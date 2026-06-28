import { nextPtsWrapOffset, PTS_MODULO } from './pts';

// Replays a raw 33-bit PTS sequence through the unwrap accumulator the same way
// demuxTS does, returning the unwrapped values.
function unwrap(seq: number[]): number[] {
  let prevMod: number | undefined;
  let offset = 0;
  return seq.map(v => {
    offset = nextPtsWrapOffset(prevMod, offset, v);
    prevMod = v;
    return v + offset;
  });
}

describe('33-bit PTS unwrap', () => {
  test('monotonically increasing PTS stays monotonic (regression: 2^33 >> 1 == 0 bug)', () => {
    // 30fps in a 90kHz clock => +3000 per frame. Starts at 10s.
    const start = 900000;
    const seq = Array.from({ length: 10 }, (_, i) => start + i * 3000);
    const out = unwrap(seq);
    expect(out).toEqual(seq); // no spurious wrap, values unchanged
    for (let i = 1; i < out.length; i++) {
      expect(out[i]).toBeGreaterThan(out[i - 1]);
    }
  });

  test('a real wrap near 2^33 is unwrapped to a continuous timeline', () => {
    const justBelow = PTS_MODULO - 3000; // last value before wrap
    const afterWrap = 3000; // wrapped back near zero
    const out = unwrap([justBelow - 3000, justBelow, afterWrap, afterWrap + 3000]);
    // After the wrap, values must keep increasing by ~3000, not jump backwards.
    expect(out[2] - out[1]).toBe(6000); // afterWrap + PTS_MODULO - justBelow
    expect(out[3]).toBeGreaterThan(out[2]);
  });

  test('small backwards jitter (B-frame DTS) does not trigger a wrap', () => {
    const out = unwrap([900000, 906000, 903000, 909000]);
    expect(out).toEqual([900000, 906000, 903000, 909000]);
  });
});
