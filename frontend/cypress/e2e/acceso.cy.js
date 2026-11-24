// CP-01 a CP-05 · Acceso y autenticación de usuarios.
// Requieren el sistema levantado y la base con `php artisan migrate:fresh --seed`.
describe('Acceso y autenticación', () => {
  it('CP-01 muestra el formulario de login con el mazo de fotos del centro', () => {
    cy.visit('/login');
    cy.get('[data-testid=mazo-fotos]').should('exist');
    cy.get('[data-testid=fondo-fotos]').should('exist');
    cy.contains('h2', 'Iniciar sesión');
    cy.get('[data-cy=email]').should('be.visible');
  });

  it('CP-02 el administrador inicia sesión y entra a su panel', () => {
    cy.login('admin@emociones.test');
    cy.url().should('include', '/panel');
    cy.contains('h1', /(Buenos días|Buenas tardes|Buenas noches), Administración/);
    cy.get('.indicador').should('have.length.at.least', 6);
  });

  it('CP-03 rechaza credenciales incorrectas', () => {
    cy.login('admin@emociones.test', 'incorrecta1');
    cy.get('[role=alert]').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('CP-04 recepción no puede abrir historias clínicas (control de acceso por rol)', () => {
    cy.ingresar('recepcion@emociones.test');
    cy.visit('/historias');
    cy.url().should('include', '/panel');
    cy.get('nav').should('not.contain', 'Historias clínicas');
  });

  it('CP-05 sin sesión las rutas privadas redirigen al login', () => {
    cy.visit('/pacientes');
    cy.url().should('include', '/login');
    cy.request({ url: '/api/pacientes', headers: { Accept: 'application/json' }, failOnStatusCode: false })
      .its('status').should('eq', 401);
  });
});
