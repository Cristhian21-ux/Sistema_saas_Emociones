// CP-12 a CP-15 · Módulo de reportes e impacto (datos reales de la base y filtros).
describe('Reportes e impacto', () => {
  it('CP-12 muestra indicadores y gráficos calculados con los registros', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/reportes');
    cy.contains('h1', 'Reportes e impacto');
    cy.get('[data-cy=indicadores] .indicador').should('have.length', 11);
    cy.get('[data-testid="indicador-Citas registradas"]').invoke('text').then(Number).should('be.greaterThan', 0);
    cy.get('[data-cy=grafico-mes]').should('be.visible');
    cy.get('[data-cy=grafico-estado] li').should('have.length.at.least', 2);
  });

  it('CP-13 el filtro por estado actualiza indicadores y gráficos', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/reportes');
    cy.get('[data-cy=estado]').select('cancelada');
    cy.get('[data-cy=aplicar]').click();
    cy.get('[data-cy=periodo]').should('contain', 'Cancelada');
    cy.get('[data-cy=grafico-estado] li').should('have.length', 1).and('contain', 'Cancelada');
    cy.get('[data-testid="indicador-Citas atendidas"]').should('have.text', '0');
  });

  it('CP-14 valida que el rango de fechas sea correcto', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/reportes');
    cy.get('[data-cy=desde]').clear().type('2026-10-20');
    cy.get('[data-cy=hasta]').clear().type('2026-10-01');
    cy.get('[data-cy=aplicar]').click();
    cy.get('[data-cy=error-hasta]').should('contain', 'posterior');
  });

  it('CP-15 el psicólogo solo ve sus propios datos (sin filtro de psicólogo)', () => {
    cy.ingresar('psicologo@emociones.test');
    cy.visit('/reportes');
    cy.get('[data-cy=indicadores]').should('be.visible');
    cy.get('[data-cy=psicologo_id]').should('not.exist');
  });
});
