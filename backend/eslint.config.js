// ESLint flat config para Node.js backend compatible con ESLint 9+

/** @type {import('eslint').FlatConfig[]} */
module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      // Defer indentation to Prettier/editor to avoid conflicts on conditional/object formatting
      indent: 'off',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
];
