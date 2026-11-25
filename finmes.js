/* Fio-Mar Gestor — finmes.js (2.51.0): Finanças por mês, no estilo "Minhas Finanças"
   - abre sempre no mês atual; a conta recomeça do zero no dia 1º (sem levar saldo do mês anterior);
   - ‹ › para ver os meses anteriores;
   - Receitas (dinheiro que entrou), Despesas (custo das peças vendidas, despesas, contas fixas pagas e taxa da maquininha) e Saldo do mês;
   - previsto: contas fixas a pagar e o que ainda falta receber (só no mês atual);
   - contas fixas do mês com "Pagar" / "Paga ✓" (db.desp[].pg = {'AAAA-MM':'AAAA-MM-DD'});
   - despesas por categoria e lançamentos do mês por dia (extrato);
   - Hoje e 7 dias continuam como atalhos (mesmo quadro de antes). */
(function (G) {
  'use strict';
  const MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const mAdd = (m, n) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') };
  const mNome = m => MES[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
  const dSem = d => SEM[new Date(d + 'T12:00').getDay()];
  const fixas = m => despMes(m).filter(x => x.rec == '1');
  /* mês que já passou: conta fixa sem marcação vale como paga (no dia do vencimento); '' = marcada como não paga */
  const venc = (d, m) => m + '-' + String(Math.min(28, +String(d.data || '').slice(8, 10) || 1)).padStart(2, '0');
  const pagaEm = (d, m) => { const v = d.pg && d.pg[m]; if (v) return v; if (v === '') return ''; return m < today().slice(0, 7) ? venc(d, m) : '' };
  const _antigo = G.finResumo;

  function mesDados(m) {
    const L = typeof finMesDias == 'function' ? finMesDias(m) : [];
    const ent = [], sai = [];
    let rec = 0, cus = 0, av = 0, tx = 0;
    L.forEach(x => {
      (x.pg || []).forEach(({ o, p, c }) => { const v = +p.valor || 0; rec += v; cus += c || 0; ent.push({ d: x.d, v, t: (cl(o.cli).nome || 'Cliente') + ' · O.S. ' + o.num, s: p.forma || '', os: o.id }); if (+p.taxa) { tx += +p.taxa; sai.push({ d: x.d, v: +p.taxa, t: 'Taxa da maquininha · O.S. ' + o.num, cat: 'Taxas da maquininha' }) } });
      (x.avL || []).forEach(dp => { av += +dp.valor || 0; sai.push({ d: x.d, v: +dp.valor || 0, t: dp.desc || 'Despesa', cat: dp.cat || 'Outros', id: dp.id }) });
    });
    const F = fixas(m), fp = F.filter(d => pagaEm(d, m)), fa = F.filter(d => !pagaEm(d, m));
    const vfp = fp.reduce((a, d) => a + (+d.valor || 0), 0), vfa = fa.reduce((a, d) => a + (+d.valor || 0), 0);
    fp.forEach(d => sai.push({ d: pagaEm(d, m), v: +d.valor || 0, t: (d.desc || 'Conta fixa') + ' (fixa)', cat: d.cat || 'Outros', id: d.id }));
    /* custo das peças vendidas entra como uma linha por pagamento */
    L.forEach(x => (x.pg || []).forEach(({ o, c }) => { if (c > 0.004) sai.push({ d: x.d, v: c, t: 'Peças e terceiros · O.S. ' + o.num, cat: 'Peças e terceiros' }) }));
    const desp = cus + av + tx + vfp;
    const cats = {}; sai.forEach(s => { cats[s.cat] = (cats[s.cat] || 0) + s.v });
    return { m, rec, cus, av, tx, vfp, vfa, desp, saldo: rec - desp, F, fa, ent, sai, cats };
  }

  function catsHTML(c, tot) {
    const L = Object.entries(c).filter(([, v]) => v > 0.004).sort((a, b) => b[1] - a[1]); if (!L.length) return '';
    const cor = k => k == 'Peças e terceiros' ? '#2F6FB0' : k == 'Taxas da maquininha' ? '#7F8C8D' : '#B4472E';
    return `<details class="fbox fmcat"><summary><b>Para onde foi o dinheiro</b><small>despesas do mês por categoria</small></summary><div class="fboxb">${L.map(([k, v]) => `<div class="fmcb"><div class="fmct"><span>${e(k)}</span><b>${R(v)}</b></div><i style="--p:${Math.max(3, Math.round(v / (tot || 1) * 100))}%;--c:${cor(k)}"></i></div>`).join('')}</div></details>`;
  }

  function fixasHTML(x, atual) {
    if (!x.F.length) return '';
    return `<details class="fbox fmfx"${x.fa.length && atual ? ' open' : ''}><summary><b>Contas fixas do mês</b><small>${x.fa.length ? plural(x.fa.length, 'a pagar', 'a pagar') + ' · ' + R(x.vfa) : 'todas pagas ✓'}</small></summary><div class="fboxb">${x.F.map(d => {
      const pg = pagaEm(d, x.m);
      return `<div class="fmfr${pg ? ' ok' : ''}"><div><b>${e(d.desc || 'Conta fixa')}</b><small>${e(d.cat || 'Outros')}${pg ? ' · paga em ' + D(pg).slice(0, 5) : ''}</small></div><span class="fmv">${R(+d.valor || 0)}</span><button type="button" class="sm ${pg ? 'fmok' : 'pr'}" aria-pressed="${!!pg}" onclick="finFixa('${d.id}','${x.m}')">${pg ? 'Paga ✓' : 'Pagar'}</button></div>`;
    }).join('')}</div></details>`;
  }

  function extratoHTML(x) {
    const L = [...x.ent.map(a => ({ ...a, s2: 1 })), ...x.sai.map(a => ({ ...a, s2: -1 }))].sort((a, b) => String(b.d).localeCompare(String(a.d)) || b.s2 - a.s2);
    if (!L.length) return `<p class="muted fmvz">Nenhum lançamento neste mês.</p>`;
    const lim = +S.f.fmlim || 40, dias = {};
    L.slice(0, lim).forEach(a => { (dias[a.d] = dias[a.d] || []).push(a) });
    return `<details class="fbox fmex" ${S.f.fmex == null || S.f.fmex ? 'open' : ''} ontoggle="S.f.fmex=this.open?1:0"><summary><b>Lançamentos do mês</b><small>${plural(L.length, 'lançamento', 'lançamentos')}</small></summary><div class="fboxb">${Object.entries(dias).map(([d, A]) => {
      const sd = A.reduce((s, a) => s + a.s2 * a.v, 0);
      return `<div class="fmdh"><span>${D(d).slice(0, 5)} · ${dSem(d)}</span><b class="${sd < 0 ? 'fneg' : 'fpos'}">${sd < 0 ? '− ' : '+ '}${R(Math.abs(sd))}</b></div>` + A.map(a => `<div class="fml ${a.s2 > 0 ? 'en' : 'sa'}"${a.os ? ` role="button" tabindex="0" onclick="go('order','${a.os}')"` : a.id ? ` role="button" tabindex="0" onclick="editDesp('${a.id}')"` : ''}><i aria-hidden="true">${a.s2 > 0 ? '↑' : '↓'}</i><div><b>${e(a.t)}</b>${a.s || a.cat ? `<small>${e(a.s || a.cat)}</small>` : ''}</div><span>${a.s2 > 0 ? '+ ' : '− '}${R(a.v)}</span></div>`).join('');
    }).join('')}${L.length > lim ? `<button type="button" class="mais" onclick="S.f.fmlim=${lim + 80};render(1)">Mostrar mais (${L.length - lim})</button>` : ''}</div></details>`;
  }

  G.finFixa = function (id, m) {
    const d = DP().find(x => x.id == id); if (!d) return;
    d.pg = d.pg || {};
    const ja = !!pagaEm(d, m), passado = m < today().slice(0, 7);
    desfazivel(() => { if (ja) { if (passado) d.pg[m] = ''; else delete d.pg[m] } else d.pg[m] = passado ? venc(d, m) : today(); save(); render(1) },
      (d.desc || 'Conta') + (ja ? ' voltou para "a pagar"' : ' paga'));
  };
  G.finMesVai = function (n) { const hj = today().slice(0, 7); let m = mAdd(S.f.fmes || hj, n); if (m > hj) m = hj; S.f.fmes = m; S.f.fmlim = 0; render(1) };

  G.finResumo = function () {
    const k = ['mes', 'hoje', 'sem'].includes(S.f.fres) ? S.f.fres : 'mes';
    const ab = [['mes', 'Mês'], ['hoje', 'Hoje'], ['sem', '7 dias']].map(([v, t]) => `<button type="button" class="${k == v ? 'on' : ''}" aria-pressed="${k == v}" onclick="S.f.fres='${v}';render(1)">${t}</button>`).join('');
    if (k != 'mes') {
      if (typeof _antigo != 'function') return '';
      const h = _antigo();
      /* o quadro antigo, com o botão "Mês" no lugar de "Este mês" */
      return h.replace(/<div class="fresab"[^>]*>[\s\S]*?<\/div>/, `<div class="fresab" role="group" aria-label="Período">${ab}</div>`);
    }
    const hj = today().slice(0, 7);
    let m = /^\d{4}-\d{2}$/.test(S.f.fmes || '') ? S.f.fmes : hj; if (m > hj) m = hj;
    const x = mesDados(m), atual = m == hj, arec = atual ? db.orders.reduce((s, o) => s + Math.max(0, oTot(o) - paid(o)), 0) : 0;
    const prev = x.saldo + arec - x.vfa;
    return `<div class="card fres fmes"><div class="fresab" role="group" aria-label="Período">${ab}</div>
 <div class="fmnav"><button type="button" class="ib" aria-label="Mês anterior" onclick="finMesVai(-1)">‹</button><div><b>${mNome(m)}</b>${atual ? '<small>mês atual · começou dia 1º</small>' : '<small>mês fechado</small>'}</div><button type="button" class="ib" aria-label="Próximo mês" onclick="finMesVai(1)" ${atual ? 'disabled' : ''}>›</button></div>
 <div class="fresg"><div><small>Receitas</small><b class="fpos">${R(x.rec)}</b></div><div><small>Despesas</small><b class="fneg">${x.desp > 0.004 ? '− ' : ''}${R(x.desp)}</b></div></div>
 <div class="fresl ${x.saldo < 0 ? 'neg' : ''}"><small>Saldo do mês</small><b>${x.saldo < 0 ? '− ' : ''}${R(Math.abs(x.saldo))}</b></div>
 ${atual && (arec > 0.004 || x.vfa > 0.004) ? `<div class="fmprev"><div><small>A receber</small><b>${R(arec)}</b></div><div><small>Contas a pagar</small><b>${R(x.vfa)}</b></div><div><small>Previsto no fim do mês</small><b class="${prev < 0 ? 'fneg' : ''}">${prev < 0 ? '− ' : ''}${R(Math.abs(prev))}</b></div></div>` : ''}
 ${!atual ? `<button type="button" class="fmhj" onclick="S.f.fmes='';render(1)">Voltar para ${MES[+hj.slice(5, 7) - 1]}</button>` : ''}</div>` +
      fixasHTML(x, atual) + catsHTML(x.cats, x.desp) + extratoHTML(x);
  };

  const css = document.createElement('style');
  css.textContent = `
.fmnav{display:flex;align-items:center;gap:8px;margin:12px 0 10px}.fmnav>div{flex:1;text-align:center}.fmnav>div b{display:block;font-size:19px}.fmnav>div small{display:block;color:var(--mut);font-size:12.5px}
.fmnav .ib{font-size:24px;line-height:1;width:44px;height:44px;margin:0}.fmnav .ib:disabled{opacity:.3}
.fpos{color:#3FA56C}
.fmprev{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--ln)}.fmprev small{display:block;color:var(--mut);font-size:12px}.fmprev b{font-size:15px;font-variant-numeric:tabular-nums}
.fmhj{width:100%;margin:10px 0 0}
.fmfr{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--ln)}.fmfr:first-child{border-top:0}.fmfr>div{flex:1;min-width:0}.fmfr b{display:block;overflow-wrap:anywhere}.fmfr small{display:block;color:var(--mut);font-size:13px}
.fmfr .fmv{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.fmfr button{margin:0;min-width:84px}.fmfr.ok>div,.fmfr.ok .fmv{opacity:.6}
.fmok{background:color-mix(in srgb,#2E8B57 22%,transparent)!important;color:#3FA56C!important;border-color:color-mix(in srgb,#2E8B57 60%,transparent)!important}
.fmcb{margin:0 0 10px}.fmct{display:flex;gap:8px;font-size:14px;margin-bottom:4px}.fmct span{flex:1}.fmct b{font-variant-numeric:tabular-nums}.fmcb i{display:block;height:7px;border-radius:4px;background:color-mix(in srgb,var(--ink) 10%,transparent);position:relative;overflow:hidden}.fmcb i::after{content:'';position:absolute;inset:0 auto 0 0;width:var(--p);background:var(--c);border-radius:4px}
.fmdh{display:flex;justify-content:space-between;align-items:center;margin:12px 0 4px;font-size:13px;color:var(--mut);font-weight:600;text-transform:capitalize}.fmdh:first-child{margin-top:0}.fmdh b{font-size:13px}
.fml{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--ln)}.fml[role=button]{cursor:pointer}.fml>i{flex:none;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800}
.fml.en>i{background:color-mix(in srgb,#2E8B57 18%,transparent);color:#3FA56C}.fml.sa>i{background:color-mix(in srgb,#B4472E 18%,transparent);color:#D0553A}
.fml>div{flex:1;min-width:0}.fml b{display:block;font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fml small{display:block;color:var(--mut);font-size:12.5px}
.fml>span{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.fml.en>span{color:#3FA56C}.fml.sa>span{color:#D0553A}
.fmvz{text-align:center;margin:12px 0}.fmex .mais{margin:8px 0 0;width:100%}
`;
  document.head.appendChild(css);
})(window);
