const q = (id) => cy.get(`[data-cy="${id}"]`);
describe('AgendaYA M03 y M04 — flujos individuales', () => {
  beforeEach(() => {
    cy.visit('/?demoDate=2026-07-06');
    cy.clearLocalStorage();
    cy.reload();
  });
  it('Joaquín · CP-001: crea un tipo de evento', () => {
    // Arrange
    q('event-name').type('Consulta de Seguimiento');
    q('event-duration').clear().type('30');
    q('event-description').type('Atención personalizada');
    // Act
    q('save-event').click();
    // Assert
    q('event-success').should('be.visible').and('contain', 'Evento creado correctamente');
    q('event-list').should('contain', 'Consulta de Seguimiento');
    q('booking-event').should('contain', 'Consulta de Seguimiento');
  });
  it('Lautaro · CP-003: edita un evento existente', () => {
    // Arrange
    q('edit-1').click();
    q('event-name').clear().type('Consulta de Seguimiento');
    q('event-duration').clear().type('45');
    q('event-mode').select('Presencial');
    // Act
    q('save-event').click();
    // Assert
    q('event-success').should('contain', 'Evento actualizado correctamente');
    q('event-1').should('contain', 'Consulta de Seguimiento · 45 min · Presencial');
    q('booking-event').should('contain', 'Consulta de Seguimiento');
  });
  it('Martín · CP-006: no elimina un evento con reservas futuras', () => {
    // Arrange
    q('event-2').should('contain', 'Entrevista Técnica');
    // Act
    q('delete-2').click();
    // Assert
    q('event-errors').should('be.visible').and('contain', 'posee reservas futuras asociadas');
    q('event-2').should('exist');
    q('booking-event').should('contain', 'Entrevista Técnica');
  });
  it('Facundo · CP-008: impide elegir un día sin disponibilidad', () => {
    // Arrange
    q('booking-event').select('1');
    // Act
    q('booking-date').select('2026-07-09');
    // Assert
    q('date-error').should('be.visible').and('contain', 'Este día no está disponible');
    q('booking-slots').children().should('have.length', 0);
  });
  it('Yamil · CP-009: muestra y selecciona una franja libre', () => {
    // Arrange
    q('booking-event').select('1');
    q('booking-date').select('2026-07-07');
    // Act
    q('slot-0900').click();
    // Assert
    q('selected-slot').should('contain', '09:00');
    q('slot-0900').should('have.class', 'selected');
    q('slot-1030').should('not.exist');
  });
  it('Lucas · CP-011: confirma una reserva y bloquea el slot', () => {
    // Arrange
    q('booking-event').select('1');
    q('booking-date').select('2026-07-07');
    q('slot-0900').click();
    q('guest-name').type('Ana Pérez');
    q('guest-email').type('ana@example.com');
    // Act
    q('confirm-booking').click();
    // Assert
    q('booking-success').should('be.visible').and('contain', 'Reserva confirmada');
    q('slot-0900').should('not.exist');
    cy.reload();
    q('booking-event').select('1');
    q('booking-date').select('2026-07-07');
    q('slot-0900').should('not.exist');
  });
  it('Joaquín · CP-002: no guarda nombre vacío ni duración cero', () => {
    // Arrange
    q('event-duration').clear().type('0');
    // Act
    q('save-event').click();
    // Assert
    q('event-errors')
      .should('contain', 'El nombre del tipo de evento es obligatorio')
      .and('contain', 'La duración debe ser mayor a 0');
    q('event-list').children().should('have.length', 2);
  });
  it('Lucas · CP-012: rechaza nombre vacío y correo inválido', () => {
    // Arrange
    q('booking-event').select('1');
    q('booking-date').select('2026-07-07');
    q('slot-1500').click();
    q('guest-email').type('sin-arroba');
    // Act
    q('confirm-booking').click();
    // Assert
    q('booking-errors')
      .should('contain', 'Por favor completar los campos obligatorios')
      .and('contain', 'Debe ingresar un correo electrónico válido');
    q('booking-success').should('not.be.visible');
    q('slot-1500').should('exist');
  });
});
