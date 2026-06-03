// =====================
// ESTADO GLOBAL
// =====================
let torneoActual = null;
let partidoActual = null;
let tipoSeleccionado = null;
let normasSeleccionadas = [];
let timerInterval = null;
let timerSegundos = 0;
let timerActivo = false;
let modalConfirmFn = null;
let torneoHistorialSeleccionado = null;

// =====================
// STORAGE
// =====================
function guardarTorneos(lista) {
  localStorage.setItem('vt_torneos', JSON.stringify(lista));
}
function cargarTorneos() {
  try { return JSON.parse(localStorage.getItem('vt_torneos')) || []; }
  catch(e) { return []; }
}
function guardarTorneoActual() {
  if (!torneoActual) return;
  const lista = cargarTorneos();
  const idx = lista.findIndex(t => t.id === torneoActual.id);
  if (idx >= 0) lista[idx] = torneoActual;
  else lista.push(torneoActual);
  guardarTorneos(lista);
}

// =====================
// PANTALLAS
// =====================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-home') renderHome();
  if (id === 'screen-historial') renderHistorial();
  if (id === 'screen-torneo') renderTorneo();
}

function showTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['tab-calendario','tab-tabla','tab-stats'].indexOf(id);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  if (id === 'tab-tabla') renderTabla();
  if (id === 'tab-stats') renderStats();
  if (id === 'tab-calendario') renderCalendario();
}

// =====================
// HOME
// =====================
function renderHome() {
  const cont = document.getElementById('torneos-activos-home');
  const torneos = cargarTorneos().filter(t => !t.finalizado);
  if (torneos.length === 0) { cont.innerHTML = ''; return; }
  cont.innerHTML = '<p style="color:var(--gray);font-size:0.8rem;margin-bottom:0.5rem">Torneos activos:</p>' +
    torneos.map(t => `
      <div class="torneo-activo-btn" onclick="abrirTorneo('${t.id}')">
        🏐 ${t.nombre}
        <div class="meta">${t.tipo === 'sala' ? 'Sala' : 'Playa'} · ${t.equipos.length} equipos</div>
      </div>`).join('');
}

function abrirTorneo(id) {
  const lista = cargarTorneos();
  torneoActual = lista.find(t => t.id === id);
  if (!torneoActual) return;
  tipoSeleccionado = torneoActual.tipo;
  showScreen('screen-torneo');
}

// =====================
// SELECCIÓN TIPO
// =====================
function selectType(tipo) {
  tipoSeleccionado = tipo;
  normasSeleccionadas = [];
  const label = document.getElementById('tipo-label');
  label.textContent = tipo === 'sala' ? '(Voleibol de Sala)' : '(Voleibol de Playa)';
  renderNormas();
  showScreen('screen-normas');
}

function renderNormas() {
  const normas = tipoSeleccionado === 'sala' ? NORMAS_SALA : NORMAS_PLAYA;
  const cont = document.getElementById('normas-lista');
  cont.innerHTML = normas.map(n => `
    <div class="norma-item ${normasSeleccionadas.includes(n.id) ? 'selected' : ''}" onclick="toggleNorma('${n.id}')" id="norma-${n.id}">
      <span class="norma-badge ${n.badge}">${n.badge === 'oficial' ? '⚡ Oficial FIVB' : '🔧 Alternativa'}</span>
      <h4>${n.titulo}</h4>
      <p>${n.descripcion}</p>
    </div>`).join('');
}

function toggleNorma(id) {
  const el = document.getElementById('norma-' + id);
  if (normasSeleccionadas.includes(id)) {
    normasSeleccionadas = normasSeleccionadas.filter(n => n !== id);
    el.classList.remove('selected');
  } else {
    normasSeleccionadas.push(id);
    el.classList.add('selected');
  }
}

function confirmarNormas() {
  if (normasSeleccionadas.length === 0) {
    showToast('Selecciona al menos una norma');
    return;
  }
  actualizarCamposEquipos();
  showScreen('screen-config');
}

// =====================
// CONFIGURAR TORNEO
// =====================
function actualizarCamposEquipos() {
  const n = parseInt(document.getElementById('num-equipos').value) || 4;
  const cont = document.getElementById('equipos-inputs');
  cont.innerHTML = '';
  for (let i = 1; i <= n; i++) {
    const row = document.createElement('div');
    row.className = 'equipo-input-row';
    row.innerHTML = `<span class="equipo-num">${i}.</span>
      <input type="text" placeholder="Nombre equipo ${i}" id="equipo-${i}" style="flex:1">`;
    cont.appendChild(row);
  }
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function crearTorneo() {
  const nombre = document.getElementById('nombre-torneo').value.trim();
  const numEq = parseInt(document.getElementById('num-equipos').value);
  const formato = document.getElementById('formato-torneo').value;
  const sede = document.getElementById('sede-torneo').value.trim();
  const fecha = document.getElementById('fecha-torneo').value;

  if (!nombre) { showToast('Escribe el nombre del torneo'); return; }
  if (numEq < 2) { showToast('Mínimo 2 equipos'); return; }

  const equipos = [];
  for (let i = 1; i <= numEq; i++) {
    const inp = document.getElementById('equipo-' + i);
    const nom = inp ? inp.value.trim() : '';
    if (!nom) { showToast(`Escribe el nombre del equipo ${i}`); return; }
    equipos.push({ id: 'eq' + i, nombre: nom });
  }

  torneoActual = {
    id: generarId(),
    nombre,
    tipo: tipoSeleccionado,
    formato,
    sede: sede || 'Sin especificar',
    fecha: fecha || new Date().toISOString().slice(0,10),
    equipos,
    normas: normasSeleccionadas,
    partidos: [],
    finalizado: false,
    creadoEn: new Date().toISOString()
  };

  generarCalendario();
  guardarTorneoActual();
  showScreen('screen-torneo');
  showToast('¡Torneo creado!');
}

// =====================
// CALENDARIO
// =====================
function generarCalendario() {
  const { equipos, formato } = torneoActual;
  torneoActual.partidos = [];
  let jornada = 1;

  if (formato === 'liga') {
    // Round-robin
    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        torneoActual.partidos.push({
          id: generarId(),
          jornada: calcJornada(i, j, equipos.length),
          local: equipos[i].id,
          visitante: equipos[j].id,
          estado: 'pendiente',
          sets: [],
          duracion: null,
          ganador: null
        });
      }
    }
    // Asignar jornadas equitativas
    asignarJornadas();
  } else if (formato === 'eliminacion') {
    generarBracket();
  } else if (formato === 'grupos') {
    generarFaseGrupos();
  }
}

function calcJornada(i, j, n) {
  return Math.floor((i + j) / 2) + 1;
}

function asignarJornadas() {
  const partidos = torneoActual.partidos;
  const n = torneoActual.equipos.length;
  // Algoritmo round-robin simple de asignación de jornadas
  let jornada = 1;
  const usados = new Set();
  const ordenados = [];
  const pendientes = [...partidos];
  
  while (pendientes.length > 0) {
    const jornadaPartidos = [];
    const eqUsados = new Set();
    let i = 0;
    while (i < pendientes.length) {
      const p = pendientes[i];
      if (!eqUsados.has(p.local) && !eqUsados.has(p.visitante)) {
        p.jornada = jornada;
        jornadaPartidos.push(p);
        eqUsados.add(p.local);
        eqUsados.add(p.visitante);
        pendientes.splice(i, 1);
      } else {
        i++;
      }
    }
    jornada++;
  }
}

function generarBracket() {
  const equipos = [...torneoActual.equipos];
  // Mezclar equipos aleatoriamente
  for (let i = equipos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [equipos[i], equipos[j]] = [equipos[j], equipos[i]];
  }
  // Generar partidos de primera ronda
  for (let i = 0; i < Math.floor(equipos.length / 2); i++) {
    torneoActual.partidos.push({
      id: generarId(),
      jornada: 1,
      fase: 'Octavos / Primera ronda',
      local: equipos[i*2].id,
      visitante: equipos[i*2+1].id,
      estado: 'pendiente',
      sets: [], duracion: null, ganador: null
    });
  }
}

function generarFaseGrupos() {
  const equipos = [...torneoActual.equipos];
  const mitad = Math.ceil(equipos.length / 2);
  const grupoA = equipos.slice(0, mitad);
  const grupoB = equipos.slice(mitad);
  
  // Partidos grupo A
  for (let i = 0; i < grupoA.length; i++) {
    for (let j = i+1; j < grupoA.length; j++) {
      torneoActual.partidos.push({
        id: generarId(), jornada: i+1,
        fase: 'Grupo A',
        local: grupoA[i].id, visitante: grupoA[j].id,
        estado: 'pendiente', sets: [], duracion: null, ganador: null
      });
    }
  }
  // Partidos grupo B
  for (let i = 0; i < grupoB.length; i++) {
    for (let j = i+1; j < grupoB.length; j++) {
      torneoActual.partidos.push({
        id: generarId(), jornada: i+1,
        fase: 'Grupo B',
        local: grupoB[i].id, visitante: grupoB[j].id,
        estado: 'pendiente', sets: [], duracion: null, ganador: null
      });
    }
  }
}

// =====================
// RENDER TORNEO
// =====================
function renderTorneo() {
  if (!torneoActual) return;
  document.getElementById('torneo-nombre-header').textContent = torneoActual.nombre;
  renderCalendario();
}

function renderCalendario() {
  if (!torneoActual) return;
  const cont = document.getElementById('partidos-lista');
  const partidos = torneoActual.partidos;
  
  if (partidos.length === 0) {
    cont.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray)">No hay partidos generados.</p>';
    return;
  }

  // Agrupar por jornada/fase
  const grupos = {};
  partidos.forEach(p => {
    const key = p.fase ? p.fase : `Jornada ${p.jornada}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(p);
  });

  cont.innerHTML = Object.entries(grupos).map(([jornada, ps]) => `
    <div class="jornada-title">${jornada}</div>
    ${ps.map(p => renderPartidoCard(p)).join('')}
  `).join('');
}

function nombreEquipo(id) {
  if (!torneoActual) return id;
  const eq = torneoActual.equipos.find(e => e.id === id);
  return eq ? eq.nombre : '?';
}

function renderPartidoCard(p) {
  const local = nombreEquipo(p.local);
  const visitante = nombreEquipo(p.visitante);
  const estadoBadge = { pendiente: 'pendiente', 'en-curso': 'en-curso', terminado: 'terminado' }[p.estado];
  const estadoLabel = { pendiente: 'Pendiente', 'en-curso': '🔴 En curso', terminado: '✓ Finalizado' }[p.estado];
  
  let scoreHtml = '<span class="partido-score">vs</span>';
  if (p.estado === 'terminado' && p.sets.length > 0) {
    const setsLocal = p.sets.filter(s => s.local > s.visitante).length;
    const setsVisitante = p.sets.filter(s => s.visitante > s.local).length;
    scoreHtml = `<span class="partido-score">${setsLocal} - ${setsVisitante}</span>`;
  }

  const durStr = p.duracion ? `⏱ ${Math.floor(p.duracion/60)}:${String(p.duracion%60).padStart(2,'0')}` : '';
  
  let botonesHtml = '';
  if (p.estado === 'pendiente') {
    botonesHtml = `<button class="btn-partido primary" onclick="iniciarPartido('${p.id}')">▶ Jugar</button>`;
  } else if (p.estado === 'en-curso') {
    botonesHtml = `<button class="btn-partido primary" onclick="iniciarPartido('${p.id}')">🔴 Continuar</button>`;
  } else {
    botonesHtml = `<button class="btn-partido" onclick="verDetallePartido('${p.id}')">📊 Ver detalle</button>
                   <button class="btn-partido" onclick="resetearPartido('${p.id}')">↺ Repetir</button>`;
  }

  return `
    <div class="partido-card">
      <div class="partido-header">
        <span class="partido-estado ${estadoBadge}">${estadoLabel}</span>
        <span class="partido-fecha">${durStr}</span>
      </div>
      <div class="partido-cuerpo">
        <div class="partido-equipo local">${local}</div>
        ${scoreHtml}
        <div class="partido-equipo visitante">${visitante}</div>
      </div>
      <div class="partido-footer">${botonesHtml}</div>
    </div>`;
}

// =====================
// TABLA CLASIFICATORIA
// =====================
function calcularTabla() {
  if (!torneoActual) return [];
  const stats = {};
  torneoActual.equipos.forEach(eq => {
    stats[eq.id] = { id: eq.id, nombre: eq.nombre, pj:0, pg:0, pp:0, sf:0, sc:0, pf:0, pc:0, pts:0 };
  });

  const normasPuntos = torneoActual.normas
    .map(nid => {
      const normas = torneoActual.tipo === 'sala' ? NORMAS_SALA : NORMAS_PLAYA;
      return normas.find(n => n.id === nid);
    })
    .filter(n => n && n.calcularPuntos);

  const normaActiva = normasPuntos[0]; // Usar la primera norma de puntos seleccionada

  torneoActual.partidos.filter(p => p.estado === 'terminado').forEach(p => {
    const setsLocal = p.sets.filter(s => s.local > s.visitante).length;
    const setsVisitante = p.sets.filter(s => s.visitante > s.local).length;
    const ptsLocal = p.sets.reduce((a, s) => a + s.local, 0);
    const ptsVisitante = p.sets.reduce((a, s) => a + s.visitante, 0);

    const eqLocal = stats[p.local];
    const eqVisitante = stats[p.visitante];
    if (!eqLocal || !eqVisitante) return;

    eqLocal.pj++; eqVisitante.pj++;
    eqLocal.sf += setsLocal; eqLocal.sc += setsVisitante;
    eqVisitante.sf += setsVisitante; eqVisitante.sc += setsLocal;
    eqLocal.pf += ptsLocal; eqLocal.pc += ptsVisitante;
    eqVisitante.pf += ptsVisitante; eqVisitante.pc += ptsLocal;

    if (setsLocal > setsVisitante) {
      eqLocal.pg++; eqVisitante.pp++;
      if (normaActiva) {
        const resultado = normaActiva.calcularPuntos({ setsG: setsLocal, setsP: setsVisitante });
        eqLocal.pts += resultado.ganador;
        eqVisitante.pts += resultado.perdedor;
      } else {
        eqLocal.pts += setsLocal; // fallback: sumar sets
      }
    } else {
      eqVisitante.pg++; eqLocal.pp++;
      if (normaActiva) {
        const resultado = normaActiva.calcularPuntos({ setsG: setsVisitante, setsP: setsLocal });
        eqVisitante.pts += resultado.ganador;
        eqLocal.pts += resultado.perdedor;
      } else {
        eqVisitante.pts += setsVisitante;
      }
    }
  });

  // Ordenar: por puntos, diferencia sets, diferencia puntos
  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const diffSetA = a.sf - a.sc;
    const diffSetB = b.sf - b.sc;
    if (diffSetB !== diffSetA) return diffSetB - diffSetA;
    return (b.pf - b.pc) - (a.pf - a.pc);
  });
}

function renderTabla() {
  const tabla = calcularTabla();
  const tbody = document.getElementById('tabla-body');
  tbody.innerHTML = tabla.map((eq, i) => `
    <tr class="${i === 0 && eq.pj > 0 ? 'winner-row' : ''}">
      <td>${i+1}</td>
      <td>${eq.nombre}${i === 0 && eq.pj > 0 ? ' 🏆' : ''}</td>
      <td>${eq.pj}</td>
      <td>${eq.pg}</td>
      <td>${eq.pp}</td>
      <td>${eq.sf}</td>
      <td>${eq.sc}</td>
      <td>${eq.pf}</td>
      <td>${eq.pc}</td>
      <td class="pts">${eq.pts}</td>
    </tr>`).join('');
}

// =====================
// ESTADÍSTICAS
// =====================
function renderStats() {
  const tabla = calcularTabla();
  const cont = document.getElementById('stats-content');
  const partidos = torneoActual.partidos.filter(p => p.estado === 'terminado');
  
  if (partidos.length === 0) {
    cont.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray)">Sin partidos jugados aún.</p>';
    return;
  }

  const maxPts = tabla.length > 0 ? Math.max(...tabla.map(e => e.pts), 1) : 1;
  
  // Ganador actual
  const lider = tabla[0];
  let campeón = '';
  if (torneoActual.finalizado && lider) {
    campeón = `<div class="champion-banner">
      <div class="trophy">🏆</div>
      <h3>CAMPEÓN: ${lider.nombre}</h3>
    </div>`;
  }

  // Duración promedio
  const durs = partidos.filter(p => p.duracion).map(p => p.duracion);
  const durProm = durs.length ? Math.round(durs.reduce((a,b) => a+b, 0) / durs.length) : 0;
  const durMax = durs.length ? Math.max(...durs) : 0;

  cont.innerHTML = campeón + `
    <div class="stat-card">
      <h4>Resumen del torneo</h4>
      <div class="stat-row"><span class="stat-name">Partidos jugados</span><span class="stat-val">${partidos.length}</span></div>
      <div class="stat-row"><span class="stat-name">Partidos pendientes</span><span class="stat-val">${torneoActual.partidos.filter(p=>p.estado==='pendiente').length}</span></div>
      <div class="stat-row"><span class="stat-name">Duración promedio</span><span class="stat-val">${Math.floor(durProm/60)}:${String(durProm%60).padStart(2,'0')}</span></div>
      <div class="stat-row"><span class="stat-name">Partido más largo</span><span class="stat-val">${Math.floor(durMax/60)}:${String(durMax%60).padStart(2,'0')}</span></div>
    </div>
    <div class="stat-card">
      <h4>Clasificación actual</h4>
      ${tabla.slice(0,5).map((eq, i) => `
        <div class="stat-row" style="flex-direction:column;align-items:stretch;gap:0.2rem">
          <div style="display:flex;justify-content:space-between">
            <span class="stat-name">${i+1}. ${eq.nombre}</span>
            <span class="stat-val">${eq.pts} pts</span>
          </div>
          <div class="stat-bar-wrap">
            <div class="stat-bar" style="width:${Math.round(eq.pts/maxPts*100)}%"></div>
          </div>
        </div>`).join('')}
    </div>
    <div class="stat-card">
      <h4>Mayor goleador (puntos a favor)</h4>
      ${tabla.sort((a,b) => b.pf-a.pf).slice(0,3).map((eq, i) => `
        <div class="stat-row">
          <span class="stat-name">${['🥇','🥈','🥉'][i]} ${eq.nombre}</span>
          <span class="stat-val">${eq.pf} pts</span>
        </div>`).join('')}
    </div>
    <div class="stat-card">
      <h4>Opciones del torneo</h4>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.25rem">
        <button class="btn-warning" onclick="marcarTorneoFinalizado()" style="font-size:0.85rem">
          ${torneoActual.finalizado ? '✓ Finalizado' : '🏆 Marcar como finalizado'}
        </button>
      </div>
    </div>`;
}

function marcarTorneoFinalizado() {
  torneoActual.finalizado = !torneoActual.finalizado;
  guardarTorneoActual();
  renderStats();
  showToast(torneoActual.finalizado ? '¡Torneo marcado como finalizado!' : 'Torneo marcado como activo');
}

// =====================
// MARCADOR
// =====================
function iniciarPartido(id) {
  const p = torneoActual.partidos.find(p => p.id === id);
  if (!p) return;
  partidoActual = p;
  
  if (p.estado === 'pendiente') {
    p.estado = 'en-curso';
    p.sets = [];
    p.duracion = 0;
    p.setActual = { local: 0, visitante: 0 };
    p.setNum = 1;
    timerSegundos = 0;
  } else {
    timerSegundos = p.duracion || 0;
  }

  document.getElementById('nombre-local').textContent = nombreEquipo(p.local);
  document.getElementById('nombre-visitante').textContent = nombreEquipo(p.visitante);
  
  timerActivo = false;
  clearInterval(timerInterval);
  document.getElementById('timer-btn').textContent = '▶ Iniciar';
  
  actualizarMarcador();
  guardarTorneoActual();
  showScreen('screen-marcador');
}

function actualizarMarcador() {
  if (!partidoActual) return;
  const sa = partidoActual.setActual || { local: 0, visitante: 0 };
  document.getElementById('pts-local').textContent = sa.local;
  document.getElementById('pts-visitante').textContent = sa.visitante;
  
  const regl = REGLAMENTO[torneoActual.tipo];
  const setNum = partidoActual.setNum || 1;
  const esFinalSet = (torneoActual.tipo === 'sala' && setNum === 5) || (torneoActual.tipo === 'playa' && setNum === 3);
  const meta = esFinalSet ? regl.puntosFinalSet : regl.puntosSet;
  document.getElementById('set-info-display').textContent = `Set ${setNum} — Meta: ${meta} puntos (mín. diferencia 2)`;

  // Sets ganados
  const setsLocal = partidoActual.sets.filter(s => s.local > s.visitante).length;
  const setsVisitante = partidoActual.sets.filter(s => s.visitante > s.local).length;
  
  const setsBadges = document.getElementById('marcador-sets-display');
  setsBadges.innerHTML = `
    <span class="set-badge ganado-local">${nombreEquipo(partidoActual.local)}: ${setsLocal}</span>
    <span class="set-badge">Sets</span>
    <span class="set-badge ganado-visitante">${nombreEquipo(partidoActual.visitante)}: ${setsVisitante}</span>`;
}

function sumarPunto(lado) {
  if (!partidoActual) return;
  if (!timerActivo) { toggleTimer(); }
  if (!partidoActual.setActual) partidoActual.setActual = { local: 0, visitante: 0 };
  partidoActual.setActual[lado]++;
  
  const sa = partidoActual.setActual;
  const regl = REGLAMENTO[torneoActual.tipo];
  const setNum = partidoActual.setNum || 1;
  const esFinalSet = (torneoActual.tipo === 'sala' && setNum === 5) || (torneoActual.tipo === 'playa' && setNum === 3);
  const meta = esFinalSet ? regl.puntosFinalSet : regl.puntosSet;

  // Verificar si el set terminó
  const maxPts = Math.max(sa.local, sa.visitante);
  const minPts = Math.min(sa.local, sa.visitante);
  if (maxPts >= meta && (maxPts - minPts) >= 2) {
    // Set terminado automáticamente
    setTimeout(() => terminarSet(true), 300);
  } else {
    actualizarMarcador();
    guardarTorneoActual();
  }
}

function restarPunto(lado) {
  if (!partidoActual) return;
  if (!partidoActual.setActual) return;
  if (partidoActual.setActual[lado] > 0) {
    partidoActual.setActual[lado]--;
    actualizarMarcador();
    guardarTorneoActual();
  }
}

function terminarSet(auto = false) {
  if (!partidoActual) return;
  const sa = partidoActual.setActual;
  if (!sa || (sa.local === 0 && sa.visitante === 0)) {
    if (!auto) showToast('El set no tiene puntos registrados');
    return;
  }

  // Guardar set
  partidoActual.sets.push({ local: sa.local, visitante: sa.visitante });
  partidoActual.setActual = { local: 0, visitante: 0 };
  
  const regl = REGLAMENTO[torneoActual.tipo];
  const setsLocal = partidoActual.sets.filter(s => s.local > s.visitante).length;
  const setsVisitante = partidoActual.sets.filter(s => s.visitante > s.local).length;
  const setsParaGanar = torneoActual.tipo === 'sala' ? 3 : 2;
  
  if (setsLocal >= setsParaGanar || setsVisitante >= setsParaGanar) {
    // Partido terminado
    terminarPartido(true);
  } else {
    partidoActual.setNum = (partidoActual.setNum || 1) + 1;
    actualizarMarcador();
    guardarTorneoActual();
    showToast(`Set ${(partidoActual.setNum || 1) - 1} terminado. Iniciando set ${partidoActual.setNum}`);
  }
}

function terminarPartido(auto = false) {
  if (!partidoActual) return;
  
  // Si hay puntos en el set actual, incluirlos
  const sa = partidoActual.setActual;
  if (sa && (sa.local > 0 || sa.visitante > 0)) {
    partidoActual.sets.push({ ...sa });
  }

  if (timerActivo) toggleTimer();
  partidoActual.duracion = timerSegundos;

  const setsLocal = partidoActual.sets.filter(s => s.local > s.visitante).length;
  const setsVisitante = partidoActual.sets.filter(s => s.visitante > s.local).length;
  
  partidoActual.ganador = setsLocal > setsVisitante ? partidoActual.local : partidoActual.visitante;
  partidoActual.estado = 'terminado';
  partidoActual.setActual = null;

  guardarTorneoActual();
  
  const ganadorNombre = nombreEquipo(partidoActual.ganador);
  showToast(`🏆 ¡${ganadorNombre} gana el partido!`);
  
  setTimeout(() => {
    showScreen('screen-torneo');
    renderCalendario();
  }, 1500);
}

function volverDePartido() {
  if (timerActivo) toggleTimer();
  if (partidoActual) guardarTorneoActual();
  showScreen('screen-torneo');
  renderCalendario();
}

// TIMER
function toggleTimer() {
  if (timerActivo) {
    clearInterval(timerInterval);
    timerActivo = false;
    document.getElementById('timer-btn').textContent = '▶ Reanudar';
  } else {
    timerActivo = true;
    document.getElementById('timer-btn').textContent = '⏸ Pausar';
    timerInterval = setInterval(() => {
      timerSegundos++;
      if (partidoActual) partidoActual.duracion = timerSegundos;
      const m = Math.floor(timerSegundos / 60);
      const s = timerSegundos % 60;
      document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
  }
}

function resetearPartido(id) {
  const p = torneoActual.partidos.find(p => p.id === id);
  if (!p) return;
  p.estado = 'pendiente';
  p.sets = [];
  p.duracion = null;
  p.ganador = null;
  p.setActual = null;
  p.setNum = 1;
  guardarTorneoActual();
  renderCalendario();
  showToast('Partido reiniciado');
}

function verDetallePartido(id) {
  const p = torneoActual.partidos.find(pt => pt.id === id);
  if (!p) return;
  const local = nombreEquipo(p.local);
  const visitante = nombreEquipo(p.visitante);
  const setsStr = p.sets.map((s,i) => `Set ${i+1}: ${s.local}-${s.visitante}`).join(' | ');
  const dur = p.duracion ? `${Math.floor(p.duracion/60)}:${String(p.duracion%60).padStart(2,'0')}` : '—';
  showModal('Detalle del Partido', `${local} vs ${visitante}\n${setsStr}\nDuración: ${dur}\nGanador: ${nombreEquipo(p.ganador)}`);
}

// =====================
// HISTORIAL
// =====================
function renderHistorial() {
  const torneos = cargarTorneos();
  const cont = document.getElementById('historial-lista');
  
  if (torneos.length === 0) {
    cont.innerHTML = `<div class="historial-empty"><div class="icon">📋</div><p>No hay torneos guardados</p></div>`;
    document.getElementById('historial-actions').style.display = 'none';
    return;
  }
  
  document.getElementById('historial-actions').style.display = 'block';
  cont.innerHTML = torneos.slice().reverse().map(t => {
    const fechaStr = t.fecha ? new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-ES') : '—';
    const partTerminados = (t.partidos || []).filter(p => p.estado === 'terminado').length;
    const tabla = calcularTablaParaTorneo(t);
    const lider = tabla[0];
    return `
      <div class="historial-torneo" onclick="verDetalleHistorial('${t.id}')">
        <span class="hbadge ${t.tipo}">${t.tipo === 'sala' ? '🏟️ Sala' : '🏖️ Playa'}</span>
        ${t.finalizado ? '<span class="hbadge" style="background:var(--green);color:#1a1a2e">✓ Final</span>' : '<span class="hbadge" style="background:rgba(255,255,255,0.15)">En curso</span>'}
        <div class="htitle">${t.nombre}</div>
        <div class="hmeta">${fechaStr} · ${t.equipos.length} equipos · ${partTerminados} partidos jugados</div>
        ${lider && lider.pj > 0 ? `<div class="hmeta">🏆 Líder: ${lider.nombre} (${lider.pts} pts)</div>` : ''}
      </div>`;
  }).join('');
}

function calcularTablaParaTorneo(t) {
  const stats = {};
  t.equipos.forEach(eq => {
    stats[eq.id] = { id: eq.id, nombre: eq.nombre, pj:0, pg:0, pp:0, sf:0, sc:0, pts:0 };
  });
  (t.partidos || []).filter(p => p.estado === 'terminado').forEach(p => {
    const setsLocal = p.sets.filter(s => s.local > s.visitante).length;
    const setsVisitante = p.sets.filter(s => s.visitante > s.local).length;
    if (!stats[p.local] || !stats[p.visitante]) return;
    stats[p.local].pj++; stats[p.visitante].pj++;
    stats[p.local].sf += setsLocal; stats[p.local].sc += setsVisitante;
    stats[p.visitante].sf += setsVisitante; stats[p.visitante].sc += setsLocal;
    if (setsLocal > setsVisitante) {
      stats[p.local].pg++; stats[p.visitante].pp++;
      stats[p.local].pts += 3;
    } else {
      stats[p.visitante].pg++; stats[p.local].pp++;
      stats[p.visitante].pts += 3;
    }
  });
  return Object.values(stats).sort((a,b) => b.pts - a.pts);
}

function verDetalleHistorial(id) {
  const lista = cargarTorneos();
  torneoHistorialSeleccionado = lista.find(t => t.id === id);
  if (!torneoHistorialSeleccionado) return;
  
  const t = torneoHistorialSeleccionado;
  const tabla = calcularTablaParaTorneo(t);
  const partidos = (t.partidos || []).filter(p => p.estado === 'terminado');
  
  const cont = document.getElementById('detalle-historial-content');
  cont.innerHTML = `
    <div class="detalle-section">
      <h3>Información</h3>
      <div class="stat-card">
        <div class="stat-row"><span>Tipo</span><span class="stat-val">${t.tipo === 'sala' ? 'Sala' : 'Playa'}</span></div>
        <div class="stat-row"><span>Sede</span><span class="stat-val">${t.sede}</span></div>
        <div class="stat-row"><span>Fecha</span><span class="stat-val">${t.fecha || '—'}</span></div>
        <div class="stat-row"><span>Formato</span><span class="stat-val">${t.formato}</span></div>
        <div class="stat-row"><span>Estado</span><span class="stat-val">${t.finalizado ? '✓ Finalizado' : 'En curso'}</span></div>
      </div>
    </div>
    <div class="detalle-section">
      <h3>Tabla Final</h3>
      <div class="tabla-wrap">
        <table class="tabla-clasificacion">
          <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PP</th><th>Pts</th></tr></thead>
          <tbody>${tabla.map((eq,i) => `
            <tr class="${i===0&&eq.pj>0?'winner-row':''}">
              <td>${i+1}</td><td>${eq.nombre}${i===0&&eq.pj>0?' 🏆':''}</td>
              <td>${eq.pj}</td><td>${eq.pg}</td><td>${eq.pp}</td>
              <td class="pts">${eq.pts}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="detalle-section">
      <h3>Resultados (${partidos.length} partidos)</h3>
      ${partidos.map(p => {
        const local = t.equipos.find(e => e.id === p.local)?.nombre || '?';
        const visitante = t.equipos.find(e => e.id === p.visitante)?.nombre || '?';
        const setsL = p.sets.filter(s => s.local > s.visitante).length;
        const setsV = p.sets.filter(s => s.visitante > s.local).length;
        const dur = p.duracion ? `${Math.floor(p.duracion/60)}:${String(p.duracion%60).padStart(2,'0')}` : '';
        return `<div class="stat-card" style="margin-bottom:0.5rem;padding:0.75rem 1rem">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.9rem">${local}</span>
            <span style="font-family:'Bebas Neue',cursive;font-size:1.3rem;color:var(--acc2)">${setsL} - ${setsV}</span>
            <span style="font-size:0.9rem;text-align:right">${visitante}</span>
          </div>
          ${dur ? `<div style="font-size:0.75rem;color:var(--gray);text-align:center;margin-top:0.3rem">⏱ ${dur}</div>` : ''}
        </div>`;
      }).join('') || '<p style="color:var(--gray);font-size:0.85rem">Sin partidos registrados</p>'}
    </div>`;
  
  showScreen('screen-detalle-historial');
}

function borrarTorneoHistorial() {
  if (!torneoHistorialSeleccionado) return;
  showModal(
    '¿Borrar este torneo?',
    `Se eliminará "${torneoHistorialSeleccionado.nombre}" y todos sus datos permanentemente.`,
    () => {
      let lista = cargarTorneos();
      lista = lista.filter(t => t.id !== torneoHistorialSeleccionado.id);
      guardarTorneos(lista);
      torneoHistorialSeleccionado = null;
      showScreen('screen-historial');
      showToast('Torneo eliminado');
    }
  );
}

function confirmarBorrarHistorial() {
  showModal(
    '¿Borrar TODO el historial?',
    'Esta acción eliminará TODOS los torneos guardados. No se puede deshacer.',
    () => {
      guardarTorneos([]);
      showToast('Historial borrado');
      renderHistorial();
    }
  );
}

// =====================
// SALIDA CON CONFIRMACIÓN
// =====================
function confirmarSalida() {
  if (torneoActual && !torneoActual.finalizado) {
    showModal(
      '¿Volver al inicio?',
      'El torneo se guardará y podrás retomarlo desde el inicio.',
      () => { showScreen('screen-home'); }
    );
  } else {
    showScreen('screen-home');
  }
}

// =====================
// MODAL
// =====================
function showModal(titulo, msg, onConfirm) {
  document.getElementById('modal-title').textContent = titulo;
  document.getElementById('modal-msg').textContent = msg;
  document.getElementById('modal-overlay').style.display = 'flex';
  modalConfirmFn = onConfirm || null;
  if (!onConfirm) {
    document.getElementById('modal-confirm-btn').style.display = 'none';
    document.querySelector('.modal-btns .btn-secondary').textContent = 'Cerrar';
  } else {
    document.getElementById('modal-confirm-btn').style.display = 'block';
    document.querySelector('.modal-btns .btn-secondary').textContent = 'Cancelar';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  modalConfirmFn = null;
}

function modalConfirmAction() {
  if (modalConfirmFn) modalConfirmFn();
  closeModal();
}

// =====================
// TOAST
// =====================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
  // Fecha por defecto = hoy
  const hoy = new Date().toISOString().slice(0,10);
  const fechaInput = document.getElementById('fecha-torneo');
  if (fechaInput) fechaInput.value = hoy;
  
  actualizarCamposEquipos();
  renderHome();
  
  // Registrar Service Worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
