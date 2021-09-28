import { iterVec, readVec } from "./binfmt";
import { newSource } from "./source";

describe("test readVec", () => {
  test("test empty", async () => {
    const bin = newSource([0x00]);
    const r = await readVec(bin, async (_) => {});
    expect(r.length).toBe(0);
  });
  test("test one", async () => {
    const bin = newSource([0x01, 0xFF]);
    const r = await readVec(bin, async (b) => await b.read());
    expect(r.length).toBe(1);
    expect(r[0]).toBe(0xFF);
  });
  test("test large", async () => {
    const bin = newSource([0xFF, 0xFF, 0xFF, 0xFF, 0x0F]);
    const r = readVec(bin, async (b) => await b.read());
    await expect(r).rejects.toThrow();
  });
});

describe("test iterVec", () => {
  test("test empty", async () => {
    const bin = newSource([0x00]);
    for await (const _ of iterVec(bin, async (_) => {})) {
      throw new Error();
    }
  });
  test("test one", async () => {
    const bin = newSource([0x01, 0xFF]);
    let n = 0;
    for await (const b of iterVec(bin, async (b) => b.read())) {
      expect(b).toBe(0xFF);
      n += 1;
    }
    expect(n).toBe(1);
  });
  test("test large", async () => {
    const bin = newSource([0xFF, 0xFF, 0xFF, 0xFF, 0x0F]);
    const r = iterVec(bin, async (b) => await b.read());
    await expect(r.next()).rejects.toThrow();
  });
});
