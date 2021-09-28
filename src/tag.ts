export type Tagged<T extends string, V> = { tag: T; val: V };

export function tag<T extends string, V>(tag: T, val: V): Tagged<T, V> {
  return { tag, val };
}
