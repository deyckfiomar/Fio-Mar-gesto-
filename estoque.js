/* Fio-Mar Gestor — estoque.js (2.49.0): Estoque mais rápido, profissional e sem poluição
   1) ajuste rápido na lista (− 1 + e Entrada/Saída)   2) entrada curta (1, último custo, fornecedores, "Hoje")
   3) pedir todo o estoque baixo de uma vez          4) contagem de estoque (com leitor)
   5) lista em linhas finas                          6) topo enxuto
   7) página da peça só com o que importa           8) movimentações em linhas finas com saldo
   9) nova peça só com o essencial                  10) categorias e ordenação
   11) barrinha de nível                             12) giro da peça (saídas em 30 dias) */
(function (G) {
  const $q = s => document.querySelector(s);
  const PD = () => db.peds = db.peds || [];
  const thumb = (s, cls) => `<img class="${cls || 'pdth'}" ${fimg(s)} alt="Foto da peça" onclick="event.stopPropagation();verFoto(this.src)">`;
  const sheet = (tit, body) => { $('#modal').innerHTML = `<div class="ov psh-ov"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>` };
  const dc = d => d ? String(d).slice(8, 10) + '/' + String(d).slice(5, 7) : '';
  const semN = p => dig(p.ncm).length != 8;
  const nf = () => { try { return usaNF() } catch (x) { return false } };
  const dias = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(String(a).slice(0, 10) + 'T12:00')) / 864e5);
  const sai30 = id => MV().filter(m => m.pid == id && m.tipo == 'S' && m.data && dias(m.data, today()) <= 30 && !/contagem/i.test(m.obs || '')).reduce((a, m) => a + (+m.q || 0), 0);
  const usoN = id => MV().filter(m => m.pid == id && m.tipo == 'S' && m.data && dias(m.data, today()) <= 90).length;
  const cats = () => [...new Set(PR().map(p => String(p.cat || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const ord = n => db.orders.find(o => String(o.num) == String(n));

  /* 11) nível: vermelho no mínimo ou abaixo, amarelo perto, verde folgado */
  function nivel(p) {
    const q = qty(p.id), mn = +p.min || 0;
    if (q <= 0) return { c: 'zero', p: 0 };
    if (!mn) return { c: '', p: -1 };
    const pc = Math.max(4, Math.min(100, q / (mn * 2) * 100));
    return { c: isLow(p) ? 'baixo' : q <= mn * 1.5 ? 'perto' : 'ok', p: pc };
  }

  /* ---------- lista ---------- */
  function linha(p) {
    const n = nivel(p), q = qty(p.id), ft = (p.fotos || [])[0];
    const det = [p.cod && e(p.cod), p.cat && e(p.cat), +p.preco > 0 && R(p.preco), nf() && semN(p) && '<span class="esnc">sem NCM</span>'].filter(Boolean).join(' · ');
    return `<div class="esl" role="button" tabindex="0" onclick="go('prod','${p.id}')">
 ${ft ? thumb(ft, 'eslf') : (() => { const [ini, cor] = avIni(p.nome || '?'); return `<span class="eslf esli" style="--ac:${cor}" aria-hidden="true">${e(ini)}</span>` })()}
 <div class="eslt"><b>${e(p.nome)}</b>${det ? `<small>${det}</small>` : ''}</div>
 <button type="button" class="esq ${n.c}" aria-label="${e(nShow(q))} ${e(p.un || 'un')} de ${e(p.nome)} · ajuste rápido" onclick="event.stopPropagation();estAj('${p.id}')"><b>${e(nShow(q))}</b><small>${e(p.un || 'un')}</small>${n.p >= 0 ? `<i style="--p:${n.p}%"></i>` : ''}</button></div>`;
  }

  function Vstock() {
    const st = S.f.sk || '', q = nrm(S.f.q || '').trim(), ct = S.f.ec || '', so = S.f.so || 'nome', P = PR(), C = cats();
    const nl = P.filter(isLow).length, nn = P.filter(semN).length, val = P.reduce((a, p) => a + Math.max(0, qty(p.id)) * (+p.custo || 0), 0);
    const tl = [['', 'Todas', 'stock', String(P.length)], ['low', 'Estoque baixo', 'alert', String(nl), nl ? KR : KM], ...(nf() ? [['ncm', 'Sem NCM', 'notas', String(nn), nn ? KA : KM]] : [])];
    let L = P.filter(p => !st || (st == 'low' ? isLow(p) : semN(p)));
    if (ct) L = L.filter(p => String(p.cat || '').trim() == ct);
    if (q) L = L.filter(p => nrm([p.nome, p.cod, p.cat, p.ean].join(' ')).includes(q));
    const nome = (a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
    L = L.slice().sort(so == 'uso' ? (a, b) => usoN(b.id) - usoN(a.id) || nome(a, b) : so == 'baixo' ? (a, b) => (qty(a.id) - (+a.min || 0)) - (qty(b.id) - (+b.min || 0)) || nome(a, b) : nome);
    const pa = typeof pdAbertos == 'function' ? pdAbertos() : 0;
    const sub = `<div class="eshs">${DONO() ? `<div class="eshv"><small>Valor em estoque</small><b>${R(val)}</b></div>` : ''}<div class="eshl"><button type="button" class="eslk" onclick="go('peds')">${svgi('pedido')}<span>Pedidos de peças</span>${pa ? `<b>${plural(pa, 'em aberto', 'em aberto')}</b>` : ''}<i>›</i></button><button type="button" class="sm esmais" aria-label="Mais opções do estoque" onclick="estMais()">⋯ Mais</button></div></div>`;
    const baixo = st == 'low' && nl ? `<button type="button" class="pr esrep" onclick="estRepor()">${svgi('pedido')} Pedir tudo ao fornecedor (${nl})</button>` : '';
    return head({ ico: 'stock', kick: 'Peças', title: 'Estoque', c: PCOL.stock, right: `<button class="pr hb" onclick="editProd()">+ Nova peça</button>`, sub }) +
      ftiles(tl, st, 'sk') +
      `<div class="srch">${svgi('search')}<input type="search" placeholder="Buscar peça por nome ou código" value="${e(S.f.q || '')}" oninput="S.f.q=this.value;render(1)"><button type="button" class="srbc" aria-label="Ler código de barras" onclick="lerCodigo(scanAbre)">${svgi('barras')}</button></div>` +
      `<div class="esfl">${C.length ? `<div class="escat" role="group" aria-label="Categorias"><button type="button" class="${ct ? '' : 'on'}" aria-pressed="${!ct}" onclick="setF('ec','')">Todas</button>${C.map(c => `<button type="button" class="${ct == c ? 'on' : ''}" aria-pressed="${ct == c}" data-c="${e(c)}" onclick="setF('ec',this.dataset.c)">${e(c)}</button>`).join('')}</div>` : '<span></span>'}
 <label class="esord"><span class="sr">Ordenar</span><select aria-label="Ordenar" onchange="setF('so',this.value)">${[['nome', 'A–Z'], ['uso', 'Mais usadas'], ['baixo', 'Menor estoque']].map(([k, t]) => `<option value="${k}" ${so == k ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>` + baixo +
      (L.length ? `<div class="card esls">${lista(L, linha)}</div>` :
        empty('stock', q ? 'Nenhuma peça encontrada.' : 'Nenhuma peça neste filtro.', st || q || ct ? '' : `<button class="pr" onclick="editProd()">+ Nova peça</button>`));
  }

  /* ---------- 1) ajuste rápido ---------- */
  G.estAj = function (id) {
    const p = prod(id); if (!p.id) return;
    sheet(e(p.nome), `<form class="esaj" onsubmit="event.preventDefault();estAjOk('${p.id}','E')">
 <p class="muted" style="margin:-4px 0 10px">Em estoque: <b>${e(nShow(qty(p.id)))} ${e(p.un || 'un')}</b>${+p.min ? ` · mínimo ${e(nShow(p.min))}` : ''}</p>
 <label>Quantidade<input name="q" inputmode="decimal" value="1" autocomplete="off"></label>
 <div class="bar" style="margin:8px 0 0"><button type="button" class="essai" onclick="estAjOk('${p.id}','S')">− Saída</button><span class="sp"></span><button class="pr">+ Entrada</button></div>
 <button type="button" class="eslk2" onclick="closeM();go('prod','${p.id}')">Abrir a peça ›</button></form>`);
  };
  G.estAjOk = function (id, tipo) {
    const p = prod(id), f = $q('#modal form.esaj'); if (!p.id || !f) return;
    const n = nBR(f.q.value);
    if (!(n > 0)) return toast('Quantidade inválida');
    if (tipo == 'S' && n > qty(id)) return toast('Estoque insuficiente: restam ' + nShow(qty(id)));
    closeM();
    desfazivel(() => { MV().push({ id: uid(), pid: id, tipo, q: n, data: today(), obs: tipo == 'E' ? 'Entrada rápida' : 'Saída rápida' }); save(); render(1) },
      (tipo == 'E' ? '+' : '−') + nShow(n) + ' ' + (p.un || 'un') + ' · ' + p.nome);
  };

  /* ---------- 3) repor o estoque baixo ---------- */
  G.estRepor = function () {
    if (typeof pdNovo != 'function') return;
    const m = PD().slice().reverse().find(x => x.status == 'Montando'), p = m || pdNovo(0);
    const antes = p.itens.length; pdBaixo(p.id); const n = p.itens.length - antes;
    go('ped', p.id); toast(n ? plural(n, 'peça entrou', 'peças entraram') + ' no pedido Nº ' + p.n + ' (quantidade para passar do mínimo)' : 'As peças com estoque baixo já estão no pedido Nº ' + p.n);
  };

  /* ---------- ⋯ do estoque ---------- */
  G.estMais = function () {
    const A = [['Contagem de estoque', "go('contagem')", 'oscheck'], ['Ler código de barras', 'lerCodigo(scanAbre)', 'barras'], ['Entrada por bipe', 'entAbre()', 'stock'], ...(DONO() ? [['Entrada por nota fiscal', "go('entradas')", 'entradas']] : [])];
    sheet('Estoque', `<div class="osml">${A.map(([t, f, ic]) => `<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`);
  };

  /* ---------- 7) página da peça + 8) movimentações + 12) giro ---------- */
  function movRows(p) {
    const L = MV().filter(m => m.pid == p.id); let sd = 0;
    const R2 = L.map(m => { sd += (m.tipo == 'E' ? 1 : -1) * (+m.q || 0); return { m, sd } }).reverse();
    const lim = +S.f.mlim || 30;
    return R2.slice(0, lim).map(({ m, sd }) => {
      const en = m.tipo == 'E', o = String(m.obs || ''), mo = o.match(/O\.S\.\s*(\d+)/), od2 = mo && ord(mo[1]);
      const ob = od2 ? e(o.slice(0, mo.index)) + `<button type="button" class="eslink" onclick="go('order','${od2.id}')">${e(mo[0])}</button>` + e(o.slice(mo.index + mo[0].length)) : e(o || (en ? 'Entrada' : 'Saída'));
      return `<div class="esm ${en ? 'en' : 'sa'}"><span class="esma" aria-hidden="true">${en ? '↑' : '↓'}</span><div class="esmt"><b>${en ? '+' : '−'}${e(nShow(m.q))}</b><small>${ob}</small></div><div class="esmd"><small>${dc(m.data)}</small><small>saldo ${e(nShow(sd))}</small></div></div>`;
    }).join('') + (R2.length > lim ? `<button type="button" class="mais" onclick="S.f.mlim=${lim + 60};render(1)">Mostrar mais (${R2.length - lim})</button>` : '');
  }
  function Vprod() {
    const p = prod(S.id); if (!p.id) return Vstock();
    const q = qty(p.id), n = nivel(p), mg = +p.custo > 0 ? Math.round((p.preco - p.custo) / p.custo * 100) : 0, s30 = sai30(p.id);
    const OR = { 0: '0 - Nacional', 1: '1 - Estrangeira direta', 2: '2 - Estrangeira interna' };
    const giro = s30 > 0 ? `Saíram <b>${e(nShow(s30))} ${e(p.un || 'un')}</b> nos últimos 30 dias${q > 0 ? ` · dá para uns <b>${plural(Math.max(1, Math.round(q / (s30 / 30))), 'dia', 'dias')}</b>` : ' · <b>acabou</b>'}` : 'Sem saídas nos últimos 30 dias';
    const sub = `<div><b>Venda ${R(p.preco)}</b>${DONO() ? `<small>Custo ${R(p.custo)}${+p.custo > 0 ? ' · margem ' + mg + '%' : ''}</small>` : ''}</div><div class="osv esqv ${n.c}"><small>Em estoque</small><b>${e(nShow(q))} ${e(p.un || 'un')}</b>${n.p >= 0 ? `<i style="--p:${n.p}%"></i>` : ''}</div>`;
    const info = [['Categoria', p.cat], ['Estoque mínimo', +p.min ? nShow(p.min) + ' ' + (p.un || 'un') : ''], ['Código de barras', p.ean], ['Fornecedores', (p.forn || []).length ? String(p.forn.length) : '']].filter(x => x[1]);
    const fis = nf() ? `<details class="card esfis"><summary>Dados fiscais${semN(p) ? ' · <span class="esnc">falta NCM</span>' : ''}</summary>${igrid([['NCM', dig(p.ncm).length == 8 ? e(p.ncm) : '<span style="color:#C98200">Falta</span>'], ['CEST', e(p.cest)], ['Origem', e(OR[p.origem] || p.origem)], ['CSOSN/CST', e(p.csosn) || 'Padrão'], ['CFOP', e(p.cfop) || 'Padrão']])}</details>` : '';
    const F = p.fotos || [];
    const fotos = F.length ? (typeof pfFotosHTML == 'function' ? pfFotosHTML(p) : '') : `<div class="esft"><span>${svgi('osfotos')} Sem foto da peça</span>${fotoBtns(`pfFoto('${p.id}',this.files)`)}</div>`;
    const nm = MV().filter(m => m.pid == p.id).length;
    return head({ back: "go('stock')", kick: 'Peça' + (p.cod ? ' · ' + e(p.cod) : ''), title: e(p.nome), c: n.c == 'baixo' || n.c == 'zero' ? KR : KG, sub,
      acts: `<button class="pr esbt" onclick="mov('${p.id}','E')">+ Entrada</button><button class="esbt" onclick="mov('${p.id}','S')">− Saída</button><button type="button" class="esbt esb3" aria-label="Mais opções da peça" onclick="estPMais('${p.id}')">⋯</button>` }) +
      `<p class="esgiro">${giro}</p>` +
      (info.length ? `<div class="card esinf">${info.map(([k, v]) => `<div><small>${k}</small><b>${e(v)}</b></div>`).join('')}</div>` : '') + fis + fotos +
      sech('Movimentações', nm ? plural(nm, 'registro', 'registros') : '') + (nm ? `<div class="card esms">${movRows(p)}</div>` : empty('stock', 'Sem movimentações.'));
  }
  G.estPMais = function (id) {
    const p = prod(id); if (!p.id) return;
    const A = [[typeof pdProd == 'function' ? 'Pedir ao fornecedor' : '', `pdProd('${p.id}')`, 'pedido'], ['Editar peça', `editProd('${p.id}')`, 'notas'], ['Ajuste rápido', `estAj('${p.id}')`, 'stock']].filter(a => a[0]);
    sheet(e(p.nome), `<div class="osml">${A.map(([t, f, ic]) => `<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`);
  };

  /* ---------- 2) entrada e saída mais curtas ---------- */
  const _mov = G.mov || mov;
  G.mov = mov = function (id, tipo) {
    _mov(id, tipo);
    const f = $q('#modal form'), p = prod(id); if (!f || !p.id) return;
    const en = tipo == 'E';
    if (f.q && !f.q.value) f.q.value = '1';
    if (en && f.custo && !f.custo.value && +p.custo > 0) f.custo.value = nShow(p.custo);
    /* data: "Hoje" e só abre para mudar */
    const dl = f.data && f.data.closest('label');
    if (dl) {
      dl.hidden = true;
      dl.insertAdjacentHTML('beforebegin', `<div class="esdt">Data: <b>hoje</b> <button type="button" class="sm" onclick="this.parentNode.nextElementSibling.hidden=false;this.parentNode.remove()">Mudar</button></div>`);
    }
    if (f.obs) {
      const L = en ? [...new Set([...PD().map(x => x.forn), ...MV().filter(m => m.tipo == 'E').map(m => m.obs)].filter(x => x && !/^(Entrada rápida|Estoque inicial|Ajuste de contagem|Pedido \d+.*)$/.test(x)))].slice(-30)
        : [...db.orders.filter(o => !osFim(o)).slice(-15).map(o => 'O.S. ' + o.num), 'Uso na oficina', 'Perda / defeito'];
      f.obs.setAttribute('list', 'esobs'); f.obs.autocomplete = 'off';
      f.obs.insertAdjacentHTML('afterend', `<datalist id="esobs">${L.map(x => `<option value="${e(x)}">`).join('')}</datalist>`);
    }
    try { f.q.focus(); f.q.select() } catch (x) {}
  };

  /* ---------- 9) nova peça só com o essencial ---------- */
  const _ep = G.editProd || editProd;
  G.editProd = editProd = function (id, pre) {
    _ep(id, pre);
    const f = $q('#modal form'); if (!f || !f.nome) return;
    const lab = n => f[n] && f[n].closest('label');
    /* nome primeiro */
    const ln = lab('nome'), lc = lab('cod'); if (ln && lc) lc.before(ln);
    /* categoria com as já usadas */
    if (f.cat) { f.cat.setAttribute('list', 'escats'); f.cat.autocomplete = 'off'; f.cat.insertAdjacentHTML('afterend', `<datalist id="escats">${cats().map(c => `<option value="${e(c)}">`).join('')}</datalist>`); }
    /* código de barras e fiscais recolhidos */
    const h3 = [...f.querySelectorAll('h3')].find(x => /fiscais/i.test(x.textContent));
    const mover = [lab('ean'), ...(h3 ? (() => { const L = []; let x = h3.nextElementSibling; while (x && x.tagName == 'LABEL' && !(x.querySelector('[name=ini]'))) { L.push(x); x = x.nextElementSibling } return L })() : [])].filter(Boolean);
    const fisc = nf(), p = id ? prod(id) : {};
    const temF = p.ncm || p.cest || p.origem || p.csosn || p.cfop;
    const d = document.createElement('details'); d.className = 'pdmais esdet';
    d.innerHTML = `<summary>+ Código de barras${fisc || temF ? ' e dados fiscais' : ''}</summary>`;
    if (p.ean || (pre && pre.ean)) d.open = true;
    const eanL = lab('ean'); mover.forEach(x => { d.appendChild(x); if (!fisc && !temF && x !== eanL) x.hidden = true; });
    if (h3) h3.remove();
    const bar = f.querySelector('.bar'); const ini = lab('ini');
    (ini || bar).before(d);
    if (!id) setTimeout(() => { try { f.nome.focus() } catch (x) {} }, 50);
  };

  /* ---------- 4) contagem de estoque ---------- */
  let CNT = {};
  function Vcont() {
    const q = nrm(S.f.cq || '').trim(), ct = S.f.ec || '', C = cats();
    let L = PR().slice().sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
    if (ct) L = L.filter(p => String(p.cat || '').trim() == ct);
    if (q) L = L.filter(p => nrm([p.nome, p.cod, p.cat, p.ean].join(' ')).includes(q));
    const dif = Object.entries(CNT).filter(([id, v]) => prod(id).id && v !== '' && isFinite(nBR(v)) && nBR(v) != qty(id));
    const btn = `<button type="button" class="pr escsv" onclick="estContOk()" ${dif.length ? '' : 'disabled'}>Salvar contagem${dif.length ? ' (' + plural(dif.length, 'diferença', 'diferenças') + ')' : ''}</button>`;
    return head({ back: "go('stock')", kick: 'Estoque', title: 'Contagem de estoque', c: PCOL.stock, sub: `<div><b>${plural(Object.keys(CNT).filter(k => CNT[k] !== '').length, 'peça contada', 'peças contadas')}</b><small>Digite quanto tem na prateleira (ou bipe cada peça). Só as diferenças viram ajuste.</small></div>`, acts: btn }) +
      `<div class="srch">${svgi('search')}<input type="search" placeholder="Buscar peça" value="${e(S.f.cq || '')}" oninput="S.f.cq=this.value;render(1)"><button type="button" class="srbc" aria-label="Bipar peça" onclick="estContBipe()">${svgi('barras')}</button></div>` +
      (C.length ? `<div class="esfl"><div class="escat" role="group" aria-label="Categorias"><button type="button" class="${ct ? '' : 'on'}" onclick="setF('ec','')">Todas</button>${C.map(c => `<button type="button" class="${ct == c ? 'on' : ''}" data-c="${e(c)}" onclick="setF('ec',this.dataset.c)">${e(c)}</button>`).join('')}</div></div>` : '') +
      (L.length ? `<form class="card escl" onsubmit="event.preventDefault()">${L.map(p => {
        const v = CNT[p.id], tem = v !== undefined && v !== '', d = tem && isFinite(nBR(v)) ? nBR(v) - qty(p.id) : 0;
        return `<label class="escr${tem ? (d ? ' dif' : ' igual') : ''}" data-id="${p.id}"><span class="esct"><b>${e(p.nome)}</b><small>Sistema: ${e(nShow(qty(p.id)))} ${e(p.un || 'un')}${tem && d ? ` · <span class="escd">${d > 0 ? '+' : ''}${e(nShow(d))}</span>` : tem ? ' · confere' : ''}</small></span><input name="c_${p.id}" inputmode="decimal" autocomplete="off" aria-label="Contado: ${e(p.nome)}" placeholder="${e(nShow(qty(p.id)))}" value="${tem ? e(v) : ''}" oninput="estContSet('${p.id}',this.value)"></label>`;
      }).join('')}</form>` : empty('stock', 'Nenhuma peça.')) + (L.length > 8 ? `<div style="margin-top:10px">${btn}</div>` : '');
  }
  G.estContSet = function (id, v) {
    CNT[id] = String(v || '').trim(); const r = $q(`.escr[data-id="${id}"]`), p = prod(id);
    if (r) { const tem = CNT[id] !== '', d = tem && isFinite(nBR(CNT[id])) ? nBR(CNT[id]) - qty(id) : 0; r.classList.toggle('dif', !!(tem && d)); r.classList.toggle('igual', !!(tem && !d));
      r.querySelector('small').innerHTML = `Sistema: ${e(nShow(qty(id)))} ${e(p.un || 'un')}${tem && d ? ` · <span class="escd">${d > 0 ? '+' : ''}${e(nShow(d))}</span>` : tem ? ' · confere' : ''}`; }
    const dif = Object.entries(CNT).filter(([k, x]) => prod(k).id && x !== '' && isFinite(nBR(x)) && nBR(x) != qty(k)).length, tot = Object.values(CNT).filter(x => x !== '').length;
    document.querySelectorAll('.escsv').forEach(b => { b.disabled = !dif; b.textContent = 'Salvar contagem' + (dif ? ' (' + plural(dif, 'diferença', 'diferenças') + ')' : '') });
    const hb = $q('.osh2 b'); if (hb) hb.textContent = plural(tot, 'peça contada', 'peças contadas');
  };
  G.estContBipe = function () {
    lerCodigo(c => {
      const k = String(c || '').replace(/\s+/g, ''), p = PR().find(x => x.ean == k || nrm(x.cod || '') == nrm(k));
      if (!p) return toast('Código ' + k + ' não está cadastrado');
      const v = CNT[p.id], n = (v !== undefined && v !== '' && isFinite(nBR(v)) ? nBR(v) : 0) + 1;
      CNT[p.id] = nShow(n); render(1); toast(p.nome + ': ' + nShow(n) + ' contada' + (n == 1 ? '' : 's'));
      setTimeout(() => { const i = $q(`[name="c_${p.id}"]`); if (i) i.scrollIntoView({ block: 'center' }) }, 50);
    }, { titulo: 'Bipe a peça' });
  };
  G.estContOk = function () {
    const L = Object.entries(CNT).filter(([id, v]) => prod(id).id && v !== '' && isFinite(nBR(v)) && nBR(v) != qty(id));
    if (!L.length) return toast('Nenhuma diferença para ajustar');
    desfazivel(() => { L.forEach(([id, v]) => { const d = nBR(v) - qty(id); MV().push({ id: uid(), pid: id, tipo: d > 0 ? 'E' : 'S', q: Math.abs(d), data: today(), obs: 'Ajuste de contagem' }) }); CNT = {}; save(); go('stock') },
      'Contagem salva · ' + plural(L.length, 'peça ajustada', 'peças ajustadas'));
  };
  G.estCont = () => CNT;

  V.stock = Vstock; V.prod = Vprod; V.contagem = Vcont;
  G.Vstock = Vstock;

  const css = document.createElement('style');
  css.textContent = `
.eslk{display:flex;align-items:center;gap:8px;margin:0;padding:6px 0;background:none;border:0;color:inherit;font-weight:600;text-align:left;flex:1;min-width:0}.eslk svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9}.eslk b{font-size:12px;font-weight:700;color:#17181A;background:#F5B700;border-radius:99px;padding:1px 8px}.eslk i{font-style:normal;color:var(--mut);margin-left:2px}
.eslk2{display:block;width:100%;margin:10px 0 0;background:none;border:0;color:var(--mut);font-weight:600;padding:6px}
.esmb{font-size:22px;line-height:1;margin-right:6px}
.esfl{display:flex;align-items:center;gap:8px;margin:0 0 10px}.escat{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0}.escat::-webkit-scrollbar{display:none}
.escat button{flex:none;margin:0;padding:5px 12px;border-radius:99px;font-size:14px;font-weight:600;border:1px solid var(--ln);background:transparent;color:var(--mut)}.escat button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.esord{margin:0;flex:none;width:auto}.esfl .esord select{margin:0;padding:5px 24px 5px 10px;font-size:14px;min-height:34px;height:34px;width:122px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.esrep{width:100%;margin:0 0 10px;display:flex;align-items:center;justify-content:center;gap:8px}.esrep svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}
.esls{padding:0;overflow:hidden}.esls .mais{margin:0;border-radius:0;border:0;border-top:1px solid var(--ln)}
.esl{display:flex;align-items:center;gap:12px;padding:9px 10px 9px 12px;border-top:1px solid var(--ln);cursor:pointer;min-height:62px}.esl:first-child{border-top:0}
.eslf{width:42px;height:42px;border-radius:9px;object-fit:cover;flex:none;display:block}.esli{display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--ac,#888) 20%,transparent);color:var(--ac,var(--mut));font-weight:700;font-size:14px}
.eslt{flex:1;min-width:0}.eslt b{display:block;font-size:16px;line-height:1.25;overflow-wrap:anywhere}.eslt small{display:block;color:var(--mut);font-size:13px;margin-top:2px;overflow-wrap:anywhere}
.esnc{color:#C98200;font-weight:600}
.esq{position:relative;flex:none;min-width:64px;margin:0;padding:6px 8px 9px;border-radius:10px;border:1px solid var(--ln);background:transparent;color:inherit;display:flex;flex-direction:column;align-items:center;line-height:1.1;overflow:hidden}
.esq b{font-size:18px;font-variant-numeric:tabular-nums}.esq small{font-size:11px;color:var(--mut)}
.esq i,.esqv i{position:absolute;left:8px;right:8px;bottom:4px;height:3px;border-radius:3px;background:color-mix(in srgb,var(--ink) 12%,transparent)}
.esq i::after,.esqv i::after{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--p);border-radius:3px;background:#2E8B57}
.esq.perto i::after,.esqv.perto i::after{background:#C98200}.esq.baixo i::after,.esqv.baixo i::after{background:#B4472E}
.esq.baixo b,.esq.zero b,.esqv.baixo b,.esqv.zero b{color:#D0553A}.esq.zero{border-color:color-mix(in srgb,#B4472E 55%,transparent)}
.esqv{position:relative;padding-bottom:10px}.esqv i{left:auto;width:90px;right:0}
.esaj label{margin-bottom:4px}.essai{border-color:color-mix(in srgb,#B4472E 50%,var(--ln))}
.esbt{flex:1;margin:0;padding:11px;font-size:16px}.esb3{flex:0 0 52px;font-size:20px;line-height:1}
.esmais{margin:0 0 0 auto;flex:none}
.eshs{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.eshv small{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}.eshv b{display:block;font-size:26px;font-variant-numeric:tabular-nums}
.eshl{display:flex;align-items:center;gap:8px}.eslk span{white-space:nowrap}
.esgiro{margin:-2px 2px 12px;font-size:14px;color:var(--mut)}.esgiro b{color:var(--ink)}
.esinf{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}.esinf small{display:block;color:var(--mut);font-size:13px}.esinf b{display:block;overflow-wrap:anywhere}
.esfis{padding:12px 14px}.esfis summary{cursor:pointer;font-weight:600;color:var(--mut);list-style:none}.esfis summary::-webkit-details-marker{display:none}.esfis[open] summary{margin-bottom:10px}.esfis .igrid,.esfis>div{margin:0}
.esft{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;color:var(--mut);font-size:14px}.esft>span{display:flex;align-items:center;gap:6px;flex:1;min-width:140px}.esft>span svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}.esft .fbs{margin:0;display:flex;gap:6px}.esft .fbs button,.esft .fbs label{margin:0;padding:6px 10px;font-size:14px;min-height:36px}
.esms{padding:0;overflow:hidden}.esms .mais{margin:0;border-radius:0;border:0;border-top:1px solid var(--ln)}
.esm{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid var(--ln)}.esm:first-child{border-top:0}
.esma{flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px}.esm.en .esma{background:color-mix(in srgb,#2E8B57 18%,transparent);color:#3FA56C}.esm.sa .esma{background:color-mix(in srgb,#B4472E 18%,transparent);color:#D0553A}
.esmt{flex:1;min-width:0}.esmt b{display:block;font-variant-numeric:tabular-nums}.esmt small{display:block;color:var(--mut);font-size:13px;overflow-wrap:anywhere}
.esmd{flex:none;text-align:right}.esmd small{display:block;color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums}
.eslink{display:inline;margin:0;padding:0;border:0;background:none;color:var(--ink);text-decoration:underline;font:inherit;font-weight:600;min-height:0}
.esdt{display:flex;align-items:center;gap:8px;margin:0 0 12px;color:var(--mut)}.esdt b{color:var(--ink)}.esdt button{margin:0 0 0 auto}
.esdet{margin:4px 0 8px}
.escl{padding:0;overflow:hidden}.escr{display:flex;align-items:center;gap:10px;margin:0;padding:9px 12px;border-top:1px solid var(--ln)}.escr:first-child{border-top:0}
.esct{flex:1;min-width:0}.esct b{display:block;overflow-wrap:anywhere}.esct small{display:block;color:var(--mut);font-size:13px}
.escr input{flex:none;width:86px;margin:0;text-align:center;font-size:17px;font-variant-numeric:tabular-nums}
.escr.igual input{border-color:#2E8B57}.escr.dif input{border-color:#C98200}.escd{color:#C98200;font-weight:700}
.escsv{width:100%;margin:0}.escsv:disabled{opacity:.5}
`;
  document.head.appendChild(css);
})(window);
