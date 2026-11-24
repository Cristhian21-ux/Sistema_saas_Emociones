const { defineConfig } = require('cypress');

/**
 * Pruebas E2E sobre la aplicación real.
 * Antes de ejecutarlas:
 *   1) backend:  php artisan migrate:fresh --seed   y   php artisan serve --port=8000
 *   2) frontend: npm run dev   (http://localhost:3000, redirige /api al backend)
 *   3) frontend: npx cypress run   (o npx cypress open para verlas paso a paso)
 */
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1366,
    viewportHeight: 768,
    defaultCommandTimeout: 8000,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
  },
});
