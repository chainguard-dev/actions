import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const shared = {
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    commonjs(),
    nodeResolve({ preferBuiltins: true }),
  ],
  external: [/^node:/],
};

export default [
  {
    input: 'index.ts',
    output: {
      esModule: true,
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    ...shared,
  },
  {
    input: 'post.ts',
    output: {
      esModule: true,
      file: 'dist/post/index.js',
      format: 'es',
      sourcemap: true,
    },
    ...shared,
  },
];
