export interface CollectionConstructor {
  new <Key, Value>(entries?: readonly (readonly [Key, Value])[] | null): Collection<Key, Value>;
  readonly [Symbol.species]: CollectionConstructor;
}

export interface Collection<Key, Value> extends Map<Key, Value> {
  constructor: CollectionConstructor;
}

export class Collection<Key, Value> extends Map<Key, Value> {
  public filter(fn: (value: Value, key: Key, collection: this) => unknown, thisArg?: unknown): Collection<Key, Value> {
    if (typeof fn !== "function") throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const results = new this.constructor[Symbol.species]<Key, Value>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }

    return results;
  }
}
