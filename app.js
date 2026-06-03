// ══════════════════════════════════════
// ESTADO
// ══════════════════════════════════════
let torneoActual = null;
let partidoActual = null;
let tipoSel = null;
let normasSel = [];
let timerSeg = 0;
let timerOn = false;
let timerInt = null;
let modalFn = null;
let histSel = null;
let tabActual = 0;

// ══════════════════════════════════════
// STORAGE
// ══════════════════════════════════════
const LS = {
  get: () => { try { return JSON.parse(localStorage.getItem('vt2') || '[]'); } catch(e){ return []; } },
  set: (d) => localStorage.setItem('vt2', JSON.stringify(d)),
  save: () => {
    if (!torneoActual) return;
    const lista = LS.get();
    const i = lista.findIndex(t => t.id === torneoActual.id);
    if (i >= 0) lista[i] = torneoActual; else lista.push(torneoActual);
    LS.set(lista);
  }
};

// ══════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-home') renderHome();
  if (id === 'screen-historial') renderHistorial();
  if (id === 'screen-torneo') renderTorneo();
}

function showTab(id, idx) {
  document.querySelectorAll('#screen-torneo .tab-content').forEach(c => c.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  document.querySelectorAll('#torneo-nav .nav-item').forEach((n,i) => n.classList.toggle('active', i === idx));
  tabActual = idx;
  if (id === 'tab-tabla') renderTabla();
  if (id === 'tab-stats') renderStats();
  if (id === 'tab-calendario') renderCalendario();
}

// ══════════════════════════════════════
// HOME
// ══════════════════════════════════════
function renderHome() {
  const cont = document.getElementById('active-torneos-home');
  const activos = LS.get().filter(t => !t.finalizado);
  if (!activos.length) { cont.innerHTML = ''; return; }
  cont.innerHTML = '<div class="active-torneos-label">Torneos activos</div>' +
    activos.map(t => `
      <div class="torneo-resume-pill" onclick="abrirTorneo('${t.id}')">
        <div class="pill-icon">${t.tipo === 'sala' ? '🏟️' : '🏖️'}</div>
        <div>
          <div class="pill-name">${t.nombre}</div>
          <div class="pill-meta">${t.equipos.length} equipos · ${t.tipo === 'sala' ? 'Sala' : 'Playa'}</div>
        </div>
      </div>`).join('');
}

function abrirTorneo(id) {
  torneoActual = LS.get().find(t => t.id === id);
  if (!torneoActual) return;
  tipoSel = torneoActual.tipo;
  showScreen('screen-torneo');
}

// ══════════════════════════════════════
// TIPO
// ══════════════════════════════════════
function selectType(tipo) {
  tipoSel = tipo;
  normasSel = [];
  renderNormas();
  showScreen('screen-normas');
}

// ══════════════════════════════════════
// NORMAS
// ══════════════════════════════════════
function renderNormas() {
  const lista = tipoSel === 'sala' ? NORMAS_SALA : NORMAS_PLAYA;
  document.getElementById('normas-lista').innerHTML = lista.map(n => `
    <div class="norma-card ${normasSel.includes(n.id) ? 'sel' : ''}" onclick="toggleNorma('${n.id}')" id="nc-${n.id}">
      <div class="norma-head">
        <div class="norma-check" id="chk-${n.id}">${normasSel.includes(n.id) ? '✓' : ''}</div>
        <div class="norma-info">
          <span class="norma-badge ${n.badge === 'oficial' ? 'badge-oficial' : 'badge-alt'}">
            ${n.badge === 'oficial' ? '⚡ Oficial FIVB' : '🔧 Alternativa'}
          </span>
          <div class="norma-title">${n.titulo}</div>
          <div class="norma-desc">${n.descripcion}</div>
        </div>
      </div>
    </div>`).join('');
}

function toggleNorma(id) {
  if (normasSel.includes(id)) {
    normasSel = normasSel.filter(n => n !== id);
  } else {
    normasSel.push(id);
  }
  renderNormas();
}

function confirmarNormas() {
  if (!normasSel.length) { toast('Selecciona al menos una norma'); return; }
  actualizarEquipos();
  document.getElementById('fecha-torneo').value = new Date().toISOString().slice(0, 10);
  showScreen('screen-config');
}

// ══════════════════════════════════════
// CONFIG
// ══════════════════════════════════════
function actualizarEquipos() {
  const n = parseInt(document.getElementById('num-equipos').value) || 4;
  const cont = document.getElementById('equipos-inputs');
  cont.innerHTML = Array.from({length: n}, (_, i) => `
    <div class="equipo-row">
      <div class="equipo-num">${i+1}</div>
      <input type="text" class="form-input" id="eq-${i+1}" placeholder="Nombre del equipo ${i+1}" style="flex:1">
    </div>`).join('');
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function crearTorneo() {
  const nombre = document.getElementById('nombre-torneo').value.trim();
  const sede = document.getElementById('sede-torneo').value.trim();
  const fecha = document.getElementById('fecha-torneo').value;
  const formato = document.getElementById('formato-torneo').value;
  const n = parseInt(document.getElementById('num-equipos').value);

  if (!nombre) { toast('Escribe el nombre del torneo'); return; }
  const equipos = [];
  for (let i = 1; i <= n; i++) {
    const v = document.getElementById('eq-' + i)?.value.trim();
    if (!v) { toast(`Escribe el nombre del equipo ${i}`); return; }
    equipos.push({ id: 'eq' + i, nombre: v });
  }

  torneoActual = {
    id: uid(), nombre, tipo: tipoSel, formato,
    sede: sede || 'Sin especificar', fecha,
    equipos, normas: normasSel,
    partidos: [], finalizado: false,
    creadoEn: new Date().toISOString()
  };

  generarCalendario();
  LS.save();
  showScreen('screen-torneo');
  toast('¡Torneo creado! 🏐');
}

// ══════════════════════════════════════
// CALENDARIO
// ══════════════════════════════════════
function generarCalendario() {
  const { equipos, formato } = torneoActual;
  torneoActual.partidos = [];

  if (formato === 'liga') {
    const partidos = [];
    for (let i = 0; i < equipos.length; i++)
      for (let j = i+1; j < equipos.length; j++)
        partidos.push({ id: uid(), local: equipos[i].id, visitante: equipos[j].id, estado: 'pendiente', sets: [], duracion: null, ganador: null });
    // Asignar jornadas round-robin
    const pendientes = [...partidos];
    let jornada = 1;
    while (pendientes.length) {
      const usados = new Set();
      let i = 0;
      while (i < pendientes.length) {
        const p = pendientes[i];
        if (!usados.has(p.local) && !usados.has(p.visitante)) {
          p.jornada = jornada; usados.add(p.local); usados.add(p.visitante);
          torneoActual.partidos.push(p); pendientes.splice(i, 1);
        } else i++;
      }
      jornada++;
    }
  } else if (formato === 'eliminacion') {
    const eqs = [...equipos].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.floor(eqs.length / 2); i++)
      torneoActual.partidos.push({ id: uid(), jornada: 1, fase: 'Primera ronda', local: eqs[i*2].id, visitante: eqs[i*2+1].id, estado: 'pendiente', sets: [], duracion: null, ganador: null });
    if (eqs.length % 2 === 1) {
      const bye = eqs[eqs.length-1];
      torneoActual.partidos.push({ id: uid(), jornada: 1, fase: 'Primera ronda', local: bye.id, visitante: null, estado: 'bye', sets: [], duracion: null, ganador: bye.id });
    }
  } else {
    const mitad = Math.ceil(equipos.length / 2);
    const gA = equipos.slice(0, mitad), gB = equipos.slice(mitad);
    [['A', gA], ['B', gB]].forEach(([g, grupo]) => {
      for (let i = 0; i < grupo.length; i++)
        for (let j = i+1; j < grupo.length; j++)
          torneoActual.partidos.push({ id: uid(), jornada: i+1, fase: `Grupo ${g}`, local: grupo[i].id, visitante: grupo[j].id, estado: 'pendiente', sets: [], duracion: null, ganador: null });
    });
  }
}

// ══════════════════════════════════════
// RENDER TORNEO
// ══════════════════════════════════════
function renderTorneo() {
  if (!torneoActual) return;
  document.getElementById('torneo-nombre-header').textContent = torneoActual.nombre;
  // Mostrar primer tab
  showTab('tab-calendario', 0);
}

function nombreEq(id) {
  if (!torneoActual || !id) return '?';
  return torneoActual.equipos.find(e => e.id === id)?.nombre || '?';
}

// ── CALENDARIO ──
function renderCalendario() {
  if (!torneoActual) return;
  const cont = document.getElementById('tab-calendario');
  const partidos = torneoActual.partidos;
  if (!partidos.length) { cont.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--txt3)">Sin partidos generados</div>'; return; }

  const grupos = {};
  partidos.forEach(p => {
    const k = p.fase ? p.fase : `Jornada ${p.jornada}`;
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(p);
  });

  cont.innerHTML = Object.entries(grupos).map(([titulo, ps]) => `
    <div class="jornada-pill">📅 ${titulo}</div>
    ${ps.map(p => cardPartido(p)).join('')}`).join('');
}

function cardPartido(p) {
  if (p.estado === 'bye') return `
    <div class="partido-card" style="margin:0 20px 10px">
      <div class="partido-body">
        <div class="partido-team home">${nombreEq(p.local)}</div>
        <div class="partido-score-box"><div class="partido-score-label">BYE</div></div>
        <div class="partido-team away" style="color:var(--txt3)">—</div>
      </div>
    </div>`;

  const sL = p.sets.filter(s => s.local > s.visitante).length;
  const sV = p.sets.filter(s => s.visitante > s.local).length;
  const durStr = p.duracion ? `⏱ ${Math.floor(p.duracion/60)}:${String(p.duracion%60).padStart(2,'0')}` : '';
  const estadoClass = { pendiente:'estado-pendiente', 'en-curso':'estado-curso', terminado:'estado-fin' }[p.estado];
  const estadoLabel = { pendiente:'Pendiente', 'en-curso':'🔴 En curso', terminado:'✓ Finalizado' }[p.estado];

  let scoreHtml = `<div class="partido-score-box"><div class="partido-score-label">vs</div></div>`;
  if (p.estado === 'terminado' || p.estado === 'en-curso') {
    scoreHtml = `<div class="partido-score-box">
      <div class="partido-score-num">${sL} – ${sV}</div>
      <div class="partido-score-label">sets</div>
    </div>`;
  }

  let btns = '';
  if (p.estado === 'pendiente') btns = `<button class="partido-btn primary" onclick="iniciarPartido('${p.id}')">▶ Jugar ahora</button>`;
  else if (p.estado === 'en-curso') btns = `<button class="partido-btn primary" onclick="iniciarPartido('${p.id}')">🔴 Continuar</button>`;
  else btns = `<button class="partido-btn" onclick="detallePartido('${p.id}')">📊 Detalle</button>
               <button class="partido-btn" onclick="resetPartido('${p.id}')">↺ Repetir</button>`;

  return `
    <div class="partido-card">
      <div class="partido-top">
        <span class="estado-badge ${estadoClass}">${estadoLabel}</span>
        <span class="partido-dur">${durStr}</span>
      </div>
      <div class="partido-body">
        <div class="partido-team home">${nombreEq(p.local)}</div>
        ${scoreHtml}
        <div class="partido-team away">${nombreEq(p.visitante)}</div>
      </div>
      <div class="partido-actions">${btns}</div>
    </div>`;
}

// ── TABLA ──
function calcTabla(t) {
  t = t || torneoActual;
  const stats = {};
  t.equipos.forEach(e => { stats[e.id] = { id:e.id, nombre:e.nombre, pj:0, pg:0, pp:0, sf:0, sc:0, pf:0, pc:0, pts:0 }; });

  const normas = t.tipo === 'sala' ? NORMAS_SALA : NORMAS_PLAYA;
  const normaActiva = t.normas.map(nid => normas.find(n => n.id === nid)).find(n => n && n.calcularPuntos);

  (t.partidos || []).filter(p => p.estado === 'terminado').forEach(p => {
    const sL = p.sets.filter(s => s.local > s.visitante).length;
    const sV = p.sets.filter(s => s.visitante > s.local).length;
    const pF = p.sets.reduce((a,s) => a + s.local, 0);
    const pC = p.sets.reduce((a,s) => a + s.visitante, 0);
    const eL = stats[p.local], eV = stats[p.visitante];
    if (!eL || !eV) return;
    eL.pj++; eV.pj++;
    eL.sf += sL; eL.sc += sV; eV.sf += sV; eV.sc += sL;
    eL.pf += pF; eL.pc += pC; eV.pf += pC; eV.pc += pF;
    if (sL > sV) {
      eL.pg++; eV.pp++;
      const r = normaActiva ? normaActiva.calcularPuntos({setsG:sL,setsP:sV}) : {ganador:3,perdedor:0};
      eL.pts += r.ganador; eV.pts += r.perdedor;
    } else {
      eV.pg++; eL.pp++;
      const r = normaActiva ? normaActiva.calcularPuntos({setsG:sV,setsP:sL}) : {ganador:3,perdedor:0};
      eV.pts += r.ganador; eL.pts += r.perdedor;
    }
  });
  return Object.values(stats).sort((a,b) => b.pts - a.pts || (b.sf-b.sc) - (a.sf-a.sc) || (b.pf-b.pc) - (a.pf-a.pc));
}

function renderTabla() {
  const data = calcTabla();
  const cont = document.getElementById('tab-tabla');
  const posClass = ['pos-1','pos-2','pos-3'];
  cont.innerHTML = `
    <div class="sec-header"><div class="sec-title">Clasificación</div></div>
    <div class="tabla-scroll">
      <table class="tabla">
        <thead><tr>
          <th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PP</th><th>SF</th><th>SC</th><th>Pts</th>
        </tr></thead>
        <tbody>
          ${data.map((eq,i) => `
            <tr class="${i===0?'row-1':i===1?'row-2':''}">
              <td><span class="pos-badge ${posClass[i]||''}">${i+1}</span></td>
              <td>${eq.nombre}${i===0&&eq.pj>0?' 🏆':''}</td>
              <td>${eq.pj}</td><td>${eq.pg}</td><td>${eq.pp}</td>
              <td>${eq.sf}</td><td>${eq.sc}</td>
              <td class="td-pts">${eq.pts}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="tabla-legend">PJ=Jugados · PG=Ganados · PP=Perdidos · SF/SC=Sets favor/contra</div>`;
}

// ── STATS ──
function renderStats() {
  const data = calcTabla();
  const cont = document.getElementById('tab-stats');
  const terminados = torneoActual.partidos.filter(p => p.estado === 'terminado');
  const pendientes = torneoActual.partidos.filter(p => p.estado === 'pendiente').length;
  const durs = terminados.filter(p => p.duracion).map(p => p.duracion);
  const durProm = durs.length ? Math.round(durs.reduce((a,b) => a+b,0)/durs.length) : 0;
  const maxPts = Math.max(...data.map(e => e.pts), 1);
  const lider = data[0];

  let campeon = '';
  if (torneoActual.finalizado && lider && lider.pj > 0) {
    campeon = `<div class="champion-card">
      <span class="champion-trophy">🏆</span>
      <div class="champion-label">Campeón del torneo</div>
      <div class="champion-name">${lider.nombre}</div>
    </div>`;
  }

  cont.innerHTML = `<div class="stats-wrap">
    ${campeon}
    <div class="stat-hero">
      <div class="stat-hero-title">Resumen</div>
      <div class="stat-grid">
        <div class="stat-item"><div class="stat-val">${terminados.length}</div><div class="stat-lbl">Jugados</div></div>
        <div class="stat-item"><div class="stat-val">${pendientes}</div><div class="stat-lbl">Pendientes</div></div>
        <div class="stat-item"><div class="stat-val" style="color:var(--acc2)">${Math.floor(durProm/60)}:${String(durProm%60).padStart(2,'0')}</div><div class="stat-lbl">Duración prom.</div></div>
        <div class="stat-item"><div class="stat-val" style="color:var(--acc3)">${torneoActual.equipos.length}</div><div class="stat-lbl">Equipos</div></div>
      </div>
    </div>
    <div class="stat-hero">
      <div class="stat-hero-title">Posiciones</div>
      <div class="rank-list">
        ${data.slice(0,5).map((eq,i) => `
          <div class="rank-row">
            <div class="rank-pos">${i+1}</div>
            <div style="flex:1">
              <div class="rank-name">${eq.nombre}</div>
              <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.round(eq.pts/maxPts*100)}%"></div></div>
            </div>
            <div class="rank-pts">${eq.pts} pts</div>
          </div>`).join('')}
      </div>
    </div>
    <div style="padding:0 0 20px">
      <button class="btn ${torneoActual.finalizado?'btn-green':'btn-amber'} btn-full" onclick="marcarFinalizado()">
        ${torneoActual.finalizado ? '✓ Torneo finalizado' : '🏁 Marcar como finalizado'}
      </button>
    </div>
  </div>`;
}

function marcarFinalizado() {
  torneoActual.finalizado = !torneoActual.finalizado;
  LS.save();
  toast(torneoActual.finalizado ? '¡Torneo finalizado! 🏆' : 'Torneo marcado como activo');
  if (tabActual === 2) renderStats();
}

// ══════════════════════════════════════
// MARCADOR
// ══════════════════════════════════════
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
    timerSeg = 0;
  } else {
    timerSeg = p.duracion || 0;
  }
  clearInterval(timerInt);
  timerOn = false;
  document.getElementById('timer-btn').textContent = '▶ Iniciar';
  actualizarMarcador();
  LS.save();
  showScreen('screen-marcador');
}

function actualizarMarcador() {
  if (!partidoActual) return;
  const sa = partidoActual.setActual || { local: 0, visitante: 0 };
  document.getElementById('pts-local').textContent = sa.local;
  document.getElementById('pts-visitante').textContent = sa.visitante;
  document.getElementById('nombre-local').textContent = nombreEq(partidoActual.local);
  document.getElementById('nombre-visitante').textContent = nombreEq(partidoActual.visitante);

  const regl = REGLAMENTO[torneoActual.tipo];
  const setNum = partidoActual.setNum || 1;
  const esFinal = (torneoActual.tipo === 'sala' && setNum === 5) || (torneoActual.tipo === 'playa' && setNum === 3);
  const meta = esFinal ? regl.puntosFinalSet : regl.puntosSet;
  document.getElementById('set-meta-info').textContent = `Set ${setNum} de ${regl.sets} — Meta: ${meta} puntos`;

  const sL = partidoActual.sets.filter(s => s.local > s.visitante).length;
  const sV = partidoActual.sets.filter(s => s.visitante > s.local).length;
  const track = document.getElementById('sets-track-display');
  track.innerHTML = `
    <div class="set-pill win-home">${nombreEq(partidoActual.local)}: ${sL}</div>
    <div class="set-pill" style="font-size:11px;color:var(--txt3)">SETS</div>
    <div class="set-pill win-away">${nombreEq(partidoActual.visitante)}: ${sV}</div>`;

  const m = Math.floor(timerSeg/60), s = timerSeg % 60;
  document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function sumarPunto(lado) {
  if (!partidoActual) return;
  if (!timerOn) toggleTimer();
  if (!partidoActual.setActual) partidoActual.setActual = { local: 0, visitante: 0 };
  partidoActual.setActual[lado]++;
  const sa = partidoActual.setActual;
  const regl = REGLAMENTO[torneoActual.tipo];
  const setNum = partidoActual.setNum || 1;
  const esFinal = (torneoActual.tipo === 'sala' && setNum === 5) || (torneoActual.tipo === 'playa' && setNum === 3);
  const meta = esFinal ? regl.puntosFinalSet : regl.puntosSet;
  const mx = Math.max(sa.local, sa.visitante), mn = Math.min(sa.local, sa.visitante);
  if (mx >= meta && mx - mn >= 2) {
    actualizarMarcador();
    setTimeout(() => terminarSet(true), 400);
  } else {
    actualizarMarcador();
    LS.save();
  }
}

function restarPunto(lado) {
  if (!partidoActual || !partidoActual.setActual) return;
  if (partidoActual.setActual[lado] > 0) {
    partidoActual.setActual[lado]--;
    actualizarMarcador();
    LS.save();
  }
}

function terminarSet(auto = false) {
  if (!partidoActual) return;
  const sa = partidoActual.setActual;
  if (!sa || (sa.local === 0 && sa.visitante === 0 && !auto)) {
    toast('El set no tiene puntos aún');
    return;
  }
  if (sa) {
    partidoActual.sets.push({ local: sa.local, visitante: sa.visitante });
    partidoActual.setActual = { local: 0, visitante: 0 };
  }
  const regl = REGLAMENTO[torneoActual.tipo];
  const sL = partidoActual.sets.filter(s => s.local > s.visitante).length;
  const sV = partidoActual.sets.filter(s => s.visitante > s.local).length;
  const para = torneoActual.tipo === 'sala' ? 3 : 2;
  if (sL >= para || sV >= para) {
    terminarPartido(true);
  } else {
    partidoActual.setNum = (partidoActual.setNum || 1) + 1;
    actualizarMarcador();
    LS.save();
    toast(`Set ${partidoActual.setNum - 1} terminado ✓`);
  }
}

function terminarPartido(auto = false) {
  if (!partidoActual) return;
  const sa = partidoActual.setActual;
  if (sa && (sa.local > 0 || sa.visitante > 0)) {
    partidoActual.sets.push({ ...sa });
  }
  if (timerOn) toggleTimer();
  partidoActual.duracion = timerSeg;
  const sL = partidoActual.sets.filter(s => s.local > s.visitante).length;
  const sV = partidoActual.sets.filter(s => s.visitante > s.local).length;
  partidoActual.ganador = sL > sV ? partidoActual.local : partidoActual.visitante;
  partidoActual.estado = 'terminado';
  partidoActual.setActual = null;
  LS.save();
  const ganNombre = nombreEq(partidoActual.ganador);
  toast(`🏆 ¡${ganNombre} gana!`);
  setTimeout(() => {
    showScreen('screen-torneo');
    renderCalendario();
  }, 1600);
}

function volverDePartido() {
  if (timerOn) toggleTimer();
  if (partidoActual) LS.save();
  showScreen('screen-torneo');
  renderCalendario();
}

function toggleTimer() {
  if (timerOn) {
    clearInterval(timerInt);
    timerOn = false;
    document.getElementById('timer-btn').textContent = '▶ Reanudar';
  } else {
    timerOn = true;
    document.getElementById('timer-btn').textContent = '⏸ Pausar';
    timerInt = setInterval(() => {
      timerSeg++;
      if (partidoActual) partidoActual.duracion = timerSeg;
      const m = Math.floor(timerSeg/60), s = timerSeg % 60;
      document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
  }
}

function resetPartido(id) {
  const p = torneoActual.partidos.find(p => p.id === id);
  if (!p) return;
  Object.assign(p, { estado:'pendiente', sets:[], duracion:null, ganador:null, setActual:null, setNum:1 });
  LS.save();
  renderCalendario();
  toast('Partido reiniciado');
}

function detallePartido(id) {
  const p = torneoActual.partidos.find(pt => pt.id === id);
  if (!p) return;
  const setsStr = p.sets.map((s,i) => `Set ${i+1}: ${s.local}–${s.visitante}`).join(' · ');
  const dur = p.duracion ? `${Math.floor(p.duracion/60)}:${String(p.duracion%60).padStart(2,'0')}` : '—';
  showModal('Detalle del partido',
    `${nombreEq(p.local)} vs ${nombreEq(p.visitante)}\n${setsStr}\nDuración: ${dur}`, null);
}

// ══════════════════════════════════════
// HISTORIAL
// ══════════════════════════════════════
function renderHistorial() {
  const lista = LS.get();
  const cont = document.getElementById('historial-lista');
  const bar = document.getElementById('historial-bar');
  if (!lista.length) {
    cont.innerHTML = `<div class="historial-empty">
      <span class="empty-icon">📋</span>
      <div class="empty-text">No hay torneos guardados</div>
    </div>`;
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  cont.innerHTML = lista.slice().reverse().map(t => {
    const tabla = calcTabla(t);
    const lider = tabla.find(e => e.pj > 0);
    const pts = (t.partidos||[]).filter(p => p.estado==='terminado').length;
    return `<div class="historial-card" onclick="verDetalle('${t.id}')">
      <div class="hcard-top">
        <div class="hcard-name">${t.nombre}</div>
        <div class="hcard-arrow">›</div>
      </div>
      <div class="hcard-chips">
        <span class="hchip ${t.tipo==='sala'?'chip-sala':'chip-playa'}">${t.tipo==='sala'?'🏟 Sala':'🏖 Playa'}</span>
        <span class="hchip ${t.finalizado?'chip-fin':'chip-act'}">${t.finalizado?'✓ Final':'En curso'}</span>
      </div>
      <div class="hcard-meta">${t.equipos.length} equipos · ${pts} partidos · ${t.sede}
        ${lider ? ' · 🏆 ' + lider.nombre : ''}</div>
    </div>`;
  }).join('');
}

function verDetalle(id) {
  histSel = LS.get().find(t => t.id === id);
  if (!histSel) return;
  document.getElementById('detalle-title').textContent = histSel.nombre;
  const tabla = calcTabla(histSel);
  const terminados = (histSel.partidos||[]).filter(p => p.estado==='terminado');
  const posClass = ['pos-1','pos-2','pos-3'];
  document.getElementById('detalle-content').innerHTML = `
    <div class="sec-header"><div class="sec-title">Información</div></div>
    <div style="padding:0 20px 16px">
      <div class="card">
        <div class="info-rows">
          <div class="info-row"><span class="lbl">Tipo</span><span class="val">${histSel.tipo==='sala'?'Sala':'Playa'}</span></div>
          <div class="info-row"><span class="lbl">Sede</span><span class="val">${histSel.sede}</span></div>
          <div class="info-row"><span class="lbl">Fecha</span><span class="val">${histSel.fecha||'—'}</span></div>
          <div class="info-row"><span class="lbl">Formato</span><span class="val">${histSel.formato}</span></div>
          <div class="info-row"><span class="lbl">Estado</span><span class="val" style="color:${histSel.finalizado?'var(--green)':'var(--acc2)'}">${histSel.finalizado?'✓ Finalizado':'En curso'}</span></div>
        </div>
      </div>
    </div>
    <div class="sec-header"><div class="sec-title">Clasificación</div></div>
    <div style="padding:0 20px 16px">
      <div class="rank-list">
        ${tabla.map((eq,i) => `
          <div class="rank-row">
            <div class="rank-pos" style="color:${i===0?'var(--acc2)':i===1?'rgba(255,255,255,0.6)':'var(--txt3)'}">${i+1}</div>
            <div class="rank-name">${eq.nombre}${i===0&&eq.pj>0?' 🏆':''}</div>
            <div style="text-align:right">
              <div class="rank-pts">${eq.pts} pts</div>
              <div style="font-size:11px;color:var(--txt3)">${eq.pg}G ${eq.pp}P</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="sec-header"><div class="sec-title">Resultados (${terminados.length})</div></div>
    <div style="padding:0 20px 8px">
      ${terminados.map(p => {
        const eq = e => histSel.equipos.find(x => x.id === e)?.nombre || '?';
        const sL = p.sets.filter(s => s.local > s.visitante).length;
        const sV = p.sets.filter(s => s.visitante > s.local).length;
        const dur = p.duracion ? `⏱ ${Math.floor(p.duracion/60)}:${String(p.duracion%60).padStart(2,'0')}` : '';
        return `<div class="result-row">
          <div class="result-home">${eq(p.local)}</div>
          <div style="text-align:center">
            <div class="result-score">${sL}–${sV}</div>
            ${dur?`<div class="result-dur">${dur}</div>`:''}
          </div>
          <div class="result-away">${eq(p.visitante)}</div>
        </div>`;
      }).join('') || '<div style="color:var(--txt3);font-size:13px;padding:8px 0">Sin partidos registrados</div>'}
    </div>`;
  showScreen('screen-detalle');
}

function pedirBorrarUno() {
  if (!histSel) return;
  showModal('¿Borrar este torneo?', `Se eliminará "${histSel.nombre}" con todos sus datos permanentemente.`, () => {
    LS.set(LS.get().filter(t => t.id !== histSel.id));
    histSel = null;
    showScreen('screen-historial');
    toast('Torneo eliminado');
  });
}

function pedirBorrarTodo() {
  showModal('¿Borrar TODO el historial?', 'Se eliminarán todos los torneos guardados. Esta acción no se puede deshacer.', () => {
    LS.set([]);
    renderHistorial();
    toast('Historial borrado');
  });
}

function confirmarSalida() {
  if (torneoActual && !torneoActual.finalizado) {
    showModal('¿Salir del torneo?', 'El torneo se guardará automáticamente y podrás retomarlo desde el inicio.', () => showScreen('screen-home'));
  } else {
    showScreen('screen-home');
  }
}

// ══════════════════════════════════════
// MODAL
// ══════════════════════════════════════
function showModal(titulo, msg, fn) {
  document.getElementById('modal-title').textContent = titulo;
  document.getElementById('modal-msg').textContent = msg;
  document.getElementById('modal-bg').style.display = 'flex';
  document.getElementById('modal-ok').style.display = fn ? 'flex' : 'none';
  modalFn = fn;
}
function closeModal() { document.getElementById('modal-bg').style.display = 'none'; modalFn = null; }
function modalOk() { if (modalFn) modalFn(); closeModal(); }

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});
