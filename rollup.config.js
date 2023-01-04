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
      babel({
        babelrc: false,
        babelHelpers: 'bundled',
        plugins: [
          // We can't use the actual TypeScript rollup plugin because it needs to run before lwc
          // and there is no option to disable decorator transforms.
          // plugin-syntax-decorators tells babel to leave the decorators alone
          // and plugin-transform-typescript only transforms type information
          // ['@babel/plugin-syntax-decorators', { decoratorsBeforeExport: true }],
          ['@babel/plugin-transform-typescript'],
          ['@lwc/babel-plugin-component'],
        ],
        extensions: ['.ts', '.js'],
      }),

      nodeResolve({
        browser: true,
      }),
      lwc({
        // exclude: [/node_modules\/.+?\.mjs$/g],
        include: ['**/*.html', '**/*.css'],
        stylesheetConfig: {
          // By default, LWC disables custom property definitions
          customProperties: {
            allowDefinition: true,
          },
        },
      }),
      commonJs({
        extensions: ['.js', '.ts', '.mjs'],
      }),
      replace({
        values: {
          'process.env.NODE_ENV': JSON.stringify(__ENV__),
        },
        preventAssignment: true,
      }),
      // After LWC has been transformed, transform any syntax isn't supported
      // by all browsers that support modules
      // babel({
      //   babelrc: false,
      //   babelHelpers: 'bundled',
      //   presets: ['@babel/preset-modules'],
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
