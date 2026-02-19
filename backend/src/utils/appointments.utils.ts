export interface Appointment {
  id: number;
  start_date: string | Date;
  end_date?: string | Date | null;
  days_of_week: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  is_recurring: boolean;
  recurrence_frequency: "none" | "daily" | "weekly";
  max_occurences?: number | null;
}

/**
 * Expands recurrence rules into concrete Date objects within a given range.
 */
export function expandRecurrences(
  appointment: Appointment,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const occurrences: Date[] = [];
  const start = new Date(appointment.start_date);
  const end = appointment.end_date ? new Date(appointment.end_date) : null;
  const maxOccurrences = appointment.max_occurences || Infinity;

  const rStart = new Date(rangeStart);
  const rEnd = new Date(rangeEnd);

  const isDayMatch = (d: Date): boolean => {
    if (!appointment.days_of_week || appointment.days_of_week.length === 0)
      return false;
    return appointment.days_of_week.includes(d.getDay());
  };

  if (
    !appointment.is_recurring ||
    appointment.recurrence_frequency === "none"
  ) {
    if (start >= rStart && start <= rEnd) {
      occurrences.push(start);
    }
    return occurrences;
  }

  let current = new Date(start);
  let count = 0;

  const SAFETY_MAX = 10000;
  let loopCount = 0;

  while (loopCount < SAFETY_MAX) {
    loopCount++;

    if (end && current > end) break;
    if (count >= maxOccurrences) break;

    const matchesDay = isDayMatch(current);

    if (matchesDay) {
      count++;

      if (current >= rStart && current <= rEnd) {
        occurrences.push(new Date(current));
      }

      if (current > rEnd) break;
    }

    current.setDate(current.getDate() + 1);
  }

  return occurrences;
}
