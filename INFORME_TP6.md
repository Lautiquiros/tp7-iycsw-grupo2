# Ingeniería y Calidad de Software — TP6: Testing Automatizado

**Proyecto:** AgendaYA · **Módulos:** M03 Tipos de Evento y M04 Booking Público  
**Equipo informado en los TPs previos:** Lautaro Quirós, Joaquín Giuliani, Facundo Costella, Martín Berón, Yamil Tahan y Lucas García.  
**Estado de este documento:** propuesta técnica generada con IA, pendiente de revisión, ejecución E2E y autoría individual real. No atribuir código automáticamente a los integrantes antes de que cada uno lo revise y asuma.

## 1. Carátula y repositorio

Repositorio remoto: **[COMPLETAR URL REAL]**. Es necesario versionar todos los archivos y verificar al menos tres commits descriptivos reales. El prototipo entregado no incluye historial Git ni URL remoto: no es evidencia de versionado hasta que se suba.

## 2. Tarea A: frontend mínimo

Aplicación servida en `http://localhost:3000`. M03: alta y edición con nombre, duración positiva entera, modalidad, confirmación y descripción opcional de hasta 500 caracteres; lista de eventos y bloqueo de eliminación si hay reservas futuras. M04: elegir tipo de evento, día disponible en el mes de referencia, horario y completar nombre y email obligatorios; se registra localmente y deja de ofrecer el horario. Teléfono y nota son opcionales. Atributos `data-cy` en todos los controles y resultados. Los formularios reportan errores visibles y el éxito informa un estado visible.

**Alcance simulado:** la autenticación del administrador y la disponibilidad configurada se suponen; los dos eventos base y sus reservas futuras están sembrados en el frontend. No hay envío real de emails, persistencia compartida entre navegadores ni validación transaccional de concurrencia. La simulación de reserva impide reutilizar un slot en el mismo almacenamiento del navegador. No afirmar que satisface M04-F05 en tiempo real multiusuario, M04-NF03 de rendimiento ni M04-NF05 de seguridad sin un backend y mediciones. La fecha `?demoDate=2026-07-06` estabiliza las pruebas del calendario y no pretende ser un calendario de producción.

**Trazabilidad:** M03-F01 / US013 / CP-001-002 ↔ creación; M03-F02 / US010 / CP-003-004 ↔ edición; M03-F03 / US016-017 / CP-005-006 ↔ eliminación; M04-F02 / CP-007-008 ↔ fechas; M04-F03 / CP-009-010 ↔ horarios; M04-F04 / CP-011-012 ↔ confirmación. Las pruebas automatizadas cubren una selección de estos casos; no se reivindica cobertura completa de cada caso.

## 3. Tarea B: Cypress E2E

Ocho escenarios: alta correcta y validación de error; edición correcta; eliminación bloqueada; día sin disponibilidad; selección de franja; reserva exitosa y reserva inválida. Cada test contiene comentarios Arrange/Act/Assert y verifica estado final. La siguiente asignación **es sugerida** según el TP5, no evidencia de quién escribió/ejecutó el código:

| Integrante       | E2E propuesto   | Unitarios propuestos |
| ---------------- | --------------- | -------------------- |
| Joaquín Giuliani | CP-001 y CP-002 | 1–5                  |
| Lautaro Quirós   | CP-003          | 6–10                 |
| Martín Berón     | CP-006          | 11–15                |
| Facundo Costella | CP-008          | 16–20                |
| Yamil Tahan      | CP-009          | 21–25                |
| Lucas García     | CP-011 y CP-012 | 26–30                |

**Código íntegro, archivo `cypress/e2e/m03-m04.cy.js`:**

```js
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
```

**Ejecución real:** pendiente de ejecutar `npm run start` y, en otra terminal, `npm run test:e2e` con Cypress instalado. Adjuntar **[CAPTURA O VIDEO REAL DE AL MENOS DOS TESTS, UNO EXITOSO Y UNO DE ERROR/BORDE]** y anotar cantidad de tests pasados/fallidos. No se generaron capturas ni video en este entorno. Si falla alguno, pegar mensaje de error completo, causa y decisión del equipo; no corregir un test solo para hacerlo verde.

## 4. Tarea C: unitarios e IA

Se usó el runner `node:test` y las aserciones `node:assert/strict` de Node.js. El archivo agrupa 5 tests por integrante propuesto y verifica como mínimo dos comportamientos o funciones en cada grupo. Se cubren casos normales, inválidos y límites: 500/501 caracteres, duración 0/negativa/fraccionaria, nombre duplicado, reservas futuras, días pasados y horarios ocupados.

**Evidencia realmente comprobada en este entorno:** `node --test tests/logica-negocio.test.js`: **30 pruebas aprobadas, 0 fallidas**. Se comprobó que `/`, `/frontend/app.js` y `/src/logica-negocio.js` responden HTTP 200 con el servidor local. Esos chequeos no sustituyen una ejecución E2E en navegador. Adjuntar **[CAPTURA DE SALIDA DE PRUEBAS UNITARIAS DEL EQUIPO]**.

**Prompt real a la IA:** “Resuelve el tp 6, tedeje e material anterior de los tps anterirores , usalos si los necesitas y lee la teoria de test automatizado. Si necesitas algo mas decime”. Se adjuntaron el enunciado del TP6, teoría introductoria y los trabajos anteriores. **Herramienta:** Perplexity (asistente de IA). **Output:** los archivos de esta propuesta, entre ellos el código íntegro de test y lógica reproducido a continuación. **Modificaciones humanas posteriores:** no documentadas aún; los integrantes deberán consignar aquí cambios reales con commit y motivo. **Evaluación crítica:** la IA facilitó casos, fixture estable y estructura de validaciones, pero no puede confirmar quién escribió/ejecutó cada test, la existencia del repo remoto, que Cypress funcione en el equipo ni la integración real con correo/concurrencia. Se evitó un test dependiente de la fecha actual congelando una fecha de demo y se separó lógica de interfaz para que el test unitario no sea un test de DOM. Cada integrante debe explicar y revisar sus cinco casos antes de firmar esta sección.

**Código íntegro, archivo `tests/logica-negocio.test.js`:**

```js
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
```

**Código fuente mínimo probado, archivo `src/logica-negocio.js`:**

```js
export function validarEvento(datos, existentes = [], idEditar = null) {
  const errors = {};
  const nombre = String(datos.nombre ?? '').trim();
  if (!nombre) errors.nombre = 'El nombre del tipo de evento es obligatorio';
  const duracion = Number(datos.duracion);
  if (
    datos.duracion === '' ||
    datos.duracion == null ||
    !Number.isInteger(duracion) ||
    duracion <= 0
  )
    errors.duracion = 'La duración debe ser mayor a 0';
  if (String(datos.descripcion ?? '').length > 500)
    errors.descripcion = 'La descripción no puede superar los 500 caracteres';
  if (
    nombre &&
    existentes.some(
      (e) =>
        e.id !== idEditar &&
        e.activo &&
        e.nombre.trim().toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'),
    )
  )
    errors.nombre = 'Ya existe un tipo de evento con ese nombre';
  if (!['Virtual', 'Presencial'].includes(datos.modalidad))
    errors.modalidad = 'Seleccioná una modalidad';
  if (!['Automática', 'Manual'].includes(datos.confirmacion))
    errors.confirmacion = 'Seleccioná un tipo de confirmación';
  return errors;
}
export function eliminarEvento(evento) {
  if (!evento || !evento.activo) return { ok: false, error: 'Tipo de evento no disponible' };
  if (evento.reservasFuturas > 0)
    return {
      ok: false,
      error: 'No se puede eliminar el tipo de evento porque posee reservas futuras asociadas',
    };
  return { ok: true, evento: { ...evento, activo: false } };
}
export function obtenerDiasDisponibles(hoy, diasConSlots) {
  const anioMes = hoy.slice(0, 7);
  return diasConSlots.filter((d) => d.slice(0, 7) === anioMes && d >= hoy).sort();
}
export function horariosDisponibles(horarios, reservados, fecha, hoy) {
  return horarios.filter(
    (h) => !reservados.includes(`${fecha}|${h}`) && `${fecha}T${h}` > `${hoy}T08:00`,
  );
}
export function validarReserva(datos, fecha, hora, hoy, libres) {
  const errors = {};
  if (!String(datos.nombre ?? '').trim())
    errors.nombre = 'Por favor completar los campos obligatorios';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(datos.email ?? '').trim()))
    errors.email = 'Debe ingresar un correo electrónico válido';
  if (!fecha || !hora || fecha < hoy || !libres.includes(hora))
    errors.horario = 'Horario ya reservado o no disponible';
  return errors;
}
```

## 5. Reflexión estructurada

1. **Trazabilidad:** TP1 permitió identificar M03-F01/F02/F03 y M04-F02/F03/F04; TP2 y TP5 concretaron nombre obligatorio, duración mayor que cero, descripción de hasta 500 caracteres y datos obligatorios para reservar. Resultó ambiguo cómo representar la disponibilidad del mes, la política para el día actual y la concurrencia en ausencia de backend. Para pruebas reproducibles fijamos un calendario de demostración y documentamos sus límites, sin convertirlo en requisito de producción.
2. **Valor de testear:** se verificaron los casos unitarios y el servidor, pero no hay aún resultados de Cypress para afirmar que encontramos un bug de interfaz. Los tests E2E previstos ayudarán a descubrir divergencias entre formulario y lógica; todo fallo real debe registrarse junto a decisión y cambio.
3. **Uso de IA:** fue más útil para derivar casos límite y generar lógica separada del DOM. Su principal límite es que puede proponer un frontend coherente en papel sin haber ejecutado un navegador ni confirmar integración con los otros módulos; por eso quedan pendientes la revisión del equipo y la ejecución E2E.

## 6. Lecciones aprendidas

- **Testeabilidad:** separar reglas puras de la interfaz y usar `data-cy` reduce fragilidad de las pruebas y facilita ubicar fallos.
- **IA:** el código generado debe revisarse y ejecutarse; un resultado no medido no puede informarse como aprobado.
- **Calidad de requisitos:** límites explícitos como 500 caracteres o duración mayor que cero producen aserciones precisas; expresiones vagas como “disponible en tiempo real” exigen definir fuente de datos y consistencia antes de probarse.

## 7. Checklist de entrega presencial

- [ ] Validar la asignación y completar aportes/autores reales de cada integrante.
- [ ] Instalar Cypress, ejecutar 8 casos E2E y guardar captura/video de dos casos para demo.
- [ ] Ejecutar `npm run test` en la computadora del equipo y adjuntar captura.
- [ ] Registrar fallos completos si aparecen y actualizar la reflexión con bugs reales.
- [ ] Crear al menos 3 commits descriptivos, subir el repo y pegar enlace real.
- [ ] Explicar oralmente dos tests unitarios, la asistencia de IA y una reflexión.
