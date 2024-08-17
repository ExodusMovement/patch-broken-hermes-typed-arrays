module.exports = {
  extends: ['@exodus/eslint-config/javascript'],
  rules: {
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/prefer-spread': 'off',
  },
  overrides: [
    {
      files: ['**/tests/**/*.?([cm])[jt]s?(x)'],
      rules: {
        '@exodus/import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/*.?([cm])[jt]s?(x)'],
    },
  ],
}
