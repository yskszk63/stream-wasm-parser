import * as leb from "@thi.ng/leb128";
import type { Source } from "../source";
import type * as v from "../struct/values";

export async function readRawInteger(
  source: Source,
  bits: number,
): Promise<Uint8Array> {
  const buf = [];
  for (const _ of Array.from({ length: Math.ceil(bits / 7) | 0 })) {
    const b = await source.read();
    buf.push(b);
    if ((b & 0x80) === 0) {
      break;
    }
  }
  return Uint8Array.from(buf);
}

async function readInteger<R extends number>(
  source: Source,
  bits: number,
  min: number,
  max: number,
  decoder: (buf: Uint8Array) => number[],
): Promise<R> {
  const src = await readRawInteger(source, bits);
  const [r, consumed] = decoder(src);
  if (consumed !== src.length) {
    throw new Error(`invalid data. ${consumed} !== ${src.length}`);
  }
  if (r < min || r > max) {
    throw new Error(`overflow. ${bits}, ${r}`);
  }
  return r as R;
}

export async function readU32(source: Source): Promise<v.u32> {
  return await readInteger(
    source,
    32,
    0x00,
    0xFFFF_FFFF,
    leb.decodeULEB128,
  );
}

export async function readU64(source: Source): Promise<v.u64> {
  return await readInteger(
    source,
    64,
    0x00,
    Number.MAX_SAFE_INTEGER,
    leb.decodeULEB128,
  );
}

export async function readS32(source: Source): Promise<v.s32> {
  return await readInteger(
    source,
    32,
    -0x8000_0000,
    0x7FFF_FFFF,
    leb.decodeSLEB128,
  );
}

export async function readS64(source: Source): Promise<v.s64> {
  return await readInteger(
    source,
    64,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    leb.decodeSLEB128,
  );
}

export async function readI8(source: Source): Promise<v.i8> {
  return await readInteger(source, 8, -0x80, 0x7F, leb.decodeSLEB128);
}

export async function readI16(source: Source): Promise<v.i16> {
  return await readInteger(source, 16, -0x8000, 0x7FFF, leb.decodeSLEB128);
}

export async function readI32(source: Source): Promise<v.i32> {
  return await readInteger(
    source,
    32,
    -0x8000_0000,
    0x7FFF_FFFF,
    leb.decodeSLEB128,
  );
}

export async function readI64(source: Source): Promise<v.i64> {
  return await readInteger(
    source,
    64,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    leb.decodeSLEB128,
  );
}

export async function readRawFloat(
  source: Source,
  bits: number,
): Promise<Uint8Array> {
  return await source.readExact((bits / 8) | 0);
}

async function readFloat<R extends number>(
  source: Source,
  bits: number,
  decoder: (v: DataView) => number,
): Promise<R> {
  const buf = await readRawFloat(source, bits);
  const view = new DataView(buf.buffer);
  const r = decoder(view);
  return r as R;
}

export async function readF32(source: Source): Promise<v.f32> {
  return await readFloat(source, 32, (v) => v.getFloat32(0, true));
}

export async function readF64(source: Source): Promise<v.f64> {
  return await readFloat(source, 64, (v) => v.getFloat64(0, true));
}

export async function readName(source: Source): Promise<v.name> {
  const length = await readU32(source);
  const content = await source.readExact(length);
  return new TextDecoder().decode(content);
}

export type {
  byte,
  f32,
  f64,
  i16,
  i32,
  i64,
  i8,
  name,
  s32,
  s64,
  u32,
  u64,
} from "../struct/values";
