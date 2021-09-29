import fs from 'fs'
import swc from 'rollup-plugin-swc'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts'
import {terser} from 'rollup-plugin-terser';

const swcConf = JSON.parse(fs.readFileSync(new URL(".swcrc", import.meta.url), {encoding: 'utf8'}));

export default [{
  input: './src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
  },
  plugins: [
    nodeResolve({
      extensions: ['.ts'],
    }),
    swc(swcConf),
    terser(),
  ],
}, {
  input: './src/index.ts',
  output: {
    file: 'dist/index.d.ts',
    format: 'es',
  },
  plugins: [
    dts(),
  ],
}];
