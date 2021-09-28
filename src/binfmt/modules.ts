import type { Source } from "../source";
import { iterVec, readVec, vec } from "../binfmt";
import type * as m from "../struct/modules";
import * as v from "./values";
import * as t from "./types";
import * as i from "./instr";
import { tag } from "../tag";

export class Context {
  typeidx: number;
  funcidx: number;
  tableidx: number;
  memidx: number;
  globalidx: number;
  elemidx: number;
  dataidx: number;
  localidx: number;
  labelidx: number;

  constructor() {
    this.typeidx = 0;
    this.funcidx = 0;
    this.tableidx = 0;
    this.memidx = 0;
    this.globalidx = 0;
    this.elemidx = 0;
    this.dataidx = 0;
    this.localidx = 0;
    this.labelidx = 0;
  }

  next<R>(
    p:
      | "typeidx"
      | "funcidx"
      | "tableidx"
      | "memidx"
      | "globalidx"
      | "elemidx"
      | "dataidx"
      | "localidx"
      | "labelidx",
  ): R {
    const v = this[p];
    this[p] += 1;
    return v as unknown as R;
  }

  indexed<R, V>(p: "typeidx", val: V): m.Indexed<m.typeidx, V>;
  indexed<R, V>(p: "funcidx", val: V): m.Indexed<m.funcidx, V>;
  indexed<R, V>(p: "tableidx", val: V): m.Indexed<m.tableidx, V>;
  indexed<R, V>(p: "memidx", val: V): m.Indexed<m.memidx, V>;
  indexed<R, V>(p: "globalidx", val: V): m.Indexed<m.globalidx, V>;
  indexed<R, V>(p: "elemidx", val: V): m.Indexed<m.elemidx, V>;
  indexed<R, V>(p: "dataidx", val: V): m.Indexed<m.dataidx, V>;
  indexed<R, V>(p: "localidx", val: V): m.Indexed<m.localidx, V>;
  indexed<R, V>(p: "labelidx", val: V): m.Indexed<m.labelidx, V>;
  indexed<R, V>(
    p:
      | "typeidx"
      | "funcidx"
      | "tableidx"
      | "memidx"
      | "globalidx"
      | "elemidx"
      | "dataidx"
      | "localidx"
      | "labelidx",
    val: V,
  ): m.Indexed<R, V> {
    const index = this.next<R>(p);
    return { index, val };
  }
}

export async function* iterItem(
  ctx: Context,
  src: Source,
): AsyncGenerator<m.Item | "EOF", void> {
  const b = await src.read(true);
  if (b === null) {
    yield "EOF";
    return;
  }
  const size = await v.readU32(src);
  const sub = src.subsource(size);

  switch (b) {
    case 0:
      yield tag("custom", await parseCustomsec(sub, size));
      return;

    case 1:
      for await (const item of iterVec(sub, t.parseFunctype)) {
        yield tag("type", ctx.indexed("typeidx", item));
      }
      return;

    case 2:
      for await (const item of iterVec(sub, (s) => parseImport(ctx, s))) {
        yield tag("import", item);
      }
      return;

    case 3:
      for await (const item of iterVec(sub, v.readU32)) {
        yield tag("func", ctx.indexed("funcidx", item as unknown as m.typeidx));
      }
      return;

    case 4:
      for await (const item of iterVec(sub, parseTable)) {
        yield tag("table", ctx.indexed("tableidx", item));
      }
      return;

    case 5:
      for await (const item of iterVec(sub, parseMem)) {
        yield tag("mem", ctx.indexed("memidx", item));
      }
      return;

    case 6:
      for await (const item of iterVec(sub, parseGlobal)) {
        yield tag("global", ctx.indexed("globalidx", item));
      }
      return;

    case 7:
      for await (const item of iterVec(sub, parseExport)) {
        yield tag("export", item);
      }
      return;

    case 8:
      yield tag("start", await parseStart(src));
      return;

    case 9:
      for await (const item of iterVec(sub, parseElem)) {
        yield tag("elem", ctx.indexed("elemidx", item));
      }
      return;

    case 10:
      for await (const item of iterVec(sub, parseCode)) {
        yield tag("code", item);
      }
      return;

    case 11:
      for await (const item of iterVec(sub, parseData)) {
        yield tag("data", ctx.indexed("dataidx", item));
      }
      return;

    case 12:
      yield tag("datacount", await parseDatacountsec(src));
      return;

    default:
      throw new Error(`unknown tag. ${b}`);
  }
}

/** 5.5.3 Custom Section */
export async function parseCustomsec(
  src: Source,
  size: number,
): Promise<m.customsec> {
  const p = src.pos;
  const name = await v.readName(src);
  const data = await src.readExact(size - (src.pos - p));
  return [name, data];
}

/** 5.5.5 Import Section */
async function parseImport(ctx: Context, src: Source): Promise<m.import_> {
  const module = await v.readName(src);
  const name = await v.readName(src);
  const desc = await parseImportdesc(ctx, src);
  return {
    module,
    name,
    desc,
  };
}

async function parseImportdesc(
  ctx: Context,
  src: Source,
): Promise<m.importdesc> {
  const b = await src.read();
  switch (b) {
    case 0x00: {
      const x = await v.readU32(src) as unknown as m.typeidx;
      return tag("func", ctx.indexed("funcidx", x));
    }
    case 0x01: {
      const tt = await t.parseTabletype(src);
      return tag("table", ctx.indexed("tableidx", tt));
    }
    case 0x02: {
      const mt = await t.parseMemtype(src);
      return tag("mem", ctx.indexed("memidx", mt));
    }
    case 0x03: {
      const gt = await t.parseGlobaltype(src);
      return tag("global", ctx.indexed("globalidx", gt));
    }
    default:
      throw new Error(`unexpected tag ${b}`);
  }
}

/** 5.5.7 Table Section */
async function parseTable(src: Source): Promise<m.table> {
  const tt = await t.parseTabletype(src);
  return {
    type: tt,
  };
}

/** 5.5.8 Memory Section */
async function parseMem(src: Source): Promise<m.mem> {
  const mt = await t.parseLimits(src);
  return {
    type: mt,
  };
}

/** 5.5.9 Global Section */
async function parseGlobal(src: Source): Promise<m.global_> {
  const gt = await t.parseGlobaltype(src);
  const e = await i.parseExprConst(src);
  return {
    type: gt,
    init: e,
  };
}

/** 5.5.10 Export Section */
async function parseExport(src: Source): Promise<m.export_> {
  const nm = await v.readName(src);
  const d = await parseExportdesc(src);
  return {
    name: nm,
    desc: d,
  };
}

async function parseExportdesc(src: Source): Promise<m.exportdesc> {
  const i = await src.read();
  switch (i) {
    case 0x00: {
      const x = await v.readU32(src) as unknown as m.funcidx;
      return tag("func", x);
    }
    case 0x01: {
      const tt = await v.readU32(src) as unknown as m.tableidx;
      return tag("table", tt);
    }
    case 0x02: {
      const mt = await v.readU32(src) as unknown as m.memidx;
      return tag("mem", mt);
    }
    case 0x03: {
      const gt = await v.readU32(src) as unknown as m.globalidx;
      return tag("global", gt);
    }
    default:
      throw new Error(`unexpected tag ${i}`);
  }
}

/** 5.5.11 Start Section */
async function parseStart(src: Source): Promise<m.start> {
  const func = await v.readU32(src) as unknown as m.funcidx;
  return {
    func,
  };
}

/** 5.5.12 Element Section */
async function parseElem(src: Source): Promise<m.elem> {
  const b = await src.read();
  switch (b) {
    case 0x00: {
      const e = await i.parseExprConst(src);
      const y = await readVec(src, v.readU32) as unknown as vec<m.funcidx>;
      return {
        type: "funcref",
        init: tag("funcref", y),
        mode: tag("active", { table: 0 as unknown as m.tableidx, offset: e }),
      };
    }
    case 0x01: {
      const et = await src.read();
      if (et !== 0x00) {
        throw new Error(`unexpected elemkind. ${et}`);
      }
      const y = await readVec(src, v.readU32) as unknown as vec<m.funcidx>;
      return {
        type: "funcref",
        init: tag("funcref", y),
        mode: tag("passive", undefined),
      };
    }
    case 0x02: {
      const x = await v.readU32(src) as unknown as m.tableidx;
      const e = await i.parseExprConst(src);
      const et = await src.read();
      if (et !== 0x00) {
        throw new Error(`unexpected elemkind. ${et}`);
      }
      const y = await readVec(src, v.readU32) as unknown as vec<m.funcidx>;
      return {
        type: "funcref",
        init: tag("funcref", y),
        mode: tag("active", { table: x, offset: e }),
      };
    }
    case 0x03: {
      const et = await src.read();
      if (et !== 0x00) {
        throw new Error(`unexpected elemkind. ${et}`);
      }
      const y = await readVec(src, v.readU32) as unknown as vec<m.funcidx>;
      return {
        type: "funcref",
        init: tag("funcref", y),
        mode: tag("deactive", undefined),
      };
    }
    case 0x04: {
      const e = await i.parseExprConst(src);
      const el = await readVec(src, i.parseExprConst);
      return {
        type: "funcref",
        init: tag("expr", el),
        mode: tag("active", { table: 0 as unknown as m.tableidx, offset: e }),
      };
    }
    case 0x05: {
      const et = await t.parseReftype(src);
      const el = await readVec(src, i.parseExprConst);
      return {
        type: et,
        init: tag("expr", el),
        mode: tag("passive", undefined),
      };
    }
    case 0x06: {
      const x = await v.readU32(src) as unknown as m.tableidx;
      const e = await i.parseExprConst(src);
      const et = await t.parseReftype(src);
      const el = await readVec(src, i.parseExprConst);
      return {
        type: et,
        init: tag("expr", el),
        mode: tag("active", { table: x, offset: e }),
      };
    }
    case 0x07: {
      const et = await t.parseReftype(src);
      const el = await readVec(src, i.parseExprConst);
      return {
        type: et,
        init: tag("expr", el),
        mode: tag("deactive", undefined),
      };
    }
    default:
      throw new Error(`unknwon elem ${b}`);
  }
}

/** 5.5.13 Code Section */
async function parseCode(src: Source): Promise<m.code> {
  const size = await v.readU32(src);
  const func = await parseFunc(src.subsource(size), size);
  return func;
}

async function parseFunc(src: Source, size: number): Promise<m.func> {
  const pos = src.pos;
  const t = await readVec(src, parseLocals);
  const esize = size - (src.pos - pos);
  const e = await src.readExact(esize - 1);
  if (await src.read() !== 0x0B) {
    throw new Error("expected end. but not.");
  }
  return [t.flatMap((i) => i), [e, "end"]];
}

async function parseLocals(src: Source): Promise<vec<m.locals>> {
  const n = await v.readU32(src);
  const vt = await t.parseValtype(src);
  const r: vec<m.locals> = [];
  for (const _ of Array.from({ length: n })) {
    r.push(vt);
  }
  return r;
}

/** 5.5.14 Data Section */
export async function parseData(src: Source): Promise<m.data> {
  const b = await src.read();
  switch (b) {
    case 0x00: {
      const e = await i.parseExprConst(src);
      const blen = await v.readU32(src);
      const b = await src.readExact(blen);
      return {
        init: b,
        mode: tag("active", { memory: 0 as unknown as m.memidx, offset: e }),
      };
    }
    case 0x01: {
      const blen = await v.readU32(src);
      const b = await src.readExact(blen);
      return {
        init: b,
        mode: tag("passive", undefined),
      };
    }
    case 0x02: {
      const x = await v.readU32(src) as unknown as m.memidx;
      const e = await i.parseExprConst(src);
      const blen = await v.readU32(src);
      const b = await src.readExact(blen);
      return {
        init: b,
        mode: tag("active", { memory: x, offset: e }),
      };
    }
    default:
      throw new Error(`unknwon elem ${i}`);
  }
}

/** Data Count Section */
export async function parseDatacountsec(src: Source): Promise<m.datacountsec> {
  return await v.readU32(src);
}
