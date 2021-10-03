# stream-wasm-parser

Streaming WASM binary parser.

WIP

## Example

(browser example)[./example/browser/index.js]

```javascript
import { parse } from "./stream-wasm-parser.js";

const $pre = document.querySelector('pre');
for await (const sec of parse(fetch('./example.wasm'))) {
    $pre.append(JSON.stringify(sec), "\n");
}
```

output

```text
{"tag":"type","val":{"index":0,"val":{"tag":"func","val":{"parameters":["i32","i32"],"results":[]}}}}
{"tag":"type","val":{"index":1,"val":{"tag":"func","val":{"parameters":["i32","i32","i32"],"results":["i32"]}}}}
{"tag":"type","val":{"index":2,"val":{"tag":"func","val":{"parameters":["i32","i32"],"results":["i32"]}}}}
{"tag":"type","val":{"index":3,"val":{"tag":"func","val":{"parameters":["i32","i32","i32"],"results":[]}}}}
...
```

## API

```typescript
/**
 * Options for `parse`.
 */
declare type ParseOptions = {
    /**
     * Capture function code instructions as Uint8Array
     */
    captureInstructions?: true;
    /**
     * Name of the custom section to capture.
     */
    captureCustom?: string[];
};
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
declare function parse(input: ArrayLike<number> | ReadableStream<Uint8Array> | Response | PromiseLike<Response>, opt?: ParseOptions): AsyncGenerator<Item, void>;

declare type Item =
  | { tag: "custom"; val: [string, Uint8Array | null] }
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
        init: Uint8Array;
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
        init: { tag: "expr"; val: (Uint8Array)[] } | {
          tag: "funcref";
          val: (funcidx)[];
        };
        mode: { tag: "passive"; val: undefined } | {
          tag: "active";
          val: { table: tableidx; offset: Uint8Array };
        } | { tag: "deactive"; val: undefined };
      };
    };
  }
  | {
    tag: "code";
    val: [
      ("i32" | "i64" | "f32" | "f64" | "funcref" | "externref")[],
      Uint8Array | null,
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
          val: { memory: memidx; offset: Uint8Array };
        };
      };
    };
  }
  | { tag: "datacount"; val: u32 };
```

## Build

```
npm build
```

## Test

```
npm test
```

# Author

[yskszk63](https://github.com/yskszk63)

# License

[MIT](LICENSE)
