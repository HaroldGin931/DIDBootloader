export function formatPassportId(hash: string): string {
  return `ID-${hash.slice(0, 8)}`;
}
