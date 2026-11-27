/* Fio-Mar Gestor — esq.js (2.54.0): porta de entrada do módulo Esquemas Elétricos.
   Fica sempre carregado (é pequeno):
   - item "Esquemas Elétricos" no menu e o ícone;
   - endereço #esquemas (abre o módulo direto pelo link);
   - telas esq (busca e lista), esqv (visualizador) e esqadm (cadastro do dono), que carregam
     o esquemas.js / esquemas-adm.js só na primeira vez que o módulo é aberto;
   - atalhos esqVeh(id) e esqOS(id) para o botão "Ver esquemas" do veículo e da O.S. */
(function (G) {
  'use strict';
  ICO.esq = '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>';
  PCOL.esq = '#E67E22';
  /* menu: logo antes do Estoque */
  if (!NAV.some((x) => x[0] == 'esq')) { const i = NAV.findIndex((x) => x[0] == 'stock'); NAV.splice(i < 0 ? NAV.length - 1 : i, 0, ['esq', 'Esquemas Elétricos']); }

  const TELAS = ['esq', 'esqv', 'esqadm'];
  const ARQ = { esq: 'esquemas.js', esqv: 'esquemas.js', esqadm: 'esquemas-adm.js' };
  const CARR = {};
  const js = (f) => CARR[f] = CARR[f] || new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = f + '?v=' + APP_VER; s.async = true;
    s.onload = ok; s.onerror = () => { delete CARR[f]; s.remove(); no(new Error('não carregou ' + f)) };
    document.head.appendChild(s);
  });
  /* o cadastro precisa das duas partes */
  G.esqCarrega = (tela) => js('esquemas.js').then(() => (tela == 'esqadm' ? js('esquemas-adm.js') : null));
  const pronto = (t) => window.ESQ && ESQ.V && typeof ESQ.V[t] == 'function';

  if (!document.getElementById('esq-css0')) {
    const st = document.createElement('style'); st.id = 'esq-css0';
    st.textContent = '.esq-osa{display:flex;flex-direction:column;align-items:flex-start;width:100%;min-height:52px;text-align:left;margin:0 0 6px;padding:8px 12px;font-size:16px}.esq-osa small{opacity:.75;font-size:14px}.esq-load{display:flex;align-items:center;gap:12px;font-size:16px;min-height:64px}.esq-spin{width:22px;height:22px;border-radius:50%;border:3px solid var(--ln);border-top-color:#E67E22;animation:esqgira .8s linear infinite;flex:none}@keyframes esqgira{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }
  let ERRO = '';
  TELAS.forEach((t) => {
    V[t] = function () {
      if (pronto(t)) return ESQ.V[t]();
      esqCarrega(t).then(() => { ERRO = ''; if (S.v == t) render() }).catch(() => { ERRO = t; if (S.v == t) render() });
      const h = head({ ico: 'esq', kick: 'Oficina', title: 'Esquemas Elétricos', c: PCOL.esq });
      if (ERRO == t) return h + `<div class="card"><p style="font-size:16px;margin:0 0 12px">Não foi possível abrir os esquemas agora. Confira a internet e tente de novo.</p><button type="button" class="pr" onclick="render()">Tentar de novo</button></div>`;
      return h + '<div class="card esq-load" role="status"><span class="esq-spin"></span>Abrindo os esquemas…</div>';
    };
  });

  /* 2.57: com o app parado, o módulo já carrega (a primeira abertura fica instantânea) */
  const cedo = () => { if (typeof SES != 'undefined' && SES && typeof OF != 'undefined' && OF) esqCarrega('esq').catch(() => {}) };
  setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(cedo, { timeout: 8000 }); else cedo() }, 4000);

  /* "Ver esquemas": abre o módulo já filtrado pelo carro (cv = veículo do cliente; os = O.S. de origem) */
  G.esqVeh = (vid) => go('esq', null, null, { cv: vid });
  G.esqOS = (oid) => { const o = od(oid); go('esq', null, null, { cv: (o && o.veh) || '', os: oid }) };

  /* ---------- integração com a gestão (etapa 7) ---------- */
  const raio = (st) => `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;vertical-align:-3px;${st || ''}">${ICO.esq}</svg>`;
  /* página do veículo: botão no topo */
  if (V.veiculo) { const _vv = V.veiculo; V.veiculo = function () { const h = _vv.apply(this, arguments); const v = typeof vh == 'function' && vh(S.id); if (!v || !v.id) return h;
    return h.replace('<div class="osh3">', `<div class="osh3"><button class="sm" onclick="esqVeh('${v.id}')">${raio()} Ver esquemas</button>`) } }
  /* O.S.: no ⋯ e, no Resumo, os esquemas anexados */
  if (typeof osMais == 'function') { const _om = osMais; G.osMais = osMais = function (id) { const r = _om.apply(this, arguments), l = document.querySelector('#modal .osml'), o = od(id);
    if (l && o) l.insertAdjacentHTML('afterbegin', `<button type="button" onclick="closeM();esqOS('${o.id}')">${svgi('esq')}<span>Ver esquemas elétricos</span></button>`); return r } }
  if (V.order) { const _vo = V.order; V.order = function () { const h = _vo.apply(this, arguments), o = od(S.id); const L = o && Array.isArray(o.esqs) ? o.esqs.filter((a) => a && a.id) : [];
    if (!o || !L.length || (S.tab || 'resumo') != 'resumo') return h;
    const card = `<div class="card esq-osx"><div style="display:flex;align-items:center;gap:8px;margin:0 0 8px"><b style="flex:1">${raio('color:#E67E22')} Esquemas anexados</b><button type="button" class="sm" onclick="esqOS('${o.id}')">Ver todos</button></div>${L.map((a) => `<button type="button" class="esq-osa" onclick="go('esqv','${a.id}',null,{os:'${o.id}'})"><b>${e(a.t || 'Esquema')}</b>${a.s ? `<small>${e(a.s)}</small>` : ''}</button>`).join('')}</div>`;
    return h.includes('<div class="card osass">') ? h.replace('<div class="card osass">', card + '<div class="card osass">') : h + card } }

  /* endereço #esquemas: abre o módulo; e o endereço acompanha a tela */
  const HASH = '#esquemas';
  const naTela = () => TELAS.includes(S.v);
  const _r = render;
  G.render = render = function () {
    const r = _r.apply(this, arguments);
    try {
      if (typeof SES != 'undefined' && SES) {
        if (naTela() && location.hash != HASH) history.replaceState(history.state, '', location.pathname + location.search + HASH);
        else if (!naTela() && location.hash == HASH) history.replaceState(history.state, '', location.pathname + location.search);
      }
    } catch (x) {}
    return r;
  };
  let PEDIU = location.hash == HASH;
  addEventListener('hashchange', () => { if (location.hash == HASH && typeof SES != 'undefined' && SES && !naTela()) go('esq') });
  /* veio pelo link: espera o login e a primeira tela */
  if (PEDIU) {
    let n = 0; const t = setInterval(() => {
      n++;
      if (typeof SES != 'undefined' && SES && typeof OF != 'undefined' && OF && document.querySelector('#main')) { clearInterval(t); PEDIU = false; if (!naTela()) go('esq') }
      else if (n > 120) clearInterval(t);
    }, 250);
  }
})(window);
