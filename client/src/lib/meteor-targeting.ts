export interface MeteorTargetWord {
  id: number;
  text: string;
  yPercent: number;
}

export function chooseMeteorTarget<TWord extends MeteorTargetWord>(
  words: TWord[],
  prefix: string,
  currentLockId: number | null,
): TWord | undefined {
  const normalizedPrefix = prefix.toLowerCase();
  const candidates = words.filter((word) => word.text.toLowerCase().startsWith(normalizedPrefix));
  return (
    candidates.find((word) => word.id === currentLockId) ??
    candidates.reduce<TWord | undefined>((best, word) => (!best || word.yPercent > best.yPercent ? word : best), undefined)
  );
}
