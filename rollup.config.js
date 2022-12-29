const path = require('path');
const lwc = require('@lwc/rollup-plugin');
const replace = require('@rollup/plugin-replace');
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonJs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel');
const { transform } = require('@babel/core');
const json = require('@rollup/plugin-json');

const __ENV__ = process.env.NODE_ENV ?? 'development';

module.exports = (args) => {
  return {
    input: 'src/main.js',

    output: {
      file: 'dist/main.js',
      format: 'esm',
    },

    plugins: [
      nodeResolve({
        browser: true,
      }),
      lwc({
        exclude: ['node_modules/**'],
      }),
      commonJs(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(__ENV__),
        preventAssignment: true,
      }),

      // After LWC has been transformed, transform any syntax isn't supported
      // by all browsers that support modules
      // babel({
      //   babelrc: false,
      //   presets: ['@babel/preset-modules'],
      //   extensions: ['.ts', '.js'],
      // }),
      args.watch &&
        serve({
          open: false,
          port: 3000,
        }),
      args.watch && livereload(),
    ],
  };
};
