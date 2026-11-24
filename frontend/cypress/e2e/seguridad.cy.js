// CP-19 a CP-26 · MP-01 Gestión de Acceso y Seguridad.
// Alta de personal, acceso del nuevo usuario, perfil, desactivación con bloqueo,
// auditoría, permisos de la API y aislamiento entre centros.
const sello = Date.now();
const nuevo = { nombre: 'Rocío Cypress', email: `rocio${sello}@emociones.test`, clave: 'Segura2026' };

/** Token guardado por cy.session para llamar a la API como ese usuario. */
const token = () => cy.window().then((win) => win.localStorage.getItem('emociones_token'));

describe('MP-01 · Gestión de acceso y seguridad', () => {
  it('CP-19 el administrador da de alta a un usuario de recepción', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/personal');
    cy.get('[data-cy=name]').type(nuevo.nombre);
    cy.get('[data-cy=email]').type(nuevo.email);
    cy.get('[data-cy=role]').select('recepcionista');
    cy.get('[data-cy=password]').type(nuevo.clave, { log: false });
    cy.get('[data-cy=agregar-personal]').click();
    cy.contains('[role=status]', 'Personal agregado.');
    cy.get('table').should('contain', nuevo.nombre);
  });

  it('CP-20 el nuevo usuario inicia sesión, ve solo sus módulos y actualiza su perfil', () => {
    cy.login(nuevo.email, nuevo.clave);
    cy.url().should('include', '/panel');
    cy.get('nav').should('contain', 'Pacientes').and('not.contain', 'Personal').and('not.contain', 'Seguridad y accesos');
    cy.visit('/perfil');
    cy.get('[data-cy=name]').clear().type(`${nuevo.nombre} Editada`);
    cy.get('[data-cy=guardar-perfil]').click();
    cy.contains('[role=status]', 'Perfil actualizado.');
  });

  it('CP-21 al desactivar la cuenta, el usuario ya no puede ingresar', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/personal');
    cy.get(`[data-cy="estado-${nuevo.email}"]`).should('have.text', 'Activo').click();
    cy.get(`[data-cy="estado-${nuevo.email}"]`).should('have.text', 'Inactivo');
    cy.clearLocalStorage();
    cy.login(nuevo.email, nuevo.clave);
    cy.contains('[role=alert]', 'desactivada');
    cy.url().should('include', '/login');
  });

  it('CP-22 la auditoría registra los intentos fallidos y bloqueados', () => {
    cy.ingresar('admin@emociones.test');
    cy.visit('/auditoria');
    cy.get('[data-cy=accion]').select('login');
    cy.get('[data-cy=filtrar-auditoria]').click();
    cy.get('[data-cy=tabla-auditoria]').should('contain', 'login.bloqueado').and('contain', 'login.fallido');
  });

  it('CP-24 la API rechaza peticiones sin token o con un rol sin permiso', () => {
    cy.request({ url: '/api/auditoria', headers: { Accept: 'application/json' }, failOnStatusCode: false })
      .its('status').should('eq', 401);
    cy.request({ url: '/api/auth/me', headers: { Accept: 'application/json', Authorization: 'Bearer token-falso' }, failOnStatusCode: false })
      .its('status').should('eq', 401);
    cy.ingresar('recepcion@emociones.test');
    cy.visit('/panel');
    token().then((t) => {
      ['/api/auditoria', '/api/personal/1/activo'].forEach((url, i) => {
        cy.request({ method: i === 1 ? 'PATCH' : 'GET', url, headers: { Accept: 'application/json', Authorization: `Bearer ${t}` }, failOnStatusCode: false })
          .its('status').should('eq', 403);
      });
    });
  });

  it('CP-25 aislamiento: un usuario de otro centro no ve los pacientes del Centro Emociones', () => {
    cy.ingresar('admin@bienestar.test');
    cy.visit('/pacientes');
    cy.contains('Aún no hay pacientes registrados.');
    token().then((t) => {
      cy.request({ url: '/api/pacientes', headers: { Accept: 'application/json', Authorization: `Bearer ${t}` } })
        .its('body.total').should('eq', 0);
    });
  });

  it('CP-26 el registro público de centros está deshabilitado en modo clínica única', () => {
    cy.visit('/registro');
    cy.url().should('include', '/login');
    cy.request({ method: 'POST', url: '/api/auth/registro', headers: { Accept: 'application/json' }, body: {}, failOnStatusCode: false })
      .its('status').should('be.oneOf', [403, 404]);
  });
});
