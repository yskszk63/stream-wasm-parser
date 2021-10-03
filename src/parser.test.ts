import path from "path";
import fs from "fs/promises";
import { execFileSync } from "child_process";
import * as p from "./parser";

beforeEach(() => {
  const testDir = path.dirname(expect.getState().testPath);
  const name = expect.getState().currentTestName.split(" ").at(-1);
  if (!name) {
    throw new Error("could not detect wat file.");
  }
  if (!name.endsWith(".wat")) {
    return;
  }
  const watpath = path.join(testDir, "..", name);
  const wasmpath = watpath + ".wasm";

  execFileSync("wat2wasm", ["-o", wasmpath, watpath], {
    stdio: ["ignore", "inherit", "inherit"],
  });
});

async function wasmfile(): Promise<ArrayLike<number>> {
  const testDir = path.dirname(expect.getState().testPath);
  const name = expect.getState().currentTestName.split(" ").at(-1);
  if (!name) {
    throw new Error("could not detect wat file.");
  }
  const watpath = path.join(testDir, "..", name);
  // if endsWith .wat generate .wasm at beforeEach.
  const wasmpath = watpath.endsWith(".wat") ? watpath + ".wasm" : watpath;

  return await fs.readFile(wasmpath);
}

async function next<T>(result: Promise<IteratorResult<T>>): Promise<T> {
  const { value, done } = await result;
  if (done) {
    throw new Error("stop iteration.");
  }
  return value;
}

describe("parsetest", () => {
  test("testdata/01_moduleonly.wat", async () => {
    const src = await wasmfile();
    for await (const _ of p.parse(src, {})) {
      throw new Error("OK");
    }
  });

  test("testdata/02_type.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    const r = await next(sections.next());
    if (r.tag === "type" && r.val.val.tag === "func") {
      expect(r.val.val.val.parameters.length).toBe(0);
      expect(r.val.val.val.results.length).toBe(0);
    } else {
      throw new Error();
    }
    for await (const _ of sections) {
      throw new Error();
    }
  });

  test("testdata/03_import.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "import") {
        const im = sec.val;
        expect(im.module).toBe("env");
        const nm = im.name;
        if (nm === "memory") {
          if (im.desc.tag === "mem") {
            expect(im.desc.val.val.min).toBe(0);
            expect(im.desc.val.val.max).toBe(2);
          } else {
            throw new Error(`tag mismatch. ${im.desc.tag}`);
          }
        } else if (nm === "fun") {
          if (im.desc.tag === "func") {
            expect(im.desc.val.val).toBe(0);
          } else {
            throw new Error(`tag mismatch. ${im.desc.tag}`);
          }
        } else if (nm === "table") {
          if (im.desc.tag === "table") {
            const [limits, reftype] = im.desc.val.val;
            expect(limits.min).toBe(1);
            expect(limits.max).toBeNull();
            expect(reftype).toBe("funcref");
          } else {
            throw new Error(`tag mismatch. ${im.desc.tag}`);
          }
        } else if (nm === "global") {
          if (im.desc.tag === "global") {
            const [mut, valtype] = im.desc.val.val;
            expect(valtype).toBe("i32");
            expect(mut).toBe("var");
          } else {
            throw new Error(`tag mismatch. ${im.desc.tag}`);
          }
        } else {
          throw new Error(`unexpected nm ${nm}`);
        }
      } else if (sec.tag === "type") {
        // skip
      } else {
        throw new Error("unexpected section.");
      }
    }
  });

  test("testdata/04_function.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, { captureInstructions: true });

    let typeseen = 0;
    for await (const sec of sections) {
      if (sec.tag === "func") {
        expect(sec.val.val).toBe(0);
      } else if (sec.tag === "code") {
        const [locals, expr] = sec.val;
        expect(locals.length).toBe(1);
        expect(locals[0]).toBe("i32");
        if (expr === null) {
          throw new Error("unexpected");
        }
        expect(expr.length).toBe(3);
        expect(expr[0]).toBe(0x41); // i32.const
        expect(expr[1]).toBe(8); // n
        expect(expr[2]).toBe(0x0B); // END
      } else if (sec.tag === "type") {
        typeseen += 1;
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
    expect(typeseen).toBe(1);

    // no capture instructions.
    for await (const sec of p.parse(await wasmfile())) {
      if (sec.tag === "code") {
        const [_, expr] = sec.val;
        expect(expr).toBeNull();
      }
    }
  });

  test("testdata/05_table.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "table") {
        const [limits, reftype] = sec.val.val.type;
        expect(reftype).toBe("funcref");
        expect(limits.min).toBe(1);
        expect(limits.max).toBeNull();
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/06_memory.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "mem") {
        expect(sec.val.val.type.min).toBe(1);
        expect(sec.val.val.type.max).toBeNull();
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/07_global.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "global") {
        const { type: [mut, valtype], init: expr } = sec.val.val;
        expect(mut).toBe("var");
        expect(valtype).toBe("i32");
        expect(expr.length).toBe(3);
        expect(expr[0]).toBe(0x41); // i32.const
        expect(expr[1]).toBe(1);
        expect(expr[2]).toBe(0x0B); // END
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/08_export.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "export") {
        const ex = sec.val;
        const nm = ex.name;
        if (nm === "memory") {
          expect(ex.desc.tag).toBe("mem");
          expect(ex.desc.val).toBe(0);
        } else if (nm === "func") {
          expect(ex.desc.tag).toBe("func");
          expect(ex.desc.val).toBe(0);
        } else if (nm === "table") {
          expect(ex.desc.tag).toBe("table");
          expect(ex.desc.val).toBe(0);
        } else if (nm === "global") {
          expect(ex.desc.tag).toBe("global");
          expect(ex.desc.val).toBe(0);
        } else {
          throw new Error(`unknown name ${nm}`);
        }
      } else if (sec.tag === "type") {
        // skip
      } else if (sec.tag === "func") {
        // skip
      } else if (sec.tag === "table") {
        // skip
      } else if (sec.tag === "mem") {
        // skip
      } else if (sec.tag === "global") {
        // skip
      } else if (sec.tag === "code") {
        // skip
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/09_start.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "start") {
        expect(sec.val.func).toBe(0);
      } else if (sec.tag === "type") {
        // skip
      } else if (sec.tag === "func") {
        // skip
      } else if (sec.tag === "code") {
        // skip
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/10_elem.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "elem") {
        expect(sec.val.val.type).toBe("funcref");
        const init = sec.val.val.init;
        if (init.tag === "funcref") {
          expect(init.val.length).toBe(1);
          expect(init.val[0]).toBe(0);
        } else {
          throw new Error(`unexpected tag ${init.tag}`);
        }
        const mode = sec.val.val.mode;
        if (mode.tag === "active") {
          expect(mode.val.table).toBe(0);
          expect(mode.val.offset.length).toBe(3);
          expect(mode.val.offset[0]).toBe(0x41); // i32.const
          expect(mode.val.offset[1]).toBe(0);
          expect(mode.val.offset[2]).toBe(0x0B); // END
        } else {
          throw new Error(`unexpected tag ${mode.tag}`);
        }
      } else if (sec.tag === "type") {
        // skip
      } else if (sec.tag === "func") {
        // skip
      } else if (sec.tag === "table") {
        // skip
      } else if (sec.tag === "code") {
        // skip
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/11_mem.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      if (sec.tag === "data") {
        expect(sec.val.val.init.length).toBe(2);
        expect(sec.val.val.init[0]).toBe("H".charCodeAt(0));
        expect(sec.val.val.init[1]).toBe("i".charCodeAt(0));
        const mode = sec.val.val.mode;
        if (mode.tag === "active") {
          expect(mode.val.offset.length).toBe(3);
          expect(mode.val.offset[0]).toBe(0x41);
          expect(mode.val.offset[1]).toBe(0);
          expect(mode.val.offset[2]).toBe(0x0B); // END
        } else {
          throw new Error(`unexpected tag ${mode.tag}`);
        }
      } else if (sec.tag === "mem") {
        // skip
      } else {
        throw new Error(`unexpected section. ${sec.tag}`);
      }
    }
  });

  test("testdata/12_etc.wat", async () => {
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const _ of sections) {
    }
  });

  test("testdata/13_customdata.wasm", async () => {
    // Generated by https://webassembly.github.io/wabt/demo/wat2wasm/index.html `(module)`
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      expect(sec.tag).toBe("custom");
    }
  });

  test("testdata/14_datacount.wasm", async () => {
    // Handwrite data. Data count section enable by `bulk memory` feature.
    const src = await wasmfile();
    const sections = p.parse(src, {});

    for await (const sec of sections) {
      expect(sec.tag).toBe("datacount");
    }
  });

  test("invalid magic number.", async () => {
    await expect(() => p.parse(Array.from({ length: 8 })).next()).rejects
      .toThrow();
  });

  test("parse from response", async () => {
    const response = Promise.resolve({
      body: Uint8Array.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
    } as unknown as Response);
    for await (const _ of p.parse(response)) {
      throw new Error();
    }
  });

  test("parse from response body null", async () => {
    const response = Promise.resolve({
      body: null,
    } as unknown as Response);
    await expect(p.parse(response).next()).rejects.toThrow("body === null");
  });
});
