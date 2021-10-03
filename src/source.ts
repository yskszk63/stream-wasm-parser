export interface Closeable {
  close(): void;
}

export interface Source {
  get pos(): number;
  read(): Promise<number>;
  read(eof: true): Promise<number | null>;
  readExact(n: number): Promise<Uint8Array>;
  skip(n: number): Promise<void>;
  subsource(limit: number): Source;
}

export function newSource(items: ArrayLike<number>): Source & Closeable;

export function newSource(items: ReadableStream): Source & Closeable;

export function newSource(
  items: ArrayLike<number> | ReadableStream,
): Source & Closeable;

export function newSource(
  items: ArrayLike<number> | ReadableStream,
): Source & Closeable {
  if ("getReader" in items) {
    return new StreamSource(items);
  } else {
    return new ArraySource(items);
  }
}

class StreamSource {
  total: number;
  bpos: number;
  buf: Uint8Array | null;
  reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor(stream: ReadableStream<Uint8Array>) {
    this.total = 0;
    this.bpos = 0;
    this.buf = null;
    this.reader = stream.getReader();
  }

  get pos(): number {
    return this.total;
  }

  async fill(need: number): Promise<"EOF" | Uint8Array> {
    if (this.buf === null || this.buf.length - this.bpos < 1) {
      const result = await this.reader.read();
      if (result.done) {
        return "EOF";
      }
      this.buf = result.value;
      this.bpos = 0;
    }

    const start = this.bpos;
    const len = Math.min(this.buf.length - start, need);
    this.bpos += len;
    this.total += len;
    return new Uint8Array(this.buf.buffer, start, len);
  }

  read(): Promise<number>;
  read(eof: true): Promise<number | null>;
  async read(eof?: true): Promise<number | null> {
    const maybebuf = await this.fill(1);
    if (maybebuf === "EOF") {
      if (eof === true) {
        return null;
      } else {
        throw new Error("unexpected EOF.");
      }
    }
    return maybebuf[0];
  }

  async readExact(n: number): Promise<Uint8Array> {
    const r = new Uint8Array(n);
    let rest = n;
    while (rest > 0) {
      const maybebuf = await this.fill(rest);
      if (maybebuf === "EOF") {
        throw new Error("unexpected EOF.");
      }
      r.set(maybebuf, r.length - rest);
      rest -= maybebuf.length;
    }
    return r;
  }

  async skip(n: number): Promise<void> {
    if (n < 0) {
      throw new Error("illegal argument.");
    }
    let rest = n;
    while (rest > 0) {
      const maybebuf = await this.fill(rest);
      if (maybebuf === "EOF") {
        throw new Error("unexpected EOF.");
      }
      rest -= maybebuf.length;
    }
  }

  subsource(limit: number): Source {
    return new SubSource(this, limit);
  }

  close(): void {
    this.reader.releaseLock();
  }
}

class ArraySource {
  _pos: number;
  items: Uint8Array;

  constructor(items: ArrayLike<number>) {
    this._pos = 0;
    this.items = Uint8Array.from(items);
  }

  get pos(): number {
    return this._pos;
  }

  read(): Promise<number>;
  read(eof: true): Promise<number | null>;
  read(eof?: true): Promise<number | null> {
    try {
      if (this.items.length - this._pos < 1) {
        if (eof) {
          return Promise.resolve(null);
        } else {
          throw new Error("unexpected EOF.");
        }
      }
      const r = this.items[this._pos];
      this._pos += 1;
      return Promise.resolve(r);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  readExact(n: number): Promise<Uint8Array> {
    try {
      if (n === 0) {
        return Promise.resolve(Uint8Array.from([]));
      }
      if (n < 1) {
        throw new Error("illegal argument.");
      }
      if (this.items.length - this._pos < n) {
        throw new Error("unexpected EOF.");
      }
      const r = this.items.slice(this._pos, this._pos + n);
      this._pos += n;
      return Promise.resolve(r);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  skip(n: number): Promise<void> {
    try {
      if (n === 0) {
        return Promise.resolve();
      }
      if (n < 1) {
        throw new Error("illegal argument.");
      }
      if (this.items.length - this._pos < n) {
        throw new Error("unexpected EOF.");
      }
      this._pos += n;
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  subsource(limit: number): Source {
    return new SubSource(this, limit);
  }

  close(): void {
    // nop
  }
}

class SubSource {
  delegate: Source;
  rest: number;

  constructor(delegate: Source, limit: number) {
    if (limit < 0) {
      throw new Error("illegal argument.");
    }
    this.delegate = delegate;
    this.rest = limit;
  }

  get pos(): number {
    return this.delegate.pos;
  }

  read(): Promise<number>;
  read(eof: true): Promise<number | null>;
  async read(eof?: true): Promise<number | null> {
    this.checkLimit(1);
    let r;
    if (eof === true) {
      r = await this.delegate.read(true);
    } else {
      r = await this.delegate.read();
    }
    if (r) {
      this.rest -= 1;
    }
    return r;
  }

  async readExact(n: number): Promise<Uint8Array> {
    this.checkLimit(n);
    const r = await this.delegate.readExact(n);
    this.rest -= r.length;
    return r;
  }

  async skip(n: number): Promise<void> {
    this.checkLimit(n);
    await this.delegate.skip(n);
    this.rest -= n;
  }

  subsource(limit: number): Source {
    return new SubSource(this, limit);
  }

  checkLimit(needs: number) {
    if (this.rest < needs) {
      throw new Error("limit reached.");
    }
  }
}
