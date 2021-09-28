import {ReadableStream} from 'stream/web';
import {parse} from 'stream-wasm-parser';

const iter = process.stdin[Symbol.asyncIterator]();
const stdin = new ReadableStream({
    async pull(controller) {
        const result = await iter.next();
        if (result.done) {
            controller.close();
        } else {
            controller.enqueue(result.value);
        }
    },

    type: 'bytes',
});

for await (const sec of parse(stdin)) {
    console.log(JSON.stringify(sec));
}
