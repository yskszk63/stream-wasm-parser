async function fuzz(buf) {
    const {parse} = await import('./dist/index.js');

    const b = new Uint8Array(buf.length + 8);
    b.set([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, ...buf]);
    try {
        for await (const _ of parse(b)) { }
    } catch (e) {
        if (e.message !== 'unexpected EOF.'
            && !e.message.startsWith('unknown tag. ')
            && e.message !== 'limit reached.'
            && !e.message.startsWith('invalid data. ')
            && !e.message.startsWith('overflow. ')
            && e.message !== 'unexpected value. undefined'
            && !e.message.startsWith('unknwon elem.')
            && !e.message.startsWith('unknown elemkind.')
            && !e.message.startsWith('unknown value. ')
            && !e.message.startsWith('length > 2**31-1')
            && !e.message.startsWith('incorrect size. ')) {
            throw e;
        }
    }
}

module.exports = {
    fuzz
};
