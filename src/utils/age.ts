/** Age helpers. We only store birth year, so age is approximate (±1 year). */

export function ageFromBirthYear(
  birthYear: number | null | undefined,
  now: Date = new Date(),
): number | null {
  if (birthYear == null || !Number.isFinite(birthYear)) return null;
  const age = now.getFullYear() - birthYear;
  return age >= 8 && age <= 65 ? age : null;
}

export function birthYearFromAge(age: number, now: Date = new Date()): number {
  return now.getFullYear() - Math.round(age);
}
