import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/chat-prompt';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { chatTools } from '@/lib/ai/tools';
import { getServiceClient } from '@/lib/db/service';
import { getUserPreferences, summarisePreferences } from '@/lib/db/queries/preferences';
import { getCurrentUser } from '@/lib/security/auth';
import { checkAiRateLimit } from '@/lib/security/rate-limit';

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      {
        error:
          'AI henüz yapılandırılmadı. GEMINI_API_KEY .env.local dosyasına eklendiğinde devreye girer.',
        code: 'AI_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  const rate = await checkAiRateLimit(user?.id ?? null);
  if (!rate.allowed) {
    return Response.json(
      { error: rate.message, code: rate.code },
      { status: rate.code === 'SIGNUP_REQUIRED' ? 401 : 429 },
    );
  }

  let body: { messages: UIMessage[] };
  try {
    body = (await req.json()) as { messages: UIMessage[] };
  } catch {
    return Response.json({ error: 'Geçersiz istek.', code: 'INVALID_INPUT' }, { status: 400 });
  }

  const prefsContext = user ? summarisePreferences(await getUserPreferences(user.id)) : null;
  const systemPrompt = prefsContext
    ? `${CHAT_SYSTEM_PROMPT}\n\nKULLANICI PROFİLİ (gizli notlar): ${prefsContext}`
    : CHAT_SYSTEM_PROMPT;

  const startedAt = Date.now();
  const lastUserMessage =
    [...body.messages].reverse().find((m) => m.role === 'user') ?? null;

  const modelMessages = await convertToModelMessages(body.messages);
  const result = streamText({
    model: google(CHAT_MODEL),
    system: systemPrompt,
    messages: modelMessages,
    tools: chatTools,
    temperature: 0.6,
    // experimental_continueSteps would let Gemini chain multiple tool calls;
    // for now a single call per turn is enough and predictable for cost.
  });

  // Fire-and-forget logging — never block the stream on it.
  void (async () => {
    try {
      await result.text;
      const lastUserText = lastUserMessage?.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => ('text' in p ? p.text : ''))
        .join(' ')
        .trim();
      const supabase = getServiceClient();
      await supabase.from('ai_query_logs').insert({
        status: 'success',
        query_text: lastUserText?.slice(0, 500) ?? '(empty)',
        user_id: user?.id ?? null,
        ip_hash: rate.identifier.ipHash,
        retrieved_deal_ids: [],
        response_deal_ids: [],
        model_used: CHAT_MODEL,
        duration_ms: Date.now() - startedAt,
      });
    } catch (err) {
      console.error('chat log failed:', err);
    }
  })();

  return result.toUIMessageStreamResponse();
}
