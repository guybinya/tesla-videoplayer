// MPEG-TS PTS/DTS are 33-bit values on a 90kHz clock that wrap at 2^33.
export const PTS_MODULO = 0x200000000; // 2^33

// Accumulate the offset that keeps a 33-bit PTS/DTS sequence monotonic across
// wraps. The half-modulo threshold MUST be computed with division: JS bitwise
// operators are 32-bit, so `PTS_MODULO >> 1` evaluates to 0 and would make every
// increasing timestamp look like a wrap — corrupting all timestamps so that only
// the first decoded frame ever gets painted.
export function nextPtsWrapOffset(prevMod: number | undefined, prevOffset: number, v: number): number {
  if (prevMod === undefined) return prevOffset;
  const half = PTS_MODULO / 2;
  if (v < prevMod && (prevMod - v) > half) return prevOffset + PTS_MODULO;
  if (v > prevMod && (v - prevMod) > half) return prevOffset - PTS_MODULO;
  return prevOffset;
}
