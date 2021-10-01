import { Item } from "./struct/modules";
import { Context, iterItem } from "./binfmt/modules";
import { newSource, Source } from "./source";

/**
 * wasm magic number ('\0asm').
 *
 * https://webassembly.github.io/spec/core/bikeshed/#binary-magic
 */
const MAGIC = [0x00, 0x61, 0x73, 0x6d];

/**
 * wasm version field.
 *
 * https://webassembly.github.io/spec/core/bikeshed/#binary-version
 */
const VERSION = [0x01, 0x00, 0x00, 0x00];

/**
 * Options for `parse`.
 *
 * Currently no option defined.
 */
export type ParseOptions = unknown;

/**
 * Parse WebAssembly binary format.
 *
 * Iterate based on each of the following items in the (section)[https://webassembly.github.io/spec/core/bikeshed/#sections%E2%91%A0].
 *
 * ## Result items overview.
 * - custom .. https://webassembly.github.io/spec/core/bikeshed/#binary-customsec
 * - type .. https://webassembly.github.io/spec/core/bikeshed/#binary-typesec
 * - import .. https://webassembly.github.io/spec/core/bikeshed/#binary-importsec
 * - func .. https://webassembly.github.io/spec/core/bikeshed/#binary-funcsec
 * - table .. https://webassembly.github.io/spec/core/bikeshed/#binary-tablesec
 * - mem .. https://webassembly.github.io/spec/core/bikeshed/#binary-memsec
 * - global .. https://webassembly.github.io/spec/core/bikeshed/#binary-globalsec
 * - export .. https://webassembly.github.io/spec/core/bikeshed/#binary-exportsec
 * - start .. https://webassembly.github.io/spec/core/bikeshed/#binary-startsec
 * - elem .. https://webassembly.github.io/spec/core/bikeshed/#binary-elemsec
 * - code .. https://webassembly.github.io/spec/core/bikeshed/#binary-codesec
 * - data .. https://webassembly.github.io/spec/core/bikeshed/#binary-datasec
 * - datacount .. https://webassembly.github.io/spec/core/bikeshed/#binary-datacountsec
 */
export async function* parse(
  input:
    | ArrayLike<number>
    | ReadableStream<Uint8Array>
    | Response
    | PromiseLike<Response>,
  _opt?: ParseOptions,
): AsyncGenerator<Item, void> {
  const src = newSource(await getBodyIfResponse(input));
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

async function getBodyIfResponse(
  input:
    | ArrayLike<number>
    | ReadableStream<Uint8Array>
    | Response
    | PromiseLike<Response>,
): Promise<ArrayLike<number> | ReadableStream<Uint8Array>> {
  if ("then" in input || "body" in input) {
    const { body } = (await Promise.resolve(input));
    if (body === null) {
      throw new Error("body === null");
    }
    return body;
  }
  return input;
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
