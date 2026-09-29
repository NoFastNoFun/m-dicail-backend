import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    ignores: ['apps/api/src/migrations/**', '**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='query']",
          message: 'Raw SQL is forbidden outside migrations: use repository methods or the query builder with named parameters (:param).',
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(where|andWhere|orWhere|having|andHaving|orHaving|orderBy|addOrderBy|groupBy|addGroupBy|select|addSelect)$/] > TemplateLiteral[expressions.length>0]",
          message: "Never build SQL with template strings: pass values as named parameters, e.g. .where('id = :id', { id }).",
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(where|andWhere|orWhere|having|andHaving|orHaving|orderBy|addOrderBy|groupBy|addGroupBy|select|addSelect)$/] > BinaryExpression[operator='+']",
          message: "Never build SQL by concatenating strings: pass values as named parameters, e.g. .where('id = :id', { id }).",
        },
      ],
    },
  },
);
