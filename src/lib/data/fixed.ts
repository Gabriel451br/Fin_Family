import { sql } from "@/lib/db/client";
import { addMonthsISO, currentMonthStartISO, monthStartOf } from "@/lib/format";
import type { FixedItem, FlowType } from "@/lib/finance";

interface FixedRow {
  id: string;
  description: string;
  amount: string;
  type: FlowType;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
}

function toItem(row: FixedRow): FixedItem {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    dayOfMonth: row.day_of_month ?? 1,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

/** Todos os itens fixos da família (inclusive os já encerrados, para o histórico dos gráficos). */
export async function listFixedItems(familyId: string): Promise<FixedItem[]> {
  const rows = await sql<FixedRow[]>`
    select id, description, amount, type::text as type, day_of_month, start_date, end_date
    from fin_family.recurring_rules
    where family_id = ${familyId} and is_active = true and type in ('income', 'expense')
    order by day_of_month asc nulls last, description asc
  `;
  return rows.map(toItem);
}

export async function createFixedItem(data: {
  familyId: string;
  description: string;
  amount: number;
  type: FlowType;
  dayOfMonth: number;
  createdBy: string;
}) {
  await sql`
    insert into fin_family.recurring_rules
      (family_id, description, amount, type, frequency, interval_count, day_of_month, start_date, created_by)
    values (
      ${data.familyId}, ${data.description}, ${data.amount}, ${data.type},
      'monthly', 1, ${data.dayOfMonth}, ${currentMonthStartISO()}, ${data.createdBy}
    )
  `;
}

export async function updateFixedItem(
  familyId: string,
  id: string,
  data: { description: string; amount: number; dayOfMonth: number },
) {
  await sql`
    update fin_family.recurring_rules
    set description = ${data.description}, amount = ${data.amount}, day_of_month = ${data.dayOfMonth}
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
