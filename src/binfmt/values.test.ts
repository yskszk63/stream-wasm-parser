import { newSource, Source } from "../source";
import * as v from "./values";

describe("test integers", () => {
  const u32 = v.readU32;
  const u64 = v.readU64;
  const s32 = v.readS32;
  const s64 = v.readS64;
  const i8 = v.readI8;
  const i16 = v.readI16;
  const i32 = v.readI32;
  const i64 = v.readI64;

  type Tests = {
    input: number[];
    wants: [(s: Source) => Promise<unknown>, number | null][];
  };
  const tests: Tests[] = [
    {
      input: [0x7F],
      wants: [
        [u32, 127],
        [u64, 127],
      ],
    },
    {
      input: [0xFF, 0x01],
      wants: [
        [u32, 255],
        [u64, 255],
      ],
    },
    {
      input: [0xE5, 0x8E, 0x26],
      wants: [
        [u32, 624485],
        [u64, 624485],
      ],
    },
    {
      input: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x0F],
      wants: [
        [u32, null],
        [u64, Number.MAX_SAFE_INTEGER],
      ],
    },
    {
      input: [0x3F],
      wants: [
        [s32, 63],
        [s64, 63],
        [i8, 63],
        [i16, 63],
        [i32, 63],
        [i64, 63],
      ],
    },
    {
      input: [0x7F],
      wants: [
        [s32, -1],
        [s64, -1],
        [i8, -1],
        [i16, -1],
        [i32, -1],
        [i64, -1],
      ],
    },
    {
      input: [0xFF, 0x00],
      wants: [
        [s32, 127],
        [s64, 127],
        [i8, 127],
        [i16, 127],
        [i32, 127],
        [i64, 127],
      ],
    },
    {
      input: [0xFF, 0x01],
      wants: [
        [s32, 255],
        [s64, 255],
        [i8, null],
        [i16, 255],
        [i32, 255],
        [i64, 255],
      ],
    },
    {
      input: [0xC0, 0xBB, 0x78],
      wants: [
        [s32, -123456],
        [s64, -123456],
        [i8, null],
        [i16, null],
        [i32, -123456],
        [i64, -123456],
      ],
    },
    {
      input: [0x81, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x70],
      wants: [
        [s32, null],
        [s64, Number.MIN_SAFE_INTEGER],
        [i8, null],
        [i16, null],
        [i32, null],
        [i64, Number.MIN_SAFE_INTEGER],
      ],
    },
    {
      input: [],
      wants: [
        [u32, null],
        [u64, null],
        [s32, null],
        [s64, null],
        [i8, null],
        [i16, null],
        [i32, null],
        [i64, null],
      ],
    },
  ];
  for (const t of tests) {
    for (const [func, wants] of t.wants) {
      test(`${t.input} should ${wants ?? "error"}`, async () => {
        const src = newSource(t.input);
        const answer = func(src);
        if (wants !== null) {
          await expect(answer).resolves.toBe(wants);
        } else {
          await expect(answer).rejects.toThrow();
        }
      });
    }
  }
});

describe("test float", () => {
  const f32 = v.readF32;
  const f64 = v.readF64;

  type Tests = {
    input: number[];
    wants: [(s: Source) => Promise<unknown>, number | null][];
  };
  const tests: Tests[] = [
    {
      input: [0x00, 0x00, 0x00, 0x7F],
      wants: [
        [f32, 1.7014118346046923e+38],
        [f64, null],
      ],
    },
    {
      input: [0x00, 0x00, 0xFF, 0x01],
      wants: [
        [f32, 9.367220608115104e-38],
        [f64, null],
      ],
    },
    {
      input: [0xE5, 0x8E, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00],
      wants: [
        [f32, 3.541009753127132e-39],
        [f64, 1.2484787e-317],
      ],
    },
    {
      input: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
      wants: [
        [f32, 0.0],
        [f64, 0.0],
      ],
    },
    {
      input: [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
      wants: [
        [f32, -0.0],
        [f64, -0.0],
      ],
    },
    {
      input: [0x7F, 0xBF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
      wants: [
        [f32, Number.NaN],
        [f64, Number.NaN],
      ],
    },
    {
      input: [0x7F, 0xF7, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
      wants: [
        [f32, Number.NaN],
        [f64, Number.NaN],
      ],
    },
    {
      input: [0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x00, 0x00],
      wants: [
        [f32, Number.POSITIVE_INFINITY],
        [f64, 1.62523e-319],
      ],
    },
    {
      input: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x7F],
      wants: [
        [f32, 8.627374255308601e-41],
        [f64, Number.POSITIVE_INFINITY],
      ],
    },
    {
      input: [0x00, 0x00, 0x80, 0xFF, 0x00, 0x00, 0x00, 0x00],
      wants: [
        [f32, Number.NEGATIVE_INFINITY],
        [f64, 2.117851268e-314],
      ],
    },
    {
      input: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0xFF],
      wants: [
        [f32, 0.0],
        [f64, Number.NEGATIVE_INFINITY],
      ],
    },
    {
      input: [],
      wants: [
        [f32, null],
        [f64, null],
      ],
    },
  ];
  for (const t of tests) {
    for (const [func, wants] of t.wants) {
      test(`${t.input} should ${wants ?? "error"}`, async () => {
        const src = newSource(t.input);
        const answer = func(src);
        if (wants !== null) {
          if (Number.isNaN(wants)) {
            await expect(answer).resolves.toBeNaN();
          } else {
            await expect(answer).resolves.toBeCloseTo(wants);
          }
        } else {
          await expect(answer).rejects.toThrow();
        }
      });
    }
  }
});
