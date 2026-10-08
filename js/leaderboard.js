(function () {
  const LIST = document.getElementById('lb-list');

  // Quantos lugares pedem nome no game over (checa corte do Top 20)
  const RANK_LIMIT = 20;
  // Quantos itens exibir na HOME
  const DISPLAY_LIMIT = 5;

  // --------- Render Top 5 na HOME ---------
  async function fetchTopHome() {
    if (!window.sb || !LIST) return;
    const { data, error } = await sb
      .from('leaderboard')
      .select('name, score, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(DISPLAY_LIMIT); // <- só 5 na home

    if (error) { console.error(error); return; }

    LIST.innerHTML = (data && data.length ? data : []).map((r, i) =>
      `<li>
         <span class="pos rank-${i + 1}">${i + 1}º</span>
         <span class="name">${escapeHTML((r.name || '').trim()) || 'Anônimo'}</span>
         <span class="score">${Number(r.score || 0).toLocaleString('pt-BR')}</span>
       </li>`
    ).join('') || `<li><span class="pos">-</span> <span class="name">Sem registros</span> <span class="score">—</span></li>`;
  }

  // --------- Enviar score ----------
  async function submitScore(name, score) {
    name = (name || '').trim().slice(0, 20);
    if (!name) return;

    // Anti-spam simples: 1 envio a cada 30s
    const now = Date.now();
    const last = +localStorage.getItem('getfgv:lastSubmit') || 0;
    if (now - last < 30000) return;
    localStorage.setItem('getfgv:lastSubmit', String(now));

    score = Math.max(0, Math.min(parseInt(score || 0, 10), 5000000));

    try {
      const { error } = await sb.from('leaderboard').insert({ name, score });
      if (error) { console.error(error); return; }
      // Atualiza a lista da HOME, se existir
      if (LIST) fetchTopHome();
    } catch (e) { console.error(e); }
  }

  // --------- Checar corte Top 20 e pedir nome ----------
  async function promptAndMaybeSubmit(score) {
    if (!Number.isFinite(score) || score <= 0) return;

    try {
      const { data, error } = await sb
        .from('leaderboard')
        .select('score, created_at')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(RANK_LIMIT);

      if (error) throw error;

      const len = Array.isArray(data) ? data.length : 0;

      if (len < RANK_LIMIT) {
        askNameAndSubmit(score);
        return;
      }

      const twentieth = data[RANK_LIMIT - 1];
      const cutoff = Number(twentieth?.score ?? 0);

      if (score >= cutoff) {
        askNameAndSubmit(score);
      }
      // else: não entrou no Top 20, não pede nome
    } catch (e) {
      console.error('Falha ao checar Top 20; oferecendo envio:', e);
      askNameAndSubmit(score);
    }
  }

  function askNameAndSubmit(score) {
    const saved = localStorage.getItem('getfgv:name') || '';

    showNameModal(score, saved, (name) => {
      localStorage.setItem('getfgv:name', name.trim().slice(0, 20));
      submitScore(name, score);
    });
  }

  // Modal leve para pedir o nome (substitui window.prompt, que trava a página)
  function showNameModal(score, savedName, onConfirm) {
    const backdrop = document.createElement('div');
    backdrop.className = 'gfv-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'gfv-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'gfv-modal-title');

    const title = document.createElement('h3');
    title.id = 'gfv-modal-title';
    title.textContent = 'Você entrou no ranking!';

    const desc = document.createElement('p');
    desc.textContent = `Você fez ${score.toLocaleString('pt-BR')} pontos. Digite seu nome (ou apelido) para publicar no Leaderboard.`;

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Seu nome';
    input.value = savedName;

    const actions = document.createElement('div');
    actions.className = 'gfv-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-outline';
    cancelBtn.textContent = 'Agora não';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn';
    confirmBtn.textContent = 'Enviar';

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(input);
    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    input.focus();
    input.select();

    function close() {
      document.removeEventListener('keydown', onKeydown);
      backdrop.remove();
    }

    function confirm() {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      close();
      onConfirm(name);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') confirm();
    }

    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    cancelBtn.addEventListener('click', close);
    confirmBtn.addEventListener('click', confirm);
    document.addEventListener('keydown', onKeydown);
  }

  // Evento disparado pelo html_actuator.js quando o jogo termina
  window.addEventListener('getfgv:gameover', (ev) => {
    let score = 0;
    if (ev && ev.detail && Number.isFinite(ev.detail.score)) {
      score = ev.detail.score;
    } else {
      const el = document.querySelector('.score-container');
      if (el) score = parseInt(el.textContent.replace(/\D+/g, ''), 10) || 0;
    }
    promptAndMaybeSubmit(score);
  });

  document.addEventListener('DOMContentLoaded', fetchTopHome);

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
})();
