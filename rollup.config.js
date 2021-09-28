import swc from 'rollup-plugin-swc'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts'

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
    swc({
      // TODO read from .swcrc
      jsc: {
        parser: {
          syntax: 'typescript',
        },
        target: 'es2018',
      },
    }),
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
