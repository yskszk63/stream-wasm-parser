import { newSource } from "../source";
import * as t from "./types";

test("unknown reftype", async () => {
  const src = newSource([0x00]);
  await expect(t.parseReftype(src)).rejects.toThrow();
});

test("valtype externref", async () => {
  const src = newSource([0x6F]);
  await expect(t.parseValtype(src)).resolves.toBe("externref");
});

test("unknown valtype", async () => {
  const src = newSource([0x00]);
  await expect(t.parseValtype(src)).rejects.toThrow();
});

test("unknown functype", async () => {
  const src = newSource([0x00]);
  await expect(t.parseFunctype(src)).rejects.toThrow();
});

test("unknown limit", async () => {
  const src = newSource([0xFF]);
  await expect(t.parseLimits(src)).rejects.toThrow();
});

test("unknown globaltype", async () => {
  const src = newSource([0x7F, 0xFF]);
  await expect(t.parseGlobaltype(src)).rejects.toThrow();
});
