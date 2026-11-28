/* Fio-Mar Gestor — esquemas-imp.js (2.55.0): importar um pacote de esquema elétrico (.zip) no Cadastro
   O pacote (gerado no projeto "Criador De Esquema Elétrico") traz:
     LEIA-ME.txt (lista das folhas), 1_PDF/*.pdf (esquema completo), 2_SVG_editavel/*folhaNN.svg,
     3_PNG_visualizacao/*folhaNN.png e 4_Dados_CSV_JSON/*.json (conectores, pinos, fusíveis e relés).
   Opcional: fiomar.json na raiz do pacote, para dizer marca, modelo, anos, motor e o sistema de cada folha.
   Importar de novo (revisão nova) ATUALIZA os mesmos esquemas (etiquetas pacote:… e item:…):
   favoritos e anotações continuam; conectores, pinos e os fusíveis do carro são trocados pelos do pacote.
   Tudo é gravado com o login do dono (RLS); nada vai para o código do app. */
(function (G) {
  'use strict';
  const $q = (s) => document.querySelector(s);
  const { cat, veic, modelo, marca, vNome, natural, res, online, msgErro, sheet } = ESQ.q;
  const C = ESQ.C;
  const LIM = 25 * 1048576;

  /* ---------- leitor de .zip (sem biblioteca: DecompressionStream do próprio navegador) ---------- */
  async function lerZip(file) {
    const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let e = buf.length - 22; const min = Math.max(0, buf.length - 65557);
    while (e >= min && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < min) throw new Error('O arquivo não é um .zip válido.');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const L = {};
    const td = new TextDecoder('utf-8');
    for (let i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('O .zip está com defeito.');
      const met = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), usz = dv.getUint32(p + 24, true);
      const fl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const nome = td.decode(buf.subarray(p + 46, p + 46 + fl)).replace(/\\/g, '/'); p += 46 + fl + xl + cl;
      if (nome.endsWith('/') || /(^|\/)(__MACOSX|\.DS_Store)/.test(nome)) continue;
      if (usz > 60 * 1048576) throw new Error('Arquivo grande demais dentro do .zip: ' + nome);
      const lfl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true), ini = off + 30 + lfl + lxl;
      L[nome] = { met, usz, dado: buf.subarray(ini, ini + csz) };
    }
    return L;
  }
  async function abre(x) {
    if (!x) return null; if (x.met === 0) return x.dado;
    if (x.met !== 8) throw new Error('Compressão do .zip não suportada.');
    if (typeof DecompressionStream == 'undefined') throw new Error('Este navegador não abre .zip. Atualize o Chrome ou o Safari.');
    return new Uint8Array(await new Response(new Blob([x.dado]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  }
  const texto = async (x) => (x ? new TextDecoder('utf-8').decode(await abre(x)).replace(/^﻿/, '') : '');
  ESQ.lerZip = lerZip;

  /* ---------- entender o pacote ---------- */
  const SIS = [[/igni[cç][aã]o|bobina|vela/i, 'Ignição'], [/ar[- ]condicionado|\bA\/C\b|climatiza|ventila[cç][aã]o interna/i, 'Ar-condicionado'], [/fus[ií]ve|^rel[eé]s?\b/i, 'Outros'],
    [/\bpartida\b(?! a frio)|motor de partida|alternador|carga da bateria/i, 'Partida e carga'], [/ilumina|farol|lanterna|luz /i, 'Iluminação'], [/painel|instrumento|quadro/i, 'Painel'],
    [/trava|vidro/i, 'Travas e vidros'], [/multim[ií]dia|r[aá]dio|som\b/i, 'Multimídia'], [/\bABS\b|airbag/i, 'ABS e airbag']];
  const sisDe = (t) => { const s = String(t || ''); for (const [re, n] of SIS) if (re.test(s)) return n; return 'Injeção' };
  function csv(t) {
    const L = []; let r = [], c = '', q = false;
    for (let i = 0; i < t.length; i++) { const ch = t[i];
      if (q) { if (ch == '"') { if (t[i + 1] == '"') { c += '"'; i++ } else q = false } else c += ch }
      else if (ch == '"') q = true; else if (ch == ',') { r.push(c); c = '' } else if (ch == '\n' || ch == '\r') { if (ch == '\r' && t[i + 1] == '\n') i++; r.push(c); c = ''; if (r.some((x) => x !== '')) L.push(r); r = [] } else c += ch }
    if (c !== '' || r.length) { r.push(c); L.push(r) }
    const h = (L.shift() || []).map((x) => x.trim()); return L.map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] || '').trim()])));
  }
  /* ---------- 2.58: dados técnicos dos componentes ----------
     1) "componentes" no dados.json, no fiomar.json ou num componentes.json:
        [{ nome, sigla, folha, tabelas: [{ titulo, colunas: [...], linhas: [[...]] }], notas: [...] }]
     2) sem isso, lê as folhas "Dados técnicos dos componentes" (SVG): título vermelho em negrito = componente,
        linha de cabeçalho com texto branco = colunas, textos da mesma altura = uma linha, itálico = observação. */
  const SIGLA_RE = /\b[A-Z][A-Z0-9]{1,5}\b/g, SIGLA_FORA = new Set(['UCE', 'ECU', 'PMS', 'NTC', 'PTC', 'CO', 'OBS', 'AC', 'A', 'V', 'MΩ', 'KΩ']);
  function siglaDe(t) {
    const s = String(t || ''), d = s.split(/\s+[—–-]\s+/);
    for (const p of [d[d.length - 1], d[0]]) { const m = (p || '').trim().match(/^([A-Z][A-Z0-9]{1,5})\b/); if (m && !SIGLA_FORA.has(m[1]) && d.length > 1) return m[1] }
    const L = (s.match(SIGLA_RE) || []).filter((x) => !SIGLA_FORA.has(x)); return L[0] || '';
  }
  const celula = (t) => { const s = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); return /^[—–-](\s*[—–-])*$/.test(s) ? '—' : s };
  function compSvg(txt, folha) {
    let doc; try { doc = new DOMParser().parseFromString(txt, 'image/svg+xml') } catch (z) { return [] }
    const T = [...doc.querySelectorAll('text')].map((t) => ({ x: +t.getAttribute('x') || 0, y: +t.getAttribute('y') || 0, sz: +t.getAttribute('font-size') || 0, cor: (t.getAttribute('fill') || '').toLowerCase(),
      b: /bold|[6-9]00/.test(t.getAttribute('font-weight') || ''), it: /italic/.test(t.getAttribute('font-style') || ''), t: (t.textContent || '').replace(/\s+/g, ' ').trim() })).filter((t) => t.t);
    if (!T.length) return [];
    /* o carimbo de baixo (Veículo / Folha / Revisão…) fica de fora */
    const rot = T.filter((t) => /^(Ve[ií]culo|Folha|Revis[aã]o|Data|Tipo)\b/i.test(t.t) && t.y > 150).map((t) => t.y);
    const corte = rot.length ? Math.min(...rot) - 3 : Infinity;
    const branco = (c) => /^#?(fff|ffffff|white)$/.test(c);
    const ehTit = (t) => t.b && t.sz >= 3 && t.sz < 3.9 && !branco(t.cor) && t.x < 60;
    const L = T.filter((t) => t.y < corte).sort((a, b) => a.y - b.y || a.x - b.x);
    const out = []; let cp = null, tb = null, lin = null, ly = null;
    const fechaLin = () => { if (lin && tb && lin.some((c) => c)) tb.linhas.push(lin.map(celula)); lin = null; ly = null };
    for (let i = 0; i < L.length; i++) {
      const t = L[i];
      if (ehTit(t)) {
        fechaLin(); const sg = siglaDe(t.t);
        /* "MAP — pressão × tensão" logo depois de "… — MAP": é outra tabela do mesmo componente */
        const ant = out[out.length - 1], mesma = ant && sg && ant.sigla == sg && new RegExp('^' + sg + '\\b').test(t.t);
        if (mesma) { cp = ant; tb = { titulo: t.t.replace(new RegExp('^' + sg + '\\s*[—–-]\\s*'), ''), colunas: [], linhas: [] }; cp.tabelas.push(tb) }
        else { cp = { nome: t.t.slice(0, 200), sigla: sg, folha: folha || null, tabelas: [], notas: [] }; tb = { titulo: '', colunas: [], linhas: [] }; cp.tabelas.push(tb); out.push(cp) }
        continue;
      }
      if (!cp) continue;
      if (branco(t.cor) && t.b) {
        /* cabeçalho: os textos brancos da mesma altura */
        fechaLin(); const H = [t]; while (L[i + 1] && Math.abs(L[i + 1].y - t.y) < 0.6 && branco(L[i + 1].cor)) H.push(L[++i]);
        if (tb.colunas.length || tb.linhas.length) { tb = { titulo: '', colunas: [], linhas: [] }; cp.tabelas.push(tb) }
        tb.colunas = H.sort((a, b) => a.x - b.x).map((h) => h.t); tb.xs = H.map((h) => h.x); continue;
      }
      if (t.it) { fechaLin(); cp.notas.push(t.t); continue }
      if (!tb.colunas.length) { fechaLin(); cp.notas.push(t.t); continue }
      if (ly == null || Math.abs(t.y - ly) > 0.6) { fechaLin(); lin = tb.colunas.map(() => ''); ly = t.y }
      let k = 0; tb.xs.forEach((x, j) => { if (t.x >= x - 1) k = j });
      lin[k] = lin[k] ? lin[k] + ' ' + t.t : t.t;
    }
    fechaLin();
    return out.map((c) => ({ ...c, tabelas: c.tabelas.filter((x) => x.linhas.length).map(({ titulo, colunas, linhas }) => ({ titulo, colunas, linhas })) })).filter((c) => c.tabelas.length || c.notas.length);
  }
  ESQ.compSvg = compSvg;
  function compJson(L) {
    return (Array.isArray(L) ? L : []).map((c, i) => {
      const tabs = Array.isArray(c.tabelas) ? c.tabelas : c.colunas || c.linhas ? [{ titulo: '', colunas: c.colunas || [], linhas: c.linhas || [] }] : Array.isArray(c.valores) ? [{ titulo: '', colunas: ['Item', 'Valor'], linhas: c.valores.map((v) => Array.isArray(v) ? v : [v.item, v.valor]) }] : [];
      return { nome: String(c.nome || c.componente || '').trim().slice(0, 200), sigla: String(c.sigla || siglaDe(c.nome || '')).trim().slice(0, 20), folha: +c.folha || null,
        tabelas: tabs.map((t) => ({ titulo: String(t.titulo || ''), colunas: (t.colunas || []).map(String), linhas: (t.linhas || []).filter(Array.isArray).map((r) => r.map(celula)) })).filter((t) => t.linhas.length),
        notas: (Array.isArray(c.notas) ? c.notas : c.notas ? [c.notas] : []).map((x) => String(x).trim()).filter(Boolean) };
    }).filter((c) => c.nome && (c.tabelas.length || c.notas.length));
  }
  ESQ.compJson = compJson;
  async function pacote(file) {
    const Z = await lerZip(file), nomes = Object.keys(Z);
    const ach = (re) => nomes.filter((n) => re.test(n)).sort(natural);
    const leia = await texto(Z[ach(/(^|\/)LEIA-?ME[^/]*\.txt$/i)[0]]);
    let man = null; const mf = ach(/(^|\/)fiomar\.json$/i)[0]; if (mf) { try { man = JSON.parse(await texto(Z[mf])) } catch (z) { throw new Error('O fiomar.json do pacote está com erro.') } }
    let dados = null;
    for (const n of ach(/\.json$/i)) { if (/fiomar\.json$/i.test(n)) continue; try { const j = JSON.parse(await texto(Z[n])); if (j && (j.conectores || j.fusiveis_reles)) { dados = j; break } } catch (z) {} }
    if (!dados) { const cp = ach(/conectores?_?pinos?\.csv$/i)[0], fu = ach(/fus[ií]veis.*\.csv$/i)[0]; if (cp || fu) dados = { conectores: cp ? csv(await texto(Z[cp])) : [], fusiveis_reles: fu ? csv(await texto(Z[fu])) : [] } }
    const pdfN = ach(/\.pdf$/i)[0], svgs = {}, pngs = {};
    ach(/folha\s*0*(\d+)\.svg$/i).forEach((n) => { svgs[+n.match(/folha\s*0*(\d+)\.svg$/i)[1]] = n });
    ach(/folha\s*0*(\d+)\.png$/i).forEach((n) => { pngs[+n.match(/folha\s*0*(\d+)\.png$/i)[1]] = n });
    if (!pdfN && !Object.keys(svgs).length) throw new Error('Não achei o PDF nem as folhas (SVG) dentro do pacote.');
    /* chave do pacote: nome da pasta sem a revisão */
    const raiz = (nomes[0] || file.name).split('/')[0].replace(/\.zip$/i, '');
    const chave = (man && man.chave) || nrm(raiz.replace(/[_ -]rev\.?\s*[a-z0-9]+$/i, '')).replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '') || 'pacote';
    const rev = String((man && man.revisao) || (dados && dados.revisao) || (raiz.match(/rev\.?\s*([a-z0-9]+)$/i) || [])[1] || 'A').toUpperCase();
    /* carro: "Fiat Palio 1.0 8V Evo (2012-2017)" */
    const vs = String((man && man.veiculo) || (dados && dados.veiculo) || (leia.split('\n')[0] || '').replace(/^ESQUEMA EL[EÉ]TRICO\s*[—-]\s*/i, '') || raiz);
    const anosT = (vs.match(/(19|20)\d{2}/g) || []).map(Number), nomeV = vs.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().split(' ');
    const tudo = (leia + ' ' + JSON.stringify(dados || {})).toLowerCase();
    const carro = { marca: (man && man.marca) || nomeV[0] || '', modelo: (man && man.modelo) || nomeV[1] || '', motor: (man && man.motor) || nomeV.slice(2).join(' '), ano_inicio: (man && man.ano_inicio) || anosT[0] || null, ano_fim: (man && man.ano_fim) || anosT[1] || null,
      combustivel: (man && man.combustivel) || (/flex|partida a frio/.test(tudo) ? 'Flex' : ''), versao: (man && man.versao) || '' };
    /* folhas: lista do LEIA-ME ("1 Alimentação…   8 Comando do A/C…") */
    /* bloco "FOLHAS": as linhas até a primeira linha em branco */
    const tit = {}, LL = leia.replace(/\r/g, '').split('\n'), i0 = LL.findIndex((l) => /^\s*FOLHAS\s*$/i.test(l)), bl = [];
    if (i0 >= 0) for (let i = i0 + 1; i < LL.length && LL[i].trim(); i++) bl.push(LL[i]);
    /* cada linha pode ter 2 colunas ("6 Partida a frio … 13 Observações"): corta onde começa um número de folha que existe */
    const temF = new Set(Object.keys(svgs).map(Number));
    bl.forEach((l) => {
      const ini = []; const re = /(^|\s)(\d{1,2})\s+(?=\D)/g; let m;
      while ((m = re.exec(l))) { const n = +m[2]; if (temF.has(n) || !temF.size) ini.push({ n, i: m.index + m[1].length, f: re.lastIndex }) }
      ini.forEach((x, k) => { const t = l.slice(x.f, k + 1 < ini.length ? ini[k + 1].i : l.length).trim(); if (t && !tit[x.n]) tit[x.n] = t.replace(/\s+—\s+/g, ', ') });
    });
    const mf2 = {}; ((man && man.folhas) || []).forEach((f) => { mf2[+f.n] = f });
    const nums = [...new Set([...Object.keys(svgs), ...Object.keys(tit)].map(Number))].filter((n) => svgs[n]).sort((a, b) => a - b);
    const folhas = nums.map((n) => { const t = (mf2[n] && mf2[n].titulo) || tit[n] || 'Folha ' + n;
      return { n, titulo: t, sistema: (mf2[n] && mf2[n].sistema) || sisDe(t), tags: (mf2[n] && mf2[n].tags) || [], usar: mf2[n] ? mf2[n].usar !== false : !/legenda|observa/i.test(t), svg: svgs[n], png: pngs[n] } });
    const npdf = pdfN ? (tit && Object.keys(tit).length) || null : null;
    const j0 = LL.findIndex((l) => /PONTOS A CONFERIR/i.test(l)), cf = [];
    if (j0 >= 0) for (let i = j0 + 1; i < LL.length && LL[i].trim(); i++) cf.push(LL[i].trim());
    const conferir = cf.join('\n');
    const sistemaInj = (dados && dados.sistema) || (man && man.sistema) || '';
    /* dados dos componentes: do JSON, se houver; senão, das folhas "Dados técnicos" */
    let comp = compJson((dados && dados.componentes) || (man && man.componentes));
    if (!comp.length) { const cj = ach(/componentes[^/]*\.json$/i)[0]; if (cj) { try { const j = JSON.parse(await texto(Z[cj])); comp = compJson(Array.isArray(j) ? j : j.componentes) } catch (z) {} } }
    let compDe = comp.length ? 'json' : '';
    if (!comp.length) for (const f of folhas.filter((x) => /dados t[eé]cnicos|componentes/i.test(x.titulo))) comp.push(...compSvg(await texto(Z[f.svg]), f.n));
    if (!compDe && comp.length) compDe = 'folhas';
    /* "TPS — resistência…" na folha seguinte continua o "… — TPS" de antes */
    comp = comp.reduce((L, c) => { const a = L[L.length - 1]; if (a && c.sigla && a.sigla == c.sigla && new RegExp('^' + c.sigla + '\\b').test(c.nome)) { c.tabelas.forEach((t) => a.tabelas.push({ ...t, titulo: t.titulo || c.nome.replace(new RegExp('^' + c.sigla + '\\s*[—–-]\\s*'), '') })); a.notas.push(...c.notas) } else L.push(c); return L }, []);
    return { Z, file, chave, rev, carro, folhas, pdf: pdfN, png1: pngs[1] || pngs[Object.keys(pngs)[0]], paginas: npdf,
      con: ((dados && dados.conectores) || []).filter((p) => p.conector && p.pino), fus: ((dados && dados.fusiveis_reles) || []).filter((f) => f.posicao || f.circuito),
      sistemaInj, comp, compDe, obs: (dados && dados.observacao) || '', conferir, completo: { titulo: ((man && man.titulo) || ('Esquema completo' + (sistemaInj ? ' ' + sistemaInj.replace(/^Marelli\s+/i, '') : ''))), sistema: (man && man.sistema_app) || 'Injeção' } };
  }
  ESQ.pacote = pacote;

  /* ---------- tela de importação (dono) ---------- */
  let PK = null, ANT = [], EST = { fase: '', p: 0, msg: '', erro: '' };
  G.esqImpEscolhe = function () {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.zip,application/zip,application/x-zip-compressed'; i.style.display = 'none';
    i.onchange = () => { const f = i.files && i.files[0]; i.remove(); if (f) esqImpAbre(f) };
    document.body.appendChild(i); i.click();
  };
  G.esqImpAbre = async function (f) {
    if (!online()) return toast('Sem internet: importar precisa de conexão.', 'erro');
    EST = { fase: 'lendo', p: 0, msg: 'Lendo o pacote…', erro: '' }; PK = null; go('esqadm', null, null, { imp: 1 });
    try {
      PK = await pacote(f);
      ANT = await res(SB.from('esq_esquemas').select('id,veiculo_id,tags,arquivo_path,miniatura_path,titulo').eq('oficina_id', OF).contains('tags', ['pacote:' + PK.chave]));
      if (ANT.length) { const v = veic(ANT[0].veiculo_id); if (v) { const m = modelo(v.modelo_id); Object.assign(PK.carro, { marca: marca(m.marca_id).nome || PK.carro.marca, modelo: m.nome || PK.carro.modelo }) } }
      EST = { fase: 'ver', p: 0, msg: '', erro: '' };
    } catch (z) { EST = { fase: 'erro', erro: z.message && !/fetch/i.test(z.message) ? z.message : msgErro(z) } }
    if (S.v == 'esqadm') render();
  };
  const revDe = (tags) => ((tags || []).find((t) => /^rev /.test(t)) || '').slice(4);
  ESQ.telaImp = function (topo) {
    const h = topo('Importar pacote', "go('esqadm')");
    if (EST.fase == 'lendo' || (!PK && !EST.fase)) return h + `<div class="card esq-load" role="status"><span class="esq-spin"></span>${e(EST.msg || 'Lendo o pacote…')}</div>` + (!PK && !EST.fase ? '<div class="bar"><button type="button" class="pr esq-bt" onclick="esqImpEscolhe()">Escolher o .zip</button></div>' : '');
    if (EST.fase == 'erro' && !PK) return h + `<div class="esq-msg erro" role="alert">${e(EST.erro)}<div class="bar"><button type="button" class="pr esq-bt" onclick="esqImpEscolhe()">Escolher outro .zip</button></div></div>`;
    const P = PK, c = P.carro, ant = ANT.find((x) => (x.tags || []).includes('item:completo')) || ANT[0];
    const SS = cat().sistemas.slice().sort((a, b) => (a.ordem || 100) - (b.ordem || 100) || natural(a.nome, b.nome));
    const opS = (v) => SS.map((s) => `<option ${s.nome == v ? 'selected' : ''}>${e(s.nome)}</option>`).join('');
    const rodando = EST.fase == 'indo';
    const ok = EST.fase == 'pronto';
    return h + `<div class="esq-box"><form class="esq-form esq-af" id="esq-imp" onsubmit="event.preventDefault();esqImpVai(this)">
      ${ant ? `<div class="esq-msg" style="margin:0 0 12px;border-style:solid;border-color:#E67E22">Este pacote já foi importado${revDe(ant.tags) ? ' (Rev. ' + e(revDe(ant.tags)) + ')' : ''}. Importar agora <b>atualiza</b> para a Rev. ${e(P.rev)}: favoritos e anotações continuam; conectores, pinos, fusíveis e dados dos componentes deste carro são trocados pelos do pacote.</div>` : ''}
      <div class="esq-h" style="margin-top:0"><h2>Carro</h2><small>Rev. ${e(P.rev)}</small></div>
      <div class="dois"><label>Marca<input name="ma" value="${e(c.marca)}" required></label><label>Modelo<input name="mo" value="${e(c.modelo)}" required></label></div>
      <div class="dois"><label>Ano inicial<input name="a1" inputmode="numeric" maxlength="4" value="${e(c.ano_inicio || '')}"></label><label>Ano final<input name="a2" inputmode="numeric" maxlength="4" value="${e(c.ano_fim || '')}"></label></div>
      <div class="dois"><label>Motor<input name="mt" value="${e(c.motor)}"></label><label>Combustível<select name="cb">${['', 'Flex', 'Gasolina', 'Etanol', 'Diesel', 'GNV', 'Híbrido', 'Elétrico'].map((x) => `<option value="${x}" ${x == c.combustivel ? 'selected' : ''}>${x || '—'}</option>`).join('')}</select></label></div>
      <div class="esq-h"><h2>O que vai entrar</h2></div>
      ${P.pdf ? `<div class="esq-row"><span class="tx"><b>${e(P.completo.titulo)} (Rev. ${e(P.rev)})</b><small>PDF completo · ${P.paginas ? plural(P.paginas, 'folha', 'folhas') + ' · ' : ''}${plural(new Set(P.con.map((x) => x.conector)).size, 'conector', 'conectores')} e ${plural(P.con.length, 'pino', 'pinos')}</small></span><select name="sc" aria-label="Sistema do esquema completo" style="max-width:44%">${opS(P.completo.sistema)}</select></div>` : ''}
      ${P.folhas.map((f, i) => `<div class="esq-row"><label style="flex-direction:row;align-items:center;gap:10px;margin:0;flex:1;min-width:0;font-weight:400"><input type="checkbox" name="u${i}" ${f.usar ? 'checked' : ''} style="width:24px;min-height:24px;flex:none"><span class="tx"><b>Folha ${f.n}</b> · ${e(f.titulo)}</span></label><select name="s${i}" aria-label="Sistema da folha ${f.n}" style="max-width:44%">${opS(f.sistema)}</select></div>`).join('')}
      ${P.comp.length ? `<div class="esq-row"><span class="tx"><b>Dados dos componentes</b><small>${plural(P.comp.length, 'componente', 'componentes')} · ${plural(P.comp.reduce((a, c) => a + c.tabelas.reduce((b, t) => b + t.linhas.length, 0), 0), 'valor', 'valores')}${P.compDe == 'folhas' ? ' · lidos das folhas ' + [...new Set(P.comp.map((c) => c.folha).filter(Boolean))].join(', ') : ''}</small></span></div>` : ''}
      <div class="esq-row"><span class="tx"><b>Fusíveis e relés</b><small>${plural(P.fus.filter((x) => !/rel/i.test(x.tipo || '')).length, 'fusível', 'fusíveis')} e ${plural(P.fus.filter((x) => /rel/i.test(x.tipo || '')).length, 'relé', 'relés')}</small></span></div>
      ${P.conferir ? `<details style="margin-top:8px"><summary style="min-height:44px;display:flex;align-items:center">Pontos a conferir no carro (do pacote)</summary><p style="white-space:pre-wrap;font-size:15px">${e(P.conferir)}</p></details>` : ''}
      ${rodando || ok || EST.erro ? `<div class="esq-msg${EST.erro ? ' erro' : ''}" role="status" aria-live="polite" style="margin-top:12px">${EST.erro ? e(EST.erro) : e(EST.msg)}<div class="esq-prog"${rodando ? '' : ' hidden'}><i style="width:${Math.round(EST.p * 100)}%"></i></div></div>` : ''}
      <div class="bar" style="margin-top:14px">${ok ? `<button type="button" class="pr esq-bt" onclick="go('esq',null,null,{vv:'${EST.vv}'})">Ver os esquemas do carro</button>` : `<button type="button" class="esq-bt" onclick="esqImpEscolhe()" ${rodando ? 'disabled' : ''}>Outro .zip</button><span class="sp"></span><button class="pr esq-bt" ${rodando ? 'disabled' : ''}>${rodando ? 'Importando…' : EST.erro ? 'Tentar de novo' : ant ? 'Atualizar' : 'Importar'}</button>`}</div>
    </form></div>`;
  };
  const passo = (p, msg) => { EST.p = p; EST.msg = msg; const b = $q('#esq-imp .esq-prog i'); if (b) b.style.width = Math.round(p * 100) + '%'; const m = $q('#esq-imp .esq-msg[role=status]'); if (m && m.firstChild) m.firstChild.textContent = msg };
  /* miniatura JPG a partir da PNG da folha (ou do próprio arquivo) */
  async function miniPng(bytes) {
    const bm = await createImageBitmap(new Blob([bytes], { type: 'image/png' })), w = 360, h = Math.round((bm.height * w) / bm.width);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(bm, 0, 0, w, h);
    return new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.78));
  }
  G.esqImpVai = async function (form) {
    if (!PK || EST.fase == 'indo') return; if (!online()) return toast('Sem internet: importar precisa de conexão.', 'erro');
    const P = PK, f = form, num = (n) => { const v = String(f[n].value || '').trim(); return v ? +v : null };
    const carro = { marca: f.ma.value.trim(), modelo: f.mo.value.trim(), ano_inicio: num('a1'), ano_fim: num('a2'), motor: f.mt.value.trim() || null, combustivel: f.cb.value || null };
    if (!carro.marca || !carro.modelo) return toast('Informe a marca e o modelo');
    const ano = (a) => a == null || (Number.isInteger(a) && a >= 1950 && a <= 2100); if (!ano(carro.ano_inicio) || !ano(carro.ano_fim) || (carro.ano_inicio && carro.ano_fim && carro.ano_fim < carro.ano_inicio)) return toast('Confira os anos');
    P.folhas.forEach((x, i) => { x.usar = !!f['u' + i].checked; x.sistema = f['s' + i].value }); if (f.sc) P.completo.sistema = f.sc.value;
    const sisId = (n) => (cat().sistemas.find((s) => s.nome == n && !s.oficina_id) || cat().sistemas.find((s) => s.nome == n) || {}).id;
    EST = { fase: 'indo', p: 0.02, msg: 'Preparando…', erro: '' }; render();
    const st = SB.storage.from('esquemas'), velhos = [], marcaT = Date.now().toString(36);
    try {
      /* 1) carro: o do pacote já importado, ou um igual no catálogo, ou novo */
      passo(0.04, 'Cadastrando o carro…');
      const M = await ESQ.adm.achaMarca(carro.marca), MO = await ESQ.adm.achaModelo(M, carro.modelo);
      const rowV = { oficina_id: OF, modelo_id: MO.id, ano_inicio: carro.ano_inicio, ano_fim: carro.ano_fim, motor: carro.motor, combustivel: carro.combustivel };
      let vid = (ANT[0] && ANT[0].veiculo_id) || (cat().veiculos.find((v) => v.modelo_id == MO.id && (v.ano_inicio || null) == carro.ano_inicio && nrm(v.motor || '') == nrm(carro.motor || '')) || {}).id;
      const V = vid ? await res(SB.from('esq_veiculos').update(rowV).eq('id', vid).select().single()) : await res(SB.from('esq_veiculos').insert(rowV).select().single());
      vid = V.id; { const L = cat().veiculos, i = L.findIndex((x) => x.id == vid); if (i >= 0) L[i] = V; else L.push(V) }
      /* 2) itens: completo (PDF) + folhas (SVG) */
      const itens = [];
      if (P.pdf) itens.push({ k: 'completo', titulo: P.completo.titulo + ' (Rev. ' + P.rev + ')', sistema: P.completo.sistema, tipo: 'pdf', arq: P.pdf, png: P.png1, mime: 'application/pdf', ext: 'pdf',
        desc: [P.sistemaInj, 'Revisão ' + P.rev, P.paginas ? plural(P.paginas, 'folha', 'folhas') : ''].filter(Boolean).join(' · ') + '.' + (P.obs ? ' ' + P.obs : '') + (P.conferir ? '\n\nConferir no carro:\n' + P.conferir : ''),
        tags: ['completo', P.sistemaInj, ...new Set(P.con.map((x) => x.conector))].filter(Boolean).slice(0, 24) });
      P.folhas.filter((x) => x.usar).forEach((x) => itens.push({ k: 'f' + String(x.n).padStart(2, '0'), titulo: 'Folha ' + x.n + ' · ' + x.titulo, sistema: x.sistema, tipo: 'svg', arq: x.svg, png: x.png, mime: 'image/svg+xml', ext: 'svg',
        desc: 'Folha ' + x.n + (P.paginas ? ' de ' + P.paginas : '') + ' do esquema completo' + (P.sistemaInj ? ' (' + P.sistemaInj + ', Rev. ' + P.rev + ')' : ' (Rev. ' + P.rev + ')') + '.', tags: x.tags || [] }));
      let feito = 0, idCompleto = null;
      for (const it of itens) {
        const pa = 0.08 + (feito / itens.length) * 0.62; passo(pa, (it.k == 'completo' ? 'Enviando o PDF completo' : 'Enviando a ' + it.titulo.split(' · ')[0].toLowerCase()) + ` (${feito + 1} de ${itens.length})…`);
        const sid = sisId(it.sistema); if (!sid) throw new Error('Sistema não encontrado: ' + it.sistema);
        const tags = [...new Set([...(it.tags || []), 'pacote:' + P.chave, 'item:' + it.k, 'rev ' + P.rev])];
        const row = { oficina_id: OF, veiculo_id: vid, sistema_id: sid, titulo: it.titulo, descricao: it.desc, tags };
        const ja = ANT.find((x) => (x.tags || []).includes('item:' + it.k));
        const r = ja ? await res(SB.from('esq_esquemas').update(row).eq('id', ja.id).select().single()) : await res(SB.from('esq_esquemas').insert(row).select().single());
        const bytes = await abre(P.Z[it.arq]); if (bytes.length > LIM) throw new Error(it.titulo + ': arquivo maior que 25 MB.');
        const blob = new Blob([bytes], { type: it.mime });
        let min = null; try { min = it.png ? await miniPng(await abre(P.Z[it.png])) : (await ESQ.preparaMin(blob, { tipo: it.tipo })).min } catch (z) {}
        let paginas = 1; if (it.tipo == 'pdf') { try { const d = await ESQ.abrePdf(new Uint8Array(bytes)); paginas = d.numPages; d.destroy() } catch (z) { throw new Error('O PDF do pacote não abriu (pode estar com defeito).') } }
        const base = `${OF}/${r.id}-rev${P.rev}-${marcaT}`;
        const u1 = await st.upload(base + '.' + it.ext, blob, { contentType: it.mime, upsert: true, cacheControl: '3600' }); if (u1.error) throw u1.error;
        let mp = null; if (min) { const u2 = await st.upload(base + '-min.jpg', min, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' }); if (!u2.error) mp = base + '-min.jpg' }
        if (ja) velhos.push(ja.arquivo_path, ja.miniatura_path);
        const r2 = await res(SB.from('esq_esquemas').update({ arquivo_path: base + '.' + it.ext, miniatura_path: mp, tipo: it.tipo, paginas }).eq('id', r.id).select().single());
        { const L = cat().esquemas, i = L.findIndex((x) => x.id == r2.id); if (i >= 0) L[i] = r2; else L.push(r2) }
        delete C.blob[r2.id]; delete C.thumb[r2.id]; if (C.off[r2.id]) { delete C.off[r2.id]; IDB.del('esq:arq:' + r2.id) }
        if (it.k == 'completo') { idCompleto = r2.id; P.paginas = paginas }
        feito++;
      }
      IDB.set('esq:off:' + OF, C.off);
      /* 3) conectores e pinos (no esquema completo; sem PDF, na primeira folha) */
      const alvo = idCompleto || (cat().esquemas.find((x) => x.veiculo_id == vid && (x.tags || []).includes('pacote:' + P.chave)) || {}).id;
      if (alvo && P.con.length) {
        passo(0.75, 'Gravando conectores e pinos…');
        await res(SB.from('esq_conectores').delete().eq('esquema_id', alvo));
        const nomes = [...new Set(P.con.map((x) => String(x.conector).trim()))];
        const cs = await res(SB.from('esq_conectores').insert(nomes.map((n) => ({ oficina_id: OF, esquema_id: alvo, codigo: n.slice(0, 80) }))).select());
        const idc = {}; cs.forEach((x) => { idc[x.codigo] = x.id });
        const pins = P.con.map((x) => ({ oficina_id: OF, conector_id: idc[String(x.conector).trim().slice(0, 80)], numero: String(x.pino).trim(), cor_fio: (x.cor_fio || '').trim() || null, funcao: (x.funcao || '').trim() || null, valor_esperado: (x.valor_esperado || '').trim() || null }));
        for (let i = 0; i < pins.length; i += 200) await res(SB.from('esq_pinos').insert(pins.slice(i, i + 200)));
        delete C.det[alvo]; IDB.del('esq:det:' + alvo);
      }
      /* 4) fusíveis e relés do carro */
      if (P.fus.length) {
        passo(0.88, 'Gravando fusíveis e relés…');
        await res(SB.from('esq_fusiveis').delete().eq('veiculo_id', vid));
        const L = P.fus.map((x) => { const a = String(x.amperagem || '').replace(/[^0-9,.]/g, '').replace(',', '.'), cx = String(x.caixa || '').trim();
          return { oficina_id: OF, veiculo_id: vid, tipo: /rel/i.test(x.tipo || '') ? 'rele' : 'fusivel', caixa: !cx || /^n\/?i$/i.test(cx) ? 'Caixa não informada no manual' : cx, localizacao_caixa: (x.localizacao_caixa || x.localizacao || '').trim() || null, posicao: String(x.posicao || '').trim() || null, amperagem: a ? +a : null, circuito: (x.circuito || '').trim() || null } });
        await res(SB.from('esq_fusiveis').insert(L)); delete C.fus[vid]; IDB.del('esq:fus:' + vid);
      }
      /* 4b) dados técnicos dos componentes (só os deste pacote são trocados) */
      let compOk = '';
      if (P.comp.length) {
        passo(0.93, 'Gravando os dados dos componentes…');
        try {
          await res(SB.from('esq_componentes').delete().eq('veiculo_id', vid).eq('pacote', P.chave));
          const rows = P.comp.map((c, i) => ({ oficina_id: OF, veiculo_id: vid, ordem: i, nome: c.nome, sigla: c.sigla || null, tabelas: c.tabelas, notas: c.notas, folha: c.folha, pacote: P.chave }));
          const ins = await res(SB.from('esq_componentes').insert(rows).select());
          const CL = cat().componentes || (C.cat.componentes = []);
          for (let i = CL.length - 1; i >= 0; i--) if (CL[i].veiculo_id == vid && CL[i].pacote == P.chave) CL.splice(i, 1);
          CL.push(...ins);
        } catch (z) { compOk = ' Os dados dos componentes não foram gravados (' + msgErro(z) + ').' }
      }
      /* 5) arquivos da revisão anterior saem do servidor */
      const fora = velhos.filter(Boolean); if (fora.length) st.remove(fora).catch(() => {});
      IDB.set('esq:cat:' + OF, { ...cat(), em: Date.now() });
      EST = { fase: 'pronto', p: 1, msg: `Pronto: ${plural(itens.length, 'esquema', 'esquemas')}, ${plural(P.con.length, 'pino', 'pinos')} ${P.comp.length && !compOk ? ', ' + plural(P.fus.length, 'fusível/relé', 'fusíveis/relés') + ' e ' + plural(P.comp.length, 'componente', 'componentes') : ' e ' + plural(P.fus.length, 'fusível/relé', 'fusíveis/relés')} do ${carro.marca} ${carro.modelo} (Rev. ${P.rev}).${compOk}`, erro: '', vv: vid };
      ANT = await res(SB.from('esq_esquemas').select('id,veiculo_id,tags,arquivo_path,miniatura_path,titulo').eq('oficina_id', OF).contains('tags', ['pacote:' + P.chave])).catch(() => ANT);
      toast('Pacote importado');
    } catch (z) {
      const m = String((z && z.message) || z || ''); EST.fase = 'ver'; EST.erro = 'Parou no meio: ' + (/row-level|42501/.test(m) ? 'só o dono pode importar.' : /exceeded|size/i.test(m) ? 'arquivo maior que 25 MB.' : m && !/fetch/i.test(m) ? m : msgErro(z)) + ' Tocar em "Tentar de novo" continua de onde parou, sem duplicar.';
      ANT = await res(SB.from('esq_esquemas').select('id,veiculo_id,tags,arquivo_path,miniatura_path,titulo').eq('oficina_id', OF).contains('tags', ['pacote:' + P.chave])).catch(() => ANT);
    }
    if (S.v == 'esqadm') render();
  };
})(window);
