// CP-16 a CP-18 · Accesibilidad para personas con discapacidad.
describe('Accesibilidad', () => {
  it('CP-16 activa alto contraste y letra grande, y se mantienen al recargar', () => {
    cy.visit('/login');
    cy.get('[data-cy=abrir-accesibilidad]').click();
    cy.get('[data-cy=panel-accesibilidad]').should('be.visible');
    cy.get('[data-cy=a11y-contraste]').check();
    cy.get('[data-cy=letra-mas]').click();
    cy.get('html').should('have.class', 'a11y-contraste').and('have.attr', 'style').and('contain', '115%');
    cy.reload();
    cy.get('html').should('have.class', 'a11y-contraste');
  });

  it('CP-17 reducir movimiento detiene la rotación de fotos y el panel se cierra con Escape', () => {
    cy.visit('/login');
    cy.get('[data-cy=abrir-accesibilidad]').click();
    cy.get('[data-cy=a11y-reducirMovimiento]').check();
    cy.get('[data-testid=mazo-fotos]').should('have.class', 'mazo--quieto');
    cy.get('[data-cy=pausar-animacion]').should('not.exist');
    cy.get('body').type('{esc}');
    cy.get('[data-cy=panel-accesibilidad]').should('not.exist');
  });

  it('CP-18 enlace "Saltar al contenido" para usuarios de teclado y lector de pantalla', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/panel');
    cy.get('[data-cy=saltar-contenido]').focus().should('be.visible').click();
    cy.location('hash').should('eq', '#contenido');
    cy.get('main#contenido').should('exist');
    cy.get('img').each(($img) => expect($img.attr('alt'), 'toda imagen tiene texto alternativo').to.exist);
  });
});
