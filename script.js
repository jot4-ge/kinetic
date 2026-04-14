// ── SECTION NAV ──
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + id).classList.add('active');
  document.getElementById('bnav-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
// ── MEAL TABS ──
function showMeals(id, el) {
  document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#meal-tabs .day-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('meals-' + id).classList.add('active');
  el.classList.add('active');
}
 
// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
 
// ── PROGRESS ──
function updateProgress() {
  const input = document.getElementById('peso-input');
  const val = parseFloat(input.value);
  if (!val || val < 60 || val > 90) { input.style.borderColor = 'var(--red)'; showToast('⚠️ Insira um peso válido (60–90kg)'); return; }
  input.style.borderColor = 'var(--green)';
  const start = 81, goal = 73.5, total = start - goal;
  const done = Math.max(0, Math.min(start - val, total));
  const pct = Math.round((done / total) * 100);
  document.getElementById('prog-bar').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  const perdido = Math.max(0, start - val).toFixed(1);
  document.getElementById('chip-meta').textContent = `Meta: 73~74kg · ${pct}% ✓`;
  localStorage.setItem('jg_peso', val);
  showToast(`${perdido}kg perdidos · ${pct}% da meta!`);
}
 
// restore saved peso
const savedPeso = localStorage.getItem('jg_peso');
if (savedPeso) {
  document.getElementById('peso-input').value = savedPeso;
  updateProgress();
}
 
// ── WATER COUNTER ──
let waterCount = parseInt(localStorage.getItem('jg_water') || '0');
const GLASS_ML = 250;
const TOTAL_GLASSES = 12;
 
function buildGlasses() {
  const wrap = document.getElementById('glasses-wrap');
  wrap.innerHTML = '';
  for (let i = 0; i < TOTAL_GLASSES; i++) {
    const g = document.createElement('div');
    g.className = 'glass' + (i < waterCount ? ' filled' : '');
    g.innerHTML = i < waterCount ? '💧' : '';
    g.addEventListener('click', () => toggleGlass(i));
    wrap.appendChild(g);
  }
  document.getElementById('water-total').textContent = (waterCount * GLASS_ML) + 'ml';
}
 
function toggleGlass(idx) {
  if (idx === waterCount - 1) {
    waterCount--;
  } else if (idx === waterCount) {
    waterCount++;
    if (waterCount >= TOTAL_GLASSES) showToast('🎉 Meta de água atingida!');
  } else {
    waterCount = idx + 1;
  }
  localStorage.setItem('jg_water', waterCount);
  buildGlasses();
}
 
function resetWater() {
  waterCount = 0;
  localStorage.setItem('jg_water', 0);
  buildGlasses();
  showToast('Contador zerado');
}
buildGlasses();
 
// ── TREINO DATA ──
const treinoData = [
  { day: 'Segunda-feira', label: 'JJ depois · 17h', tipo: 'jj', grupo: 'Peito + Tríceps (A)',
    exercicios: [
      { nome: 'Supino reto com barra', series: 4, reps: '8~10' },
      { nome: 'Supino inclinado com halteres', series: 3, reps: '10~12' },
      { nome: 'Crucifixo com halteres', series: 3, reps: '12' },
      { nome: 'Peck deck / cross-over', series: 3, reps: '12~15' },
      { nome: 'Tríceps pulley (corda)', series: 3, reps: '12' },
      { nome: 'Tríceps testa com barra W', series: 3, reps: '10' },
      { nome: 'Mergulho entre bancos', series: 3, reps: '12~15' },
    ],
    cardio: 'JJ das 17~18h já cobre. Opcional: 10~15min esteira leve como aquecimento.'
  },
  { day: 'Terça-feira', label: 'Sem JJ · cardio incluso', tipo: 'cardio', grupo: 'Costas + Bíceps (B)',
    exercicios: [
      { nome: 'Puxada frontal (pegada larga)', series: 4, reps: '8~10' },
      { nome: 'Remada curvada com barra', series: 3, reps: '8~10' },
      { nome: 'Remada unilateral com haltere', series: 3, reps: '10~12' },
      { nome: 'Puxada neutra (pegada fechada)', series: 3, reps: '10~12' },
      { nome: 'Remada baixa (serrote)', series: 3, reps: '12' },
      { nome: 'Rosca direta com barra', series: 3, reps: '10' },
      { nome: 'Rosca martelo com halteres', series: 3, reps: '12' },
      { nome: 'Rosca concentrada', series: 3, reps: '12' },
    ],
    cardio: '20~25min de esteira (6~7km/h) ou bicicleta ergométrica após o treino.'
  },
  { day: 'Quarta-feira', label: 'JJ depois · 17h', tipo: 'jj', grupo: 'Pernas (C)',
    exercicios: [
      { nome: 'Agachamento livre com barra', series: 4, reps: '8~10' },
      { nome: 'Leg press 45°', series: 4, reps: '10~12' },
      { nome: 'Cadeira extensora', series: 3, reps: '12~15' },
      { nome: 'Mesa flexora', series: 3, reps: '12' },
      { nome: 'Avanço com halteres', series: 3, reps: '12 (cada)' },
      { nome: 'Stiff com halteres', series: 3, reps: '12' },
      { nome: 'Panturrilha em pé', series: 4, reps: '15~20' },
    ],
    cardio: 'JJ das 17~18h já cobre. Não adicione cardio pesado — perna + JJ é suficiente.'
  },
  { day: 'Quinta-feira', label: 'Sem JJ · cardio incluso', tipo: 'cardio', grupo: 'Peito + Tríceps (A2 — variação)',
    exercicios: [
      { nome: 'Supino inclinado com barra', series: 4, reps: '8~10' },
      { nome: 'Supino reto com halteres', series: 3, reps: '10~12' },
      { nome: 'Cross-over (cabo)', series: 3, reps: '12~15' },
      { nome: 'Flexão de braço (finalização)', series: 3, reps: 'máximo' },
      { nome: 'Tríceps corda no pulley', series: 3, reps: '12' },
      { nome: 'French press com haltere', series: 3, reps: '10~12' },
      { nome: 'Tríceps banco (paralelas)', series: 3, reps: '12~15' },
    ],
    cardio: '20~25min de esteira ou bike após o treino.'
  },
  { day: 'Sexta-feira', label: 'JJ depois · 17h', tipo: 'jj', grupo: 'Costas + Bíceps (B2 — variação)',
    exercicios: [
      { nome: 'Puxada frontal (pegada fechada)', series: 4, reps: '8~10' },
      { nome: 'Remada máquina', series: 3, reps: '10~12' },
      { nome: 'Pull-over com haltere', series: 3, reps: '12' },
      { nome: 'Remada cavalinho', series: 3, reps: '10~12' },
      { nome: 'Rosca W com barra', series: 3, reps: '10' },
      { nome: 'Rosca inversa', series: 3, reps: '12' },
      { nome: 'Rosca 21 com barra', series: 3, reps: '21 (7+7+7)' },
    ],
    cardio: 'JJ das 17~18h já cobre. Opcional: 10min aquecimento na esteira.'
  },
  { day: 'Sábado', label: 'Sem JJ · cardio incluso', tipo: 'cardio', grupo: 'Ombros + Abdômen (D)',
    exercicios: [
      { nome: 'Desenvolvimento com halteres', series: 4, reps: '10~12' },
      { nome: 'Elevação lateral com halteres', series: 4, reps: '12~15' },
      { nome: 'Elevação frontal', series: 3, reps: '12' },
      { nome: 'Crucifixo inverso (posterior)', series: 3, reps: '12~15' },
      { nome: 'Encolhimento de ombros', series: 3, reps: '15' },
      { nome: 'Abdominal crunch', series: 4, reps: '15~20' },
      { nome: 'Prancha frontal', series: 3, reps: '30~45s' },
      { nome: 'Abdominal bicicleta (oblíquo)', series: 3, reps: '20' },
    ],
    cardio: '25~30min de esteira, bike ou caminhada acelerada após o treino.'
  },
];
 
// load saved treino state
function getTreinoKey(dayIdx, exIdx) { return `jg_t_${dayIdx}_${exIdx}`; }
function getTreinoDoneKey(dayIdx) { return `jg_td_${dayIdx}`; }
 
function buildTreino() {
  const list = document.getElementById('treino-list');
  list.innerHTML = '';
 
  treinoData.forEach((t, di) => {
    const total = t.exercicios.length;
    const checked = t.exercicios.filter((_, ei) => localStorage.getItem(getTreinoKey(di, ei)) === '1').length;
    const isDone = localStorage.getItem(getTreinoDoneKey(di)) === '1';
    const pct = total > 0 ? checked / total : 0;
    const circ = 2 * Math.PI * 12;
    const offset = circ * (1 - pct);
 
    const card = document.createElement('div');
    card.className = 'treino-card' + (isDone ? ' done' : '');
    card.id = `tcard-${di}`;
 
    const badgeHtml = t.tipo === 'jj'
      ? `<span class="treino-badge badge-jj">🥋 JJ 17h</span>`
      : `<span class="treino-badge badge-cardio">🏃 Cardio</span>`;
 
    const doneHtml = isDone
      ? `<span class="treino-badge badge-done" style="margin-left:4px">✓ Feito</span>` : '';
 
    card.innerHTML = `
      <div class="treino-head" onclick="toggleTreino(${di})">
        <div class="treino-head-left">
          <div class="treino-day-label">${t.day} · ${t.label}</div>
          <div class="treino-name">${t.grupo}</div>
        </div>
        <div class="treino-right">
          ${badgeHtml}${doneHtml}
          <div class="prog-ring">
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle class="bg" cx="16" cy="16" r="12" stroke-width="3"/>
              <circle class="fill" cx="16" cy="16" r="12" stroke-width="3"
                stroke-dasharray="${circ.toFixed(1)}"
                stroke-dashoffset="${offset.toFixed(1)}"/>
            </svg>
            <div class="count">${checked}/${total}</div>
          </div>
          <span class="chevron" id="chev-${di}">›</span>
        </div>
      </div>
      <div class="treino-body" id="tbody-${di}">
        <table class="ex-table">
          <tr><th></th><th>Exercício</th><th>Séries</th><th>Reps</th></tr>
          ${t.exercicios.map((e, ei) => {
            const ck = localStorage.getItem(getTreinoKey(di, ei)) === '1';
            return `<tr class="${ck ? 'checked' : ''}" id="trow-${di}-${ei}">
              <td style="width:28px">
                <div class="ex-check ${ck ? 'checked' : ''}" onclick="toggleEx(event,${di},${ei})" id="exck-${di}-${ei}"></div>
              </td>
              <td><div class="ex-name-wrap">${e.nome}</div></td>
              <td>${e.series}</td>
              <td>${e.reps}</td>
            </tr>`;
          }).join('')}
        </table>
        <div class="cardio-box"><span>Cardio:</span> ${t.cardio}</div>
        <button class="done-btn ${isDone ? 'is-done' : ''}" id="dbtn-${di}" onclick="markDone(${di})">
          ${isDone ? 'Treino concluído!' : 'Marcar treino como feito'}
        </button>
      </div>`;
    list.appendChild(card);
  });
}
 
function toggleTreino(di) {
  const body = document.getElementById('tbody-' + di);
  const chev = document.getElementById('chev-' + di);
  const open = body.classList.contains('open');
  body.classList.toggle('open');
  chev.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
}
 
function toggleEx(e, di, ei) {
  e.stopPropagation();
  const key = getTreinoKey(di, ei);
  const current = localStorage.getItem(key) === '1';
  localStorage.setItem(key, current ? '0' : '1');
  buildTreino();
  // re-open body
  const body = document.getElementById('tbody-' + di);
  const chev = document.getElementById('chev-' + di);
  body.classList.add('open');
  chev.style.transform = 'rotate(90deg)';
  if (!current) {
    const t = treinoData[di];
    const checked = t.exercicios.filter((_, i) => localStorage.getItem(getTreinoKey(di, i)) === '1').length;
    if (checked === t.exercicios.length) showToast('🔥 Todos os exercícios feitos!');
  }
}
 
function markDone(di) {
  const key = getTreinoDoneKey(di);
  const current = localStorage.getItem(key) === '1';
  localStorage.setItem(key, current ? '0' : '1');
  buildTreino();
  document.getElementById('tbody-' + di).classList.add('open');
  document.getElementById('chev-' + di).style.transform = 'rotate(90deg)';
  if (!current) showToast('💪 Treino marcado como feito!');
}
 
buildTreino();
 
// ── WEEK DATA ──
const weekData = [
  { day: 'Segunda', color: '#a8e063', textColor: '#0f2000', blocks: [
    { time: '08h~09h50', text: 'Matemática Discreta 1', type: 'aula' },
    { time: '10h~11h50', text: 'Cálculo 3', type: 'aula' },
    { time: '12h~13h50', text: 'Métodos de Desenv. Software', type: 'aula' },
    { time: '~14h~16h', text: 'Treino — Peito + Tríceps', type: 'treino' },
    { time: '17h~18h', text: 'Jiu-Jitsu 🥋', type: 'jj' },
    { time: 'Pós JJ', text: 'Jantar + Ceia', type: 'refeicao' },
  ]},
  { day: 'Terça', color: '#64b5f6', textColor: '#001a30', blocks: [
    { time: '10h~11h50', text: 'Cálculo 3', type: 'aula' },
    { time: '14h~15h50', text: 'Gestão da Produção e Qualidade', type: 'aula' },
    { time: '16h~17h50', text: 'Humanidades e Cidadania', type: 'aula' },
    { time: 'Manhã ou noite', text: 'Treino — Costas + Bíceps', type: 'treino' },
    { time: 'Pós aulas', text: 'Almoço tardio + Ceia', type: 'refeicao' },
  ]},
  { day: 'Quarta', color: '#ffb74d', textColor: '#2a1500', blocks: [
    { time: '08h~09h50', text: 'Matemática Discreta 1', type: 'aula' },
    { time: '12h~13h50', text: 'Métodos de Desenv. Software', type: 'aula' },
    { time: '14h~15h50', text: 'Teoria de Eletrônica Digital 1', type: 'aula' },
    { time: '~16h~16h45', text: 'Treino — Pernas', type: 'treino' },
    { time: '17h~18h', text: 'Jiu-Jitsu 🥋', type: 'jj' },
    { time: 'Pós JJ', text: 'Jantar + Ceia', type: 'refeicao' },
  ]},
  { day: 'Quinta', color: '#ce93d8', textColor: '#1a0025', blocks: [
    { time: '08h~09h50', text: 'Prática de Eletrônica Digital 1', type: 'aula' },
    { time: '10h~11h50', text: 'Cálculo 3', type: 'aula' },
    { time: '14h~15h50', text: 'Gestão da Produção e Qualidade', type: 'aula' },
    { time: '16h~17h50', text: 'Humanidades e Cidadania', type: 'aula' },
    { time: 'Noite', text: 'Treino — Peito + Tríceps A2', type: 'treino' },
    { time: 'Pós treino', text: 'Jantar + Ceia', type: 'refeicao' },
  ]},
  { day: 'Sexta', color: '#ef9a9a', textColor: '#2a0000', blocks: [
    { time: '14h~15h50', text: 'Teoria de Eletrônica Digital 1', type: 'aula' },
    { time: 'Manhã livre', text: 'Treino — Costas + Bíceps B2', type: 'treino' },
    { time: '17h~18h', text: 'Jiu-Jitsu 🥋', type: 'jj' },
    { time: 'Pós JJ', text: 'Jantar + Ceia', type: 'refeicao' },
  ]},
  { day: 'Sábado', color: '#80cbc4', textColor: '#001a18', blocks: [
    { time: 'Manhã', text: 'Treino — Ombros + Abdômen', type: 'treino' },
    { time: 'Almoço', text: 'Refeição normal ou livre 🎉', type: 'refeicao' },
    { time: 'Tarde/noite', text: 'Descanso e recuperação', type: 'descanso' },
  ]},
  { day: 'Domingo', color: '#888', textColor: '#111', blocks: [
    { time: 'Dia todo', text: 'Descanso total 😴', type: 'descanso' },
  ]},
];
 
const typeStyles = {
  aula:     'background:#1a1e28;border-left:3px solid #64b5f6',
  treino:   'background:#182518;border-left:3px solid #a8e063',
  jj:       'background:#281e0a;border-left:3px solid #ffb74d',
  refeicao: 'background:#1e1828;border-left:3px solid #ce93d8',
  descanso: 'background:#1a1a1a;border-left:3px solid #555',
};
 
const weekContainer = document.getElementById('week-days');
weekData.forEach(d => {
  const inner = d.blocks.map((b, i) => `
    <div style="${typeStyles[b.type]};padding:8px 13px;${i < d.blocks.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06)' : ''}; display:flex;gap:10px;align-items:flex-start">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--text3);min-width:76px;padding-top:2px;flex-shrink:0">${b.time}</div>
      <div style="font-size:12px;color:var(--text)">${b.text}</div>
    </div>`).join('');
  weekContainer.insertAdjacentHTML('beforeend', `
    <div class="week-day-card">
      <div class="week-day-header" style="background:${d.color};color:${d.textColor}">${d.day}</div>
      ${inner}
    </div>`);
});
 
// ── CHECKLIST ──
const checklistItems = [
  { id: 'cl_water', text: 'Beber 3~3,5L de água', sub: 'Use o contador na aba Água' },
  { id: 'cl_cafe', text: 'Café da manhã feito', sub: '' },
  { id: 'cl_lanche1', text: 'Lanche da manhã feito', sub: 'Levar para a faculdade' },
  { id: 'cl_almoco', text: 'Almoço feito', sub: '' },
  { id: 'cl_pre', text: 'Pré-treino feito', sub: '~45min antes' },
  { id: 'cl_treino', text: 'Treino concluído', sub: '' },
  { id: 'cl_jantar', text: 'Jantar feito', sub: '' },
  { id: 'cl_ceia', text: 'Ceia feita', sub: 'Iogurte + whey' },
  { id: 'cl_sono', text: '7h+ de sono planejado', sub: '' },
];
 
function buildChecklist() {
  const container = document.getElementById('checklist');
  container.innerHTML = '';
  checklistItems.forEach(item => {
    const ck = localStorage.getItem(item.id) === '1';
    const div = document.createElement('div');
    div.className = 'check-item' + (ck ? ' checked' : '');
    div.innerHTML = `
      <div class="ci-box" id="cibox-${item.id}"></div>
      <div style="flex:1">
        <div class="ci-text">${item.text}</div>
        ${item.sub ? `<div class="ci-sub">${item.sub}</div>` : ''}
      </div>`;
    div.addEventListener('click', () => {
      const current = localStorage.getItem(item.id) === '1';
      localStorage.setItem(item.id, current ? '0' : '1');
      buildChecklist();
      if (!current) {
        const done = checklistItems.filter(i => localStorage.getItem(i.id) === '1').length;
        if (done === checklistItems.length) showToast('🏆 Dia perfeito! Todos os itens completos!');
      }
    });
    container.appendChild(div);
  });
  const done = checklistItems.filter(i => localStorage.getItem(i.id) === '1').length;
  if (done > 0) {
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:11px;color:var(--text3);margin-top:6px;margin-bottom:12px';
    msg.textContent = `${done}/${checklistItems.length} itens completados hoje`;
    container.appendChild(msg);
  }
}
 
function resetChecklist() {
  checklistItems.forEach(i => localStorage.removeItem(i.id));
  buildChecklist();
  showToast('Checklist zerado');
}
 
buildChecklist();
 
// ── SERVICE WORKER (PWA) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registrado com sucesso'))
      .catch(err => console.log('SW falhou:', err));
  });
}