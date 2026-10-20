import type { RecurrenceFrequency } from "@/lib/types";

/** Próximas N ocorrências previstas de uma regra, calculadas em memória (puro, sem I/O). */
export function projectOccurrences(
  rule: {
    start_date: string;
    end_date: string | null;
    frequency: RecurrenceFrequency;
    interval_count: number;
  },
  count = 6,
  from: Date = new Date(),
): Date[] {
  const occurrences: Date[] = [];
  const start = new Date(`${rule.start_date}T00:00:00`);
  const end = rule.end_date ? new Date(`${rule.end_date}T00:00:00`) : null;
  const interval = Math.max(1, rule.interval_count);

  let cursor = new Date(start);
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  let safety = 0;
  while (cursor < fromMidnight && safety < 1200) {
    cursor = advance(cursor, rule.frequency, interval);
    safety++;
  }

  while (occurrences.length < count && safety < 2400) {
    if (end && cursor > end) break;
    occurrences.push(new Date(cursor));
    cursor = advance(cursor, rule.frequency, interval);
    safety++;
  }

  return occurrences;
}

export function advance(
  date: Date,
  frequency: RecurrenceFrequency,
  interval: number,
): Date {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7 * interval);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + interval);
  else next.setFullYear(next.getFullYear() + interval);
  return next;
}
