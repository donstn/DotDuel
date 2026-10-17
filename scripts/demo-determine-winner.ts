// Demo file for the Codex-as-verifier exercise. Not imported anywhere; safe to delete.
export function determineWinner(p1Score: number, p2Score: number): 'p1' | 'p2' | 'draw' {
  if (p1Score > p2Score) return 'p1';
  if (p2Score > p1Score) return 'p2';
  return 'draw';
}
