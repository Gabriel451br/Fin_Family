// Aparece na hora ao trocar de aba/mês, enquanto os dados da página chegam.
function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-xl space-y-4" aria-busy="true" aria-label="Carregando">
      <Block className="h-7 w-40" />
      <Block className="h-4 w-64" />
      <Block className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Block className="h-24" />
        <Block className="h-24" />
      </div>
      <Block className="h-48 w-full" />
      <Block className="h-32 w-full" />
    </div>
  );
}
