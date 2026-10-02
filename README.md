# AgendaYA TP7 — Integración continua sobre M03 y M04

Prototipo HTML/CSS/JS vanilla con lógica compartida en `src/logica-negocio.js`, 30 pruebas unitarias de Node (`node:test`) y 8 casos E2E de Cypress. Sin backend real: datos en `localStorage`, sin envío de correos ni autenticación. Requiere Node.js y npm instalados. Sobre esa base, el TP7 agrega control de formato (Prettier), análisis estático (ESLint) y un pipeline de integración continua en GitHub Actions.

## Instalación y ejecución

```bash
npm install
npm run test
npm run start
```

Abrí `http://localhost:3000` para probar el frontend; dejá el servidor abierto. En **otra terminal**:

```bash
npm run test:e2e
# o npm run cypress:open
```

Para reproducir las fechas de los casos E2E: `http://localhost:3000/?demoDate=2026-07-06`. Esta fecha de demostración solo fija el calendario en pruebas; sin ella se usa la fecha local. Los datos se conservan en localStorage: para reiniciar desde el navegador, borrá el almacenamiento del sitio. Cypress reinicia el almacenamiento antes de cada test.

## Alcance

- M03: crear y editar tipo de evento; además, eliminación lógica con bloqueo ante reservas futuras (simuladas).
- M04: elegir evento, fecha disponible y franja horaria; cargar datos y confirmar reserva, bloqueando el horario ocupado.
- El calendario simula dos días disponibles y uno sin disponibilidad, siempre dentro del mes de la fecha base; si se prueba al final del mes puede haber menos días visibles. El horario 10:30 está reservado por defecto en las fechas disponibles.
- El frontend simula un administrador ya autenticado y no integra servicios M01, M02, M05 ni M06: notificaciones, reservas futuras y disponibilidad se modelan localmente. No usar con información sensible real.

## Estructura

- `frontend/`: vista web, lógica de interfaz y estilos.
- `src/logica-negocio.js`: validación, eliminación, fechas y slots, confirmación.
- `tests/logica-negocio.test.js`: 30 pruebas unitarias, 5 propuestas por integrante.
- `cypress/e2e/m03-m04.cy.js`: 8 pruebas E2E con Arrange / Act / Assert.
- `eslint.config.js`, `.prettierrc`, `.prettierignore`: configuración de análisis estático y formato.
- `.github/workflows/ci.yml`: definición del pipeline de integración continua.
- `INFORME_TP6.md`: informe editable; completar evidencias, autorías, commits y enlace antes de entregar.

## Pipeline CI

El workflow `.github/workflows/ci.yml` se llama **CI AgendaYA** y corre en GitHub Actions.

### Cuándo se dispara

- `pull_request` hacia `main`, `develop` y `hotfix/**`: valida el cambio **antes** de integrarlo.
- `push` hacia `main` y `develop`: valida el estado de las ramas principales después de cada integración.

### Job `calidad` (ubuntu-latest)

Los pasos corren en orden y el job se detiene en el primero que falle:

1. **Checkout del repositorio** (`actions/checkout@v4`): descarga el código del commit que se está validando.
2. **Configurar Node.js 20** (`actions/setup-node@v4` con `cache: npm`): fija la versión del runtime y cachea las descargas de npm usando `package-lock.json` como clave, para acelerar las corridas siguientes.
3. **Instalar dependencias (`npm ci`)**: instalación limpia y reproducible a partir de `package-lock.json`. Falla si el lock quedó desactualizado respecto de `package.json`.
4. **Formato (Prettier)** → `npm run format:check`: verifica el estilo de código sin modificar archivos. Si falla, se corrige localmente con `npm run format`.
5. **Linter (ESLint)** → `npm run lint`: reglas recomendadas de ESLint con globals por entorno (Node en `server.js`, `src/` y `tests/`; navegador en `frontend/`; Cypress y Mocha en `cypress/`).
6. **Tests unitarios** → `npm test`: las 30 pruebas de `node:test` sobre `src/logica-negocio.js`.
7. **Build** → `npm run build`: chequeo de sintaxis con `node --check` de `server.js`, `src/logica-negocio.js` y `frontend/app.js`. El proyecto es JS vanilla sin empaquetador, así que el build verifica que los tres puntos de entrada parseen correctamente.

### Job `e2e` (depende de `calidad`)

Declara `needs: calidad`, por lo que **solo arranca si la calidad pasó**. Así, un error de formato o un test unitario roto no consume tiempo de navegador.

1. **Checkout** y **Configurar Node.js 20**: se repiten porque cada job corre en una máquina nueva y no comparte el espacio de trabajo con el anterior.
2. **Ejecutar Cypress contra el servidor local** (`cypress-io/github-action@v6`): instala las dependencias y el binario de Cypress, levanta la aplicación con `start: npm start`, espera con `wait-on: 'http://localhost:3000'` hasta que el servidor responda y entonces ejecuta los 8 casos E2E.
3. **Subir screenshots** y **Subir videos** (`actions/upload-artifact@v4` con `if: failure()`): solo si el job falla, publica `cypress/screenshots` y `cypress/videos` como artifacts descargables desde la corrida, para usarlos como evidencia del fallo. `if-no-files-found: ignore` evita que el paso falle cuando Cypress no generó archivos.

### Reproducir el pipeline localmente

```bash
npm ci
npm run format:check
npm run lint
npm test
npm run build
npm start          # y en otra terminal: npm run test:e2e
```

## Versionado y evidencia

```bash
git init
git add frontend src server.js package.json .gitignore README.md
git commit -m "feat: frontend minimo M03 y M04"
git add tests
git commit -m "test: 30 pruebas unitarias de logica de negocio"
git add cypress cypress.config.js INFORME_TP6.md
git commit -m "test: flujos E2E Cypress e informe TP6"
```

Las líneas son una guía **para realizar commits reales** (nunca se deben inventar hashes, autorías o ejecuciones). Crear repo remoto y subir la rama siguiendo el proveedor elegido. Guardar capturas o video reales de Cypress y la salida de `npm run test` en la entrega. Cypress puede requerir descarga de binarios mediante `npm install`.
