import js from '@eslint/js';
import globals from 'globals';

export default [
  // Carpetas y artefactos que el linter no debe mirar
  {
    ignores: ['node_modules/**', 'cypress/videos/**', 'cypress/screenshots/**'],
  },

  // Reglas recomendadas de ESLint para todo el proyecto
  js.configs.recommended,

  // Código que corre en Node: servidor, lógica de negocio y tests unitarios
  {
    files: ['server.js', 'src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  // Código que corre en el navegador
  {
    files: ['frontend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },

  // Especificaciones E2E: globals de Cypress y Mocha
  {
    files: ['cypress/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        describe: 'readonly',
        it: 'readonly',
        cy: 'readonly',
        beforeEach: 'readonly',
        expect: 'readonly',
      },
    },
  },

  // Archivos de configuración de la raíz (herramientas, corren en Node)
  {
    files: ['eslint.config.js', 'cypress.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
];
