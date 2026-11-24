// CP-06 a CP-09 · Validación de formularios, registro, edición y eliminación de pacientes.
const dni = String(Date.now()).slice(-8);

describe('Gestión de pacientes (CRUD)', () => {
  beforeEach(() => {
    cy.ingresar('recepcion@emociones.test');
    cy.visit('/pacientes');
    cy.contains('h1', 'Pacientes');
  });

  it('CP-06 valida los campos obligatorios, el DNI y el celular', () => {
    cy.get('[data-cy=guardar-paciente]').click();
    cy.get('[data-cy=error-nombres]').should('contain', 'Requerido.');
    cy.get('[data-cy=error-apellidos]').should('contain', 'Requerido.');
    cy.get('[data-cy=dni]').type('1234');
    cy.get('[data-cy=telefono]').type('812345678');
    cy.get('[data-cy=guardar-paciente]').click();
    cy.get('[data-cy=error-dni]').should('contain', '8 dígitos');
    cy.get('[data-cy=error-telefono]').should('contain', 'empieza con 9');
  });

  it('CP-07 registra un paciente nuevo', () => {
    cy.get('[data-cy=nombres]').type('Lucía');
    cy.get('[data-cy=apellidos]').type('Cypress Prueba');
    cy.get('[data-cy=dni]').type(dni);
    cy.get('[data-cy=telefono]').type('987654321');
    cy.get('[data-cy=email]').type(`lucia${dni}@correo.pe`);
    cy.get('[data-cy=guardar-paciente]').click();
    cy.contains('[role=status]', 'Paciente registrado.');
    cy.get('[data-cy=buscar-paciente]').type(dni);
    cy.get('table').should('contain', 'Cypress Prueba').and('contain', dni);
  });

  it('CP-08 edita los datos del paciente', () => {
    cy.get('[data-cy=buscar-paciente]').type(dni);
    cy.get(`[data-cy=editar-${dni}]`).click();
    cy.contains('h2', 'Editar paciente');
    cy.get('[data-cy=apellidos]').clear().type('Cypress Editado');
    cy.get('[data-cy=guardar-paciente]').click();
    cy.contains('[role=status]', 'Paciente actualizado.');
    cy.get('table').should('contain', 'Cypress Editado');
  });

  it('CP-09 elimina al paciente (borrado lógico)', () => {
    cy.get('[data-cy=buscar-paciente]').type(dni);
    cy.get(`[data-cy=eliminar-${dni}]`).click(); // Cypress acepta el confirm() automáticamente
    cy.contains('[role=status]', 'Paciente eliminado.');
    cy.contains('No hay pacientes que coincidan con la búsqueda.');
  });
});
