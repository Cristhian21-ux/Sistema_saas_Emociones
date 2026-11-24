// Comandos reutilizables de las pruebas E2E del Centro Psicológico Emociones.
const CLAVE = 'Emociones2026';

/** Login por la interfaz (se usa en las pruebas que evalúan el propio login). */
Cypress.Commands.add('login', (email, password = CLAVE) => {
  cy.visit('/login');
  cy.get('[data-cy=email]').type(email);
  cy.get('[data-cy=password]').type(password, { log: false });
  cy.get('[data-cy=submit]').click();
});

/**
 * Inicia sesión una sola vez por usuario y reutiliza el token (cy.session).
 * Evita chocar con el límite de 10 intentos de login por minuto de la API.
 */
Cypress.Commands.add('ingresar', (email) => {
  cy.session(['usuario', email], () => {
    cy.login(email);
    cy.url().should('include', '/panel');
  }, {
    cacheAcrossSpecs: true,
    validate() {
      cy.window().then((win) => win.localStorage.getItem('emociones_token')).then((token) => {
        cy.request({ url: '/api/auth/me', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, failOnStatusCode: false })
          .its('status').should('eq', 200);
      });
    },
  });
});

/** Evidencia: una captura al final de cada escenario (se guardan en cypress/screenshots). */
afterEach(() => {
  cy.screenshot({ capture: 'viewport' });
});
