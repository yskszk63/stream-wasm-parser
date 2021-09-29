# stream-wasm-parser

Streaming WASM binary parser.

WIP

## Build

```
npm build
```

## Test

```
npm test
```

## API

```typescript
declare type Options = unknown;
declare function parse(input: ArrayLike<number> | ReadableStream<Uint8Array>, _opt?: Options): AsyncGenerator<Item, void>;

declare type Item =
  | { tag: "custom"; val: [string, Uint8Array] }
  | {
    tag: "type";
    val: {
      index: typeidx;
      val: {
        tag: "func";
        val: {
          parameters:
            ("i32" | "i64" | "f32" | "f64" | "funcref" | "externref")[];
          results: ("i32" | "i64" | "f32" | "f64" | "funcref" | "externref")[];
        };
      };
    };
  }
  | {
    tag: "import";
    val: {
      module: string;
      name: string;
      desc: { tag: "func"; val: { index: funcidx; val: typeidx } } | {
        tag: "table";
        val: {
          index: tableidx;
          val: [{ min: u32; max: u32 | null }, "funcref" | "externref"];
        };
      } | {
        tag: "mem";
        val: { index: memidx; val: { min: u32; max: u32 | null } };
      } | {
        tag: "global";
        val: {
          index: globalidx;
          val: [
            "const" | "var",
            "i32" | "i64" | "f32" | "f64" | "funcref" | "externref",
          ];
        };
      };
    };
  }
  | { tag: "func"; val: { index: funcidx; val: typeidx } }
  | {
    tag: "table";
    val: {
      index: tableidx;
      val: { type: [{ min: u32; max: u32 | null }, "funcref" | "externref"] };
    };
  }
  | {
    tag: "mem";
    val: { index: memidx; val: { type: { min: u32; max: u32 | null } } };
  }
  | {
    tag: "global";
    val: {
      index: globalidx;
      val: {
        type: [
          "const" | "var",
          "i32" | "i64" | "f32" | "f64" | "funcref" | "externref",
        ];
        init: [Uint8Array, "end"];
      };
    };
  }
  | {
    tag: "export";
    val: {
      name: string;
      desc: { tag: "func"; val: funcidx } | { tag: "table"; val: tableidx } | {
        tag: "mem";
        val: memidx;
      } | { tag: "global"; val: globalidx };
    };
  }
  | { tag: "start"; val: { func: funcidx } }
  | {
    tag: "elem";
    val: {
      index: elemidx;
      val: {
        type: "funcref" | "externref";
        init: { tag: "expr"; val: ([Uint8Array, "end"])[] } | {
          tag: "funcref";
          val: (funcidx)[];
        };
        mode: { tag: "passive"; val: undefined } | {
          tag: "active";
          val: { table: tableidx; offset: [Uint8Array, "end"] };
        } | { tag: "deactive"; val: undefined };
      };
    };
  }
  | {
    tag: "code";
    val: [
      ("i32" | "i64" | "f32" | "f64" | "funcref" | "externref")[],
      [Uint8Array, "end"],
    ];
  }
  | {
    tag: "data";
    val: {
      index: dataidx;
      val: {
        init: Uint8Array;
        mode: { tag: "passive"; val: undefined } | {
          tag: "active";
          val: { memory: memidx; offset: [Uint8Array, "end"] };
        };
      };
    };
  }
  | { tag: "datacount"; val: u32 };
```

# Author

[yskszk63](https://github.com/yskszk63)

# License

[MIT](LICENSE)
