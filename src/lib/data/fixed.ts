import { sql } from "@/lib/db/client";
import { addMonthsISO, currentMonthStartISO, monthStartOf } from "@/lib/format";
import type { FixedFrequency, FixedItem, FlowType, Wallet } from "@/lib/finance";

interface FixedRow {
  id: string;
  description: string;
  amount: string;
  type: FlowType;
  frequency: FixedFrequency;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  wallet: Wallet;
  auto_debit: boolean;
}

function toItem(row: FixedRow): FixedItem {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    frequency: row.frequency,
    dayOfMonth: row.day_of_month ?? 1,
    startDate: row.start_date,
    endDate: row.end_date,
    wallet: row.wallet,
    autoDebit: row.auto_debit,
  };
}

/** Todos os itens fixos da família (inclusive os já encerrados, para o histórico dos gráficos). */
export async function listFixedItems(familyId: string): Promise<FixedItem[]> {
  const rows = await sql<FixedRow[]>`
    select id, description, amount, type::text as type, frequency::text as frequency,
      day_of_month, start_date, end_date, wallet, auto_debit
    from fin_family.recurring_rules
    where family_id = ${familyId} and is_active = true and type in ('income', 'expense')
      and frequency in ('monthly', 'yearly')
    order by day_of_month asc nulls last, description asc
  `;
  return rows.map(toItem);
}

/**
 * Mês (AAAA-MM-01) em que uma conta anual começa a valer: neste ano, se o mês
 * de vencimento ainda não passou; senão, no ano que vem (evita cobrar de cara
 * uma conta de um mês que já ficou para trás).
 */
function firstYearlyMonth(monthOfYear: number) {
  const current = currentMonthStartISO();
  const year = Number(current.slice(0, 4));
  const currentMonth = Number(current.slice(5, 7));
  const y = monthOfYear >= currentMonth ? year : year + 1;
  return `${y}-${String(monthOfYear).padStart(2, "0")}-01`;
}

export async function createFixedItem(data: {
  familyId: string;
  description: string;
  amount: number;
  type: FlowType;
  frequency: FixedFrequency;
  /** 1-12; só usado nas contas anuais */
  monthOfYear: number;
  dayOfMonth: number;
  wallet: Wallet;
  autoDebit: boolean;
  createdBy: string;
}) {
  const startDate =
    data.frequency === "yearly"
      ? firstYearlyMonth(data.monthOfYear)
      : currentMonthStartISO();
  await sql`
    insert into fin_family.recurring_rules
      (family_id, description, amount, type, frequency, interval_count, day_of_month, start_date,
       wallet, auto_debit, created_by)
    values (
      ${data.familyId}, ${data.description}, ${data.amount}, ${data.type},
      ${data.frequency}, 1, ${data.dayOfMonth}, ${startDate},
      ${data.wallet}, ${data.autoDebit}, ${data.createdBy}
    )
  `;
}

export async function updateFixedItem(
  familyId: string,
  id: string,
  data: {
    description: string;
    amount: number;
    dayOfMonth: number;
    /** 1-12; só vale para contas anuais */
    monthOfYear: number;
    wallet: Wallet;
    autoDebit: boolean;
  },
) {
  const [row] = await sql<{ frequency: FixedFrequency; start_date: string }[]>`
    select frequency::text as frequency, start_date
    from fin_family.recurring_rules
    where family_id = ${familyId} and id = ${id}
  `;
  if (!row) return;

  const startDate =
    row.frequency === "yearly"
      ? `${row.start_date.slice(0, 4)}-${String(data.monthOfYear).padStart(2, "0")}-01`
      : row.start_date;
  await sql`
    update fin_family.recurring_rules
    set description = ${data.description}, amount = ${data.amount},
        day_of_month = ${data.dayOfMonth}, start_date = ${startDate},
        wallet = ${data.wallet}, auto_debit = ${data.autoDebit}
    where family_id = ${familyId} and id = ${id}
  `;
}

/**
 * Remove um item fixo. Se ele só existe desde este mês, apaga de vez; se já
 * vinha de meses anteriores, encerra no mês passado para preservar o histórico.
 */
export async function removeFixedItem(familyId: string, id: string) {
  const thisMonth = currentMonthStartISO();
  const [row] = await sql<{ start_date: string }[]>`
    select start_date from fin_family.recurring_rules
    where family_id = ${familyId} and id = ${id}
  `;
  if (!row) return;

  if (monthStartOf(row.start_date) >= thisMonth) {
    await sql`
      delete from fin_family.recurring_rules
      where family_id = ${familyId} and id = ${id}
    `;
    return;
  }
  const lastMonthEnd = addMonthsISO(thisMonth, -1);
  await sql`
    update fin_family.recurring_rules
    set end_date = ${lastMonthEnd}
    where family_id = ${familyId} and id = ${id}
  `;
}
