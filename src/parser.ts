import { Item } from "./struct/modules";
import { Context, iterItem } from "./binfmt/modules";
import { newSource, Source } from "./source";

export const MAGIC = [0x00, 0x61, 0x73, 0x6d];

export const VERSION = [0x01, 0x00, 0x00, 0x00];

export type Options = unknown;

export async function* parse(
  input: ArrayLike<number> | ReadableStream<Uint8Array>,
  _opt?: Options,
): AsyncGenerator<Item, void> {
  const src = newSource(input);
  try {
    await checkHeader(src);

    const ctx = new Context();
    while (true) {
      for await (const item of iterItem(ctx, src)) {
        if (item === "EOF") {
          return;
        }
        yield item;
      }
    }
  } finally {
    src.close();
  }
}

async function checkHeader(src: Source): Promise<void> {
  const magic = await src.readExact(MAGIC.length);
  const version = await src.readExact(VERSION.length);

  const ok = magic.every((v, i) => v === MAGIC[i]) &&
    version.every((v, i) => v === VERSION[i]);
  if (!ok) {
    throw new Error("unexpected magic or version.");
  }
}
