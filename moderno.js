/* Fio-Mar Gestor — moderno.js (2.44.0)
   Carregado por último (depois do oficina.js).
   1) "+ Novo" no meio da barra de baixo (as ações) e "Mais" (☰) no topo (as telas)
   6) cabeçalho único: no celular, o título da tela e o botão principal sobem para o topo
   8) Painel: os contadores viram uma linha fina
   9) Finanças pessoais nas cores da marca
   10) o Diagnóstico (diagnostico.js + ilustra.js) carrega depois da primeira tela
   11) passagem suave entre as telas e vibração curta ao concluir, entregar e receber */
(function (G) {
  const $q = (s) => document.querySelector(s);
  const ee = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sheetM = (tit, body) => { $q('#modal').innerHTML = `<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${ee(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>` };

  /* ---------- CSS ---------- */
  const st = document.createElement('style');
  st.textContent = `
/* 1) botão "+ Novo" redondo no meio da barra */
#bnav a.pl span.c{box-shadow:0 0 0 5px #17181A,0 6px 16px rgba(0,0,0,.45)}#bnav a.pl>span:last-child{color:var(--hi);font-weight:700}
.nvg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:4px}
.nvg button{display:grid;justify-items:center;align-content:center;gap:8px;min-height:96px;margin:0;padding:12px 6px;border-radius:14px;font-size:14px;font-weight:600;line-height:1.15;text-align:center}
.nvg button svg{width:30px;height:30px;fill:none;stroke:var(--hi);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.nvg button.pr{background:var(--hi);border-color:var(--hi);color:#17181A}.nvg button.pr svg{stroke:#17181A}
.nvs{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.nvs button{margin:0;min-height:40px;padding:6px 12px;font-size:14px}
/* ☰ Mais no topo */
nav .nbtn.pmenu{display:none}
/* 7) cartão do pátio: um botão + ⋯ */
.kca .kcm{flex:none;width:48px;min-width:48px;padding:0;font-size:20px;font-weight:800;letter-spacing:1px}
.kcml{display:grid;gap:8px}.kcml button{margin:0;min-height:48px;justify-content:flex-start;text-align:left;font-size:16px}
/* 8) Painel: contadores numa linha fina */
.dshl{display:block!important;margin:-4px 0 12px!important;font-size:14px;color:var(--mut);white-space:nowrap;overflow-x:auto;scrollbar-width:none}
.dshl::-webkit-scrollbar{display:none}
.dshl a{display:inline!important;min-height:0!important;padding:0!important;border:0!important;background:none!important;color:var(--ink)!important;font-weight:600!important;text-decoration:underline;text-decoration-color:var(--ln);text-underline-offset:3px;cursor:pointer}
.dshl i{display:inline!important;font-style:normal;margin:0 7px;color:var(--mut)}
/* 9) Finanças pessoais nas cores da marca */
.psbt{background:var(--sf,var(--card))!important;border:1px solid var(--ln)!important;color:var(--ink)!important;box-shadow:none!important}
.psbt svg{stroke:var(--hi)!important}.psbt small{color:var(--mut)!important}.psbt i{color:var(--hi)!important}
/* 11) passagem suave entre as telas */
@media (prefers-reduced-motion:no-preference){#main.vt{animation:vtin .18s ease-out}@keyframes vtin{from{opacity:.35;transform:translateY(6px)}to{opacity:1;transform:none}}}
/* 6) cabeçalho único no celular */
nav .tacs{display:none}
@media (max-width:760px){
 nav .nbtn.pmenu{display:inline-flex}
 nav .nbtn.pbus span,nav .nbtn.pmenu span{display:none!important}
 nav .nbtn.pbus,nav .nbtn.pmenu{width:40px;min-width:40px;padding:0;justify-content:center}
 nav .nb{padding:0 10px!important}
 nav .tacs{display:flex;gap:6px;align-items:center}
 nav .tacs .hb{margin:0;min-height:40px;padding:6px 10px;font-size:14px;white-space:nowrap}
 nav .tacs .hb.dot{width:40px;padding:0}
 nav .brand .bt.tt b{display:block;font-family:'Barlow Condensed',sans-serif;font-size:23px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 nav .brand .bt.tt small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 nav .nb{flex-wrap:nowrap!important;gap:8px}nav .brand{min-width:0;flex:1 1 0;gap:9px}nav .nbr{flex:none;gap:6px}nav .lg{width:34px;height:34px}
 nav .brand .bt{min-width:0;overflow:hidden}
 .pgh.pgh-top .osh1{display:none}
 .pgh.pgh-top{padding-top:8px}.pgh.pgh-top .osh1+.osh3,.pgh.pgh-top .osh1+.osh2{margin-top:0}
 .pgh.pgh-vazio{display:none}
}`;
  document.head.appendChild(st);

  /* ---------- 1) "+ Novo": as ações do dia a dia ---------- */
  const IC = {
    car: '<path d="M5 17h14M6 17v2M18 17v2M4 13l2-5h12l2 5v4H4z"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 13v5M9.5 15.5h5"/>',
    pay: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    desp: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    diag: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    orc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'
  };
  const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
  G.novoAcoes = function () {
    const dono = typeof DONO == 'function' && DONO();
    const A = [['car', 'Entrada do carro', "closeM();typeof checkin=='function'?checkin():newOS()", 1], ['cal', 'Agendar', 'closeM();editAg()'],
      ['pay', 'Receber', "closeM();go(V.receber?'receber':'orders',0,0,V.receber?{}:{st:'receber'})"],
      dono ? ['desp', 'Despesa', "closeM();go('fin');editDesp()"] : ['orc', 'Orçamento', "closeM();go('quotes');editQuote()"],
      ['diag', 'Diagnóstico', "closeM();abreDG(()=>{go('diag');DG.novo()})"], dono ? ['orc', 'Orçamento', "closeM();go('quotes');editQuote()"] : null].filter(Boolean);
    const B = [['Cliente', 'closeM();editClient()'], ['Veículo', 'closeM();editVeh()'], ...(typeof pdNovo == 'function' ? [['Pedido de peças', 'closeM();pdNovo()']] : [])];
    sheetM('Novo', `<div class="nvg">${A.map(([k, l, f, p]) => `<button type="button" class="${p ? 'pr' : ''}" onclick="${f}">${ic(k)}<span>${l}</span></button>`).join('')}</div>
     <div class="nvs">${B.map(([l, f]) => `<button type="button" onclick="${f}">+ ${l}</button>`).join('')}</div>`)
  };

  /* ☰ Mais (topo): o menu de antes sem a parte "Novo" (que foi para o + Novo); continuam Tema, Sair e a versão */
  if (typeof maisAcoes == 'function') {
    const _ma = maisAcoes;
    G.maisAcoes = maisAcoes = function () {
      const r = _ma.apply(this, arguments), m = $q('#modal .psh');
      if (m) { const h = m.querySelector('.psh-h h2'); if (h) h.textContent = 'Mais'; const ps = [...m.querySelectorAll('.psec')]; const nv = ps.find((x) => /^novo$/i.test(x.textContent.trim()));
        if (nv) { const g = nv.nextElementSibling; if (g && g.classList.contains('pgrid')) g.remove(); nv.remove() } const ir = ps.find((x) => /ir para/i.test(x.textContent)); if (ir) ir.remove() }
      return r
    }
  }

  /* ---------- 10) Diagnóstico carregado depois ---------- */
  let DGP = null;
  const carrega = (src) => new Promise((ok, er) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = er; document.body.appendChild(s) });
  G.carregaDG = function () {
    if (G.DG) return Promise.resolve();
    if (!DGP) DGP = carrega('ilustra.js').then(() => carrega('diagnostico.js')).catch((x) => { DGP = null; throw x });
    return DGP
  };
  /* abre algo do Diagnóstico mesmo se ainda não carregou */
  G.abreDG = function (fn) { if (G.DG) return fn(); toast('Abrindo o Diagnóstico...'); G.carregaDG().then(fn).catch(() => toast('Não deu para abrir o Diagnóstico. Confira a internet.')) };
  const precisaDG = () => typeof S != 'undefined' && (S.v == 'diag' || (S.v == 'order' && S.tab == 'diag'));
  /* sem internet o app abre da cópia guardada; carregar logo depois da primeira tela */
  const cedo = () => { if (!G.DG) G.carregaDG().then(() => { if (precisaDG()) render(1) }).catch(() => {}) };
  if ('requestIdleCallback' in window) requestIdleCallback(cedo, { timeout: 1500 }); else setTimeout(cedo, 600);

  /* ---------- 6) cabeçalho único ---------- */
  function topo() {
    const n = $q('#nav'); if (!n) return; const bt = n.querySelector('.brand .bt'), nbr = n.querySelector('.nbr'); if (!bt || !nbr) return;
    let box = n.querySelector('.tacs'); if (!box) { box = document.createElement('div'); box.className = 'tacs'; nbr.appendChild(box) }
    const ph = $q('#main .osh.pgh'), h = ph && ph.querySelector('.osh1 .osh-t h1');
    /* só nas telas principais (cabeçalho com ícone); telas com "voltar" ficam como estão */
    if (ph && h && ph.querySelector('.osh1 > .pic')) {
      const sm = ph.querySelector('.osh-t small');
      const tit = S.v == 'dash' ? 'Painel' : h.textContent;
      bt.classList.add('tt'); bt.innerHTML = `<b>${ee(tit)}</b><small>${ee(sm ? sm.textContent : '')}</small>`;
      box.innerHTML = '';
      ph.querySelectorAll('.osh1 > .hb').forEach((b) => { if (S.v == 'dash' && /Entrada do carro/.test(b.textContent)) return; const c = b.cloneNode(true); if (/^\+ Diagnosticar$/.test(c.textContent.trim())) c.textContent = '+ Novo'; box.appendChild(c) });
      ph.classList.add('pgh-top'); ph.classList.toggle('pgh-vazio', !ph.querySelector('.osh2,.osh3'));
    } else { bt.classList.remove('tt'); bt.innerHTML = '<b>Fio-Mar</b><small>Gestor de oficina</small>'; box.innerHTML = '' }
  }

  /* ---------- render: Diagnóstico sob demanda, cabeçalho, passagem suave ---------- */
  let ANTV = '';
  const _r = render;
  G.render = render = function () {
    if (precisaDG() && !G.DG && typeof SES != 'undefined' && SES) G.carregaDG().then(() => render(1)).catch(() => toast('Não deu para abrir o Diagnóstico. Confira a internet.'));
    const x = _r.apply(this, arguments);
    try { topo() } catch (e) {}
    try {
      const m = $q('#main'); const v = typeof S != 'undefined' ? S.v + '|' + (S.id || '') : '';
      if (m && v != ANTV && ANTV) { m.classList.remove('vt'); void m.offsetWidth; m.classList.add('vt') }
      ANTV = v
    } catch (e) {}
    return x
  };

  /* ---------- 11) vibração curta ---------- */
  const vib = () => { try { if (navigator.vibrate) navigator.vibrate(18) } catch (e) {} };
  if (typeof setSt == 'function') { const _s = setSt; G.setSt = setSt = function (v) { const r = _s.apply(this, arguments); if (['Concluída', 'Entregue'].includes(v)) vib(); return r } }
  if (typeof recebeOk == 'function') { const _k = recebeOk; G.recebeOk = recebeOk = function () { const antes = (db.orders || []).reduce((a, x) => a + (x.pags || []).length, 0); const r = _k.apply(this, arguments); if ((db.orders || []).reduce((a, x) => a + (x.pags || []).length, 0) > antes) vib(); return r } }

  /* primeira tela já com o cabeçalho novo */
  try { if (typeof SES != 'undefined' && SES) render(1) } catch (e) {}
})(window);
