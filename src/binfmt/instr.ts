import type { Source } from "../source";
import type { expr } from "../struct/instr";
import * as v from "./values";

/** 5.4.8 Expressions / 3.3.9 Expressions - Constant Expressions */
export async function parseExprConst(src: Source): Promise<expr> {
  const e = [];
  while (true) {
    const i = await src.read();
    e.push(i);
    switch (i) {
      case 0x0B:
        return Uint8Array.from(e);
      case 0x41: {
        // i32.const n
        const b = await v.readRawInteger(src, 32);
        e.push(...Array.from(b));
        break;
      }
      case 0x42: {
        // i64.const n
        const b = await v.readRawInteger(src, 64);
        e.push(...Array.from(b));
        break;
      }
      case 0x43: {
        // f32.const n
        const b = await v.readRawFloat(src, 32);
        e.push(...Array.from(b));
        break;
      }
      case 0x44: {
        // f64.const n
        const b = await v.readRawFloat(src, 64);
        e.push(...Array.from(b));
        break;
      }
      case 0xD0: {
        // ref.null
        const b = await src.read(); // reftype
        e.push(b);
        break;
      }
      case 0xD2: {
        // ref.func
        const b = await v.readRawInteger(src, 32); // funcidx
        e.push(...Array.from(b));
        break;
      }
      case 0x23: {
        // global.get
        const b = await v.readRawInteger(src, 32); // globalidx
        e.push(...Array.from(b));
        break;
      }
    }
  }
}

export type { expr } from "../struct/instr";
