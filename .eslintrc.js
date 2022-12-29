module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      parserOpts: {
        plugins: [
          'classProperties',
          ['decorators', { decoratorsBeforeExport: false }],
        ],
      },
    },
  },
  extends: [
    'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@lwc/eslint-plugin-lwc'],
  // plugins: ['@typescript-eslint'],
  rules: {
    'prettier/prettier': 'warn',
  },
};
