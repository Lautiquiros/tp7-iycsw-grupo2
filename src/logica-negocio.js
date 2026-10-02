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
