// @deno-types="../dist/index.d.ts"
import {parse, types as t, modules as m} from '../dist/index.js';

const stdin = new ReadableStream({
    async pull(controller) {
        const buf = new Uint8Array(4096);
        const r = await Deno.stdin.read(buf);
        if (r === null) {
            controller.close();
        } else {
            controller.enqueue(new Uint8Array(buf.buffer, 0, r));
        }
    },
    type: 'bytes',
});

console.log("export type i32 = number;");
console.log("export type i64 = BigInt;");
console.log("export type f32 = number;");
console.log("export type f64 = number;");
console.log("export type Export = {");

const types: Map<m.typeidx, t.functype> = new Map();
const funcs: Map<m.funcidx, m.typeidx> = new Map();
for await (const sec of parse(stdin)) {
    switch (sec.tag) {
    case "type": {
        types.set(sec.val.index, sec.val.val);
        break;
    }

    case "func": {
        funcs.set(sec.val.index, sec.val.val);
        break;
    }

    case "import": {
        if (sec.val.desc.tag === 'func') {
            funcs.set(sec.val.desc.val.index, sec.val.desc.val.val);
        }
        break;
    }

    case "export": {
        const {name, desc} = sec.val;
        switch (desc.tag) {
        case "global": {
            console.log(`  ${name}: WebAssembly.Global;`);
            break;
        }

        case "table": {
            console.log(`  ${name}: WebAssembly.Table;`);
            break;
        }

        case "mem": {
            console.log(`  ${name}: WebAssembly.Memory;`);
            break;
        }

        case "func": {
            const func = funcs.get(desc.val);
            if (typeof func === 'undefined') {
                throw new Error();
            }
            const type = types.get(func);
            if (typeof type === 'undefined') {
                throw new Error();
            }

            const params = type.val.parameters.map((t, i) => `p${i}: ${t}`).join(', ');
            switch (type.val.results.length) {
            case 0:
                console.log(`  ${name}(${params}): void`);
                break;
            case 1:
                console.log(`  ${name}(${params}): ${type.val.results[0]}`);
                break;
            default:
                console.log(`  ${name}(${params}): [${type.val.results.join(', ')}]`);
                break;
            }
            break;
        }

        default:
            break;
        }
    }
    }
}
console.log("}");
