/* Fio-Mar Gestor — ordem.js (2.46.0): O.S. mais prática
   1) abas finas  2) pagamento no Resumo  3) itens como no orçamento (− +, valor na linha, mão de obra por hora, lucro)
   4) tocar no carro para editar  5) cronômetro do serviço  6) garantia na entrega  7) assinatura do cliente
   8) "Tudo OK" no checklist  9) peça pedida no item  10) lista limpa (cartão no index.html) */
(function (G) {
  const $q = (s) => document.querySelector(s);
  const ee = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nn = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const FECH = ['Concluída', 'Entregue', 'Cancelada'];

  const st = document.createElement('style');
  st.textContent = `
/* 1) abas finas */
#ostabs.ostabs{gap:2px!important;border-bottom:1px solid var(--ln);margin:0 0 12px!important;padding:0!important;background:none!important;box-shadow:none!important;overflow-x:auto;scrollbar-width:none}
#ostabs.ostabs::-webkit-scrollbar{display:none}
#ostabs .ost{flex:none!important;display:inline-flex!important;flex-direction:row!important;align-items:center;gap:6px;min-height:44px!important;height:auto!important;padding:6px 12px!important;margin:0!important;border:0!important;border-bottom:3px solid transparent!important;border-radius:0!important;background:none!important;box-shadow:none!important;color:var(--mut)!important;width:auto!important;min-width:0!important}
#ostabs .ost.on{color:var(--ink)!important;border-bottom-color:var(--hi)!important}
#ostabs .ost svg,#ostabs .ost .s{display:none!important}#ostabs .ost .l{font-size:15px!important;font-weight:700}
#ostabs.ostabs.osq{display:flex!important;grid-template-columns:none!important;overflow-x:auto!important} #ostabs.ostabs.osq .ost{flex:none!important;min-width:0!important;padding:6px 10px!important} #ostabs.ostabs.osq .ost .l{overflow:visible!important;text-overflow:clip!important;max-width:none!important;white-space:nowrap;font-size:15px!important;letter-spacing:0!important} @media (max-width:400px){#ostabs.ostabs.osq .ost{padding:6px 7px!important;gap:4px!important}#ostabs.ostabs.osq .ost .l{font-size:14px!important}#ostabs.ostabs.osq .ost .otn{padding:1px 6px;font-size:11.5px}} #ostabs .ost .otn{font-style:normal;font-size:12px;font-weight:700;background:var(--ln);color:var(--ink);border-radius:99px;padding:1px 7px}
#ostabs .ost::before,#ostabs .ost::after{display:none!important}#ostabs .ost.osmx.dot .l::after{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#E07A5F;margin-left:5px;vertical-align:middle}
/* 4) carro: tocar edita (sem a etiqueta "editar") */
.osvh>b{text-decoration:underline dotted;text-decoration-color:var(--mut);text-underline-offset:4px}
/* 5) cronômetro e 6) garantia */
.ostm{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:5px;font-size:13.5px;color:var(--mut)}.ostm>span{display:inline!important}.osvh .ostm b{display:inline!important;font-size:inherit!important;color:var(--ink);text-decoration:none}.ostm .on{color:#3fb06f;font-weight:700}
.osgar{border-left:4px solid #C98200}.osgar b{color:#C98200}
/* 3) itens */
.osits .qbx{display:inline-flex;min-width:38px;justify-content:center;font-weight:700}
.osped{justify-self:start;display:inline-block;margin-top:3px;font-size:12px;font-weight:700;color:#5fa8e0;background:color-mix(in srgb,#3E7CB1 18%,transparent);border-radius:99px;padding:1px 8px}
.osped.ok{color:#3fb06f;background:color-mix(in srgb,#2E8B57 18%,transparent)}.osped.mt{color:var(--mut);background:var(--ln)}
/* 2) pagamento no Resumo */
.ospay{margin-top:12px;padding-top:12px;border-top:1px solid var(--ln);display:grid;gap:5px}.ospay div{display:flex;justify-content:space-between;gap:8px;font-size:15px}
.ospay .f b{color:#E07A5F;font-size:19px}.ospay .pg b{color:#3fb06f}.ospay .pr{width:100%;margin:8px 0 0;min-height:52px;font-size:17px}
.ospay .lk{justify-self:start;margin:2px 0 0;min-height:36px;padding:4px 10px;font-size:14px}
/* 7) assinatura */
.osass{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.osass>b{flex:1 1 100%}.osass .as{display:grid;gap:4px;justify-items:center;flex:1 1 140px;border:1px dashed var(--ln);border-radius:10px;padding:8px;font-size:13px;color:var(--mut);margin:0;min-height:76px}
.osass .as img{max-width:100%;height:44px;object-fit:contain;background:#fff;border-radius:6px}
.assc{width:100%;height:200px;background:#fff;border-radius:10px;touch-action:none;display:block}
/* 10) lista */
.clst{border:0;cursor:pointer;font:inherit;font-size:11.5px;font-weight:700;min-height:28px;margin:0}`;
  document.head.appendChild(st);

  /* ---------- 9) peça pedida: liga o item da O.S. ao pedido de peças ---------- */
  function pedChip(o, i) {
    if (i.t != 'Peça' && !i.pid) return '';
    const di = nn(i.d); if (!di) return '';
    for (const p of (db.peds || []).slice().reverse()) {
      const it = (p.itens || []).find((x) => x.os == o.id && (nn(x.nome).includes(di) || di.includes(nn(x.nome))));
      if (!it) continue;
      if (p.status == 'Recebido' || it.chegou) return `<span class="osped ok">chegou ✓</span>`;
      if (p.status == 'Enviado') return `<span class="osped">pedida ${D(p.env || p.data).slice(0, 5)}${p.forn ? ' · ' + ee(p.forn) : ''}</span>`;
      return `<span class="osped mt">no pedido ${ee(p.n)} (a enviar)</span>`;
    }
    return '';
  }

  /* ---------- 3 e 2) cartão de itens + pagamento ---------- */
  G.osItensCard = function (o) {
    const ed = !FECH.includes(o.status) || DONO(), tot = oTot(o), pg = paid(o), rest = tot - pg;
    const rows = o.items.map((i, n) => `<div class="qit"><div class="qid" onclick="editItem(od(S.id),${n},1)" role="button" tabindex="0">${typeof itFoto == 'function' ? itFoto(i) : ''}<b>${ee(i.d)}</b><small class="muted">${ee(i.t)}${i.det ? ' · ' + ee(i.det) : ''}</small>${pedChip(o, i)}</div>
     <div class="qir">${ed && !i.baixa ? `<span class="qiq"><button type="button" aria-label="Menos" onclick="osQtd(${n},-1)">−</button><b>${nShow(i.q)}</b><button type="button" aria-label="Mais" onclick="osQtd(${n},1)">+</button></span>` : `<span class="qbx" title="${i.baixa ? 'Peça com baixa no estoque: toque no item para mudar' : ''}">${nShow(i.q)}×</span>`}
     ${ed ? `<label class="qiv">R$<input inputmode="decimal" aria-label="Valor de ${ee(i.d)}" value="${nShow(+i.v || 0)}" onchange="osVal(${n},this.value)"></label>` : `<span class="muted">${R(+i.v || 0)}</span>`}<b class="qit-t">${R((+i.q || 0) * (+i.v || 0))}</b>
     ${ed ? `<button type="button" class="sm qrm" aria-label="Remover item" onclick="rmOS(${n})">×</button>` : ''}</div></div>`).join('');
    const formas = [...new Set((o.pags || []).map((p) => p.forma).filter(Boolean))].join(', ');
    return `<div class="card osits"><b>Serviços e peças</b><div class="qits" style="margin-top:6px">${rows || '<p class="muted" style="margin:6px 0">Nenhum item ainda.</p>'}</div>
     ${typeof favHTML == 'function' ? favHTML('os') : ''}${ed ? `<button type="button" class="pr oaadd" onclick="osAdd()">+ Adicionar serviço ou peça</button>` : ''}${typeof qLucro == 'function' ? qLucro(o) : ''}
     ${tot > 0.004 ? `<div class="ospay"><div><span class="muted">Total</span><b>${R(tot)}</b></div>${pg > 0 ? `<div><span class="muted">Pago${formas ? ' (' + ee(formas) + ')' : ''}</span><span>${R(pg)}</span></div>` : ''}
      ${rest > 0.005 ? `<div class="f"><span>Falta</span><b>${R(rest)}</b></div><button type="button" class="pr" onclick="${typeof recebe == 'function' ? `recebe('${o.id}')` : `osTab('pag')`}">Receber ${R(rest)}</button>` : `<div class="pg"><span>Pagamento</span><b>✓ Pago</b></div>`}
      <button type="button" class="lk" onclick="osTab('pag')">${(o.pags || []).length ? `Pagamentos (${o.pags.length}), recibo e Pix ›` : 'Pix e outras formas ›'}</button></div>` : ''}</div>`
  };
  G.osQtd = function (n, d) { const o = od(S.id), i = o && o.items[n]; if (!i) return; if (i.baixa) return editItem(o, n, 1); const q = (+i.q || 0) + d; if (q <= 0) return toast('Para tirar o item, toque no ×'); i.q = Math.round(q * 100) / 100; save(); render() };
  G.osVal = function (n, v) { const o = od(S.id), i = o && o.items[n]; if (!i) return; const x = nBR(v); if (!(x >= 0)) { toast('Valor inválido'); return render() } i.v = Math.round(x * 100) / 100; save(); render() };
  /* "Mão de obra por hora" também na busca da O.S. */
  if (typeof osAdd == 'function') { const _a = osAdd; G.osAdd = osAdd = function () { const r = _a.apply(this, arguments); const b = $q('#modal .oab'); if (b && !b.querySelector('.oahr')) b.insertAdjacentHTML('beforeend', `<button type="button" class="oahr" onclick="closeM();qHora()">${svgi('clock')}<span>Mão de obra por hora</span></button>`); return r } }

  /* ---------- 5) cronômetro e 6) garantia ---------- */
  const tmMs = (o) => { const t = o.tmo || {}; return (+t.ms || 0) + (t.ini ? Date.now() - t.ini : 0) };
  const tmTxt = (ms) => { const m = Math.round(ms / 60000), h = Math.floor(m / 60); return h ? `${h} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min` };
  G.osTmHTML = function (o) {
    const P = []; if (o.tmo && (o.tmo.ms || o.tmo.ini)) P.push(`<span>⏱ <b>${tmTxt(tmMs(o))}</b> de serviço${o.mec ? ' · ' + ee(o.mec) : ''}${o.tmo.ini ? ' <span class="on">● contando</span>' : ''}</span>`);
    if (o.gar && o.gar.ate) P.push(`<span>🛡 Garantia até <b>${D(o.gar.ate)}</b>${o.gar.ate < today() ? ' (vencida)' : ''}</span>`);
    return P.length ? `<div class="ostm">${P.join('')}</div>` : ''
  };
  const garDias = () => Math.max(0, parseInt(db.cfg && db.cfg.gar) || 90);
  const soma = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) };
  G.osGarAviso = function (o) {
    if (!o.veh) return '';
    const p = db.orders.filter((x) => x.id != o.id && x.veh == o.veh && x.gar && x.gar.ate >= (o.aberta || today()) && (x.gar.de || '') <= (o.aberta || today())).sort((a, b) => b.gar.ate.localeCompare(a.gar.ate))[0];
    return p ? `<div class="card osgar"><b>Dentro da garantia da O.S. ${ee(p.num)}</b> (até ${D(p.gar.ate)}).<br><small class="muted">${ee(p.items.map((i) => i.d).slice(0, 3).join(', '))}</small> <button type="button" class="sm" onclick="go('order','${p.id}')">Ver a O.S. ${ee(p.num)}</button></div>` : ''
  };
  if (typeof setSt == 'function') {
    const _s = setSt;
    G.setSt = setSt = function (v) {
      const o = od(S.id), ant = o && o.status; const r = _s.apply(this, arguments);
      try {
        if (o && ant != v) {
          o.tmo = o.tmo || { ms: 0 };
          if (v == 'Em andamento' && !o.tmo.ini) o.tmo.ini = Date.now();
          if (ant == 'Em andamento' && v != 'Em andamento' && o.tmo.ini) { o.tmo.ms = (+o.tmo.ms || 0) + Date.now() - o.tmo.ini; o.tmo.ini = null }
          if (v == 'Entregue' && !o.gar && garDias() > 0) o.gar = { d: garDias(), de: today(), ate: soma(today(), garDias()) };
          save(); if (S.v == 'order') render(1)
        }
      } catch (e) {}
      return r
    }
  }
  /* garantia: configurável no ⋯ da O.S. (dono) */
  if (typeof osMais == 'function') { const _m = osMais; G.osMais = osMais = function (id) { const r = _m.apply(this, arguments), l = $q('#modal .osml'); if (l && DONO()) l.insertAdjacentHTML('beforeend', `<label class="osgcf">🛡 Garantia ao entregar<input inputmode="numeric" value="${garDias()}" onchange="db.cfg=db.cfg||{};db.cfg.gar=Math.max(0,parseInt(this.value)||0);save();toast('Garantia: '+db.cfg.gar+' dias')"> dias</label>`); return r } }

  /* ---------- 7) assinatura do cliente ---------- */
  G.assHTML = function (o) {
    const a = o.ass || {}, sl = (k, l) => `<button type="button" class="as" onclick="assinar('${o.id}','${k}')">${a[k] ? `<img src="${a[k].src}" alt="Assinatura ${l}"><span>${l} · ${D(a[k].data)}</span>` : `<b>✍ ${l}</b><span>Cliente assina com o dedo</span>`}</button>`;
    return `<div class="card osass"><b>Assinatura do cliente</b>${sl('ent', 'Entrada')}${['Concluída', 'Entregue'].includes(o.status) || a.sai ? sl('sai', 'Entrega') : ''}</div>`
  };
  G.assinar = function (id, k) {
    const o = od(id); if (!o) return; const c = cl(o.cli);
    $q('#modal').innerHTML = `<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="Assinatura"><div class="psh-h"><h2>${k == 'ent' ? 'Autorizo o serviço' : 'Recebi o veículo'}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>
     <p class="muted" style="margin:0 0 8px">${ee(c.nome || 'Cliente')}, assine com o dedo no quadro.</p><canvas class="assc" id="assc"></canvas>
     <div class="bar" style="margin-top:10px"><button type="button" onclick="assLimpa()">Limpar</button><span class="sp"></span><button type="button" class="pr" onclick="assSalva('${id}','${k}')">Salvar assinatura</button></div></div></div>`;
    const cv = $q('#assc'), r = cv.getBoundingClientRect(), dp = Math.min(2, window.devicePixelRatio || 1); cv.width = r.width * dp; cv.height = r.height * dp; const x = cv.getContext('2d'); x.scale(dp, dp); x.lineWidth = 2.4; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#111';
    let on = false, lp = null; cv.dataset.vazio = '1';
    const pt = (ev) => { const b = cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top] };
    cv.addEventListener('pointerdown', (ev) => { on = true; lp = pt(ev); cv.setPointerCapture(ev.pointerId) });
    cv.addEventListener('pointermove', (ev) => { if (!on) return; const p = pt(ev); x.beginPath(); x.moveTo(lp[0], lp[1]); x.lineTo(p[0], p[1]); x.stroke(); lp = p; cv.dataset.vazio = '' });
    const fim = () => { on = false }; cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim)
  };
  G.assLimpa = function () { const cv = $q('#assc'); if (!cv) return; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.dataset.vazio = '1' };
  G.assSalva = function (id, k) {
    const cv = $q('#assc'), o = od(id); if (!cv || !o) return; if (cv.dataset.vazio) return toast('Falta a assinatura');
    /* reduz para no máximo 400 px de largura */
    const w = Math.min(400, cv.width), h = Math.round(cv.height * w / cv.width), t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').drawImage(cv, 0, 0, w, h);
    o.ass = o.ass || {}; o.ass[k] = { src: t.toDataURL('image/png'), data: today() }; save(); closeM(); render(); toast('Assinatura salva')
  };

  /* ---------- 8) "Tudo OK" no checklist ---------- */
  G.ckTudoOk = function () {
    const o = od(S.id); if (!o) return; o.ck = o.ck || {}; let n = 0;
    CK.forEach((k) => { const c = o.ck[k] = o.ck[k] || {}; if (!['OK', 'Atenção', 'Defeito'].includes(c.s)) { c.s = 'OK'; n++ } });
    save(); render(); toast(n ? `${n} ${n == 1 ? 'item marcado' : 'itens marcados'} como OK` : 'Todos os itens já estavam marcados')
  };
})(window);
