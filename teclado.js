/* Fio-Mar Gestor — teclado.js (2.47.0): teclado certo em cada campo
   Olha cada campo que aparece na tela (pelo nome, id, rótulo e exemplo) e escolhe o teclado:
   - só números (km, ano, CPF/CNPJ, CEP, NCM, parcelas, minutos, dias…);
   - números com vírgula (valores em R$, %, horas, quantidade);
   - telefone; e-mail; endereço de site;
   - letras maiúsculas (placa, chassi, código de falha, UF, referência da peça);
   - nomes com a primeira letra maiúscula, sem o celular sugerir o nome do dono.
   Também: botão "Próximo" no teclado dos formulários (Enter passa para o campo seguinte,
   e só o último salva) e "Buscar" nos campos de busca. */
(function (G) {
  const nr = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const PULA = /^(file|checkbox|radio|hidden|button|submit|reset|range|color|date|time|datetime-local|month|week|password|image)$/;
  const NAOTXT = /^(file|checkbox|radio|hidden|button|submit|reset|range|color|date|time|datetime-local|month|week|image)$/;

  /* [teclado, testes por nome/id, testes pelo rótulo] — o primeiro que bater vale */
  const NUM = 'numeric', DEC = 'decimal';
  const REG = [
    /* letras maiúsculas */
    ['placa', /^(placa|cipl|pl|plc|placa\d)$/, /^placa\b/],
    ['maius', /^(chassi|vin|uf|cod|dgcode|dgcd|cfopx)$/, /^(chassi|uf|codigo \/ referencia|codigo de falha|codigo dtc)/],
    /* só números */
    [NUM, /^(km|cikm|ano|ciano|parc|dur|min|revmeses|cep|doc|cpf|cnpj|ncm|cest|cfop|csosn|ibge|qval|gar|dias)$/,
      /^(km|quilometragem|ano$|ano do|parcelas|duracao|minutos|lembrar troca|cep|cpf|cnpj|ncm|cest|cfop|csosn|codigo ibge|validade no pdf|garantia ao entregar)/],
    /* números com vírgula */
    [DEC, /^(valor|v|custo|preco|horas|txp|txdeb|txcred|txp6|txp12|q|qtd)$/,
      /(\(r\$|^r\$|\(%\)|^valor|^preco|^custo|^horas de mao|^taxa|^desconto|^quantidade|^chegou$)/],
    /* telefone */
    ['tel', /^(tel|tel1|tel2|ftel|ctel|citel|telefone|fone|whats|whatsapp|celular)$/, /^(telefone|whatsapp|celular)/],
    /* e-mail e site */
    ['email', /^(email|le|e-mail)$/, /^e-?mail/],
    ['url', /^(su|url|site)$/, /^(project url|site)/],
    /* nomes */
    ['nome', /^(nome|cnome|cinome|ln|forn|pixnome|razao|mec|n|oficina|cidade|bairro|mun|cor|modelo|cimod|cicor|tec|resp)$/,
      /^(nome|seu nome|cliente$|fornecedor|nome do favorecido|razao social|mecanico|outro nome|cidade|bairro|municipio|cor$|marca\/modelo|tecnico responsavel|responsavel)/]
  ];

  function rotulo(el) {
    const l = el.closest('label');
    let t = '';
    if (l) { const c = l.cloneNode(true); c.querySelectorAll('input,textarea,select,datalist,.cbl').forEach(x => x.remove()); t = c.textContent; }
    if (!t && el.id) { const f = document.querySelector('label[for="' + el.id + '"]'); if (f) t = f.textContent; }
    return nr(t || el.getAttribute('aria-label') || '');
  }

  function tipo(el) {
    if (el.dataset.tk) return el.dataset.tk;
    if (el.closest('.vzf')) return '';
    const k = nr(el.name || el.id || '').replace(/^dgcy\d$/, 'dec');
    const r = rotulo(el);
    if (/valor medido|valor depois|valor ou resultado/.test(r + ' ' + nr(el.placeholder) + ' ' + nr(el.getAttribute('aria-label')))) return 'medida';
    /* buscas que aceitam placa, nome e telefone juntos ficam no teclado de letras */
    if (el.type === 'search' || /buscar|digite para buscar|placa, nome/.test(nr(el.placeholder))) return 'busca';
    if (el.classList.contains('cbi')) return 'busca';
    if (el.name === 'pix') return 'pix';
    for (const [t, rk, rr] of REG) { if (rk.test(k) || (rr && r && rr.test(r))) return t; }
    if (/^dec$/.test(k)) return DEC;
    return '';
  }

  function pixModo(el) {
    const f = el.form || el.closest('form'), s = f && f.querySelector('[name=pixtipo]');
    const v = nr(s && s.value);
    return /telefone/.test(v) ? 'tel' : /cpf|cnpj/.test(v) ? NUM : /mail/.test(v) ? 'email' : 'livre';
  }

  function aplica(el, t) {
    const set = (a, v) => { if (el.getAttribute(a) !== v) el.setAttribute(a, v); };
    const sem = () => { set('autocomplete', 'off'); set('autocorrect', 'off'); el.spellcheck = false; };
    if (t === 'pix') t = pixModo(el);
    switch (t) {
      case NUM: set('inputmode', 'numeric'); sem(); break;
      case DEC: set('inputmode', 'decimal'); sem(); break;
      case 'tel': if (el.type === 'text') el.type = 'tel'; set('inputmode', 'tel'); sem(); break;
      case 'email': set('inputmode', 'email'); set('autocapitalize', 'none'); set('autocorrect', 'off'); el.spellcheck = false; break;
      case 'url': set('inputmode', 'url'); set('autocapitalize', 'none'); sem(); break;
      case 'placa': case 'maius': set('autocapitalize', 'characters'); sem(); if (el.tagName === 'INPUT' && el.inputMode) el.removeAttribute('inputmode'); break;
      case 'nome': set('autocapitalize', 'words'); set('autocomplete', el.id === 'ln' ? 'name' : 'off'); break;
      case 'medida': set('autocapitalize', 'none'); set('autocorrect', 'off'); el.spellcheck = false; break;
      case 'busca': set('enterkeyhint', 'search'); if (!el.getAttribute('autocomplete')) set('autocomplete', 'off'); break;
      case 'livre': el.removeAttribute('inputmode'); set('autocapitalize', 'none'); sem(); break;
    }
    el.dataset.tkv = t || '-';
  }

  /* campos de texto de um formulário, na ordem da tela */
  const CAMPO = 'input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([disabled]):not([readonly]),select:not([disabled]),textarea:not([disabled]):not([readonly])';
  const visivel = x => x.getClientRects().length > 0 && !x.closest('[hidden]');
  function campos(f) { return [...f.querySelectorAll(CAMPO)].filter(visivel); }

  function proximo(el) {
    const f = el.form; if (!f) return null;
    const L = campos(f), i = L.indexOf(el);
    for (let j = i + 1; j < L.length; j++) { const x = L[j]; if (x.tagName !== 'SELECT' && !NAOTXT.test(x.type || '')) return x; }
    return null;
  }

  function dica(el) {
    if (el.tagName !== 'INPUT' || PULA.test(el.type) || el.dataset.tkv === 'busca') return;
    if (!el.form || el.hasAttribute('onkeydown') || el.classList.contains('cbi')) return;
    el.setAttribute('enterkeyhint', proximo(el) ? 'next' : 'done');
  }

  function trata(el) {
    if (!el || !el.matches || !el.matches('input,textarea') || PULA.test(el.type || '')) return;
    if (el.tagName === 'TEXTAREA') { if (!el.hasAttribute('enterkeyhint')) el.setAttribute('enterkeyhint', 'enter'); return; }
    aplica(el, tipo(el));
  }

  function varre(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    if (raiz.matches && raiz.matches('input,textarea')) trata(raiz);
    raiz.querySelectorAll('input,textarea').forEach(trata);
    raiz.querySelectorAll('form input').forEach(x => { if (!x.hasAttribute('enterkeyhint') && !PULA.test(x.type) && x.dataset.tkv !== 'busca' && !x.hasAttribute('onkeydown') && !x.classList.contains('cbi')) x.setAttribute('enterkeyhint', 'next'); });
  }

  /* Enter no meio do formulário passa para o próximo campo; no último, salva como antes */
  document.addEventListener('keydown', ev => {
    const el = ev.target;
    if (ev.key !== 'Enter' || ev.isComposing || ev.shiftKey || !el || el.tagName !== 'INPUT') return;
    if (PULA.test(el.type) || !el.form || el.hasAttribute('onkeydown') || el.classList.contains('cbi')) return;
    const nx = proximo(el);
    if (!nx) return;
    ev.preventDefault();
    nx.focus();
    try { if (nx.select && nx.value && nx.tagName === 'INPUT') nx.select(); } catch (x) {}
  }, true);

  /* o teclado é definido quando o campo recebe o toque (o "Próximo" depende dos campos visíveis) */
  document.addEventListener('focusin', ev => { const el = ev.target; if (!el || !el.matches || !el.matches('input,textarea')) return; trata(el); dica(el); }, true);
  /* a chave PIX troca de teclado quando muda o tipo */
  document.addEventListener('change', ev => {
    const s = ev.target; if (!s || s.name !== 'pixtipo' || !s.form) return;
    const p = s.form.querySelector('[name=pix]'); if (p) aplica(p, 'pix');
  }, true);

  const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) varre(n); });
  function liga() { varre(document.body); mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.body) liga(); else document.addEventListener('DOMContentLoaded', liga);

  G.teclado = { tipo, varre, aplica };
})(window);
