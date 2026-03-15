export default function MaintenancePage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-[2rem] border border-zinc-200 bg-white px-8 py-12 text-center shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
        {/* ロゴ */}
        <img src="/icon.png" alt="Logo" width={200} height={200} className="mx-auto mb-6" />
        <p className="text-sm font-bold tracking-[0.3em] text-amber-600">MAINTENANCE</p>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 md:text-4xl">
          現在メンテナンス中です
        </h1>
        <p className="mt-6 text-base leading-8 text-zinc-600 md:text-lg">
          ただいまサービスの更新作業を行っています。<br />
          しばらくしてから再度アクセスしてください。
        </p>
      </div>
    </section>
  );
}