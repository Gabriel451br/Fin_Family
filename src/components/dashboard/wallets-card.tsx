import { formatCurrency } from "@/lib/format";
import { WALLET_LABELS } from "@/lib/finance";
import type { DashboardData } from "@/lib/data/dashboard";

/** Saldo do mês separado entre dinheiro e vale (VA/VR); o saldo total fica no card acima. */
export function WalletsCard({
  wallets,
  currency,
}: {
  wallets: DashboardData["wallets"];
  currency: string;
}) {
  const items = [
    { key: "cash" as const, data: wallets.cash },
    { key: "benefit" as const, data: wallets.benefit },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Dinheiro × VA/VR</h2>
      <p className="mb-3 text-xs text-slate-500">
        Mesmo saldo do mês, separado por onde o dinheiro está
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ key, data }) => {
          const negative = data.balance < 0;
          return (
            <div key={key} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">{WALLET_LABELS[key]}</p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900">
                {negative ? "−" : ""}
                {formatCurrency(Math.abs(data.balance), currency)}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                entrou {formatCurrency(data.income, currency)}
                <br />
                saiu {formatCurrency(data.expense, currency)}
              </p>
            </div>
          );
        })}
      </div>
      {wallets.benefit.income === 0 && wallets.benefit.expense === 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Para separar o vale, marque a receita como <strong>VA/VR</strong> em Contas (receitas
          fixas) ou ao lançar, e escolha &quot;VA/VR&quot; nos gastos pagos com o vale.
        </p>
      )}
    </section>
  );
}
