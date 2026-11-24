// CP-10 y CP-11 · Navegación entre módulos y cierre de sesión.
const MODULOS = [
  ['Citas y agenda', '/citas'],
  ['Pacientes', '/pacientes'],
  ['Reportes e impacto', '/reportes'],
  ['Lista de espera', '/espera'],
  ['Historias clínicas', '/historias'],
  ['Personal', '/personal'],
  ['Auditoría', '/auditoria'],
  ['Panel', '/panel'],
];

describe('Navegación', () => {
  it('CP-10 el administrador recorre todos los módulos desde el menú', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/panel');
    MODULOS.forEach(([etiqueta, ruta]) => {
      cy.get('nav').contains('a', etiqueta).click();
      cy.location('pathname').should('eq', ruta);
      cy.get('h1').should('be.visible');
    });
  });

  it('CP-11 cerrar sesión invalida el acceso a las rutas privadas', () => {
    cy.login('psicologa@emociones.test');
    cy.url().should('include', '/panel');
    cy.contains('button', 'Cerrar sesión').click();
    cy.url().should('include', '/login');
    cy.visit('/panel');
    cy.url().should('include', '/login');
  });
});
