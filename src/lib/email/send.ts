import 'server-only';

export interface EmailEnvelope {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Mock email gönderici — V1'de SMTP/SES yapılandırması yok. Server log'una
 * "[email]" prefix'iyle yazıyoruz; production'a geçildiğinde burada Resend
 * veya SendGrid SDK çağrısı yapılacak, dışarıdaki çağıranlar değişmez.
 */
export async function sendEmail(envelope: EmailEnvelope): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    // TODO: gerçek bir provider takılınca burası dolar.
    console.warn('[email] no provider configured', {
      to: envelope.to,
      subject: envelope.subject,
    });
    return;
  }

  // Dev'de okunaklı görsün diye satır satır basıyoruz.
  console.log('\n──────── 📧 MOCK EMAIL ────────');
  console.log(`To:      ${envelope.to}`);
  console.log(`Subject: ${envelope.subject}`);
  console.log('──');
  for (const line of envelope.text.split('\n')) console.log(line);
  console.log('────────────────────────────────\n');
}
