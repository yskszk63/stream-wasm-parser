import * as m from "./modules";
import { newSource } from "../source";

test("unknown section tag", async () => {
  const data = newSource([0xFF, 0x00]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "unknown tag. 255",
  );
});

test("unknown import desc tag", async () => {
  const data = newSource([0x02, 0x7F, 0x01, 0x00, 0x00, 0xFF]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "unknown tag. 255",
  );
});

test("unknown export desc tag", async () => {
  const data = newSource([0x07, 0x7F, 0x01, 0x00, 0xFF]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "unknown tag. 255",
  );
});

test("unknown elem tag", async () => {
  const data = newSource([0x09, 0x7F, 0x01, 0xFF]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "unknown tag. 255",
  );
});

test("unknown data tag", async () => {
  const data = newSource([0x0B, 0x7F, 0x01, 0xFF]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "unknown tag. 255",
  );
});

test("incorrect code size", async () => {
  const data = newSource([0x0A, 0x7F, 0x01, 0x03, 0x01, 0x01, 0x7F]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "incorrect size. 3 3",
  );
});

test("code ends without end", async () => {
  const data = newSource([0x0A, 0x7F, 0x01, 0x04, 0x01, 0x01, 0x7F, 0x00]);
  const ctx = new m.Context(false, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "expected end. but not.",
  );
});

test("code ends without end. captrue instructions.", async () => {
  const data = newSource([0x0A, 0x7F, 0x01, 0x04, 0x01, 0x01, 0x7F, 0x00]);
  const ctx = new m.Context(true, []);
  await expect(m.iterItem(ctx, data).next()).rejects.toThrow(
    "expected end. but not.",
  );
});
