/* Fio-Mar Gestor — esquemas-adm.js (2.54.0): cadastro do módulo Esquemas Elétricos (só o dono)
   Carros (marca, modelo, anos, motor), esquemas com arquivo (PDF, PNG, JPG ou SVG, até 25 MB),
   conectores e pinos, fusíveis e relés, sistemas próprios.
   O banco confere de novo (RLS): só o dono da oficina grava. Apagar acontece na hora, com Desfazer. */
(function (G) {
  'use strict';
  const $q = (s) => document.querySelector(s);
  const { cat, marca, modelo, veic, sist, esqm, anos, vNome, vSub, natural, res, online, msgErro, sheet, meu } = ESQ.q;
  const C = ESQ.C;
  const LIM = 25 * 1048576;
  const KC = () => 'esq:cat:' + OF;
  const salvaCat = () => { C.em = Date.now(); IDB.set(KC(), { ...cat(), em: C.em }) };
  const COMB = ['', 'Flex', 'Gasolina', 'Etanol', 'Diesel', 'GNV', 'Híbrido', 'Elétrico'];
  const AMP = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 80, 100];
  const erroTxt = (z) => { const m = String((z && z.message) || z || ''); if (/row-level security|42501|permission/i.test(m)) return 'Só o dono da oficina pode cadastrar.'; if (/duplicate|23505/i.test(m)) return 'Já existe um cadastro igual.'; if (/exceeded|too large|size/i.test(m)) return 'Arquivo maior que 25 MB.'; if (/mime|not supported/i.test(m)) return 'Tipo de arquivo não aceito. Use PDF, PNG, JPG ou SVG.'; return msgErro(z) };
  const falhou = (z, o) => toast((o || 'Não salvou') + ': ' + erroTxt(z), 'erro');
  const precisaNet = () => { if (online()) return false; toast('Sem internet: o cadastro precisa de conexão.', 'erro'); return true };
  const tira = (L, id) => { const i = L.findIndex((x) => x.id == id); if (i >= 0) L.splice(i, 1); return i };
  const troca = (L, r) => { const i = L.findIndex((x) => x.id == r.id); if (i >= 0) L[i] = r; else L.push(r) };

  /* ---------- formulários ---------- */
  const campo = (n, l, v, o = {}) => `<label>${l}${o.area ? `<textarea name="${n}" ${o.req ? 'required' : ''} maxlength="${o.max || 2000}" ${o.ph ? `placeholder="${e(o.ph)}"` : ''}>${e(v == null ? '' : v)}</textarea>`
    : o.sel ? `<select name="${n}" ${o.req ? 'required' : ''}>${o.sel.map(([k, t]) => `<option value="${e(k)}" ${String(v == null ? '' : v) == String(k) ? 'selected' : ''}>${e(t)}</option>`).join('')}</select>`
    : `<input name="${n}" value="${e(v == null ? '' : v)}" ${o.req ? 'required' : ''} ${o.im ? `inputmode="${o.im}"` : ''} ${o.list ? `list="${o.list}"` : ''} ${o.ph ? `placeholder="${e(o.ph)}"` : ''} autocomplete="off" maxlength="${o.max || 200}">`}</label>`;
  const lista = (id, L) => `<datalist id="${id}">${[...new Set(L.filter(Boolean))].sort(natural).map((x) => `<option value="${e(x)}">`).join('')}</datalist>`;
  const fsheet = (tit, corpo, acao, extra) => sheet(tit, `<form class="esq-form esq-af" novalidate onsubmit="event.preventDefault();${acao}(this,event.submitter)">${corpo}<div class="bar" style="margin-top:14px">${extra || ''}<span class="sp"></span><button type="button" class="esq-bt" onclick="closeM()">Cancelar</button><button class="pr esq-bt" value="ok">Salvar</button></div></form>`);
  const ocupa = (form, t) => { const b = [...form.querySelectorAll('button')].filter((x) => x.type != 'button'); b.forEach((x) => { x.disabled = true; x.dataset.t = x.dataset.t || x.textContent }); const p = form.querySelector('button.pr'); if (p) p.textContent = t || 'Salvando…'; return () => b.forEach((x) => { x.disabled = false; x.textContent = x.dataset.t }) };
  const txt = (f, n) => String((f[n] && f[n].value) || '').trim();
  const num = (f, n) => { const v = txt(f, n).replace(',', '.'); return v === '' ? null : +v };

  if (!$q('#esq-css-adm')) {
    const st = document.createElement('style'); st.id = 'esq-css-adm';
    st.textContent = `.esq-af label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:15px;margin:0 0 10px}
.esq-af input,.esq-af select,.esq-af textarea{min-height:48px;font-size:16px;width:100%}
.esq-af .dois{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.esq-af .dois label{margin:0 0 10px}
.esq-siglas{display:flex;flex-wrap:wrap;gap:6px;margin:-4px 0 10px}
.esq-siglas button{min-height:44px;min-width:56px;padding:0 10px;display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:15px}
.esq-seg2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 10px}
.esq-seg2 button{min-height:48px;font-size:16px}.esq-seg2 button.on{background:#E67E22;color:#fff;border-color:#E67E22}
.esq-arq{border:2px dashed var(--ln);border-radius:14px;padding:14px;margin:0 0 12px;font-size:16px}
.esq-arq input[type=file]{margin-top:8px;min-height:48px;font-size:16px;width:100%}
.esq-row{display:flex;align-items:center;gap:10px;min-height:56px;padding:8px 0;border-top:1px solid var(--ln);font-size:16px}
.esq-row .tx{flex:1;min-width:0;overflow-wrap:anywhere}.esq-row small{display:block;opacity:.8;font-size:14px}
.esq-row .esq-bt{min-width:48px}
.esq-prog{height:8px;border-radius:4px;background:var(--ln);overflow:hidden;margin:8px 0}.esq-prog i{display:block;height:100%;width:0;background:#E67E22;transition:width .3s}
@media (max-width:360px){.esq-af .dois{grid-template-columns:1fr}}`;
    document.head.appendChild(st);
  }

  /* ---------- tela do cadastro ---------- */
  const topo = (t, back) => head({ back: back || "go('esq')", kick: 'Esquemas Elétricos', title: t, c: PCOL.esq });
  ESQ.V.esqadm = function () {
    if (!DONO()) return topo('Cadastro') + '<div class="esq-msg" role="alert">Só o dono da oficina pode cadastrar esquemas.</div>';
    if (!C.cat && !C.erro) { ESQ.carregaCat(); return topo('Cadastro') + '<div class="card esq-load" role="status"><span class="esq-spin"></span>Carregando…</div>' }
    if (!C.cat) return topo('Cadastro') + `<div class="esq-msg erro" role="alert">Não deu para carregar. ${e(C.erro)}<div class="bar"><button type="button" class="pr esq-bt" onclick="ESQ.C.erro='';ESQ.carregaCat(1)">Tentar de novo</button></div></div>`;
    const f = S.f || {};
    if (C.velha) return topo('Cadastro') + '<div class="esq-msg" role="alert">Sem internet: o cadastro precisa de conexão. Você ainda pode ver os esquemas baixados.</div>';
    carregaImp().catch(() => {});
    if (f.imp) { if (!ESQ.telaImp) { carregaImp().then(() => { if (S.v == 'esqadm') render() }).catch(() => {}); return topo('Importar pacote') + '<div class="card esq-load"><span class="esq-spin"></span>Abrindo o importador…</div>' } return ESQ.telaImp(topo) }
    if (f.ed || f.novo) return telaEsq(f);
    if (f.car) return telaCarro(f);
    const aba = f.aba || 'esq';
    const seg = [['esq', 'Esquemas', cat().esquemas.length], ['car', 'Carros', cat().veiculos.length], ['sis', 'Sistemas', '']];
    let h = topo('Cadastro') + `<div class="esq-box"><div class="esq-seg" role="tablist">${seg.map(([k, l, n]) => `<button type="button" role="tab" class="${aba == k ? 'on' : ''}" aria-selected="${aba == k}" onclick="S.f={aba:'${k}'};render()">${l}${n !== '' ? ` (${n})` : ''}</button>`).join('')}</div>`;
    if (aba == 'car') h += abaCarros();
    else if (aba == 'sis') h += abaSis();
    else h += abaEsq();
    return h + '</div>';
  };

  function abaEsq() {
    const L = cat().esquemas.slice().sort((a, b) => natural(vNome(veic(a.veiculo_id)), vNome(veic(b.veiculo_id))) || natural(a.titulo, b.titulo));
    return `<div class="bar" style="margin:0 0 12px"><button type="button" class="pr esq-bt" onclick="go('esqadm',null,null,{novo:1})">+ Enviar esquema</button><button type="button" class="esq-bt" onclick="esqImp()">Importar pacote (.zip)</button></div>` +
      (L.length ? `<div class="esq-lista">${L.map((x) => `<button type="button" class="esq-it" onclick="go('esqadm',null,null,{ed:'${x.id}'})"><span class="esq-th" data-esqmin="${x.id}">${svgi('esq')}</span><span class="esq-tx"><b>${e(x.titulo)}</b><small>${e([sist(x.sistema_id).nome, vNome(veic(x.veiculo_id))].filter(Boolean).join(' · '))}</small>${x.arquivo_path ? '' : '<small style="color:#B4472E">Sem arquivo</small>'}</span></button>`).join('')}</div>`
        : '<div class="esq-msg">Nenhum esquema ainda. Cadastre o carro e envie o arquivo (PDF, foto ou SVG).</div>') + agendaMin();
  }
  const agendaMin = () => { setTimeout(() => { try { ESQ.miniaturas && ESQ.miniaturas() } catch (z) {} }, 0); return '' };
  function abaCarros() {
    const cont = {}; cat().esquemas.forEach((x) => { cont[x.veiculo_id] = (cont[x.veiculo_id] || 0) + 1 });
    const VS = cat().veiculos.slice().sort((a, b) => natural(vNome(a), vNome(b)));
    return `<div class="bar" style="margin:0 0 12px"><button type="button" class="pr esq-bt" onclick="esqCarro()">+ Carro</button></div>` +
      (VS.length ? `<div class="esq-lista">${VS.map((v) => `<button type="button" class="esq-it" style="min-height:60px" onclick="go('esqadm',null,null,{car:'${v.id}'})"><span class="esq-th">${svgi('vehicles')}</span><span class="esq-tx"><b>${e(vNome(v))}</b><small>${e([vSub(v), plural(cont[v.id] || 0, 'esquema', 'esquemas')].filter(Boolean).join(' · '))}</small></span></button>`).join('')}</div>`
        : '<div class="esq-msg">Nenhum carro cadastrado.</div>');
  }
  function abaSis() {
    const S0 = cat().sistemas.slice().sort((a, b) => (a.ordem || 100) - (b.ordem || 100) || natural(a.nome, b.nome)), uso = {};
    cat().esquemas.forEach((x) => { uso[x.sistema_id] = (uso[x.sistema_id] || 0) + 1 });
    return `<p class="muted" style="font-size:15px;margin:0 0 10px">Os sistemas padrão valem para todas as oficinas. Você pode criar outros só para a sua.</p>
      <div class="bar" style="margin:0 0 12px"><button type="button" class="pr esq-bt" onclick="esqSis()">+ Sistema</button></div>` +
      S0.map((s) => `<div class="esq-row"><span class="tx"><b>${e(s.nome)}</b><small>${s.oficina_id ? 'Da oficina' : 'Padrão'} · ${plural(uso[s.id] || 0, 'esquema', 'esquemas')}</small></span>${s.oficina_id ? `<button type="button" class="esq-bt" onclick="esqSis('${s.id}')">Editar</button>` : ''}</div>`).join('');
  }

  /* ---------- importar pacote .zip (esquemas-imp.js, carregado junto com o cadastro) ---------- */
  let IMP = null;
  const carregaImp = () => IMP = IMP || new Promise((ok, no) => { if (ESQ.telaImp) return ok(); const s = document.createElement('script'); s.src = 'esquemas-imp.js?v=' + APP_VER; s.onload = ok; s.onerror = () => { IMP = null; no(new Error('não carregou')) }; document.head.appendChild(s) });
  G.esqImp = function () { if (typeof esqImpEscolhe == 'function') return esqImpEscolhe(); carregaImp().then(() => esqImpEscolhe()).catch(() => toast('Não deu para abrir o importador. Confira a internet.', 'erro')) };

  /* ---------- carro (marca → modelo → anos, motor, versão) ---------- */
  G.esqCarro = function (id, depois) {
    const v = id ? veic(id) : null, m = v ? modelo(v.modelo_id) : {}, mk = m.marca_id ? marca(m.marca_id) : {};
    ESQ._depoisCarro = depois || null;
    fsheet(v ? 'Editar carro' : 'Novo carro',
      `${lista('esq-dl-ma', cat().marcas.map((x) => x.nome))}${lista('esq-dl-mo', cat().modelos.map((x) => x.nome))}
      ${campo('ma', 'Marca', mk.nome, { req: 1, list: 'esq-dl-ma', ph: 'Ex.: Volkswagen' })}
      ${campo('mo', 'Modelo', m.nome, { req: 1, list: 'esq-dl-mo', ph: 'Ex.: Gol' })}
      <div class="dois">${campo('a1', 'Ano inicial', v && v.ano_inicio, { im: 'numeric', ph: 'Ex.: 2009', max: 4 })}${campo('a2', 'Ano final', v && v.ano_fim, { im: 'numeric', ph: 'Vazio = até hoje', max: 4 })}</div>
      <div class="dois">${campo('mt', 'Motor', v && v.motor, { ph: 'Ex.: 1.0 8V' })}${campo('cb', 'Combustível', v && v.combustivel, { sel: COMB.map((c) => [c, c || '—']) })}</div>
      ${campo('vs', 'Versão', v && v.versao, { ph: 'Ex.: LT, Trendline (opcional)' })}
      <input type="hidden" name="id" value="${e(id || '')}">`,
      'esqCarroSalva', v ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqCarroDel('${v.id}')">Apagar</button>` : '');
  };
  async function achaMarca(nome) {
    const n = nrm(nome); let x = cat().marcas.find((m) => nrm(m.nome) == n);
    if (!x) { x = await res(SB.from('esq_marcas').insert({ oficina_id: OF, nome }).select().single()); cat().marcas.push(x) }
    return x;
  }
  async function achaModelo(ma, nome) {
    const n = nrm(nome); let x = cat().modelos.find((m) => m.marca_id == ma.id && nrm(m.nome) == n);
    if (!x) { x = await res(SB.from('esq_modelos').insert({ oficina_id: OF, marca_id: ma.id, nome }).select().single()); cat().modelos.push(x) }
    return x;
  }
  G.esqCarroSalva = async function (form) {
    const ma = txt(form, 'ma'), mo = txt(form, 'mo'), a1 = num(form, 'a1'), a2 = num(form, 'a2'), id = txt(form, 'id');
    if (!ma) { form.ma.focus(); return toast('Informe a marca') } if (!mo) { form.mo.focus(); return toast('Informe o modelo') }
    const ano = (a) => a == null || (Number.isInteger(a) && a >= 1950 && a <= 2100);
    if (!ano(a1) || !ano(a2)) return toast('Ano inválido. Use 4 números, ex.: 2012');
    if (a1 && a2 && a2 < a1) return toast('O ano final é antes do inicial');
    if (precisaNet()) return; const volta = ocupa(form);
    try {
      const M = await achaMarca(ma), MO = await achaModelo(M, mo);
      const row = { oficina_id: OF, modelo_id: MO.id, ano_inicio: a1, ano_fim: a2, motor: txt(form, 'mt') || null, combustivel: txt(form, 'cb') || null, versao: txt(form, 'vs') || null };
      const ant = id && veic(id);
      const r = id ? await res(SB.from('esq_veiculos').update(row).eq('id', id).select().single()) : await res(SB.from('esq_veiculos').insert(row).select().single());
      if (!r) throw new Error('row-level security');
      troca(cat().veiculos, r); salvaCat();
      if (ant && ant.modelo_id != r.modelo_id) await limpaVazios(ant.modelo_id);
      closeM(1); toast(id ? 'Carro salvo' : 'Carro cadastrado: ' + vNome(r));
      const dp = ESQ._depoisCarro; ESQ._depoisCarro = null;
      if (dp) dp(r.id); else render();
    } catch (z) { volta(); falhou(z) }
  };
  /* modelo e marca sem carro nenhum saem do catálogo */
  async function limpaVazios(moid) {
    try {
      if (!cat().veiculos.some((v) => v.modelo_id == moid)) { const mo = modelo(moid); await res(SB.from('esq_modelos').delete().eq('id', moid)); tira(cat().modelos, moid);
        if (mo.marca_id && !cat().modelos.some((m) => m.marca_id == mo.marca_id)) { await res(SB.from('esq_marcas').delete().eq('id', mo.marca_id)); tira(cat().marcas, mo.marca_id) } }
      salvaCat();
    } catch (z) {}
  }
  G.esqCarroDel = async function (id) {
    const v = veic(id); if (!v) return;
    const ne = cat().esquemas.filter((x) => x.veiculo_id == id).length;
    if (ne) return toast('Este carro tem ' + plural(ne, 'esquema', 'esquemas') + '. Apague ou mude os esquemas de carro antes.', 'erro');
    if (precisaNet()) return;
    try {
      const fus = await res(SB.from('esq_fusiveis').select('*').eq('veiculo_id', id));
      const mo = modelo(v.modelo_id), ma = marca(mo.marca_id);
      await res(SB.from('esq_veiculos').delete().eq('id', id)); tira(cat().veiculos, id); delete C.fus[id];
      await limpaVazios(v.modelo_id); closeM(1); S.f = { aba: 'car' }; render();
      desfazCom('Carro apagado: ' + vNome({ ...v }), async () => {
        try {
          if (!cat().marcas.some((x) => x.id == ma.id)) { await res(SB.from('esq_marcas').insert(ma)); cat().marcas.push(ma) }
          if (!cat().modelos.some((x) => x.id == mo.id)) { await res(SB.from('esq_modelos').insert(mo)); cat().modelos.push(mo) }
          await res(SB.from('esq_veiculos').insert(v)); cat().veiculos.push(v);
          if (fus && fus.length) await res(SB.from('esq_fusiveis').insert(fus));
          salvaCat(); render();
        } catch (z) { falhou(z, 'Não deu para desfazer') }
      });
    } catch (z) { falhou(z, 'Não apagou') }
  };

  /* ---------- página do carro: dados e fusíveis/relés ---------- */
  function telaCarro(f) {
    const v = veic(f.car); if (!v) return topo('Carro', "go('esqadm',null,null,{aba:'car'})") + '<div class="esq-msg">Carro não encontrado.</div>';
    const L = C.fus[v.id];
    if (!L) ESQ.carregaFus(v.id);
    const cx = {}; (L || []).forEach((x) => { const k = x.caixa || 'Sem caixa'; (cx[k] = cx[k] || []).push(x) });
    const ne = cat().esquemas.filter((x) => x.veiculo_id == v.id).length;
    return topo(e(vNome(v)), "go('esqadm',null,null,{aba:'car'})") + `<div class="esq-box">
      <div class="esq-vcard">${svgi('vehicles')}<span style="flex:1"><b>${e(vNome(v))}</b><small>${e(vSub(v))}</small></span><button type="button" class="esq-bt" onclick="esqCarro('${v.id}')">Editar</button></div>
      <div class="bar" style="margin:0 0 6px"><button type="button" class="esq-bt" onclick="go('esqadm',null,null,{novo:1,vv:'${v.id}'})">+ Esquema deste carro</button><button type="button" class="esq-bt" onclick="go('esq',null,null,{vv:'${v.id}'})">Ver ${plural(ne, 'esquema', 'esquemas')}</button></div>
      <div class="esq-h"><h2>Fusíveis e relés</h2><small>${L ? L.length : ''}</small></div>
      <div class="bar" style="margin:0 0 10px"><button type="button" class="pr esq-bt" onclick="esqFus('${v.id}')">+ Fusível ou relé</button></div>
      ${!L ? '<div class="card esq-load"><span class="esq-spin"></span>Carregando…</div>' : !L.length ? '<div class="esq-msg">Nenhum fusível ou relé cadastrado.</div>' :
        Object.keys(cx).sort(natural).map((k) => `<div class="esq-cx"><h3>${e(k)}</h3>${cx[k].map((x) => x.localizacao_caixa).find(Boolean) ? `<div class="muted" style="font-size:15px">${e(cx[k].map((x) => x.localizacao_caixa).find(Boolean))}</div>` : ''}${cx[k].sort((a, b) => natural(a.posicao, b.posicao)).map((x) => `<div class="esq-row"><span class="tx"><b>${e(x.posicao || '—')}</b> ${x.tipo == 'rele' ? '<span class="esq-rl">Relé</span>' : ''}${e(x.circuito || '')}<small>${x.amperagem ? String(x.amperagem).replace('.', ',') + ' A' : ''}</small></span><button type="button" class="esq-bt" onclick="esqFus('${v.id}','${x.id}')">Editar</button></div>`).join('')}</div>`).join('')}
    </div>`;
  }
  G.esqFus = function (vid, id, pre) {
    const x = id ? (C.fus[vid] || []).find((z) => z.id == id) : null, p = pre || {}, tipo = x ? x.tipo : p.tipo || 'fusivel';
    const caixas = (C.fus[vid] || []).map((z) => z.caixa), locs = (C.fus[vid] || []).map((z) => z.localizacao_caixa);
    const amp = x ? x.amperagem : null;
    fsheet(x ? 'Editar ' + (tipo == 'rele' ? 'relé' : 'fusível') : 'Fusível ou relé',
      `${lista('esq-dl-cx', caixas)}${lista('esq-dl-lc', locs)}
      <div class="esq-seg2" role="group" aria-label="Tipo"><button type="button" class="${tipo == 'fusivel' ? 'on' : ''}" aria-pressed="${tipo == 'fusivel'}" onclick="esqFusTipo(this,'fusivel')">Fusível</button><button type="button" class="${tipo == 'rele' ? 'on' : ''}" aria-pressed="${tipo == 'rele'}" onclick="esqFusTipo(this,'rele')">Relé</button></div>
      <input type="hidden" name="tp" value="${tipo}">
      <div class="dois">${campo('cx', 'Caixa', x ? x.caixa : p.cx, { list: 'esq-dl-cx', ph: 'Ex.: Caixa do motor' })}${campo('po', 'Posição', x ? x.posicao : '', { ph: 'Ex.: F7, R3', req: 1, max: 20 })}</div>
      ${campo('lc', 'Onde fica a caixa', x ? x.localizacao_caixa : p.lc, { list: 'esq-dl-lc', ph: 'Ex.: ao lado da bateria' })}
      <label class="esq-amp" ${tipo == 'rele' ? 'hidden' : ''}>Amperagem<select name="am"><option value="">—</option>${AMP.map((a) => `<option value="${a}" ${+amp == a ? 'selected' : ''}>${String(a).replace('.', ',')} A</option>`).join('')}${amp && !AMP.includes(+amp) ? `<option value="${amp}" selected>${amp} A</option>` : ''}</select></label>
      ${campo('ci', 'Circuito protegido / comandado', x ? x.circuito : '', { ph: 'Ex.: bomba de combustível' })}
      <input type="hidden" name="vid" value="${vid}"><input type="hidden" name="id" value="${e(id || '')}">`,
      'esqFusSalva', (x ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqFusDel('${vid}','${x.id}')">Apagar</button>` : `<button class="esq-bt" value="mais">Salvar e outro</button>`));
  };
  G.esqFusTipo = function (b, t) { const f = b.closest('form'); f.tp.value = t; b.parentNode.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x == b); x.setAttribute('aria-pressed', x == b) }); const a = f.querySelector('.esq-amp'); if (a) a.hidden = t == 'rele' };
  G.esqFusSalva = async function (form, sub) {
    const vid = txt(form, 'vid'), id = txt(form, 'id'), po = txt(form, 'po');
    if (!po) { form.po.focus(); return toast('Informe a posição (ex.: F7)') }
    if (precisaNet()) return; const volta = ocupa(form);
    const row = { oficina_id: OF, veiculo_id: vid, tipo: txt(form, 'tp') == 'rele' ? 'rele' : 'fusivel', caixa: txt(form, 'cx') || null, localizacao_caixa: txt(form, 'lc') || null, posicao: po, amperagem: txt(form, 'tp') == 'rele' ? null : num(form, 'am'), circuito: txt(form, 'ci') || null };
    try {
      const r = id ? await res(SB.from('esq_fusiveis').update(row).eq('id', id).select().single()) : await res(SB.from('esq_fusiveis').insert(row).select().single());
      if (!r) throw new Error('row-level security');
      const L = C.fus[vid] = C.fus[vid] || []; troca(L, r); IDB.set('esq:fus:' + vid, L);
      toast((r.tipo == 'rele' ? 'Relé ' : 'Fusível ') + r.posicao + ' salvo');
      if (sub && sub.value == 'mais') { closeM(1); render(); esqFus(vid, null, { tipo: r.tipo, cx: r.caixa, lc: r.localizacao_caixa }); setTimeout(() => { const i = $q('#modal [name=po]'); if (i) i.focus() }, 60) }
      else { closeM(1); render() }
    } catch (z) { volta(); falhou(z) }
  };
  G.esqFusDel = async function (vid, id) {
    const L = C.fus[vid] || [], x = L.find((z) => z.id == id); if (!x || precisaNet()) return;
    try {
      await res(SB.from('esq_fusiveis').delete().eq('id', id)); const i = tira(L, id); IDB.set('esq:fus:' + vid, L); closeM(1); render();
      desfazCom((x.tipo == 'rele' ? 'Relé ' : 'Fusível ') + (x.posicao || '') + ' apagado', async () => { try { await res(SB.from('esq_fusiveis').insert(x)); L.splice(Math.min(i, L.length), 0, x); IDB.set('esq:fus:' + vid, L); render() } catch (z) { falhou(z, 'Não deu para desfazer') } });
    } catch (z) { falhou(z, 'Não apagou') }
  };

  /* ---------- sistemas da oficina ---------- */
  G.esqSis = function (id) {
    const s = id ? sist(id) : null;
    fsheet(s ? 'Editar sistema' : 'Novo sistema', campo('nm', 'Nome do sistema', s && s.nome, { req: 1, ph: 'Ex.: Tração 4x4' }) + `<input type="hidden" name="id" value="${e(id || '')}">`,
      'esqSisSalva', s ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqSisDel('${s.id}')">Apagar</button>` : '');
  };
  G.esqSisSalva = async function (form) {
    const nm = txt(form, 'nm'), id = txt(form, 'id'); if (!nm) return toast('Informe o nome');
    if (cat().sistemas.some((s) => s.id != id && nrm(s.nome) == nrm(nm))) return toast('Já existe um sistema com esse nome');
    if (precisaNet()) return; const volta = ocupa(form);
    try {
      const r = id ? await res(SB.from('esq_sistemas').update({ nome: nm }).eq('id', id).select().single()) : await res(SB.from('esq_sistemas').insert({ oficina_id: OF, nome: nm, ordem: 500 }).select().single());
      if (!r) throw new Error('row-level security');
      troca(cat().sistemas, r); salvaCat(); closeM(1); render(); toast('Sistema salvo');
    } catch (z) { volta(); falhou(z) }
  };
  G.esqSisDel = async function (id) {
    const s = sist(id), n = cat().esquemas.filter((x) => x.sistema_id == id).length;
    if (n) return toast('Este sistema tem ' + plural(n, 'esquema', 'esquemas') + '. Mude os esquemas de sistema antes.', 'erro');
    if (precisaNet()) return;
    try { await res(SB.from('esq_sistemas').delete().eq('id', id)); tira(cat().sistemas, id); salvaCat(); closeM(1); render();
      desfazCom('Sistema apagado: ' + s.nome, async () => { try { await res(SB.from('esq_sistemas').insert(s)); cat().sistemas.push(s); salvaCat(); render() } catch (z) { falhou(z, 'Não deu para desfazer') } });
    } catch (z) { falhou(z, 'Não apagou') }
  };

  /* ---------- esquema: dados, arquivo, conectores e pinos ---------- */
  const TIPOS = { 'application/pdf': ['pdf', 'pdf'], 'image/png': ['imagem', 'png'], 'image/jpeg': ['imagem', 'jpg'], 'image/svg+xml': ['svg', 'svg'] };
  const EXT = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };
  const tipoDe = (file) => { const t = TIPOS[file.type] ? file.type : EXT[String(file.name || '').split('.').pop().toLowerCase()]; return t ? { mime: t, tipo: TIPOS[t][0], ext: TIPOS[t][1] } : null };
  ESQ.tipoDe = tipoDe;
  function telaEsq(f) {
    const x = f.ed ? esqm(f.ed) : null;
    if (f.ed && !x) return topo('Esquema', "go('esqadm')") + '<div class="esq-msg">Esquema não encontrado.</div>';
    const vv = x ? x.veiculo_id : f.vv || '', VS = cat().veiculos.slice().sort((a, b) => natural(vNome(a), vNome(b)));
    const SS = cat().sistemas.slice().sort((a, b) => (a.ordem || 100) - (b.ordem || 100) || natural(a.nome, b.nome));
    const aba = f.aba || 'dados';
    const corpo = !x || aba == 'dados' ? `<form class="esq-form esq-af" id="esq-fe" novalidate onsubmit="event.preventDefault();esqEsqSalva(this)">
        <label>Carro<select name="vv" required onchange="if(this.value=='+'){this.value='${e(vv)}';esqCarro(null,esqCarroNoForm)}"><option value="">Escolha o carro</option>${VS.map((v) => `<option value="${v.id}" ${vv == v.id ? 'selected' : ''}>${e(vNome(v) + (v.ano_inicio ? ' (' + anos(v) + ')' : ''))}</option>`).join('')}<option value="+">+ Cadastrar carro novo…</option></select></label>
        ${campo('si', 'Sistema', x ? x.sistema_id : (f.si || ''), { req: 1, sel: [['', 'Escolha o sistema'], ...SS.map((s) => [s.id, s.nome])] })}
        ${campo('ti', 'Título', x && x.titulo, { req: 1, ph: 'Ex.: Injeção eletrônica completa' })}
        ${campo('de', 'Descrição (opcional)', x && x.descricao, { area: 1, ph: 'Ex.: de onde veio, observações' })}
        ${campo('tg', 'Etiquetas (separe por vírgula)', x && (x.tags || []).join(', '), { ph: 'Ex.: bico, sonda, bomba' })}
        <div class="esq-arq"><b>Arquivo</b><br>${x && x.arquivo_path ? `<span>Atual: ${e({ pdf: 'PDF', imagem: 'Imagem', svg: 'SVG' }[x.tipo] || 'arquivo')}${x.tipo == 'pdf' ? ' · ' + plural(x.paginas || 1, 'página', 'páginas') : ''}. Escolha outro só se quiser trocar.</span>` : '<span>PDF, foto (PNG ou JPG) ou SVG, até 25 MB. Pode tirar foto de um esquema em papel.</span>'}
          <input type="file" name="arq" accept=".pdf,.png,.jpg,.jpeg,.svg,application/pdf,image/png,image/jpeg,image/svg+xml" aria-label="Arquivo do esquema" onchange="esqArqVer(this)"><div id="esq-arqinfo" class="muted" style="font-size:15px;margin-top:6px"></div><div class="esq-prog" id="esq-prog" hidden><i></i></div></div>
        <div class="bar">${x ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqEsqDel('${x.id}')">Apagar esquema</button>` : ''}<span class="sp"></span><button class="pr esq-bt">${x ? 'Salvar' : 'Salvar e enviar'}</button></div>
      </form>` : painelCon(x);
    return topo(x ? 'Editar esquema' : 'Enviar esquema', x ? "go('esqadm')" : (f.vv ? `go('esqadm',null,null,{car:'${f.vv}'})` : "go('esqadm')")) + `<div class="esq-box">
      ${x ? `<div class="esq-seg" role="tablist" style="grid-template-columns:1fr 1fr">${[['dados', 'Dados e arquivo'], ['con', 'Conectores e pinos']].map(([k, l]) => `<button type="button" role="tab" class="${aba == k ? 'on' : ''}" aria-selected="${aba == k}" onclick="S.f={...S.f,aba:'${k}'};render()">${l}</button>`).join('')}</div>
        <div class="bar" style="margin:0 0 10px"><button type="button" class="esq-bt" onclick="go('esqv','${x.id}')">Abrir o esquema</button></div>` : ''}
      ${corpo}</div>`;
  }
  /* carro novo cadastrado no meio do formulário: entra na lista sem apagar o que já foi digitado */
  G.esqCarroNoForm = function (id) {
    const sel = $q('#esq-fe [name=vv]'), v = veic(id); if (!sel || !v) return render();
    const o = new Option(vNome(v) + (v.ano_inicio ? ' (' + anos(v) + ')' : ''), id, true, true); sel.insertBefore(o, sel.lastElementChild); sel.value = id; S.f = { ...S.f, vv: id };
  };
  G.esqArqVer = function (inp) {
    const fl = inp.files && inp.files[0], info = $q('#esq-arqinfo'); if (!info) return;
    if (!fl) { info.textContent = ''; return }
    const t = tipoDe(fl), mb = (fl.size / 1048576).toFixed(1).replace('.', ',');
    info.innerHTML = !t ? '<b style="color:#B4472E">Tipo não aceito. Use PDF, PNG, JPG ou SVG.</b>' : fl.size > LIM ? `<b style="color:#B4472E">Arquivo com ${mb} MB: o limite é 25 MB.</b>` : `${e(fl.name)} · ${mb} MB`;
    const ti = inp.form && inp.form.ti; if (ti && !ti.value.trim() && t) ti.value = String(fl.name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 120);
  };
  const prog = (p) => { const b = $q('#esq-prog'); if (!b) return; b.hidden = p == null; const i = b.querySelector('i'); if (i) i.style.width = Math.round((p || 0) * 100) + '%' };
  /* miniatura (JPG pequeno) e número de páginas */
  async function preparaMin(blob, t) {
    const larg = 360, cv = document.createElement('canvas'); let paginas = 1;
    if (t.tipo == 'pdf') {
      const doc = await ESQ.abrePdf(new Uint8Array(await blob.arrayBuffer()));
      paginas = doc.numPages; const pg = await doc.getPage(1), v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: larg / v1.width });
      cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; try { doc.destroy() } catch (z) {}
    } else {
      const u = URL.createObjectURL(blob); try {
        const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('A imagem não abriu. O arquivo pode estar com defeito.')); i.src = u });
        const nw = im.naturalWidth || 1200, nh = im.naturalHeight || 900; cv.width = larg; cv.height = Math.round((nh * larg) / nw);
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
      } finally { URL.revokeObjectURL(u) }
    }
    const min = await new Promise((ok) => cv.toBlob((b) => ok(b), 'image/jpeg', 0.78));
    return { min, paginas };
  }
  ESQ.preparaMin = preparaMin;
  ESQ.adm = { achaMarca, achaModelo, salvaCat };
  G.esqEsqSalva = async function (form) {
    const f = S.f || {}, x = f.ed ? esqm(f.ed) : null;
    const vv = form.vv.value, si = form.si.value, ti = txt(form, 'ti'), fl = form.arq.files && form.arq.files[0];
    if (!vv || vv == '+') { form.vv.focus(); return toast('Escolha o carro') }
    if (!si) { form.si.focus(); return toast('Escolha o sistema') }
    if (!ti) { form.ti.focus(); return toast('Escreva o título') }
    const t = fl ? tipoDe(fl) : null;
    if (fl && !t) return toast('Tipo de arquivo não aceito. Use PDF, PNG, JPG ou SVG.', 'erro');
    if (fl && fl.size > LIM) return toast('O arquivo passa de 25 MB. Diminua ou divida o PDF.', 'erro');
    if (!x && !fl) { form.arq.focus(); return toast('Escolha o arquivo do esquema') }
    if (precisaNet()) return; const volta = ocupa(form);
    const row = { oficina_id: OF, veiculo_id: vv, sistema_id: si, titulo: ti, descricao: txt(form, 'de') || null, tags: txt(form, 'tg').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30) };
    let r = x;
    try {
      r = x ? await res(SB.from('esq_esquemas').update(row).eq('id', x.id).select().single()) : await res(SB.from('esq_esquemas').insert(row).select().single());
      if (!r) throw new Error('row-level security');
      troca(cat().esquemas, r); salvaCat();
      if (fl) {
        const b = form.querySelector('button.pr'); if (b) b.textContent = 'Preparando o arquivo…'; prog(0.15);
        let mi = null; try { mi = await preparaMin(fl, t) } catch (z) { if (t.tipo != 'pdf') throw z; throw new Error('O PDF não abriu. Ele pode estar com senha ou com defeito.') }
        if (b) b.textContent = 'Enviando…'; prog(0.35);
        const marca2 = Date.now().toString(36), arq = `${OF}/${r.id}-${marca2}.${t.ext}`, minp = `${OF}/${r.id}-${marca2}-min.jpg`;
        const st = SB.storage.from('esquemas');
        const up1 = await st.upload(arq, fl, { contentType: t.mime, upsert: true, cacheControl: '3600' }); if (up1.error) throw up1.error; prog(0.8);
        let mp = null; if (mi && mi.min) { const up2 = await st.upload(minp, mi.min, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' }); if (!up2.error) mp = minp }
        const velhos = [r.arquivo_path, r.miniatura_path].filter(Boolean);
        r = await res(SB.from('esq_esquemas').update({ arquivo_path: arq, miniatura_path: mp, tipo: t.tipo, paginas: (mi && mi.paginas) || 1 }).eq('id', r.id).select().single());
        troca(cat().esquemas, r); salvaCat(); prog(1);
        if (velhos.length) st.remove(velhos).catch(() => {});
        /* o arquivo mudou: a cópia antiga deste aparelho sai */
        delete C.blob[r.id]; delete C.thumb[r.id]; if (C.off[r.id]) { delete C.off[r.id]; IDB.del('esq:arq:' + r.id); IDB.set('esq:off:' + OF, C.off) }
        if (ESQ.VW.id == r.id) ESQ.VW.id = null;
      }
      toast(x ? 'Esquema salvo' : 'Esquema enviado');
      go('esqadm', null, null, { ed: r.id, aba: x ? 'dados' : 'con' });
    } catch (z) {
      volta(); prog(null); falhou(z, x || !r ? 'Não salvou' : 'O esquema foi salvo, mas o arquivo não subiu');
      if (!x && r && r.id) { S.f = { ed: r.id }; render() }
    }
  };
  G.esqEsqDel = async function (id) {
    const x = esqm(id); if (!x || precisaNet()) return;
    try {
      const con = await res(SB.from('esq_conectores').select('*').eq('esquema_id', id));
      const pin = con.length ? await res(SB.from('esq_pinos').select('*').in('conector_id', con.map((c) => c.id))) : [];
      const fav = await res(SB.from('esq_favoritos').select('*').eq('esquema_id', id)).catch(() => []);
      const not = await res(SB.from('esq_anotacoes').select('*').eq('esquema_id', id)).catch(() => []);
      await res(SB.from('esq_esquemas').delete().eq('id', id)); const i = tira(cat().esquemas, id); salvaCat();
      const offA = C.off[id] ? await IDB.get('esq:arq:' + id) : null, offI = C.off[id];
      if (C.off[id]) { delete C.off[id]; IDB.del('esq:arq:' + id); IDB.set('esq:off:' + OF, C.off) }
      C.fav.delete(id);
      /* o arquivo só sai do servidor depois do tempo do Desfazer */
      let volta = false; const T = setTimeout(() => { if (!volta) SB.storage.from('esquemas').remove([x.arquivo_path, x.miniatura_path].filter(Boolean)).catch(() => {}) }, 9000);
      go('esqadm');
      desfazCom('Esquema apagado: ' + x.titulo, async () => {
        volta = true; clearTimeout(T);
        try {
          await res(SB.from('esq_esquemas').insert({ ...x }));
          if (con.length) await res(SB.from('esq_conectores').insert(con)); if (pin.length) await res(SB.from('esq_pinos').insert(pin));
          if (fav && fav.length) await res(SB.from('esq_favoritos').insert(fav)).catch(() => {}); if (not && not.length) await res(SB.from('esq_anotacoes').insert(not)).catch(() => {});
          cat().esquemas.splice(Math.min(i, cat().esquemas.length), 0, x); salvaCat(); if ((fav || []).some((z) => z.user_id == meu())) C.fav.add(id);
          if (offA) { await IDB.set('esq:arq:' + id, offA); C.off[id] = offI; IDB.set('esq:off:' + OF, C.off) }
          render();
        } catch (z) { falhou(z, 'Não deu para desfazer') }
      });
    } catch (z) { falhou(z, 'Não apagou') }
  };

  /* conectores e pinos */
  function painelCon(x) {
    const d = C.det[x.id];
    if (!d) { ESQ.carregaDet(x.id); return '<div class="card esq-load"><span class="esq-spin"></span>Carregando…</div>' }
    return `<div class="bar" style="margin:0 0 10px"><button type="button" class="pr esq-bt" onclick="esqCon('${x.id}')">+ Conector</button></div>` +
      (d.con.length ? d.con.map((c) => { const P = d.pin[c.id] || [];
        return `<div class="esq-con"><div style="display:flex;align-items:flex-start;gap:8px"><div style="flex:1;min-width:0"><h3>${e(c.codigo)}${c.nome ? ' · ' + e(c.nome) : ''}</h3>${c.localizacao ? `<div class="esq-loc">${e(c.localizacao)}</div>` : ''}</div><button type="button" class="esq-bt" onclick="esqCon('${x.id}','${c.id}')">Editar</button></div>
          ${P.map((p) => `<div class="esq-row"><span class="esq-pino" style="border:0;padding:0;grid-template-columns:52px 1fr;flex:1"><span class="n">${e(p.numero)}</span><span>${ESQ.q.corFio(p.cor_fio)}</span><span class="f">${e(p.funcao || '—')}</span><span class="v">${e(p.valor_esperado || '')}</span></span><button type="button" class="esq-bt" onclick="esqPino('${x.id}','${c.id}','${p.id}')">Editar</button></div>`).join('')}
          <div class="bar" style="margin-top:8px"><button type="button" class="esq-bt" onclick="esqPino('${x.id}','${c.id}')">+ Pino</button></div></div>` }).join('')
        : '<div class="esq-msg">Nenhum conector ainda. Cadastre o conector (ex.: C1, conector do módulo) e depois os pinos.</div>');
  }
  G.esqCon = function (eid, cid) {
    const d = C.det[eid] || { con: [] }, c = cid ? d.con.find((z) => z.id == cid) : null;
    fsheet(c ? 'Editar conector' : 'Novo conector', `${campo('co', 'Código', c && c.codigo, { req: 1, ph: 'Ex.: C1, X12', max: 40 })}${campo('nm', 'Nome', c && c.nome, { ph: 'Ex.: conector do módulo de injeção' })}${campo('lc', 'Onde fica', c && c.localizacao, { ph: 'Ex.: atrás da bateria' })}<input type="hidden" name="eid" value="${eid}"><input type="hidden" name="id" value="${e(cid || '')}">`,
      'esqConSalva', c ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqConDel('${eid}','${c.id}')">Apagar</button>` : '');
  };
  G.esqConSalva = async function (form) {
    const eid = txt(form, 'eid'), id = txt(form, 'id'), co = txt(form, 'co'); if (!co) { form.co.focus(); return toast('Informe o código do conector') }
    if (precisaNet()) return; const volta = ocupa(form);
    const row = { oficina_id: OF, esquema_id: eid, codigo: co, nome: txt(form, 'nm') || null, localizacao: txt(form, 'lc') || null };
    try {
      const r = id ? await res(SB.from('esq_conectores').update(row).eq('id', id).select().single()) : await res(SB.from('esq_conectores').insert(row).select().single());
      if (!r) throw new Error('row-level security');
      const d = C.det[eid] = C.det[eid] || { con: [], pin: {} }; troca(d.con, r); d.con.sort((a, b) => natural(a.codigo, b.codigo)); IDB.set('esq:det:' + eid, d);
      closeM(1); render(); toast('Conector ' + r.codigo + ' salvo'); if (!id) setTimeout(() => esqPino(eid, r.id), 120);
    } catch (z) { volta(); falhou(z) }
  };
  G.esqConDel = async function (eid, cid) {
    const d = C.det[eid], c = d && d.con.find((z) => z.id == cid); if (!c || precisaNet()) return; const P = (d.pin[cid] || []).slice();
    try {
      await res(SB.from('esq_conectores').delete().eq('id', cid)); const i = tira(d.con, cid); delete d.pin[cid]; IDB.set('esq:det:' + eid, d); closeM(1); render();
      desfazCom('Conector ' + c.codigo + ' apagado' + (P.length ? ' (com ' + plural(P.length, 'pino', 'pinos') + ')' : ''), async () => { try { await res(SB.from('esq_conectores').insert(c)); if (P.length) await res(SB.from('esq_pinos').insert(P)); d.con.splice(Math.min(i, d.con.length), 0, c); d.pin[cid] = P; IDB.set('esq:det:' + eid, d); render() } catch (z) { falhou(z, 'Não deu para desfazer') } });
    } catch (z) { falhou(z, 'Não apagou') }
  };
  const proxNum = (L) => { const ns = L.map((p) => parseInt(p.numero)).filter((n) => !isNaN(n)); return ns.length ? String(Math.max(...ns) + 1) : '1' };
  G.esqPino = function (eid, cid, pid) {
    const d = C.det[eid] || { pin: {} }, L = d.pin[cid] || [], p = pid ? L.find((z) => z.id == pid) : null, c = (d.con || []).find((z) => z.id == cid) || {};
    fsheet((p ? 'Editar pino' : 'Novo pino') + (c.codigo ? ' · ' + e(c.codigo) : ''), `
      <div class="dois">${campo('nu', 'Número do pino', p ? p.numero : proxNum(L), { req: 1, im: 'numeric', max: 10 })}${campo('cf', 'Cor do fio', p && p.cor_fio, { ph: 'Ex.: VM/BR', max: 20 })}</div>
      <div class="esq-siglas" role="group" aria-label="Escolher a cor">${Object.keys(ESQ.q.CORES).map((k) => `<button type="button" onclick="esqSigla(this,'${k}')" aria-label="${ESQ.q.CORES[k][0]}"><span class="esq-fio liso" style="--a:${ESQ.q.CORES[k][1]};width:18px"></span>${k}</button>`).join('')}<button type="button" onclick="esqSigla(this,'/')" aria-label="Listra">/ listra</button><button type="button" onclick="esqSigla(this,'')" aria-label="Limpar a cor">Limpar</button></div>
      ${campo('fu', 'Função', p && p.funcao, { ph: 'Ex.: alimentação 12V pós-chave' })}
      ${campo('ve', 'Valor esperado', p && p.valor_esperado, { ph: 'Ex.: 12 V com a chave ligada; 600 a 1.200 Ω' })}
      <input type="hidden" name="eid" value="${eid}"><input type="hidden" name="cid" value="${cid}"><input type="hidden" name="id" value="${e(pid || '')}">`,
      'esqPinoSalva', p ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqPinoDel('${eid}','${cid}','${p.id}')">Apagar</button>` : `<button class="esq-bt" value="mais">Salvar e próximo</button>`);
  };
  /* toca as siglas para montar a cor: VM, depois "/", depois BR = VM/BR */
  G.esqSigla = function (b, k) { const i = b.closest('form').cf; if (!k) i.value = ''; else if (k == '/') { if (i.value && !i.value.includes('/')) i.value += '/' } else i.value = /\/$/.test(i.value) ? i.value + k : k; i.dispatchEvent(new Event('input', { bubbles: true })) };
  G.esqPinoSalva = async function (form, sub) {
    const eid = txt(form, 'eid'), cid = txt(form, 'cid'), id = txt(form, 'id'), nu = txt(form, 'nu'); if (!nu) { form.nu.focus(); return toast('Informe o número do pino') }
    const d = C.det[eid] = C.det[eid] || { con: [], pin: {} }, L = d.pin[cid] = d.pin[cid] || [];
    if (L.some((p) => p.id != id && String(p.numero).trim().toLowerCase() == nu.toLowerCase())) { form.nu.focus(); return toast('Já existe o pino ' + nu + ' neste conector') }
    if (precisaNet()) return; const volta = ocupa(form);
    const row = { oficina_id: OF, conector_id: cid, numero: nu, cor_fio: txt(form, 'cf').toUpperCase() || null, funcao: txt(form, 'fu') || null, valor_esperado: txt(form, 've') || null };
    try {
      const r = id ? await res(SB.from('esq_pinos').update(row).eq('id', id).select().single()) : await res(SB.from('esq_pinos').insert(row).select().single());
      if (!r) throw new Error('row-level security');
      troca(L, r); L.sort((a, b) => natural(a.numero, b.numero)); IDB.set('esq:det:' + eid, d); toast('Pino ' + r.numero + ' salvo');
      closeM(1); render(); if (sub && sub.value == 'mais') { esqPino(eid, cid); setTimeout(() => { const i = $q('#modal [name=cf]'); if (i) i.focus() }, 60) }
    } catch (z) { volta(); falhou(z) }
  };
  G.esqPinoDel = async function (eid, cid, pid) {
    const d = C.det[eid], L = d && d.pin[cid], p = L && L.find((z) => z.id == pid); if (!p || precisaNet()) return;
    try { await res(SB.from('esq_pinos').delete().eq('id', pid)); const i = tira(L, pid); IDB.set('esq:det:' + eid, d); closeM(1); render();
      desfazCom('Pino ' + p.numero + ' apagado', async () => { try { await res(SB.from('esq_pinos').insert(p)); L.splice(Math.min(i, L.length), 0, p); IDB.set('esq:det:' + eid, d); render() } catch (z) { falhou(z, 'Não deu para desfazer') } });
    } catch (z) { falhou(z, 'Não apagou') }
  };
})(window);
