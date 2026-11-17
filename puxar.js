/* Fio-Mar Gestor — puxar a tela para baixo para atualizar
   Funciona em qualquer tela (fora de formulários abertos): puxe do topo e solte.
   Atualiza os dados da nuvem, procura versão nova do app e redesenha a tela. */
(function () {
  const G = window;
  const LIM = 70, MAX = 110;
  let y0 = 0, x0 = 0, dy = 0, ativo = false, puxando = false, ocupado = false;

  const css = document.createElement('style');
  css.textContent = `
#ptr{position:fixed;left:50%;top:0;z-index:60;width:44px;height:44px;margin-left:-22px;border-radius:50%;background:var(--sf);border:1px solid var(--ln);box-shadow:0 4px 14px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;transform:translateY(-60px);opacity:0;pointer-events:none;transition:transform .2s,opacity .2s}
#ptr svg{width:22px;height:22px;fill:none;stroke:var(--mut);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
#ptr.pronto svg{stroke:var(--ac,#F5B700)}#ptr.pronto{border-color:var(--ac,#F5B700)}
#ptr.gira svg{stroke:var(--ac,#F5B700);animation:ptrg .8s linear infinite}
#ptr.mexe{transition:none}
#ptrt{position:fixed;left:50%;top:0;transform:translateX(-50%);z-index:59;white-space:nowrap;font-size:14px;font-weight:600;color:var(--ink);background:var(--sf);border:1px solid var(--ln);border-radius:999px;padding:5px 14px;box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none;opacity:0;transition:opacity .2s}
@keyframes ptrg{to{transform:rotate(360deg)}}`;
  document.head.appendChild(css);

  const el = document.createElement('div'); el.id = 'ptr'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
  const tx = document.createElement('div'); tx.id = 'ptrt';
  const poe = () => { if (!el.isConnected) document.body.appendChild(el); if (!tx.isConnected) document.body.appendChild(tx) };

  const topo = () => { const h = document.querySelector('#nav'); const b = h ? h.getBoundingClientRect().bottom : 0; return Math.max(8, Math.min(b, 140)) };
  const pode = t => {
    if (ocupado) return false;
    if ((window.scrollY || document.documentElement.scrollTop || 0) > 2) return false;
    const m = document.getElementById('modal'); if (m && m.innerHTML.trim()) return false;
    if (document.body.classList.contains('kbopen')) return false;
    if (document.querySelector('.vzov, .vz-ov, #vzp:not([hidden]), .psh, .sh.on')) return false;
    if (t && t.closest && t.closest('input,textarea,select,[contenteditable],#vzfab,.cbl,.md,.sh,.psh,canvas,video,[data-noptr]')) return false;
    /* dentro de uma caixa que rola para baixo e não está no topo */
    for (let n = t; n && n !== document.body; n = n.parentElement) { if (n.scrollHeight > n.clientHeight + 4 && n.scrollTop > 0 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return false }
    return true
  };
  const mostra = d => {
    poe(); const p = Math.min(d, MAX), y = topo() - 50 + p;
    el.classList.add('mexe'); el.style.transform = `translateY(${y}px) rotate(${p * 3}deg)`; el.style.opacity = Math.min(1, p / 40);
    el.classList.toggle('pronto', p >= LIM);
    tx.style.top = (y + 54) + 'px'; tx.style.opacity = p > 30 ? 1 : 0; tx.textContent = p >= LIM ? 'Solte para atualizar' : 'Puxe para atualizar'
  };
  const esconde = () => { el.classList.remove('mexe', 'pronto', 'gira'); el.style.transform = 'translateY(-60px)'; el.style.opacity = 0; tx.style.opacity = 0 };

  document.addEventListener('touchstart', ev => {
    if (ev.touches.length != 1 || !pode(ev.target)) { ativo = false; return }
    ativo = true; puxando = false; dy = 0; y0 = ev.touches[0].clientY; x0 = ev.touches[0].clientX
  }, { passive: true });

  document.addEventListener('touchmove', ev => {
    if (!ativo) return;
    const t = ev.touches[0], d = t.clientY - y0, dx = Math.abs(t.clientX - x0);
    if (!puxando) {
      if (d > 8 && d > dx * 1.3 && (window.scrollY || 0) <= 2) puxando = true;
      else if (d < -4 || dx > 12) { ativo = false; return } else return
    }
    dy = Math.max(0, d) * 0.5;
    if (ev.cancelable) ev.preventDefault();
    mostra(dy)
  }, { passive: false });

  const fim = () => {
    if (!ativo) return; ativo = false;
    if (!puxando) return; puxando = false;
    if (dy >= LIM) atualiza(); else esconde()
  };
  document.addEventListener('touchend', fim, { passive: true });
  document.addEventListener('touchcancel', () => { ativo = puxando = false; esconde() }, { passive: true });

  const espera = (p, ms) => Promise.race([Promise.resolve(p).catch(() => { }), new Promise(r => setTimeout(r, ms))]);

  async function atualiza() {
    if (ocupado) return; ocupado = true;
    poe(); el.classList.remove('mexe', 'pronto'); el.classList.add('gira');
    el.style.transform = `translateY(${topo() + 10}px)`; el.style.opacity = 1;
    tx.style.top = (topo() + 64) + 'px'; tx.textContent = 'Atualizando...'; tx.style.opacity = 1;
    let msg = 'Tudo atualizado', tipo = 'ok';
    try {
      /* 1) versão nova do app: se houver, o app recarrega sozinho */
      const sw = navigator.serviceWorker && await espera(navigator.serviceWorker.getRegistration(), 3000);
      if (sw) await espera(sw.update(), 6000);
      if (!navigator.onLine) { msg = 'Sem internet: mostrando o que está salvo no aparelho'; tipo = 'av' }
      else if (typeof SB != 'undefined' && SB && typeof SES != 'undefined' && SES && typeof OF != 'undefined' && OF) {
        /* 2) manda o que ainda não subiu e 3) busca o que mudou na nuvem */
        if (typeof DIRTY != 'undefined' && DIRTY && typeof push == 'function') { try { if (typeof TS != 'undefined') clearTimeout(TS) } catch (x) { } await espera(push(), 8000) }
        if (typeof DIRTY == 'undefined' || !DIRTY) await espera(pull(1), 10000);
        else { msg = 'Ainda enviando suas mudanças. Tente de novo em instantes'; tipo = 'av' }
      }
      if (sw && (sw.installing || sw.waiting)) { msg = 'Versão nova encontrada: atualizando o app...'; tipo = 'in' }
      if (typeof render == 'function') render(1);
    } catch (x) { msg = 'Não deu para atualizar agora. Confira a internet'; tipo = 'erro' }
    setTimeout(() => { esconde(); ocupado = false; if (typeof toast == 'function') toast(msg, tipo) }, 350)
  }
  G.ptrAtualiza = atualiza;
})();
