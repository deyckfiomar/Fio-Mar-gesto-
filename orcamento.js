/* Fio-Mar Gestor — orcamento.js (2.45.0): orçamento mais rápido
   busca única (placa, nome ou telefone), adicionar único, quantidade e valor na linha, mão de obra por hora,
   salvar sozinho, "Enviar ao cliente", aprovar depois de enviar, lucro previsto (só o dono). */
(function (G) {
  const $q = (s) => document.querySelector(s);
  const ee = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nn = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const sheetM = (tit, body) => { $q('#modal').innerHTML = `<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${ee(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>` };

  const st = document.createElement('style');
  st.textContent = `
.qbus label{display:block;font-weight:700;margin:0 0 6px}.qbus input{width:100%}#qbr{display:grid;gap:6px;margin-top:8px}
#qbr button{display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left;margin:0;min-height:52px;padding:8px 12px}
#qbr button small{display:block;color:var(--mut);font-weight:400}#qbr .qbn{border-style:dashed}
.qtroca{font:inherit;font-size:13px;margin-left:6px;padding:2px 8px;min-height:0;border-radius:99px;vertical-align:middle}
.qveh{display:flex;gap:8px;align-items:center;margin:0 0 10px}.qveh select{flex:1;margin:0}.qveh .sm{margin:0;flex:none}
details.qmore{margin:0 0 10px}details.qmore>summary{cursor:pointer;color:var(--mut);font-weight:600;min-height:36px;display:flex;align-items:center;list-style:none}details.qmore>summary::-webkit-details-marker{display:none}
details.qmore[open]>summary{color:var(--ink)}
.qits{display:grid;gap:0}.qit{padding:10px 0;border-bottom:1px solid var(--ln);display:grid;gap:6px}.qit:last-child{border-bottom:0}
.qid{cursor:pointer;display:grid}.qid b{font-size:16px}.qid small{font-size:12.5px}
.qir{display:flex;align-items:center;gap:8px}.qiq{display:inline-flex;align-items:center;border:1px solid var(--ln);border-radius:10px;overflow:hidden}
.qiq button{margin:0;min-height:38px;width:38px;padding:0;border:0;border-radius:0;font-size:18px;font-weight:700}.qiq b{min-width:28px;text-align:center}
.qiv{display:inline-flex;align-items:center;gap:4px;margin:0;color:var(--mut);font-size:13px}.qiv input{width:82px;margin:0;min-height:38px;padding:4px 8px;text-align:right}
.qit-t{margin-left:auto;white-space:nowrap}.qrm{margin:0;min-height:38px;width:38px;padding:0}
.oaadd{width:100%;margin:12px 0 4px}
.qdlink{margin:6px 0 0;min-height:36px;padding:4px 12px;font-size:14px}
.qluc{display:flex;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px dashed var(--ln);font-size:14px;color:var(--mut)}.qluc b{color:#3fb06f}
.qbar .qenv{flex:1}.qbar .qdots{width:48px;min-width:48px;padding:0;font-size:20px;font-weight:800}
.qsalvo{margin:-4px 0 8px;text-align:right;font-size:12.5px;color:var(--mut)}
.qml{display:grid;gap:8px}.qml button{margin:0;min-height:48px;justify-content:flex-start;text-align:left;font-size:16px}
.qml label{display:flex;align-items:center;gap:8px;font-size:15px}.qml label input{width:70px;margin:0}`;
  document.head.appendChild(st);

  /* ---------- 1) busca única: placa, nome ou telefone ---------- */
  G.qBusca = function (v) {
    const b = $q('#qbr'); if (!b) return; const t = nn(v).trim(), d = t.replace(/\D/g, ''), pl = t.replace(/[^a-z0-9]/g, '');
    if (t.length < 2) { b.innerHTML = ''; return }
    const V = db.vehicles.filter((x) => (pl.length >= 3 && nn(x.placa).replace(/[^a-z0-9]/g, '').includes(pl)) || nn(x.modelo).includes(t)).slice(0, 5);
    const C = db.clients.filter((c) => nn(c.nome).includes(t) || (d.length >= 4 && String(c.tel || '').replace(/\D/g, '').includes(d)) || (d.length >= 6 && String(c.doc || c.cpf || '').replace(/\D/g, '').includes(d))).slice(0, 5);
    b.innerHTML = V.map((x) => `<button type="button" onclick="qPick('${x.cli}','${x.id}')">${typeof plc == 'function' ? plc(x) : ''}<span><b>${ee(x.modelo || 'Veículo')}</b><small>${ee(cl(x.cli).nome || 'Sem cliente')}</small></span></button>`).join('') +
      C.filter((c) => !V.some((x) => x.cli == c.id)).map((c) => `<button type="button" onclick="qPick('${c.id}')"><span><b>${ee(c.nome)}</b><small>${ee([c.tel, db.vehicles.filter((x) => x.cli == c.id).map((x) => x.placa || x.modelo).join(', ')].filter(Boolean).join(' · ') || 'Cliente')}</small></span></button>`).join('') +
      `<button type="button" class="qbn" onclick="qNovoTudo()"><span><b>+ Cadastrar cliente e carro</b><small>“${ee(v.trim())}” não está aqui</small></span></button>`
  };
  G.qPick = function (cid, vid) { if (!S.q) return; S.q.cli = cid; S.q.veh = vid || (db.vehicles.find((x) => x.cli == cid) || {}).id || ''; render() };
  G.qTroca = function () { if (!S.q) return; S.q.cli = ''; S.q.veh = ''; render(); setTimeout(() => { const i = $q('#qbq'); if (i) i.focus() }, 50) };
  /* cadastra o cliente e, em seguida, o carro (com a placa já preenchida se foi digitada) */
  G.qNovoTudo = function () {
    const v = (($q('#qbq') || {}).value || '').trim(), pl = typeof normPl == 'function' ? normPl(v) : '', tel = v.replace(/\D/g, '').length >= 8 ? v : '';
    editClient(null, (n) => { S.q.cli = n.id; S.q.veh = ''; setTimeout(() => editVeh(null, (x) => { S.q.veh = x.id; render() }, { cli: n.id, ...(pl ? { placa: pl } : {}) }), 350) }, pl || tel ? (tel ? { tel } : {}) : { nome: v })
  };

  /* ---------- 4) adicionar único (a mesma busca da O.S.) ---------- */
  G.qAdd = function () {
    if (!S.q) return; oaAlvo('q');
    sheetM('Adicionar no orçamento', `<div class="oaq"><input type="search" id="oaq" placeholder="O que vai entrar? Ex.: óleo, pastilha" autocomplete="off" oninput="oaR(this.value)"><button type="button" class="srbc" aria-label="Ler código de barras da peça" onclick="oaBip()">${svgi('barras')}</button></div><div id="oar"></div>
     <div class="oab"><button type="button" onclick="oaNovo()">${svgi('plus')}<span>Item novo</span></button><button type="button" onclick="closeM();qHora()">${svgi('clock')}<span>Mão de obra por hora</span></button></div>`); oaR('')
  };
  /* peça do estoque no orçamento: não dá baixa (a baixa é na O.S.) */
  if (typeof oaPeca == 'function') { const _p = oaPeca; G.oaPeca = oaPeca = function (pid) { const r = _p.apply(this, arguments); const b = $q('#modal .oaok'); if (b && window.__qalvo) b.textContent = 'Lançar no orçamento'; return r } }
  if (typeof oaPecaOk == 'function') { const _k = oaPecaOk; G.oaPecaOk = oaPecaOk = function (pid) {
    if (!window.__qalvo) return _k.apply(this, arguments);
    const p = prod(pid), n = +String(($q('#oaqn') || {}).value || '').replace(',', '.'); if (!p.id || !S.q) return; if (!(n > 0)) return toast('Quantidade inválida');
    S.q.items.push({ t: 'Peça', d: p.nome, det: p.cod ? 'Cód. ' + p.cod : '', q: n, v: p.preco || 0, pid: p.id, ...(DONO() ? { custo: +p.custo || 0 } : {}) }); closeM(); render(); toast(p.nome + ' no orçamento') } }
  /* marca quando a busca está servindo o orçamento (a da O.S. limpa) */
  { const _a = G.oaAlvo; G.oaAlvo = oaAlvo = function (x) { window.__qalvo = x == 'q' ? 1 : 0; return _a(x) } }
  if (typeof osAdd == 'function') { const _o = osAdd; G.osAdd = osAdd = function () { window.__qalvo = 0; return _o.apply(this, arguments) } }

  /* ---------- 5) quantidade e valor na linha ---------- */
  G.qQtd = function (n, d) { const i = S.q && S.q.items[n]; if (!i) return; const q = (+i.q || 0) + d; if (q <= 0) return toast('Para tirar o item, toque no ×'); i.q = Math.round(q * 100) / 100; render() };
  G.qVal = function (n, v) { const i = S.q && S.q.items[n]; if (!i) return; const x = nBR(v); if (!(x >= 0)) { toast('Valor inválido'); return render() } i.v = Math.round(x * 100) / 100; render() };

  /* ---------- 6) mão de obra por hora ---------- */
  G.qHora = function () {
    const vh0 = +(db.cfg && db.cfg.vhora) || '';
    modal('Mão de obra por hora', [['d', 'Serviço', 'text', 0, 1], ['hr', 'Horas', 'number', 0, 1], ['vh', 'Valor da hora (R$)', 'number', 0, 1]], { d: 'Mão de obra', hr: 1, vh: vh0 }, (o) => {
      const h = +o.hr, vh = +o.vh; if (!(h > 0)) return toast('Horas inválidas'); if (!(vh > 0)) return toast('Valor da hora inválido');
      db.cfg = db.cfg || {}; if (DONO()) db.cfg.vhora = vh;
      const w = S.v == 'quote' ? S.q : S.v == 'order' ? od(S.id) : null; if (!w) return; w.items.push({ t: 'Mão de obra', d: o.d || 'Mão de obra', det: `${String(h).replace('.', ',')} h × ${R(vh)}`, q: h, v: vh }); save(); render(); toast('Mão de obra lançada: ' + R(h * vh))
    })
  };

  /* ---------- 13) lucro previsto (só o dono) ---------- */
  G.qLucro = function (q) {
    if (!DONO() || !q.items.length) return '';
    let rec = 0, cus = 0, sem = 0; q.items.forEach((i) => { const t = (+i.q || 0) * (+i.v || 0); rec += t; let c = i.custo; if (c == null && i.pid) c = (prod(i.pid) || {}).custo; if (c == null || c === '') { if (i.t == 'Peça') sem++; c = 0 } cus += (+i.q || 0) * (+c || 0) });
    const tot = sum(q.items, q.desc), luc = tot - cus, pct = tot > 0 ? Math.round(luc / tot * 100) : 0;
    return `<div class="qluc"><span>Lucro previsto${sem ? ` <small>(${sem} ${sem == 1 ? 'peça' : 'peças'} sem custo)</small>` : ''}</span><b>${R(luc)} (${pct}%)</b></div>`
  };

  /* ---------- 9 e 10) ⋯ do orçamento ---------- */
  G.qMais = function () {
    const q = S.q; if (!q) return; const ro = q.status == 'Aprovado', env = q.status != 'Rascunho' || q.env, qv = Math.max(1, +(db.cfg && db.cfg.qval) || 7);
    sheetM('Orçamento Nº ' + ee(q.n), `<div class="qml"><button type="button" onclick="closeM();genPDF(S.q)">Ver ou baixar o PDF</button>
     ${!ro && !env ? `<button type="button" onclick="closeM();approve()">Cliente aprovou pessoalmente</button>` : ''}
     ${!ro && q.status != 'Recusado' ? `<button type="button" onclick="closeM();S.q.status='Recusado';saveQuote(1);render()">Marcar recusado</button>` : ''}
     ${DONO() ? `<label>Validade no PDF<input inputmode="numeric" value="${qv}" onchange="db.cfg=db.cfg||{};db.cfg.qval=Math.max(1,parseInt(this.value)||7);save();toast('Validade: '+db.cfg.qval+' dias')"> dias</label>` : ''}
     ${q.novo || !DONO() ? '' : `<button type="button" class="dg" onclick="closeM();if(confirm('Excluir o orçamento Nº ${ee(q.n)}?'))delQuote()">Excluir</button>`}</div>`)
  };

  /* ---------- 8) salvar sozinho ---------- */
  let ULT = '';
  const auto = () => { const q = S.v == 'quote' && S.q; if (!q || !q.cli || (q.novo && !q.items.length)) return; const j = JSON.stringify(q); if (j == ULT) return; ULT = j; try { saveQuote(1) } catch (e) {} };
  const _r = render; G.render = render = function () { try { auto() } catch (e) {} const x = _r.apply(this, arguments); return x };
  if (typeof qs == 'function') { const _qs = qs; G.qs = qs = function () { const r = _qs.apply(this, arguments); try { auto() } catch (e) {} return r } }
  /* sair: o que tem cliente já está salvo */
  if (typeof qBack == 'function') { G.qBack = qBack = function () { const q = S.q; if (!q) return go('quotes'); if (q.novo && !q.items.length) return go('quotes'); if (!q.cli) return toast('Escolha o cliente: digite a placa, o nome ou o telefone'); auto(); saveQuote(1); go('quotes') } }
  /* novo orçamento: o desconto e a busca começam fechados */
  if (typeof editQuote == 'function') { const _e = editQuote; G.editQuote = editQuote = function () { window.__qdsc = 0; ULT = ''; const r = _e.apply(this, arguments); setTimeout(() => { const i = $q('#qbq'); if (i && S.v == 'quote') i.focus() }, 80); return r } }
})(window);
