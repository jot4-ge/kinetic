// ── SECTION NAV & MEAL TABS & TOAST & PROGRESS & WATER ──
// (Mantenha essas funções exatamente como te mandei no código anterior. Apenas atualize a Array de treino e de semana abaixo)

function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + id).classList.add('active');
  document.getElementById('bnav-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
function showMeals(id, el) {
  document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#meal-tabs .day-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('meals-' + id).classList.add('active');
  el.classList.add('active');
}
 
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
 
function updateProgress() {
  const input = document.getElementById('peso-input');
  const val = parseFloat(input.value);
  if (!val || val < 60 || val > 90) { input.style.borderColor = '#555'; showToast('⚠️ Insira um peso válido'); return; }
  input.style.borderColor = '#fff';
  const start = 81, goal = 74, total = start - goal;
  const done = Math.max(0, Math.min(start - val, total));
  const pct = Math.round((done / total) * 100);
  document.getElementById('prog-bar').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('chip-meta').textContent = `Meta: 74kg · ${pct}% ✓`;
  localStorage.setItem('jg_peso', val);
  showToast(`Você secou ${(start - val).toFixed(1)}kg!`);
}
 
const savedPeso = localStorage.getItem('jg_peso');
if (savedPeso) {
  document.getElementById('peso-input').value = savedPeso;
  updateProgress();
}
 
let waterCount = parseInt(localStorage.getItem('jg_water') || '0');
const TOTAL_GLASSES = 16;
 
function buildGlasses() {
  const wrap = document.getElementById('glasses-wrap');
  wrap.innerHTML = '';
  for (let i = 0; i < TOTAL_GLASSES; i++) {
    const g = document.createElement('div');
    g.className = 'glass' + (i < waterCount ? ' filled' : '');
    g.innerHTML = i < waterCount ? '🧊' : '';
    g.addEventListener('click', () => toggleGlass(i));
    wrap.appendChild(g);
  }
  document.getElementById('water-total').textContent = (waterCount * 250) + 'ml';
}
 
function toggleGlass(idx) {
  if (idx === waterCount - 1) waterCount--;
  else if (idx === waterCount) {
    waterCount++;
    if (waterCount >= TOTAL_GLASSES) showToast('🔥 4L batidos. Retenção indo embora!');
  } else waterCount = idx + 1;
  localStorage.setItem('jg_water', waterCount);
  buildGlasses();
}
function resetWater() { waterCount = 0; localStorage.setItem('jg_water', 0); buildGlasses(); }
buildGlasses();

// ── TREINO DATA (Completo Original + Foco Queima) ──
const treinoData = [
  { day: 'Segunda-feira', label: 'JJ depois · 17h', tipo: 'jj', grupo: 'Peito — Chest Day (Volume)',
    exercicios: [
      { nome: 'Supino reto com barra', series: 4, reps: '6~8' },
      { nome: 'Supino inclinado com halteres', series: 4, reps: '8~10' },
      { nome: 'Crucifixo inclinado com halteres', series: 3, reps: '12~15' },
      { nome: 'Peck deck / fly na máquina', series: 3, reps: '12~15' },
      { nome: 'Cross-over cabo (contração alta)', series: 3, reps: '15~20' },
      { nome: 'Tríceps pulley (corda) — superset', series: 4, reps: '12~15' },
      { nome: 'Tríceps testa haltere unilateral', series: 3, reps: '10~12' },
    ],
    cardio: 'JJ das 17~18h já cobre. Nada extra — priorizar recuperação.'
  },
  { day: 'Terça-feira', label: 'Sem JJ · cardio incluso', tipo: 'cardio', grupo: 'Costas — Back Width (V-Taper)',
    exercicios: [
      { nome: 'Puxada frontal pegada larga (foco dorsais)', series: 4, reps: '8~10' },
      { nome: 'Puxada neutra pegada fechada', series: 3, reps: '10~12' },
      { nome: 'Remada curvada (cotovelo para fora — foco V-taper)', series: 4, reps: '8~10' },
      { nome: 'Remada unilateral com haltere', series: 3, reps: '10~12' },
      { nome: 'Pull-over com haltere (alongamento dorsal)', series: 3, reps: '12~15' },
      { nome: 'Rosca direta com barra (pico)', series: 3, reps: '8~10' },
      { nome: 'Rosca concentrada (contração)', series: 3, reps: '12~15' },
      { nome: 'Rosca martelo (braquial)', series: 3, reps: '10~12' },
    ],
    cardio: '20min de esteira inclinada (6km/h · 8% inclinação) após o treino.'
  },
  { day: 'Quarta-feira', label: 'JJ depois · 17h', tipo: 'jj', grupo: 'Ombros — Shoulder Aesthetics (3D)',
    exercicios: [
      { nome: 'Desenvolvimento Arnold com halteres', series: 4, reps: '8~10' },
      { nome: 'Elevação lateral com halteres (drop set)', series: 4, reps: '12→15→20' },
      { nome: 'Elevação lateral na polia (cabo)', series: 3, reps: '15~20' },
      { nome: 'Elevação frontal alternada com halteres', series: 3, reps: '12' },
      { nome: 'Crucifixo inverso (posterior 3D)', series: 4, reps: '15~20' },
      { nome: 'Face pull (saúde do manguito)', series: 3, reps: '15~20' },
      { nome: 'Encolhimento de ombros com halteres', series: 3, reps: '15' },
    ],
    cardio: 'JJ das 17~18h já cobre. Opcional: 10min aquecimento na esteira.'
  },
  { day: 'Quinta-feira', label: 'Sem JJ · cardio incluso', tipo: 'cardio', grupo: 'Pernas — Quad + Glúteo (Lower Body)',
    exercicios: [
      { nome: 'Agachamento livre com barra (deep)', series: 4, reps: '6~8' },
      { nome: 'Leg press 45° (pisada alta + larga)', series: 4, reps: '10~12' },
      { nome: 'Hack squat na máquina', series: 3, reps: '10~12' },
      { nome: 'Cadeira extensora (peak contraction)', series: 3, reps: '12~15' },
      { nome: 'Stiff romeno com barra', series: 4, reps: '8~10' },
      { nome: 'Mesa flexora', series: 3, reps: '12~15' },
      { nome: 'Panturrilha em pé (carga máxima)', series: 5, reps: '12~15' },
    ],
    cardio: '20min esteira inclinada após o treino. Perna + JJ seria demais — sem JJ quinta.'
  },
  { day: 'Sexta-feira', label: 'JJ depois · 17h', tipo: 'jj', grupo: 'Peito + Bíceps (Pump Day)',
    exercicios: [
      { nome: 'Supino inclinado halteres (contração total)', series: 4, reps: '10~12' },
      { nome: 'Cross-over cabo (baixo para cima)', series: 3, reps: '15~20' },
      { nome: 'Flexão de braço lenta (3s descida)', series: 3, reps: 'máximo' },
      { nome: 'Peck deck (squeeze no pico)', series: 3, reps: '15' },
      { nome: 'Rosca 21 com barra W', series: 3, reps: '21 (7+7+7)' },
      { nome: 'Rosca spider curl com haltere', series: 3, reps: '10~12' },
      { nome: 'Rosca cabo unilateral (pico)', series: 3, reps: '12~15' },
    ],
    cardio: 'JJ das 17~18h já cobre. Dia de volume + JJ — ótimo para definição.'
  },
  { day: 'Sábado', label: 'Sem JJ · cardio incluso', tipo: 'cardio', grupo: 'Costas + Abdômen (Finisher Week)',
    exercicios: [
      { nome: 'Puxada frontal pegada larga', series: 4, reps: '8~10' },
      { nome: 'Remada máquina (chest supported)', series: 3, reps: '10~12' },
      { nome: 'Pull-over polia alta', series: 3, reps: '12~15' },
      { nome: 'Abdominal crunch na máquina (carga)', series: 4, reps: '12~15' },
      { nome: 'Abdominal remador (hollow body)', series: 3, reps: '15~20' },
      { nome: 'Prancha lateral (cada lado)', series: 3, reps: '30~45s' },
      { nome: 'Abdominal infra (elevação de pernas)', series: 3, reps: '15~20' },
      { nome: 'Abdominal bicicleta (oblíquo)', series: 3, reps: '20' },
    ],
    cardio: '25~30min de esteira inclinada ou bike após. Semana finalizada.'
  },
];

function getTreinoKey(di, ei) { return `jg_t_${di}_${ei}`; }
function getTreinoDoneKey(di) { return `jg_td_${di}`; }
 
function buildTreino() {
  const list = document.getElementById('treino-list');
  list.innerHTML = '';
  treinoData.forEach((t, di) => {
    const total = t.exercicios.length;
    const checked = t.exercicios.filter((_, ei) => localStorage.getItem(getTreinoKey(di, ei)) === '1').length;
    const isDone = localStorage.getItem(getTreinoDoneKey(di)) === '1';
    const card = document.createElement('div');
    card.className = 'treino-card' + (isDone ? ' done' : '');
    card.innerHTML = `
      <div class="treino-head" onclick="toggleTreino(${di})">
        <div><div class="treino-day-label">${t.day} · ${t.label}</div><div class="treino-name">${t.grupo}</div></div>
        <div class="treino-right"><div class="count">${checked}/${total}</div><span class="chevron" id="chev-${di}">›</span></div>
      </div>
      <div class="treino-body" id="tbody-${di}">
        <table class="ex-table">
          ${t.exercicios.map((e, ei) => {
            const ck = localStorage.getItem(getTreinoKey(di, ei)) === '1';
            return `<tr class="${ck ? 'checked' : ''}"><td style="width:28px"><div class="ex-check ${ck ? 'checked' : ''}" onclick="toggleEx(event,${di},${ei})"></div></td><td>${e.nome}</td><td>${e.series}x <span style="font-size:10px">${e.reps}</span></td></tr>`;
          }).join('')}
        </table>
        <div class="cardio-box"><span>Cardio/JJ:</span> ${t.cardio}</div>
        <button class="done-btn ${isDone ? 'is-done' : ''}" onclick="markDone(${di})">${isDone ? 'Treino finalizado!' : 'Finalizar treino'}</button>
      </div>`;
    list.appendChild(card);
  });
}
 
function toggleTreino(di) {
  const body = document.getElementById('tbody-' + di);
  body.classList.toggle('open');
  document.getElementById('chev-' + di).style.transform = body.classList.contains('open') ? 'rotate(0deg)' : 'rotate(90deg)';
}
function toggleEx(e, di, ei) {
  e.stopPropagation();
  const key = getTreinoKey(di, ei);
  localStorage.setItem(key, localStorage.getItem(key) === '1' ? '0' : '1');
  buildTreino();
  document.getElementById('tbody-' + di).classList.add('open');
}
function markDone(di) {
  const key = getTreinoDoneKey(di);
  localStorage.setItem(key, localStorage.getItem(key) === '1' ? '0' : '1');
  buildTreino();
}
buildTreino();

// ── WEEK DATA (Sua rotina exata da UnB, corrigindo as cores dos blocos) ──
const weekData = [
  { day: 'Segunda', color: '#1a1a1a', textColor: '#fff', blocks: [
    { time: '06h30', text: 'Treino — Peito + Tríceps (A)', type: 'treino' },
    { time: '08h~09h50', text: 'UnB: Matemática Discreta 1', type: 'aula' },
    { time: '10h~11h50', text: 'UnB: Cálculo 3', type: 'aula' },
    { time: '12h~13h50', text: 'UnB: Métodos Desenv. Software', type: 'aula' },
    { time: '17h~18h', text: 'Jiu-Jitsu 🥋', type: 'jj' }
  ]},
  { day: 'Terça', color: '#1a1a1a', textColor: '#fff', blocks: [
    { time: '06h30', text: 'Treino — Costas + Bíceps + Cardio', type: 'treino' },
    { time: '10h~11h50', text: 'UnB: Cálculo 3', type: 'aula' },
    { time: '14h~15h50', text: 'UnB: Gestão da Prod. e Qualidade', type: 'aula' },
    { time: '16h~17h50', text: 'UnB: Humanidades e Cidadania', type: 'aula' },
    { time: 'Noite', text: 'Dev/Gestão: ContraDito / Reset Dept', type: 'trabalho' }
  ]},
  { day: 'Quarta', color: '#1a1a1a', textColor: '#fff', blocks: [
    { time: '06h30', text: 'Treino — Pernas (C)', type: 'treino' },
    { time: '08h~09h50', text: 'UnB: Matemática Discreta 1', type: 'aula' },
    { time: '12h~13h50', text: 'UnB: Métodos Desenv. Software', type: 'aula' },
    { time: '14h~15h50', text: 'UnB: Teoria Eletrônica Digital 1', type: 'aula' },
    { time: '17h~18h', text: 'Jiu-Jitsu 🥋', type: 'jj' }
  ]},
  { day: 'Quinta', color: '#1a1a1a', textColor: '#fff', blocks: [
    { time: '06h30', text: 'Treino — Peito + Tríceps A2 + Cardio', type: 'treino' },
    { time: '08h~09h50', text: 'UnB: Prática Eletrônica Digital 1', type: 'aula' },
    { time: '10h~11h50', text: 'UnB: Cálculo 3', type: 'aula' },
    { time: '14h~15h50', text: 'UnB: Gestão da Prod. e Qualidade', type: 'aula' },
    { time: '16h~17h50', text: 'UnB: Humanidades e Cidadania', type: 'aula' }
  ]},
  { day: 'Sexta', color: '#1a1a1a', textColor: '#fff', blocks: [
    { time: '06h30', text: 'Treino — Costas + Bíceps B2', type: 'treino' },
    { time: '14h~15h50', text: 'UnB: Teoria Eletrônica Digital 1', type: 'aula' },
    { time: '17h~18h', text: 'Jiu-Jitsu 🥋', type: 'jj' },
    { time: 'Noite', text: 'Dev/Gestão: ContraDito / Reset Dept', type: 'trabalho' }
  ]},
  { day: 'Sábado', color: '#111', textColor: '#888', blocks: [
    { time: 'Manhã', text: 'Treino — Ombros + Abdômen + Cardio', type: 'treino' },
    { time: 'Almoço', text: 'Refeição Livre (Abaixo 1000kcal)', type: 'refeicao' },
    { time: 'Tarde', text: 'Descanso e Organização Semanal', type: 'descanso' }
  ]},
];

const typeStyles = {
  aula:     'background:#111;border-left:3px solid #555',
  treino:   'background:#181818;border-left:3px solid #fff',
  jj:       'background:#111;border-left:3px solid #888',
  trabalho: 'background:#1a1a1a;border-left:3px solid #555',
  refeicao: 'background:#111;border-left:3px solid #666',
  descanso: 'background:#0a0a0a;border-left:3px solid #333',
};

const weekContainer = document.getElementById('week-days');
weekData.forEach(d => {
  const inner = d.blocks.map(b => `<div style="${typeStyles[b.type]};padding:12px;margin-bottom:2px;display:flex;gap:12px; align-items:center;"><div style="font-family:'DM Mono';font-size:10px;color:#777;min-width:65px;">${b.time}</div><div style="font-size:13px;color:#ddd">${b.text}</div></div>`).join('');
  // Correção do Bug de Cores da Semana:
  weekContainer.insertAdjacentHTML('beforeend', `<div class="week-day-card"><div class="week-day-header" style="background:${d.color}; color:${d.textColor}; border-bottom:1px solid #333;">${d.day}</div>${inner}</div>`);
});
 
// ── CHECKLIST ──
const checklistItems = [
  { id: 'cl_treino', text: 'Treino de Força às 06:30 feito' },
  { id: 'cl_agua', text: 'Bateu os 4 Litros de água' },
  { id: 'cl_prot', text: 'Bateu a meta de Proteína (190g)' },
  { id: 'cl_jj', text: 'Jiu-Jitsu ou Cardio realizado' },
  { id: 'cl_sono', text: 'Min. 7h de Sono garantidas' }
];
 
function buildChecklist() {
  const container = document.getElementById('checklist');
  container.innerHTML = '';
  checklistItems.forEach(item => {
    const ck = localStorage.getItem(item.id) === '1';
    const div = document.createElement('div');
    div.className = 'check-item' + (ck ? ' checked' : '');
    div.innerHTML = `<div class="ci-box"></div><div class="ci-text">${item.text}</div>`;
    div.addEventListener('click', () => {
      localStorage.setItem(item.id, ck ? '0' : '1');
      buildChecklist();
    });
    container.appendChild(div);
  });
}
function resetChecklist() { checklistItems.forEach(i => localStorage.removeItem(i.id)); buildChecklist(); }
buildChecklist();