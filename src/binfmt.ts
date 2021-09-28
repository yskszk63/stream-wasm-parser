import type { Source } from "./source";
import type { vec } from "./struct";
import * as v from "./binfmt/values";

export async function readVec<R>(
  source: Source,
  itemReader: (s: Source) => Promise<R>,
): Promise<vec<R>> {
  const length = await v.readU32(source);
  const result = [];
  for (const _ of Array.from({ length })) {
    result.push(await itemReader(source));
  }
  return result;
}

export async function* iterVec<R>(
  source: Source,
  itemReader: (s: Source) => Promise<R>,
): AsyncGenerator<R> {
  const length = await v.readU32(source);
  for (const _ of Array.from({ length })) {
    const item = await itemReader(source);
    yield item;
  }
}

export type { vec } from "./struct";
