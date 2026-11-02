const TZ = "America/Sao_Paulo";

const pad = (n: number) => String(n).padStart(2, "0");

export function formatCurrency(value: string | number, currency = "BRL") {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Valor curto para rótulos de gráfico (ex: 1,2 mil). */
export function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Converte o texto digitado ("1.234,56", "12,5", "12.50") em número. */
export function parseMoney(input: string): number {
  let s = input.replace(/[^\d.,-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Data de hoje (AAAA-MM-DD) no fuso do Brasil, independente do servidor/aparelho. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Primeiro dia do mês de uma data AAAA-MM-DD. */
export function monthStartOf(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function currentMonthStartISO() {
  return monthStartOf(todayISO());
}

export function addMonthsISO(monthStartISO: string, delta: number) {
  const [y, m] = monthStartISO.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-01`;
}

export function daysInMonth(monthStartISO: string) {
  const [y, m] = monthStartISO.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Lê o parâmetro ?m=AAAA-MM da URL; se inválido, usa o mês atual. */
export function parseMonthParam(value: string | undefined) {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return `${value}-01`;
  return currentMonthStartISO();
}

export function monthParam(monthStartISO: string) {
  return monthStartISO.slice(0, 7);
}

function utcDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d || 1));
}

export function formatMonth(iso: string) {
  const text = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatMonthShort(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  })
    .format(utcDate(iso))
    .replace(".", "");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate(value));
}

export function formatDayMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(utcDate(value))
    .replace(".", "");
}
