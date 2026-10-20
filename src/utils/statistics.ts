/** Percentage of correct answers, rounded to a whole number. 0 when nothing was attempted. */
export function calculateAccuracy(correct: number, attempted: number): number {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
}
