import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validarEvento,
  eliminarEvento,
  obtenerDiasDisponibles,
  horariosDisponibles,
  validarReserva,
} from '../src/logica-negocio.js';
const evento = {
  nombre: 'Consulta',
  duracion: '30',
  modalidad: 'Virtual',
  confirmacion: 'Automática',
  descripcion: '',
};
const activo = { id: 1, nombre: 'Consulta', activo: true, reservasFuturas: 0 };
const reserva = { nombre: 'Ana Pérez', email: 'ana@example.com' };
const fecha = '2026-07-07',
  hoy = '2026-07-06';
// Joaquín: creación y validación de evento (5 tests, 2 comportamientos: validación y duplicados)
test('Joaquín: evento completo válido', () => assert.deepEqual(validarEvento(evento), {}));
test('Joaquín: nombre vacío rechazado', () =>
  assert.match(validarEvento({ ...evento, nombre: '  ' }).nombre, /obligatorio/));
test('Joaquín: duración cero rechazada', () =>
  assert.match(validarEvento({ ...evento, duracion: 0 }).duracion, /mayor a 0/));
test('Joaquín: descripción de 500 caracteres aceptada', () =>
  assert.equal(validarEvento({ ...evento, descripcion: 'a'.repeat(500) }).descripcion, undefined));
test('Joaquín: nombre duplicado sin distinguir mayúsculas rechazado', () =>
  assert.match(validarEvento({ ...evento, nombre: 'CONSULTA' }, [activo]).nombre, /Ya existe/));
// Lautaro: edición, longitud y duplicados (5 tests; validación + exclusión por id)
test('Lautaro: descripción de 501 caracteres rechazada', () =>
  assert.match(validarEvento({ ...evento, descripcion: 'a'.repeat(501) }).descripcion, /500/));
test('Lautaro: editar el mismo ID permite conservar nombre', () =>
  assert.equal(validarEvento(evento, [activo], 1).nombre, undefined));
test('Lautaro: editar a nombre ajeno duplicado se rechaza', () =>
  assert.match(validarEvento(evento, [activo], 2).nombre, /Ya existe/));
test('Lautaro: duración negativa se rechaza', () =>
  assert.ok(validarEvento({ ...evento, duracion: -5 }).duracion));
test('Lautaro: duración fraccionaria se rechaza', () =>
  assert.ok(validarEvento({ ...evento, duracion: 1.5 }).duracion));
// Martín: eliminación lógica + validación de formulario (5 tests, dos funciones)
test('Martín: eliminación sin reservas conserva datos y desactiva', () =>
  assert.deepEqual(eliminarEvento(activo).evento, { ...activo, activo: false }));
test('Martín: eliminación con reservas futuras bloqueada', () =>
  assert.match(eliminarEvento({ ...activo, reservasFuturas: 2 }).error, /reservas futuras/));
test('Martín: eliminar evento inactivo rechazada', () =>
  assert.equal(eliminarEvento({ ...activo, activo: false }).ok, false));
test('Martín: evento inexistente rechaza eliminación', () =>
  assert.equal(eliminarEvento(null).ok, false));
test('Martín: modalidad fuera del catálogo rechazada', () =>
  assert.ok(validarEvento({ ...evento, modalidad: 'Híbrida' }).modalidad));
// Facundo: fechas y slots (5 tests, dos funciones)
test('Facundo: fechas futuras del mes quedan ordenadas', () =>
  assert.deepEqual(obtenerDiasDisponibles(hoy, ['2026-07-08', '2026-07-07']), [
    '2026-07-07',
    '2026-07-08',
  ]));
test('Facundo: fecha pasada se excluye', () =>
  assert.deepEqual(obtenerDiasDisponibles(hoy, ['2026-07-05']), []));
test('Facundo: fecha del siguiente mes se excluye', () =>
  assert.deepEqual(obtenerDiasDisponibles(hoy, ['2026-08-01']), []));
test('Facundo: fecha de hoy puede aparecer', () =>
  assert.deepEqual(obtenerDiasDisponibles(hoy, [hoy]), [hoy]));
test('Facundo: slot ya tomado se excluye', () =>
  assert.deepEqual(horariosDisponibles(['09:00', '15:00'], ['2026-07-07|09:00'], fecha, hoy), [
    '15:00',
  ]));
// Yamil: slots y disponibilidad de reserva (5 tests, dos funciones)
test('Yamil: todos los slots futuros libres aparecen', () =>
  assert.deepEqual(horariosDisponibles(['09:00', '15:00'], [], fecha, hoy), ['09:00', '15:00']));
test('Yamil: solo se bloquea el slot de la fecha correcta', () =>
  assert.deepEqual(horariosDisponibles(['09:00'], ['2026-07-08|09:00'], fecha, hoy), ['09:00']));
test('Yamil: slot pasado se excluye', () =>
  assert.deepEqual(horariosDisponibles(['09:00'], [], '2026-07-05', hoy), []));
test('Yamil: reserva sin slot se rechaza', () =>
  assert.ok(validarReserva(reserva, fecha, '', hoy, ['09:00']).horario));
test('Yamil: horario ocupado se rechaza al confirmar', () =>
  assert.ok(validarReserva(reserva, fecha, '09:00', hoy, []).horario));
// Lucas: datos de invitado y verificación de fecha (5 tests, dos comportamientos)
test('Lucas: reserva válida aceptada', () =>
  assert.deepEqual(validarReserva(reserva, fecha, '09:00', hoy, ['09:00']), {}));
test('Lucas: nombre vacío rechazado', () =>
  assert.ok(validarReserva({ ...reserva, nombre: ' ' }, fecha, '09:00', hoy, ['09:00']).nombre));
test('Lucas: email inválido rechazado', () =>
  assert.ok(
    validarReserva({ ...reserva, email: 'incorrecto' }, fecha, '09:00', hoy, ['09:00']).email,
  ));
test('Lucas: teléfono ausente permitido', () =>
  assert.deepEqual(
    validarReserva({ ...reserva, telefono: '' }, fecha, '09:00', hoy, ['09:00']),
    {},
  ));
test('Lucas: fecha pasada no reservable', () =>
  assert.ok(validarReserva(reserva, '2026-07-05', '09:00', hoy, ['09:00']).horario));
