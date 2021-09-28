import { Source } from "../source";
import { readVec } from "../binfmt";
import * as v from "../binfmt/values";
import * as t from "../struct/types";

const numtypemap: Record<number, t.numtype> = {
  0x7F: "i32",
  0x7E: "i64",
  0x7D: "f32",
  0x7C: "f64",
};

const reftypemap: Record<number, t.reftype> = {
  0x70: "funcref",
  0x6F: "externref",
};

/** 5.3.2 Reference Types */
export async function parseReftype(src: Source): Promise<t.reftype> {
  const v = await src.read();
  const r = reftypemap[v];
  if (r) {
    return r;
  }
  throw new Error(`unknown reftype. ${v}`);
}

/** 5.3.3 Value Types */
export async function parseValtype(src: Source): Promise<t.valtype> {
  const v = await src.read();
  const n = numtypemap[v];
  if (n) {
    return n;
  }
  const r = reftypemap[v];
  if (r) {
    return r;
  }
  throw new Error(`unknown valtype. ${v}`);
}

/** 5.3.4 Result Types */
export async function parseResulttype(src: Source): Promise<t.resulttype> {
  return await readVec(src, parseValtype);
}

/** 5.3.5 Function Types */
export async function parseFunctype(src: Source): Promise<t.functype> {
  const tag = await src.read();
  if (tag !== 0x60) {
    throw new Error(`unknown tag. ${tag}`);
  }
  const parameters = await parseResulttype(src);
  const results = await parseResulttype(src);
  return {
    tag: "func",
    val: {
      parameters,
      results,
    },
  };
}

/** 5.3.6 Limits */
export async function parseLimits(src: Source): Promise<t.limits> {
  const tag = await src.read();
  switch (tag) {
    case 0x00: {
      const min = await v.readU32(src);
      return {
        min,
        max: null,
      };
    }

    case 0x01: {
      const min = await v.readU32(src);
      const max = await v.readU32(src);
      return {
        min,
        max,
      };
    }

    default:
      throw new Error(`unknown tag. ${tag}`);
  }
}

/** 5.3.7 Memory Types */
export async function parseMemtype(src: Source): Promise<t.memtype> {
  return await parseLimits(src);
}

/** 5.3.8 Table Types */
export async function parseTabletype(src: Source): Promise<t.tabletype> {
  const et = await parseReftype(src);
  const lim = await parseLimits(src);
  return [lim, et];
}

/** 5.3.9 Global Types */
export async function parseGlobaltype(src: Source): Promise<t.globaltype> {
  const ty = await parseValtype(src);
  const m = await src.read();
  switch (m) {
    case 0x00:
      return ["const", ty];
    case 0x01:
      return ["var", ty];
    default:
      throw new Error(`unknown value. ${m}`);
  }
}

export * from "../struct/types";
