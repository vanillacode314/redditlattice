module.exports = {
  extends: ['turbo', 'prettier'],
  plugins: ['solid', '@typescript-eslint', 'unused-imports', 'css'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
}
