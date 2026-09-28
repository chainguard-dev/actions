import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';

const shared = {
  plugins: [
    esbuild({ tsconfig: './tsconfig.json', target: 'es2022' }),
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
