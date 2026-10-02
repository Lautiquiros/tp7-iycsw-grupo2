import {
  validarEvento,
  eliminarEvento,
  obtenerDiasDisponibles,
  horariosDisponibles,
  validarReserva,
} from '/src/logica-negocio.js';
const $ = (id) => document.querySelector(`[data-cy="${id}"]`);
const params = new URLSearchParams(location.search);
const realNow = new Date();
const today = /^\d{4}-\d{2}-\d{2}$/.test(params.get('demoDate') || '')
  ? params.get('demoDate')
  : [
      realNow.getFullYear(),
      String(realNow.getMonth() + 1).padStart(2, '0'),
      String(realNow.getDate()).padStart(2, '0'),
    ].join('-');
const addDays = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
};
const dias = [1, 2]
  .map((n) => addDays(today, n))
  .filter((d) => d.slice(0, 7) === today.slice(0, 7));
const noDisponible = addDays(today, 3);
const seed = [
  {
    id: 1,
    nombre: 'Consulta Inicial',
    duracion: 30,
    modalidad: 'Virtual',
    confirmacion: 'Automática',
    descripcion: '',
    activo: true,
    reservasFuturas: 0,
  },
  {
    id: 2,
    nombre: 'Entrevista Técnica',
    duracion: 45,
    modalidad: 'Presencial',
    confirmacion: 'Manual',
    descripcion: '',
    activo: true,
    reservasFuturas: 2,
  },
];
const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
let eventos = load('ay_eventos', seed),
  reservados = load('ay_reservados', []),
  editId = null,
  selectedTime = '';
const persist = () => {
  localStorage.setItem('ay_eventos', JSON.stringify(eventos));
  localStorage.setItem('ay_reservados', JSON.stringify(reservados));
};
const text = (node, value) => {
  node.textContent = value;
  node.hidden = !value;
};
const clearForm = () => {
  $('event-form').reset();
  editId = null;
};
function renderEvents() {
  const ul = $('event-list');
  ul.replaceChildren();
  for (const e of eventos.filter((e) => e.activo)) {
    const li = document.createElement('li');
    li.setAttribute('data-cy', `event-${e.id}`);
    li.append(document.createTextNode(`${e.nombre} · ${e.duracion} min · ${e.modalidad} `));
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Editar';
    edit.setAttribute('data-cy', `edit-${e.id}`);
    edit.onclick = () => {
      editId = e.id;
      for (const key of ['nombre', 'duracion', 'modalidad', 'confirmacion', 'descripcion'])
        $('event-form').elements[key].value = e[key];
      text($('event-errors'), '');
      text($('event-success'), '');
    };
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = 'Eliminar';
    del.setAttribute('data-cy', `delete-${e.id}`);
    del.onclick = () => {
      const result = eliminarEvento(e);
      if (!result.ok) {
        text($('event-errors'), result.error);
        return;
      }
      eventos = eventos.map((x) => (x.id === e.id ? result.evento : x));
      persist();
      renderEvents();
      text($('event-errors'), '');
      text($('event-success'), 'Tipo de evento eliminado correctamente');
    };
    li.append(edit, del);
    ul.append(li);
  }
  const select = $('booking-event');
  const prior = select.value;
  select.replaceChildren(new Option('Seleccioná un evento', ''));
  for (const e of eventos.filter((e) => e.activo))
    select.add(new Option(`${e.nombre} (${e.duracion} min)`, String(e.id)));
  select.value = eventos.some((e) => e.activo && String(e.id) === prior) ? prior : '';
  renderDates();
}
function renderDates() {
  const sel = $('booking-date');
  sel.replaceChildren(new Option('Seleccioná una fecha', ''));
  for (const d of obtenerDiasDisponibles(today, dias)) sel.add(new Option(d, d));
  if (noDisponible.slice(0, 7) === today.slice(0, 7))
    sel.add(new Option(`${noDisponible} (sin disponibilidad)`, noDisponible));
  sel.value = '';
  selectedTime = '';
  renderSlots();
  text($('date-error'), '');
}
function renderSlots() {
  const container = $('booking-slots');
  container.replaceChildren();
  if (!$('booking-event').value || !$('booking-date').value) return;
  const fecha = $('booking-date').value;
  if (!dias.includes(fecha)) {
    text($('date-error'), 'Este día no está disponible, por favor seleccione otro');
    return;
  }
  text($('date-error'), '');
  const libres = horariosDisponibles(
    ['09:00', '10:30', '15:00'],
    [`${fecha}|10:30`, ...reservados],
    fecha,
    today,
  );
  for (const hora of libres) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = hora;
    b.setAttribute('data-cy', `slot-${hora.replace(':', '')}`);
    b.onclick = () => {
      selectedTime = hora;
      text($('selected-slot'), `Horario seleccionado: ${hora}`);
      for (const el of container.querySelectorAll('button'))
        el.classList.toggle('selected', el === b);
    };
    container.append(b);
  }
}
$('event-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(ev.currentTarget));
  const errors = validarEvento(data, eventos, editId);
  text($('event-errors'), Object.values(errors).join('. '));
  text($('event-success'), '');
  for (const key of ['nombre', 'duracion', 'descripcion'])
    ev.currentTarget.elements[key].setAttribute('aria-invalid', String(Boolean(errors[key])));
  if (Object.keys(errors).length) return;
  if (editId !== null) {
    eventos = eventos.map((e) =>
      e.id === editId ? { ...e, ...data, duracion: Number(data.duracion) } : e,
    );
    text($('event-success'), 'Evento actualizado correctamente');
  } else {
    eventos.push({
      ...data,
      id: Math.max(0, ...eventos.map((e) => e.id)) + 1,
      duracion: Number(data.duracion),
      activo: true,
      reservasFuturas: 0,
    });
    text($('event-success'), 'Evento creado correctamente');
  }
  persist();
  clearForm();
  renderEvents();
});
$('cancel-edit').onclick = () => {
  clearForm();
  text($('event-errors'), '');
};
$('booking-event').onchange = renderDates;
$('booking-date').onchange = () => {
  selectedTime = '';
  text($('selected-slot'), '');
  renderSlots();
};
$('booking-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(ev.currentTarget));
  const fecha = $('booking-date').value,
    libres = dias.includes(fecha)
      ? horariosDisponibles(
          ['09:00', '10:30', '15:00'],
          [`${fecha}|10:30`, ...reservados],
          fecha,
          today,
        )
      : [];
  const errors = validarReserva(data, fecha, selectedTime, today, libres);
  if (!$('booking-event').value) errors.evento = 'Seleccioná un tipo de evento';
  text($('booking-errors'), Object.values(errors).join('. '));
  text($('booking-success'), '');
  if (Object.keys(errors).length) return;
  reservados.push(`${fecha}|${selectedTime}`);
  persist();
  text(
    $('booking-success'),
    `Reserva confirmada: ${fecha} ${selectedTime}. Notificaciones no enviadas (simulación).`,
  );
  selectedTime = '';
  text($('selected-slot'), '');
  renderSlots();
});
renderEvents();
