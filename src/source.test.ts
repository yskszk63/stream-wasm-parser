import { newSource } from "./source";

describe("array source", () => {
  test("read", async () => {
    const src = newSource([0x12, 0x34]);
    expect(await src.read()).toBe(0x12);
    expect(await src.read()).toBe(0x34);
    expect(await src.read(true)).toBeNull();
  });

  test("readExact", async () => {
    const src = newSource([0x01, 0x02, 0x03]);
    expect(await src.readExact(1)).toEqual(Uint8Array.from([0x01]));
    expect(await src.readExact(2)).toEqual(Uint8Array.from([0x02, 0x03]));
    await expect(src.readExact(1)).rejects.toThrow("unexpected EOF.");
    await expect(src.readExact(-1)).rejects.toThrow("illegal argument.");
  });

  test("skip", async () => {
    const src = newSource([0x01, 0x02, 0x03]);
    await src.skip(2);
    expect(await src.readExact(1)).toEqual(Uint8Array.from([0x03]));
    await expect(src.skip(1)).rejects.toThrow("unexpected EOF.");
    await expect(src.skip(-1)).rejects.toThrow("illegal argument.");
    await expect(src.read(true)).resolves.toBeNull();
  });
});

describe("subsource", () => {
  test("incorrect limit", async () => {
    const src = newSource([0x01, 0x02, 0x03]);
    expect(() => src.subsource(-1)).toThrow();
  });
});

class StreamStub {
  get locked(): boolean {
    throw new Error("stub");
  }
  cancel(): Promise<void> {
    throw new Error("stub");
  }
  getReader(): ReadableStreamDefaultReader {
    throw new Error("stub");
  }
  pipeThrough(): ReadableStream {
    throw new Error("stub");
  }
  pipeTo(): Promise<void> {
    throw new Error("stub");
  }
  tee(): [ReadableStream, ReadableStream] {
    throw new Error("stub");
  }
  forEach() {
    throw new Error("stub");
  }
  [Symbol.iterator](): IterableIterator<any> {
    throw new Error("stub");
  }
  entries(): IterableIterator<[number, any]> {
    throw new Error("stub");
  }
  keys(): IterableIterator<number> {
    throw new Error("stub");
  }
  values(): IterableIterator<any> {
    throw new Error("stub");
  }
}

class ReaderStub {
  read(): Promise<ReadableStreamDefaultReadResult<any>> {
    throw new Error("stub");
  }
  releaseLock(): void {
    throw new Error("stub");
  }
  get closed(): Promise<undefined> {
    throw new Error("stub");
  }
  cancel(): Promise<void> {
    throw new Error("stub");
  }
}

describe("stream source", () => {
  test("read", async () => {
    let n = 0;
    const stream = new (class extends StreamStub {
      getReader() {
        return new (class extends ReaderStub {
          read() {
            if (n++ === 0) {
              return Promise.resolve({
                value: Uint8Array.from([0x12, 0x34]),
                done: false as false,
              });
            } else {
              return Promise.resolve({ done: true as true });
            }
          }
        })();
      }
    })();

    const src = newSource(stream);
    await expect(src.subsource(0).read()).rejects.toThrow("limit reached.");
    expect(await src.read()).toBe(0x12);
    expect(await src.read()).toBe(0x34);
    expect(await src.read(true)).toBeNull();
    expect(await src.subsource(1).read(true)).toBeNull();
    await expect(src.read()).rejects.toThrow();
    expect(src.pos).toBe(2);
  });

  test("readExact", async () => {
    let n = 0;
    const stream = new (class extends StreamStub {
      getReader() {
        return new (class extends ReaderStub {
          read() {
            if (n++ === 0) {
              return Promise.resolve({
                value: Uint8Array.from([0x01, 0x02, 0x03]),
                done: false as false,
              });
            } else {
              return Promise.resolve({ done: true as true });
            }
          }
          releaseLock(): void {}
        })();
      }
    })();

    const src = newSource(stream);
    try {
      await expect(src.subsource(0).readExact(1)).rejects.toThrow(
        "limit reached.",
      );
      expect(await src.readExact(1)).toEqual(Uint8Array.from([0x01]));
      expect(await src.readExact(2)).toEqual(Uint8Array.from([0x02, 0x03]));
      await expect(src.readExact(1)).rejects.toThrow("unexpected EOF.");
      await expect(src.readExact(-1)).rejects.toThrow(
        "Invalid typed array length: -1",
      );
    } finally {
      src.close();
    }
  });

  test("skip", async () => {
    let n = 0;
    const stream = new (class extends StreamStub {
      getReader() {
        return new (class extends ReaderStub {
          read() {
            if (n++ === 0) {
              return Promise.resolve({
                value: Uint8Array.from([0x01, 0x02, 0x03]),
                done: false as false,
              });
            } else {
              return Promise.resolve({ done: true as true });
            }
          }
          releaseLock(): void {}
        })();
      }
    })();

    const src = newSource(stream);
    try {
      await src.skip(1);
      expect(await src.readExact(2)).toEqual(Uint8Array.from([0x02, 0x03]));
      await expect(src.skip(1)).rejects.toThrow("unexpected EOF.");
      await expect(src.skip(-1)).rejects.toThrow("illegal argument.");
      await expect(src.read(true)).resolves.toBeNull();
    } finally {
      src.close();
    }
  });
});
