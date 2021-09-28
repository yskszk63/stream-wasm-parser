import { newSource } from "./source";

test("array source read.", async () => {
  const src = newSource([0x12, 0x34]);
  expect(await src.read()).toBe(0x12);
  expect(await src.read()).toBe(0x34);
  expect(await src.read(true)).toBeNull();
});

test("array source readExact.", async () => {
  const src = newSource([0x01, 0x02, 0x03]);
  expect(await src.readExact(1)).toEqual(Uint8Array.from([0x01]));
  expect(await src.readExact(2)).toEqual(Uint8Array.from([0x02, 0x03]));
  await expect(src.readExact(1)).rejects.toThrow("unexpected EOF.");
  await expect(src.readExact(-1)).rejects.toThrow("illegal argument.");
});
