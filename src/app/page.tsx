export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase">
        gidek · kurulum aşamasında
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        AI ile sana özel fırsatlar
      </h1>
      <p className="text-muted-foreground max-w-md text-lg">
        Ne yapmak istediğini yaz, gidek senin için en uygun tiyatro, kahvaltı, tatil ve daha
        fazlasını bulsun.
      </p>
    </main>
  );
}
