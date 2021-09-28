import type { Source } from "./source";
import type { vec } from "./struct";
import * as v from "./binfmt/values";

export async function readVec<R>(
  source: Source,
  itemReader: (s: Source) => Promise<R>,
): Promise<vec<R>> {
  const length = await v.readU32(source);
  if (length > (2 ** 31) - 1) {
    throw new Error(`length > 2**31-1 ${length}`);
  }
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(await itemReader(source));
  }
  return result;
}

export async function* iterVec<R>(
  source: Source,
  itemReader: (s: Source) => Promise<R>,
): AsyncGenerator<R> {
  const length = await v.readU32(source);
  if (length > (2 ** 31) - 1) {
    throw new Error(`length > 2**31-1 ${length}`);
  }
  for (let i = 0; i < length; i++) {
    const item = await itemReader(source);
    yield item;
  }
}

export type { vec } from "./struct";
