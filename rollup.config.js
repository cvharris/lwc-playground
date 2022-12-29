const lwc = require('@lwc/rollup-plugin');
const replace = require('@rollup/plugin-replace');
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonJs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel');

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
      babel({
        babelrc: false,
        babelHelpers: 'bundled',
        plugins: [
          // We can't use the actual TypeScript rollup plugin because it needs to run before lwc
          // and there is no option to disable decorator transforms.
          // plugin-transform-typescript only transforms type information and leaves
          // the decorators in place for @lwc/babel-plugin-component to transform
          ['@babel/plugin-transform-typescript'],
          ['@lwc/babel-plugin-component'],
        ],
        extensions: ['.ts'],
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
      babel({
        babelrc: false,
        presets: ['@babel/preset-modules'],
      }),
      args.watch &&
        serve({
          open: false,
          port: 3000,
        }),
      args.watch && livereload(),
    ],
  };
};
