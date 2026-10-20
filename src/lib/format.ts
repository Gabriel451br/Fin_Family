export function formatCurrency(value: string | number, currency = "BRL") {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(value: string | Date) {
  const d =
    typeof value === "string"
      ? new Date(value.includes("T") ? value : `${value}T00:00:00`)
      : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatMonth(value: string | Date) {
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function addMonthsISO(monthStartISO: string, delta: number) {
  const d = new Date(`${monthStartISO}T00:00:00`);
  return new Date(d.getFullYear(), d.getMonth() + delta, 1).toISOString().slice(0, 10);
}
