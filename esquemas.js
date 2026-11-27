/* Fio-Mar Gestor — esquemas.js (2.54.0): módulo Esquemas Elétricos
   Carregado só ao abrir o módulo (esq.js). Dados no Supabase (tabelas esq_*, por oficina, com RLS),
   arquivos no bucket privado "esquemas" (link assinado). Cópia no aparelho (IndexedDB) para usar sem internet.
   Telas: esq (busca e lista), esqv (visualizador). O cadastro fica no esquemas-adm.js.
   Os esquemas são enviados pela própria oficina; nenhum esquema de fabricante vem no código. */
(function (G) {
  'use strict';
  const $q = (s) => document.querySelector(s);
  const sheet = (tit, body) => { $('#modal').innerHTML = `<div class="ov psh-ov"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>` };
  const meu = () => (typeof SES != 'undefined' && SES && SES.user && SES.user.id) || '';
  const online = () => navigator.onLine !== false;
  const semNet = (x) => !online() || /fetch|network|internet|Failed/i.test(String((x && (x.message || x)) || ''));
  const msgErro = (x) => semNet(x) ? 'Sem internet agora.' : 'O servidor não respondeu (' + String((x && x.message) || x || 'erro').slice(0, 80) + ').';
  const res = async (p) => { const { data, error } = await p; if (error) throw error; return data };
  const ICON = (k) => svgi(k);
  const natural = (a, b) => String(a || '').localeCompare(String(b || ''), 'pt-BR', { numeric: true, sensitivity: 'base' });
  const ANO = new Date().getFullYear();

  /* ícones do módulo */
  Object.assign(ICO, {
    esqstar: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    esqoff: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    esqok: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12 4 4 0 0 0 6 19.8z"/><path d="m9 14 2 2 4-4"/>',
    esqfus: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 6h4M10 18h4M12 9v6"/>',
    esqfio: '<path d="M3 7c4 0 4 10 8 10s4-10 8-10"/><circle cx="3" cy="7" r="1.5"/><circle cx="21" cy="7" r="1.5"/>',
    esqpin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    esqfull: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    esqlua: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    esqsol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    esqmais: '<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-3.5-3.5"/>',
    esqmenos: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-3.5-3.5"/>',
    esqgira: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>',
    esqcel: '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M18 12h.01"/>',
    esqcar: ICO.vehicles || '',
    esqdots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    esqger: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    esqup: '<path d="M12 20V9"/><path d="m7 14 5-5 5 5"/><path d="M5 4h14"/>',
    esqx: '<path d="M6 6l12 12M18 6 6 18"/>',
    esqnota: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  });

  /* ---------- CSS do módulo (prefixo esq-) ---------- */
  if (!$q('#esq-css')) {
    const st = document.createElement('style'); st.id = 'esq-css';
    st.textContent = `
.esq-box{font-size:16px}
.esq-busca{position:relative;margin:0 0 12px}
.esq-busca input{width:100%;min-height:52px;font-size:17px;padding:0 14px 0 46px;border-radius:14px}
.esq-busca svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;opacity:.7;pointer-events:none}
.esq-casc{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}
.esq-casc label{display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:600;margin:0}
.esq-casc select{min-height:50px;font-size:16px}
.esq-casc .esq-limpa{grid-column:1/-1;justify-self:start}
.esq-bt{min-height:48px;font-size:16px}
.esq-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}
.esq-chips::-webkit-scrollbar{display:none}
.esq-chips button{flex:none;min-height:44px;border-radius:22px;padding:0 16px;font-size:15px;white-space:nowrap}
.esq-chips button.on{background:#E67E22;color:#fff;border-color:#E67E22}
.esq-chips button small{opacity:.8;margin-left:6px;font-weight:700}
.esq-lista{display:grid;gap:10px}
.esq-it{display:flex;gap:12px;align-items:center;min-height:72px;padding:10px 12px;border:1px solid var(--ln);border-radius:14px;background:var(--card,transparent);cursor:pointer;text-align:left;width:100%;font:inherit;color:inherit}
.esq-it:active{transform:scale(.99)}
.esq-th{width:64px;height:64px;border-radius:10px;flex:none;object-fit:cover;background:var(--ln);display:flex;align-items:center;justify-content:center;overflow:hidden}
.esq-th svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.8;opacity:.55}
.esq-th img{width:100%;height:100%;object-fit:cover}
.esq-it .esq-tx{flex:1;min-width:0}
.esq-it b{display:block;font-size:16px;line-height:1.25;overflow-wrap:anywhere}
.esq-it small{display:block;font-size:14px;opacity:.8;margin-top:3px;overflow-wrap:anywhere}
.esq-bdg{display:flex;flex-direction:column;gap:6px;align-items:center;flex:none}
.esq-bdg svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}
.esq-bdg .fav svg{fill:#F5B700;stroke:#C98200}
.esq-bdg .off{color:#2E8B57}
.esq-vcard{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:2px solid #E67E22;margin:0 0 12px}
.esq-vcard svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.8;flex:none}
.esq-vcard b{font-size:17px;display:block}
.esq-vcard small{font-size:14px;opacity:.8}
.esq-vcard .sp{flex:1}
.esq-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 12px}
.esq-seg button{min-height:48px;font-size:15px;padding:0 6px;line-height:1.15}
.esq-seg button.on{background:#E67E22;color:#fff;border-color:#E67E22}
.esq-msg{padding:18px 16px;border-radius:14px;border:1px dashed var(--ln);font-size:16px;line-height:1.45}
.esq-msg.erro{border-style:solid;border-color:#B4472E}
.esq-msg .bar{margin-top:12px}
.esq-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:18px 0 8px}
.esq-h h2{font-size:18px;margin:0}
.esq-h small{font-size:14px;opacity:.8}
.esq-res-tipo{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#E67E22}
.esq-fio{display:inline-block;width:30px;height:16px;border-radius:8px;vertical-align:middle;border:1px solid rgba(127,127,127,.6);background:linear-gradient(180deg,var(--a) 0 34%,var(--b) 34% 66%,var(--a) 66%);flex:none}
.esq-fio.liso{background:var(--a)}
.esq-fio.q{background:repeating-linear-gradient(45deg,transparent 0 4px,rgba(127,127,127,.5) 4px 6px)}
.esq-cor{display:inline-flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap}
.esq-tab{width:100%;border-collapse:collapse;font-size:16px}
.esq-tab th,.esq-tab td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--ln);vertical-align:top}
.esq-tab th{font-size:13px;text-transform:uppercase;letter-spacing:.03em;opacity:.75}
.esq-con{border:1px solid var(--ln);border-radius:14px;padding:12px;margin:0 0 12px}
.esq-con h3{margin:0;font-size:17px}
.esq-con .esq-loc{font-size:14px;opacity:.8;margin:2px 0 6px}
.esq-pino{display:grid;grid-template-columns:52px 1fr;gap:4px 10px;padding:10px 0;border-top:1px solid var(--ln)}
.esq-pino .n{grid-row:span 3;font-size:20px;font-weight:800;text-align:center;align-self:center;border-radius:10px;border:2px solid var(--ln);min-height:48px;display:flex;align-items:center;justify-content:center}
.esq-pino .f{font-size:16px}
.esq-pino .v{font-size:15px;opacity:.9}
.esq-cx{border:1px solid var(--ln);border-radius:14px;padding:12px;margin:0 0 12px}
.esq-cx h3{margin:0 0 2px;font-size:17px}
.esq-fus{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--ln);font-size:16px}
.esq-fus .p{font-weight:800;min-width:48px;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:2px solid var(--ln)}
.esq-fus .a{display:inline-flex;align-items:center;gap:6px;font-weight:700;white-space:nowrap}
.esq-fus .a i{width:14px;height:22px;border-radius:3px;border:1px solid rgba(127,127,127,.7);display:inline-block}
.esq-fus.hl{background:rgba(230,126,34,.14);border-radius:10px}
.esq-rl{font-size:12px;font-weight:800;padding:2px 8px;border-radius:8px;background:#2F6FB0;color:#fff;margin-right:6px}
/* visualizador em modo foco (2.57): ocupa a tela toda, barras finas por cima do desenho e gaveta de conectores */
body.esq-foco #nav,body.esq-foco #bnav,body.esq-foco #ver{display:none!important}
body.esq-foco{overflow:hidden}
body.esq-foco #main.vt{animation:none}
.esq-vw{--bg:#131416;--sf:#1E2023;--ink:#ECEDEE;--mut:#9A9FA6;--ln:#33363C;--ac:#F5B700;--on:#17181A;color-scheme:dark;position:fixed;inset:0;z-index:18;display:flex;flex-direction:column;background:#131416;color:#ECEDEE;font-size:16px;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
.esq-area{position:relative;flex:1;min-height:0;min-width:0}
.esq-stage{position:absolute;inset:0;overflow:hidden;background:#26272B;touch-action:none;user-select:none;-webkit-user-select:none}
.esq-stage.noite{background:#000}
.esq-pan{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
.esq-pan canvas,.esq-pan img{display:block;max-width:none;background:#fff;-webkit-user-drag:none}
.esq-pan .esq-det{position:absolute;pointer-events:none}
.esq-pins{position:absolute;left:0;top:0;pointer-events:none}
.esq-mk{position:absolute;transform:translate(-50%,-100%) scale(var(--is,1));transform-origin:50% 100%;pointer-events:auto;min-width:34px;height:34px;border-radius:17px 17px 17px 4px;background:#E67E22;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);padding:0 6px;margin:0;width:auto}
.esq-over{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#fff;font-size:16px;text-align:center;padding:20px;background:rgba(0,0,0,.35)}
.esq-over .bar{justify-content:center}
.esq-vbar{position:absolute;left:0;right:0;z-index:3;display:flex;align-items:center;gap:6px;padding:8px 10px;transition:opacity .18s,transform .18s}
.esq-vbar.top{top:0;padding-bottom:16px;background:linear-gradient(180deg,rgba(19,20,22,.96) 0,rgba(19,20,22,.88) 68%,rgba(19,20,22,0))}
.esq-vbar.bot{bottom:0;padding-top:16px;background:linear-gradient(0deg,rgba(19,20,22,.96) 0,rgba(19,20,22,.88) 68%,rgba(19,20,22,0))}
.esq-vbar .t{flex:1;min-width:0;padding:0 2px}
.esq-vbar .t b{display:block;font-size:17px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esq-vbar .t small{display:flex;align-items:center;gap:5px;font-size:14px;color:var(--mut);white-space:nowrap;overflow:hidden}
.esq-vbar .t small span{overflow:hidden;text-overflow:ellipsis}
.esq-vbar .t small svg{width:16px;height:16px;flex:none;fill:none;stroke:#3CB371;stroke-width:2}
.esq-vbar .sp{flex:1}
.esq-ib{min-width:48px;min-height:48px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;flex:none}
.esq-ib svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2}
.esq-vw .esq-ib{width:48px;background:rgba(255,255,255,.07);color:#ECEDEE;border:1px solid rgba(255,255,255,.1);margin:0}
.esq-vw .esq-ib.on{background:#E67E22;color:#fff;border-color:#E67E22}
.esq-ib.fav svg{fill:#F5B700;stroke:#C98200}
.esq-pg2{display:inline-flex;align-items:center;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}
.esq-pg2[hidden]{display:none}
.esq-vw .esq-pg2 .esq-ib{background:none;border:0;font-size:26px;font-weight:700;line-height:1}
.esq-pg2 span{min-width:52px;text-align:center;font-weight:700;font-size:16px;font-variant-numeric:tabular-nums}
.esq-pbt{min-height:48px;border-radius:24px;padding:0 16px 0 13px;display:inline-flex;align-items:center;gap:8px;font-size:16px;font-weight:700;background:#E67E22;color:#fff;border:0;flex:none;width:auto;margin:0}
.esq-pbt svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}
.esq-pbt small{background:rgba(0,0,0,.22);border-radius:10px;padding:1px 8px;font-size:14px}
.esq-vw.gav .esq-pbt{background:rgba(255,255,255,.14)}
.esq-vw .esq-pg2 .esq-ib{width:44px;min-width:44px}
@media (max-width:430px){#esq-bfull{display:none}}
@media (max-width:380px){.esq-pbt .l{display:none}.esq-pbt{padding:0 13px}}
.esq-chip2{position:absolute;z-index:3;min-height:44px;border-radius:22px;padding:0 16px;font-size:15px;font-weight:700;display:inline-flex;align-items:center;gap:7px;background:rgba(19,20,22,.9);color:#fff;border:1px solid rgba(255,255,255,.2);width:auto;margin:0;transition:opacity .18s}
.esq-chip2 svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}
.esq-chip2[hidden]{display:none}
.esq-fit{right:10px;bottom:76px}
.esq-osb{left:50%;transform:translateX(-50%);top:74px;white-space:nowrap}
.esq-osb.ok{background:#2E7D4F;border-color:#2E7D4F}
.esq-vw.limpo .esq-vbar,.esq-vw.limpo .esq-chip2{opacity:0;pointer-events:none}
.esq-vw.limpo .esq-vbar.top{transform:translateY(-10px)}
.esq-vw.limpo .esq-vbar.bot{transform:translateY(10px)}
.esq-dica{position:absolute;left:50%;bottom:80px;transform:translateX(-50%);z-index:4;background:#E67E22;color:#fff;padding:10px 16px;border-radius:22px;font-size:16px;font-weight:700;pointer-events:none;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.esq-br{display:flex;align-items:center;gap:12px;font-size:16px;padding:4px 2px}
.esq-br svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;flex:none}
.esq-br input{flex:1;min-height:44px}
/* gaveta: conectores, anotações e informações */
.esq-gav{flex:none;height:0;overflow:hidden;display:flex;flex-direction:column;background:#1B1C1F;border-top:1px solid rgba(255,255,255,.1);container-type:inline-size;transition:height .2s ease}
.esq-vw.gav .esq-gav{height:56%}
.esq-vw.gav.alto .esq-gav{height:88%}
.esq-gav-h{flex:none;position:relative;display:flex;align-items:center;gap:8px;padding:20px 10px 8px}
.esq-gav-h .pega{position:absolute;left:50%;top:0;transform:translateX(-50%);width:96px;height:22px;min-height:0;border:0;background:none;padding:0;margin:0;cursor:grab;touch-action:none}
.esq-gav-h .pega::before{content:'';position:absolute;left:50%;top:8px;transform:translateX(-50%);width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.32)}
.esq-gav-h .esq-seg{flex:1;margin:0}
.esq-gav-b{flex:1;min-height:0;overflow:auto;padding:4px 12px 20px;overscroll-behavior:contain}
@media (orientation:landscape) and (min-width:600px){
  .esq-vw{flex-direction:row}
  .esq-gav{height:auto!important;width:0;border-top:0;border-left:1px solid rgba(255,255,255,.1);transition:width .2s ease}
  .esq-vw.gav .esq-gav{width:min(44%,480px)}
  .esq-gav-h{padding-top:10px}
  .esq-gav-h .pega{display:none}
}
/* pinos em tabela */
.esq-pfil{position:relative;margin:2px 0 12px}
.esq-pfil input{width:100%;min-height:48px;font-size:16px;padding:0 12px 0 42px;border-radius:12px}
.esq-pfil svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;opacity:.65;pointer-events:none}
.esq-cn{margin:0 0 16px}
.esq-cn h3{display:flex;align-items:baseline;gap:8px;margin:0 0 2px;font-size:16px;line-height:1.3}
.esq-cn h3 .c{color:#F0A35C;font-weight:800;flex:none}
.esq-cn h3 .nm{min-width:0;overflow-wrap:anywhere}
.esq-cn h3 small{margin-left:auto;font-size:14px;color:var(--mut);font-weight:600;white-space:nowrap}
.esq-cn .loc{font-size:14px;color:var(--mut);margin:0 0 6px}
.esq-pt{border:1px solid var(--ln);border-radius:12px;overflow:hidden}
.esq-pr{display:grid;grid-template-columns:40px 96px minmax(0,1fr);align-items:center;gap:0 10px;min-height:48px;padding:6px 10px;border-top:1px solid var(--ln);font-size:16px}
.esq-pr:first-child{border-top:0}
.esq-pr.hd{min-height:0;padding:7px 10px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);background:rgba(255,255,255,.03)}
.esq-pr .n{font-weight:800;font-size:17px;text-align:center;font-variant-numeric:tabular-nums}
.esq-pr .c{min-width:0;overflow:hidden}
.esq-pr .c .esq-cor{gap:6px;font-size:15px;white-space:normal}
.esq-pr .c .esq-fio{width:22px;height:12px}
.esq-pr .f{min-width:0;overflow-wrap:anywhere;line-height:1.3}
.esq-pr .f small{display:block;font-size:15px;color:#F0A35C;font-weight:600;margin-top:1px}
.esq-pr .v{display:none}
.esq-pr.hl{background:rgba(230,126,34,.18);box-shadow:inset 3px 0 0 #E67E22}
.esq-pr[hidden],.esq-cn[hidden]{display:none}
@container (min-width:560px){
  .esq-pr{grid-template-columns:48px 120px minmax(0,1fr) minmax(0,1fr)}
  .esq-pr .f small{display:none}
  .esq-pr .v{display:block;color:#F0A35C;font-weight:600;overflow-wrap:anywhere}
}
.esq-nota{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--ln);font-size:16px}
.esq-nota .mk{flex:none;min-width:34px;height:34px;border-radius:17px;background:#E67E22;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.esq-nota .tx{flex:1;min-width:0;overflow-wrap:anywhere;white-space:pre-wrap}
.esq-nota small{display:block;opacity:.75;font-size:13px;margin-top:4px}
.esq-form textarea{width:100%;min-height:90px;font-size:16px}
.esq-leg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.esq-leg div{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--ln);border-radius:12px;font-size:16px;min-height:48px}
.esq-leg b{min-width:28px}
@media (max-width:380px){.esq-casc{gap:8px}}
/* tela inicial (2.57): busca com "Gerenciar", carros com a sigla da marca */
.esq-brow{display:flex;gap:8px;margin:0 0 12px}
.esq-brow .esq-busca{flex:1;min-width:0;margin:0}
.esq-ger{flex:none;min-height:52px;width:auto;padding:0 14px;border-radius:14px;display:inline-flex;align-items:center;gap:8px;font-size:16px;font-weight:700;margin:0}
.esq-ger svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}
@media (max-width:390px){.esq-ger span{display:none}.esq-ger{width:52px;justify-content:center;padding:0}}
.esq-gm{display:grid;gap:10px}
.esq-gm>button{min-height:60px;font-size:17px;font-weight:700;display:flex;align-items:center;gap:14px;text-align:left;padding:8px 16px;border-radius:14px;width:100%;margin:0}
.esq-gm>button svg{width:24px;height:24px;flex:none;fill:none;stroke:currentColor;stroke-width:2}
.esq-gm>button small{display:block;font-size:14px;opacity:.78;font-weight:500;margin-top:2px}
.esq-gm .esq-zm{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.esq-gm .esq-zm button{min-height:52px;font-size:16px;font-weight:700;width:100%;margin:0;display:flex;align-items:center;justify-content:center;gap:8px}
.esq-gm .esq-zm svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}
.esq-mca{font-family:'Barlow Condensed',Barlow,sans-serif;font-weight:700;font-size:21px;letter-spacing:.03em;color:#fff;background:var(--mc,#555)!important;opacity:1}
.esq-it.vazio{opacity:.62}
.esq-it.vazio .esq-mca{filter:grayscale(.6)}
.esq-vcard .esq-mca{width:48px;height:48px;font-size:18px;border-radius:10px}
.esq-vcard .esq-ib{border-radius:12px}
.esq-vcard .esq-troca{min-height:44px;flex:none;width:auto;margin:0;padding:0 14px;font-size:15px}
.esq-vcard .esq-ib.ok{color:#2E8B57}
.esq-seg button small{margin-left:6px;font-weight:800;font-size:14px;opacity:.85}
.esq-casc select{min-height:50px}
`;
    document.head.appendChild(st);
  }

  /* ---------- cores dos fios ---------- */
  const CORES = { PT: ['Preto', '#111111'], VM: ['Vermelho', '#D32F2F'], AM: ['Amarelo', '#FBC02D'], AZ: ['Azul', '#1E63C6'], VD: ['Verde', '#2E8B3E'], BR: ['Branco', '#F5F5F5'], MR: ['Marrom', '#7B4A26'], CZ: ['Cinza', '#8A8F96'], LJ: ['Laranja', '#EF7D1A'], RS: ['Rosa', '#E97FB0'], VI: ['Violeta', '#7E4BB5'] };
  const NOMECOR = {}; Object.entries(CORES).forEach(([k, [n]]) => { NOMECOR[nrm(n)] = k }); Object.assign(NOMECOR, { roxo: 'VI', lilas: 'VI', bege: null });
  const SIN = { LR: 'LJ', PR: 'PT' }; /* outras siglas comuns (LR = laranja) */
  const sigla = (t) => { const s = String(t || '').trim(); const u = s.toUpperCase(); if (CORES[u]) return u; if (SIN[u]) return SIN[u]; const n = nrm(s); return NOMECOR[n] || null };
  /* "VM/BR" = vermelho com listra branca */
  function corFio(txt) {
    let t = String(txt || '').trim(); if (!t) return '<span class="muted">—</span>';
    /* "N/I" = cor não informada no original; "*" = cor provável (conferir no chicote) */
    if (/^n\/?i$/i.test(t)) return '<span class="esq-cor" title="cor não informada"><span class="esq-fio q" aria-hidden="true"></span><span class="muted" style="font-weight:600">não informada</span></span>';
    const prov = /\*/.test(t); t = t.replace(/\*/g, '').trim();
    if (prov) return corFio(t).replace('</span>' + e(t.toUpperCase()) + '</span>', '</span>' + e(t.toUpperCase()) + ' <small style="font-weight:700;color:#C98200">conferir</small></span>').replace('title="', 'title="provável: ');
    const p = t.split(/\s*[\/\-–+]\s*/).filter(Boolean), a = sigla(p[0]), b = p[1] ? sigla(p[1]) : null;
    const nome = [a ? CORES[a][0] : p[0], p[1] ? (b ? CORES[b][0] : p[1]) : ''].filter(Boolean).join(' com listra ').toLowerCase();
    const sw = !a ? '<span class="esq-fio q" aria-hidden="true"></span>' : `<span class="esq-fio${b ? '' : ' liso'}" style="--a:${CORES[a][1]};--b:${b ? CORES[b][1] : CORES[a][1]}" aria-hidden="true"></span>`;
    return `<span class="esq-cor" title="${e(nome)}">${sw}${e(t.toUpperCase())}</span>`;
  }
  G.esqCorFio = corFio;
  /* cor padrão do fusível lâmina pela amperagem */
  const FCOR = { 1: '#111', 2: '#9E9E9E', 3: '#7E4BB5', 4: '#E97FB0', 5: '#D2B48C', 7.5: '#7B4A26', 10: '#D32F2F', 15: '#1E63C6', 20: '#FBC02D', 25: '#F5F5F5', 30: '#2E8B3E', 35: '#5D7A8C', 40: '#EF7D1A', 50: '#D32F2F', 60: '#1E63C6' };

  /* ---------- estado e cópia no aparelho ---------- */
  const C = { cat: null, em: 0, carr: null, erro: '', velha: false, fav: new Set(), off: {}, offOk: false, det: {}, fus: {}, nota: {}, thumb: {}, url: {}, blob: {} };
  const KC = () => 'esq:cat:' + OF, KO = () => 'esq:off:' + OF, KF = () => 'esq:fav:' + OF + ':' + meu();
  const KD = (id) => 'esq:det:' + id, KA = (id) => 'esq:arq:' + id, KU = (vid) => 'esq:fus:' + vid, KN = (id) => 'esq:not:' + id + ':' + meu();
  const ESQ = G.ESQ = { C, V: {} };
  const naTela = () => ['esq', 'esqv', 'esqadm'].includes(S.v);
  const redesenha = () => { if (naTela() && !$q('#modal .ov')) render() };

  IDB.get(KO()).then((o) => { C.off = o || {}; C.offOk = true; if (naTela()) redesenha() });

  /* catálogo inteiro da oficina (marcas, modelos, veículos, sistemas e esquemas) */
  async function carregaCat(forca) {
    if (C.carr) return C.carr;
    if (C.cat && !forca && Date.now() - C.em < 60e3) return C.cat;
    C.carr = (async () => {
      /* 2.57: abre na hora com a cópia do aparelho e atualiza pela internet logo em seguida */
      if (!C.cat) { const g0 = await IDB.get(KC()); if (g0 && !C.cat) { C.cat = g0; C.em = 0; const f0 = await IDB.get(KF()); if (f0) C.fav = new Set(f0); redesenha() } }
      try {
        if (!online()) throw new Error('offline');
        const of = OF;
        const [ma, mo, ve, si, es, fa] = await Promise.all([
          res(SB.from('esq_marcas').select('*').eq('oficina_id', of)),
          res(SB.from('esq_modelos').select('*').eq('oficina_id', of)),
          res(SB.from('esq_veiculos').select('*').eq('oficina_id', of)),
          res(SB.from('esq_sistemas').select('*')),
          res(SB.from('esq_esquemas').select('id,oficina_id,veiculo_id,sistema_id,titulo,descricao,arquivo_path,miniatura_path,tipo,paginas,tags,created_at').eq('oficina_id', of)),
          res(SB.from('esq_favoritos').select('esquema_id').eq('oficina_id', of)).catch(() => null),
        ]);
        C.cat = { marcas: ma || [], modelos: mo || [], veiculos: ve || [], sistemas: (si || []).filter((s) => !s.oficina_id || s.oficina_id == of), esquemas: es || [] };
        C.em = Date.now(); C.erro = ''; C.velha = false;
        if (fa) { C.fav = new Set(fa.map((x) => x.esquema_id)); IDB.set(KF(), [...C.fav]) }
        IDB.set(KC(), { ...C.cat, em: C.em });
      } catch (x) {
        const g = await IDB.get(KC());
        if (g) { C.cat = g; C.em = Date.now(); C.velha = true; C.erro = ''; const f = await IDB.get(KF()); if (f) C.fav = new Set(f) }
        else C.erro = msgErro(x);
      } finally { C.carr = null }
      redesenha(); return C.cat;
    })();
    return C.carr;
  }
  ESQ.carregaCat = carregaCat;
  ESQ.limpa = () => { C.cat = null; C.em = 0 };

  /* ---------- consultas do catálogo ---------- */
  const cat = () => C.cat || { marcas: [], modelos: [], veiculos: [], sistemas: [], esquemas: [] };
  const marca = (id) => cat().marcas.find((x) => x.id == id) || {};
  const modelo = (id) => cat().modelos.find((x) => x.id == id) || {};
  const veic = (id) => cat().veiculos.find((x) => x.id == id) || null;
  const sist = (id) => cat().sistemas.find((x) => x.id == id) || {};
  const esqm = (id) => cat().esquemas.find((x) => x.id == id) || null;
  const anos = (v) => !v || !v.ano_inicio ? '' : v.ano_fim && v.ano_fim != v.ano_inicio ? v.ano_inicio + '–' + v.ano_fim : v.ano_fim ? String(v.ano_inicio) : v.ano_inicio + ' em diante';
  const vMod = (v) => { const m = modelo(v.modelo_id); return [marca(m.marca_id).nome, m.nome].filter(Boolean).join(' ') };
  const vNome = (v) => !v ? 'Carro não encontrado' : [vMod(v), v.motor, v.versao].filter(Boolean).join(' ');
  const vSub = (v) => !v ? '' : [anos(v), v.combustivel].filter(Boolean).join(' · ');
  const vAnos = (v) => { const a = v.ano_inicio || null, b = v.ano_fim || (a ? ANO + 1 : null); if (!a) return []; const L = []; for (let y = a; y <= Math.min(b, a + 60); y++) L.push(y); return L };
  const ordS = (a, b) => (a.ordem || 100) - (b.ordem || 100) || natural(a.nome, b.nome);
  ESQ.q = { cat, marca, modelo, veic, sist, esqm, anos, vMod, vNome, vSub, natural, res, online, msgErro, sheet, meu, corFio, CORES, FCOR };

  /* filtro em cascata: marca → modelo → ano → motor/versão (S.f: ma, mo, ano, vv) */
  function cascata() {
    const f = S.f, C0 = cat();
    const marcas = C0.marcas.slice().sort((a, b) => natural(a.nome, b.nome));
    const modelos = f.ma ? C0.modelos.filter((m) => m.marca_id == f.ma).sort((a, b) => natural(a.nome, b.nome)) : [];
    let vs = f.mo ? C0.veiculos.filter((v) => v.modelo_id == f.mo) : [];
    const anosL = [...new Set(vs.flatMap(vAnos))].sort((a, b) => b - a);
    if (f.ano) vs = vs.filter((v) => !v.ano_inicio || vAnos(v).includes(+f.ano));
    vs.sort((a, b) => natural([a.motor, a.versao].join(' '), [b.motor, b.versao].join(' ')));
    const opt = (L, cur, vk, lk, ph) => `<option value="">${ph}</option>` + L.map((x) => `<option value="${e(x[vk])}" ${String(cur || '') == String(x[vk]) ? 'selected' : ''}>${e(typeof lk == 'function' ? lk(x) : x[lk])}</option>`).join('');
    return `<div class="esq-casc" role="group" aria-label="Escolher o carro">
      <select aria-label="Marca" onchange="esqF('ma',this.value)">${opt(marcas, f.ma, 'id', 'nome', marcas.length ? 'Marca' : 'Nenhuma marca')}</select>
      <select aria-label="Modelo" onchange="esqF('mo',this.value)" ${f.ma ? '' : 'disabled'}>${opt(modelos, f.mo, 'id', 'nome', 'Modelo')}</select>
      <select aria-label="Ano" onchange="esqF('ano',this.value)" ${f.mo && anosL.length ? '' : 'disabled'}>${opt(anosL.map((y) => ({ y })), f.ano, 'y', 'y', f.mo ? (anosL.length ? 'Todos os anos' : 'Sem ano') : 'Ano')}</select>
      <select aria-label="Motor ou versão" onchange="esqF('vv',this.value)" ${f.mo ? '' : 'disabled'}>${opt(vs, f.vv, 'id', (v) => [v.motor, v.versao, v.combustivel].filter(Boolean).join(' ') + (v.ano_inicio ? ' (' + anos(v) + ')' : '') || 'Versão única', f.mo ? (vs.length ? 'Motor / versão' : 'Nenhum') : 'Motor / versão')}</select>
      ${f.ma ? `<button type="button" class="sm esq-limpa" onclick="esqF('ma','')">Limpar a escolha</button>` : ''}
    </div>`;
  }
  G.esqF = function (k, v) {
    const f = S.f = { ...S.f };
    const dep = { ma: ['mo', 'ano', 'vv', 'sis', 'tab', 'casc', 'hl'], mo: ['ano', 'vv', 'sis', 'tab'], ano: ['vv', 'sis'], vv: ['sis'] };
    f[k] = v; (dep[k] || []).forEach((d) => delete f[d]);
    if (k == 'vv' && v) { const x = veic(v); if (x) { f.mo = x.modelo_id; f.ma = modelo(x.modelo_id).marca_id } }
    /* um só carro possível: escolhe sozinho */
    if ((k == 'mo' || k == 'ano') && f.mo && !f.vv) { const vs = cat().veiculos.filter((x) => x.modelo_id == f.mo && (!f.ano || !x.ano_inicio || vAnos(x).includes(+f.ano))); if (vs.length == 1) f.vv = vs[0].id }
    if (k == 'ma' && v) { const ms = cat().modelos.filter((m) => m.marca_id == v); if (ms.length == 1) { f.mo = ms[0].id; const vs = cat().veiculos.filter((x) => x.modelo_id == f.mo); if (vs.length == 1) f.vv = vs[0].id } }
    S.f = f; render(); };

  /* ---------- carro do cliente → carro do catálogo ---------- */
  /* liga pelo campo esqv do veículo; se não tiver, tenta achar pelo modelo e ano escritos */
  function doCliente(cv) {
    const v = typeof vh == 'function' ? vh(cv) : null; if (!v || !v.id) return { v: null };
    if (v.esqv && veic(v.esqv)) return { v, ok: v.esqv };
    const t = nrm([v.modelo, v.motor].join(' ')), ano = parseInt(v.ano) || 0;
    const nota = (x) => { const m = modelo(x.modelo_id), mk = marca(m.marca_id); let s = 0; const mn = nrm(m.nome); if (mn && new RegExp('(^|\\W)' + mn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\W|$)').test(t)) s += 3; else return 0; if (mk.nome && t.includes(nrm(mk.nome))) s += 1; if (x.motor && t.includes(nrm(x.motor).split(' ')[0])) s += 1; if (ano && x.ano_inicio) s += vAnos(x).includes(ano) ? 2 : -3; return s };
    const L = cat().veiculos.map((x) => [x, nota(x)]).filter((p) => p[1] > 0).sort((a, b) => b[1] - a[1]);
    return { v, sug: L.slice(0, 4).map((p) => p[0]) };
  }
  G.esqLiga = function (cv, vid) {
    const v = vh(cv); if (!v || !v.id) return;
    const antes = v.esqv; v.esqv = vid || ''; if (!vid) delete v.esqv; save();
    const f = { ...S.f, cv }; delete f.sug; if (vid) { const x = veic(vid); if (x) { f.vv = vid; f.mo = x.modelo_id; f.ma = modelo(x.modelo_id).marca_id } } S.f = f; render();
    if (typeof desfazCom == 'function') desfazCom(vid ? 'Carro do cliente ligado a ' + vNome(veic(vid)) : 'Ligação desfeita', () => { if (antes) v.esqv = antes; else delete v.esqv; save(); render() });
  };

  /* ---------- miniaturas: link assinado, carregadas quando aparecem na tela ---------- */
  async function urlAss(path, seg) {
    const c = C.url[path]; if (c && c.ate > Date.now() + 60e3) return c.u;
    const { data, error } = await SB.storage.from('esquemas').createSignedUrl(path, seg || 3600);
    if (error || !data) throw error || new Error('sem link');
    const u = data.signedUrl || data.signedURL; C.url[path] = { u, ate: Date.now() + (seg || 3600) * 1000 }; return u;
  }
  ESQ.urlAss = urlAss;
  /* a CSP do app só aceita imagem de blob:/data:, então o arquivo vem pelo link assinado (connect-src *.supabase.co) e vira blob: */
  async function blobDe(path, seg) { const r = await fetch(await urlAss(path, seg)); if (!r.ok) throw new Error('erro ' + r.status); return r.blob() }
  ESQ.blobDe = blobDe;
  let IO = null;
  function miniaturas() {
    const L = [...document.querySelectorAll('[data-esqmin]')]; if (!L.length) return;
    const carrega = async (el) => {
      const id = el.dataset.esqmin, x = esqm(id); el.removeAttribute('data-esqmin'); if (!x) return;
      try {
        let u = C.thumb[id];
        if (!u) { const a = C.off[id] && (await IDB.get(KA(id))); let b = a && (a.min || (x.tipo != 'pdf' ? a.blob : null)); if (!b && !x.miniatura_path) b = await IDB.get('esq:min:' + id); if (!b && online()) { if (x.miniatura_path) b = await blobDe(x.miniatura_path); else if (x.tipo != 'pdf' && x.arquivo_path) b = C.blob[id] || await blobDe(x.arquivo_path) } if (b) u = URL.createObjectURL(b.type ? b : new Blob([b], { type: x.tipo == 'svg' ? 'image/svg+xml' : 'image/png' })) }
        if (u) { C.thumb[id] = u; el.innerHTML = `<img src="${e(u)}" alt="" loading="lazy" decoding="async">` }
      } catch (z) {}
    };
    if ('IntersectionObserver' in window) { if (IO) IO.disconnect(); IO = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { IO.unobserve(x.target); carrega(x.target) } }), { rootMargin: '200px' }); L.forEach((el) => IO.observe(el)) }
    else L.forEach(carrega);
  }

  ESQ.miniaturas = miniaturas;
  /* ---------- cartão de esquema ---------- */
  const TIPO = { pdf: 'PDF', imagem: 'Imagem', svg: 'Desenho (SVG)' };
  /* 2.57: duas linhas só (título; sistema · carro · páginas); dentro do carro, sem repetir o carro */
  function itEsq(x, extra, semCarro) {
    const v = veic(x.veiculo_id), s = sist(x.sistema_id), fav = C.fav.has(x.id), off = !!C.off[x.id];
    const pag = !x.arquivo_path ? 'Sem arquivo' : x.tipo == 'pdf' && x.paginas > 1 ? x.paginas + ' páginas' : '';
    return `<button type="button" class="esq-it" onclick="go('esqv','${x.id}',null,${extra ? e(JSON.stringify(extra)) : '{}'})">
      <span class="esq-th" data-esqmin="${x.id}">${ICON('esq')}</span>
      <span class="esq-tx"><b>${e(x.titulo)}</b><small>${e([s.nome, semCarro ? '' : vNome(v), pag].filter(Boolean).join(' · '))}</small></span>
      <span class="esq-bdg">${fav ? `<span class="fav" title="Favorito" aria-label="Favorito">${ICON('esqstar')}</span>` : ''}${off ? `<span class="off" title="Disponível sem internet" aria-label="Disponível sem internet">${ICON('esqok')}</span>` : ''}</span>
    </button>`;
  }
  ESQ.itEsq = itEsq;
  /* sigla da marca num quadrado com cor própria (só letras: nada de logotipo de fabricante) */
  const SIGM = { volkswagen: 'VW', chevrolet: 'GM', 'mercedes-benz': 'MB', 'land rover': 'LR', 'alfa romeo': 'AR', citroen: 'CIT', peugeot: 'PEU', renault: 'REN', hyundai: 'HYU', toyota: 'TOY', honda: 'HON', nissan: 'NIS', mitsubishi: 'MIT', chery: 'CHE', 'caoa chery': 'CHE', suzuki: 'SUZ', yamaha: 'YAM', volvo: 'VOL', porsche: 'POR', chrysler: 'CHR', dodge: 'DOD', troller: 'TRO' };
  const siglaM = (n) => { const k = nrm(n || '').trim(); if (!k) return '?'; if (SIGM[k]) return SIGM[k]; const w = k.split(/[\s-]+/).filter(Boolean); if (w.length > 1) return w.map((p) => p[0]).join('').slice(0, 3).toUpperCase(); return (k.length <= 4 ? k : k.slice(0, 3)).toUpperCase() };
  const corM = (n) => { let h = 7; for (const ch of nrm(n || '')) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 30% 34%)` };
  const marcaDe = (v) => v ? marca(modelo(v.modelo_id).marca_id).nome || '' : '';
  const selo = (v) => { const n = marcaDe(v); return `<span class="esq-th esq-mca" style="--mc:${corM(n)}" aria-hidden="true">${e(siglaM(n))}</span>` };
  ESQ.siglaM = siglaM;

  /* ---------- busca livre (servidor, com cópia no aparelho quando estiver sem internet) ---------- */
  const B = { q: '', r: null, load: false, err: '', local: false, t: 0, n: 0 };
  /* mesma ideia do servidor: cada palavra precisa aparecer ou ser parecida (erro de digitação) */
  const tri = (s) => { const t = '  ' + s + ' ', o = new Set(); for (let i = 0; i < t.length - 2; i++) o.add(t.slice(i, i + 3)); return o };
  const simPal = (w, doc) => { const W = tri(w); let best = 0; doc.split(/\s+/).forEach((d) => { if (!d) return; const D2 = tri(d); let c = 0; W.forEach((g) => { if (D2.has(g)) c++ }); const s = c / (W.size + D2.size - c); if (s > best) best = s }); return best };
  async function buscaLocal(q) {
    const W = [...new Set(nrm(q).split(/[\s,;/]+/).filter(Boolean))]; if (!W.length) return [];
    const docs = [];
    cat().esquemas.forEach((x) => { const v = veic(x.veiculo_id); const d = C.det[x.id]; docs.push({ tipo: 'esquema', id: x.id, veiculo_id: x.veiculo_id, esquema_id: x.id, titulo: x.titulo, detalhe: [sist(x.sistema_id).nome, vNome(v)].filter(Boolean).join(' · '), d: nrm([vNome(v), v && v.ano_inicio, v && v.ano_fim, v && v.combustivel, sist(x.sistema_id).nome, x.titulo, x.descricao, (x.tags || []).join(' '), d ? d.con.map((c) => [c.codigo, c.nome, c.localizacao, ...(d.pin[c.id] || []).map((p) => [p.funcao, p.cor_fio].join(' '))].join(' ')).join(' ') : ''].join(' ')) }) });
    Object.entries(C.fus).forEach(([vid, L]) => { const v = veic(vid); (L || []).forEach((f) => docs.push({ tipo: f.tipo, id: f.id, veiculo_id: vid, esquema_id: null, titulo: [f.tipo == 'rele' ? 'Relé' : 'Fusível', f.posicao, f.circuito].filter(Boolean).join(' '), detalhe: [[f.caixa, f.amperagem ? f.amperagem + ' A' : ''].filter(Boolean).join(' '), vNome(v)].filter(Boolean).join(' · '), d: nrm([vNome(v), v && v.ano_inicio, f.tipo == 'rele' ? 'rele' : 'fusivel', f.caixa, f.localizacao_caixa, f.posicao, f.circuito, f.amperagem].join(' ')) })) });
    const out = [];
    docs.forEach((d) => { let sc = 0, ok = true; W.forEach((w) => { if (d.d.includes(w)) sc += 1; else { const s = w.length >= 3 ? simPal(w, d.d) : 0; if (s >= 0.4) sc += s; else ok = false } }); if (ok) out.push({ ...d, score: sc }) });
    return out.sort((a, b) => b.score - a.score || natural(a.titulo, b.titulo)).slice(0, 40);
  }
  ESQ.buscaLocal = buscaLocal;
  async function busca(q) {
    const n = ++B.n; B.q = q; B.err = '';
    if (!q.trim()) { B.r = null; B.load = false; return pintaBusca() }
    B.load = true; pintaBusca();
    let r = null, local = false;
    try { if (!online() || C.velha) throw new Error('offline'); r = await res(SB.rpc('esq_buscar', { of: OF, q, lim: 40 })) }
    catch (x) { try { r = await buscaLocal(q); local = true } catch (z) { B.err = msgErro(x) } }
    if (n != B.n) return;
    B.r = r || []; B.local = local; B.load = false; pintaBusca();
  }
  G.esqBuscaLimpa = function () { clearTimeout(B.t); B.n++; B.q = ''; B.r = null; B.load = false; B.err = '' };
  G.esqBusca = function (q) { clearTimeout(B.t); B.t = setTimeout(() => busca(q), 320) };
  ESQ.busca = busca;
  function resBusca() {
    if (!B.q.trim()) return '';
    if (B.load && !B.r) return '<div class="esq-msg" role="status"><span class="esq-spin" style="display:inline-block;vertical-align:middle;margin-right:10px"></span>Procurando…</div>';
    if (B.err) return `<div class="esq-msg erro" role="alert">Não deu para procurar. ${e(B.err)}</div>`;
    const R0 = B.r || [];
    if (!R0.length) return `<div class="esq-msg">Nada encontrado para “${e(B.q)}”.<br><small class="muted">Tente só o modelo (ex.: “gol”) ou o sistema (ex.: “injeção”).</small></div>`;
    return `<div class="esq-h"><h2>Resultados</h2><small>${plural(R0.length, 'item', 'itens')}${B.local ? ' · busca no aparelho' : ''}</small></div><div class="esq-lista">` + R0.map((r) => {
      if (r.tipo == 'esquema') { const x = esqm(r.esquema_id || r.id); if (x) return itEsq(x, { q: B.q }) }
      const fus = r.tipo == 'fusivel' || r.tipo == 'rele';
      return `<button type="button" class="esq-it" onclick="esqBuscaLimpa();go('esq',null,null,{vv:'${r.veiculo_id}',tab:'fus',hl:'${r.id}'})"><span class="esq-th">${ICON(fus ? 'esqfus' : 'esq')}</span><span class="esq-tx"><span class="esq-res-tipo">${fus ? (r.tipo == 'rele' ? 'Relé' : 'Fusível') : 'Esquema'}</span><b>${e(r.titulo)}</b><small>${e(r.detalhe || '')}</small></span></button>`;
    }).join('') + '</div>';
  }
  function pintaBusca() { const el = $q('#esq-res'); if (el) { el.innerHTML = resBusca(); miniaturas() } const c = $q('#esq-corpo'); if (c) c.style.display = B.q.trim() ? 'none' : '' }

  /* ---------- tela principal ---------- */
  /* 2.57: um botão só ("Gerenciar") ao lado da busca, para o dono; as opções abrem numa janela de baixo */
  G.esqGer = function () {
    const vv = (S.f || {}).vv, nv = vv ? `{novo:1,vv:'${vv}'}` : '{novo:1}';
    esqCarrega('esqadm').catch(() => {});
    sheet('Gerenciar esquemas', `<div class="esq-gm esq-dono">
      <button type="button" class="pr" onclick="closeM();go('esqadm',null,null,${nv})">${ICON('esqup')}<span>+ Adicionar esquema<small>PDF, foto ou SVG de um carro</small></span></button>
      <button type="button" onclick="closeM();esqImpDaqui()">${ICON('esqfio')}<span>Importar pacote (.zip)<small>Manual com folhas, conectores e pinos</small></span></button>
      <button type="button" onclick="closeM();go('esqadm')">${ICON('esqger')}<span>Cadastro<small>Carros, esquemas, sistemas e fusíveis</small></span></button></div>`);
  };
  G.esqImpDaqui = function () { if (typeof esqImp == 'function') return esqImp(); esqCarrega('esqadm').then(() => esqImp()).catch(() => go('esqadm')) };
  function topo(extra) {
    return head({ ico: 'esq', kick: 'Oficina', title: 'Esquemas Elétricos', c: PCOL.esq, sub: extra || '' });
  }
  function aviso() {
    if (C.velha) return `<div class="esq-msg" role="status" style="margin:0 0 12px">${ICON('esqok')} Sem internet: mostrando a cópia guardada no aparelho.</div>`;
    return '';
  }
  ESQ.V.esq = function () {
    if (!C.cat && !C.erro) { carregaCat(); return topo() + '<div class="card esq-load" role="status"><span class="esq-spin"></span>Carregando os esquemas da oficina…</div>' }
    if (!C.cat && C.erro) return topo() + `<div class="esq-msg erro" role="alert">Não deu para carregar os esquemas. ${e(C.erro)}<div class="bar"><button type="button" class="pr esq-bt" onclick="ESQ.C.erro='';ESQ.carregaCat(1)">Tentar de novo</button></div></div>`;
    if (Date.now() - C.em > 60e3 && !C.velha) carregaCat();
    const f = S.f || {};
    /* veio do veículo do cliente ou da O.S. */
    let cli = '';
    if (f.cv && !f.vv && !f.lig) {
      const r = doCliente(f.cv);
      if (r.ok) { setTimeout(() => esqF('vv', r.ok), 0); return topo() + '<div class="card esq-load"><span class="esq-spin"></span>Abrindo o carro…</div>' }
      if (r.v) cli = `<div class="esq-msg" style="margin:0 0 12px"><b>${e(vlabel(r.v))}</b>${r.v.ano ? ' · ' + e(r.v.ano) : ''}<br>Este carro do cliente ainda não está ligado a um carro dos esquemas.${r.sug.length ? '<br><b>É algum destes?</b>' : (cat().veiculos.length ? '<br>Escolha o carro abaixo e toque em “Ligar ao carro do cliente”.' : '')}
        ${r.sug.length ? `<div class="esq-lista" style="margin-top:10px">${r.sug.map((x) => `<button type="button" class="esq-it" style="min-height:56px" onclick="esqLiga('${r.v.id}','${x.id}')">${selo(x)}<span class="esq-tx"><b>${e(vNome(x))}</b><small>${e(vSub(x))}</small></span></button>`).join('')}</div>` : ''}</div>`;
    }
    const vv = f.vv && veic(f.vv);
    /* carro aberto pela busca, pelo link ou pela O.S.: a cascata guarda a marca e o modelo dele */
    if (vv && (f.mo != vv.modelo_id || !f.ma)) { f.mo = vv.modelo_id; f.ma = modelo(vv.modelo_id).marca_id }
    const temCat = cat().esquemas.length || cat().veiculos.length;
    let corpo = '';
    if (!temCat) corpo = `<div class="esq-msg">${DONO() ? 'Nenhum esquema cadastrado ainda.<br>Toque em <b>Gerenciar</b> para cadastrar o primeiro carro e enviar o arquivo (PDF, foto ou SVG).<div class="bar"><button type="button" class="pr esq-bt" onclick="go(\'esqadm\')">Cadastrar o primeiro</button></div>' : 'Nenhum esquema cadastrado ainda.<br>Peça ao dono da oficina para enviar os esquemas no Cadastro.'}</div>`;
    else if (vv) corpo = telaCarro(vv, f);
    else corpo = inicio();
    const ligar = f.cv && vv && (vh(f.cv) || {}).esqv != vv.id ? `<div class="bar" style="margin:-4px 0 12px"><button type="button" class="pr esq-bt" onclick="esqLiga('${f.cv}','${vv.id}')">Ligar ao carro do cliente (${e(vlabel(vh(f.cv)))})</button></div>` : '';
    if (DONO()) esqCarrega('esqadm').catch(() => {});
    setTimeout(() => { miniaturas(); const i = $q('#esq-q'); if (i && B.q && i.value != B.q) i.value = B.q; pintaBusca(); cedoPdf() }, 0);
    /* com o carro escolhido, a cascata some (fica o cartão do carro com "Trocar") */
    const casc = temCat && (!vv || f.casc) ? cascata() : '';
    return topo() + `<div class="esq-box">${aviso()}
      <div class="esq-brow"><div class="esq-busca">${ICON('search')}<input id="esq-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Carro, sistema, pino…" aria-label="Buscar esquemas: carro, sistema, pino ou relé" value="${e(B.q)}" oninput="esqBusca(this.value)"></div>${DONO() ? `<button type="button" class="esq-ger" id="esq-ger" aria-label="Gerenciar esquemas" onclick="esqGer()">${ICON('esqger')}<span>Gerenciar</span></button>` : ''}</div>
      <div id="esq-res" aria-live="polite"></div>
      <div id="esq-corpo">${cli}${casc}${ligar}${corpo}</div></div>`;
  };
  /* PDF aparece na lista: o leitor de PDF já carrega enquanto a pessoa escolhe (abre mais rápido) */
  let CEDO = 0;
  function cedoPdf() { if (CEDO || !cat().esquemas.some((x) => x.tipo == 'pdf')) return; CEDO = 1; const f = () => pdfjs().catch(() => { CEDO = 0 }); if ('requestIdleCallback' in window) requestIdleCallback(f, { timeout: 2500 }); else setTimeout(f, 800) }

  /* esquemas abertos por último (neste aparelho) */
  const KRE = () => 'esq_rec:' + OF;
  const recentes = () => { try { return JSON.parse(localStorage.getItem(KRE()) || '[]') } catch (x) { return [] } };
  const lembraRec = (id) => { try { localStorage.setItem(KRE(), JSON.stringify([id, ...recentes().filter((i) => i != id)].slice(0, 8))) } catch (x) {} };
  ESQ.recentes = recentes;
  function inicio() {
    const E0 = cat().esquemas, ja = new Set();
    const rec = recentes().map(esqm).filter(Boolean).slice(0, 3); rec.forEach((x) => ja.add(x.id));
    const fav = E0.filter((x) => C.fav.has(x.id) && !ja.has(x.id)); fav.forEach((x) => ja.add(x.id));
    const off = E0.filter((x) => C.off[x.id] && !ja.has(x.id));
    const cont = {}; E0.forEach((x) => { cont[x.veiculo_id] = (cont[x.veiculo_id] || 0) + 1 });
    /* carros com esquema primeiro; sem esquema no fim, mais apagados */
    const VS = cat().veiculos.slice().sort((a, b) => (!cont[a.id]) - (!cont[b.id]) || natural(vNome(a), vNome(b)));
    const sec = (t, L) => L.length ? `<div class="esq-h"><h2>${t}</h2><small>${L.length}</small></div><div class="esq-lista">${L.map((x) => itEsq(x)).join('')}</div>` : '';
    return sec('Recentes', rec) + sec('Favoritos', fav) + sec('Baixados no aparelho', off) +
      `<div class="esq-h"><h2>Carros cadastrados</h2><small>${VS.length}</small></div><div class="esq-lista">` +
      (VS.map((v) => `<button type="button" class="esq-it${cont[v.id] ? '' : ' vazio'}" style="min-height:64px" onclick="esqF('vv','${v.id}')">${selo(v)}<span class="esq-tx"><b>${e(vNome(v))}</b><small>${e([vSub(v), plural(cont[v.id] || 0, 'esquema', 'esquemas')].filter(Boolean).join(' · '))}</small></span></button>`).join('') || '<div class="esq-msg">Nenhum carro cadastrado.</div>') + '</div>';
  }

  function telaCarro(v, f) {
    const tab = f.tab || 'esq', L = cat().esquemas.filter((x) => x.veiculo_id == v.id);
    const nf = (C.fus[v.id] || []).length, comArq = L.filter((x) => x.arquivo_path), falta = comArq.filter((x) => !C.off[x.id]).length;
    const seg = [['esq', 'Esquemas', L.length], ['fus', 'Fusíveis', C.fus[v.id] ? nf : ''], ['cor', 'Cores', '']];
    const bx = !comArq.length ? '' : BXC == v.id ? `<button type="button" class="esq-ib" id="esq-bcarro" disabled aria-label="Baixando os esquemas deste carro"><span class="esq-spin" style="width:20px;height:20px"></span></button>`
      : `<button type="button" class="esq-ib${falta ? '' : ' ok'}" id="esq-bcarro" aria-label="${falta ? `Baixar ${plural(falta, 'esquema', 'esquemas')} deste carro para usar sem internet` : 'Todos os esquemas deste carro abrem sem internet'}" title="${falta ? 'Baixar o carro inteiro' : 'Tudo no aparelho'}" onclick="esqBaixaCarro('${v.id}')">${ICON(falta ? 'esqoff' : 'esqok')}</button>`;
    let h = `<div class="esq-vcard">${selo(v)}<span class="sp"><b>${e(vNome(v))}</b><small>${e(vSub(v))}</small></span>${bx}<button type="button" class="esq-troca" onclick="S.f={...S.f,lig:1};esqF('ma','')">Trocar</button></div>
      <div class="esq-seg" role="tablist">${seg.map(([k, l, n]) => `<button type="button" role="tab" class="${tab == k ? 'on' : ''}" aria-selected="${tab == k}" onclick="S.f={...S.f,tab:'${k}'};render()">${l}${n !== '' ? `<small>${n}</small>` : ''}</button>`).join('')}</div>`;
    if (tab == 'fus') return h + telaFus(v, f);
    if (tab == 'cor') return h + legenda();
    if (!C.fus[v.id]) carregaFus(v.id, true);
    if (!L.length) return h + `<div class="esq-msg">Este carro ainda não tem esquema.${DONO() ? `<div class="bar"><button type="button" class="pr esq-bt" onclick="go('esqadm',null,null,{novo:1,vv:'${v.id}'})">Enviar esquema deste carro</button></div>` : ''}</div>`;
    const cs = {}; L.forEach((x) => { cs[x.sistema_id] = (cs[x.sistema_id] || 0) + 1 });
    const SS = cat().sistemas.filter((s) => cs[s.id]).sort(ordS);
    const sf = f.sis && cs[f.sis] ? f.sis : '';
    const LL = L.filter((x) => !sf || x.sistema_id == sf).sort((a, b) => ordS(sist(a.sistema_id), sist(b.sistema_id)) || natural(a.titulo, b.titulo));
    return h + (SS.length > 1 ? `<div class="esq-chips" role="group" aria-label="Sistema"><button type="button" class="${sf ? '' : 'on'}" aria-pressed="${!sf}" onclick="S.f={...S.f,sis:''};render()">Todos<small>${L.length}</small></button>${SS.map((s) => `<button type="button" class="${sf == s.id ? 'on' : ''}" aria-pressed="${sf == s.id}" onclick="S.f={...S.f,sis:'${s.id}'};render()">${e(s.nome)}<small>${cs[s.id]}</small></button>`).join('')}</div>` : '') +
      `<div class="esq-lista">${LL.map((x) => itEsq(x, null, true)).join('')}</div>`;
  }

  /* ---------- fusíveis e relés do carro ---------- */
  async function carregaFus(vid, quieto) {
    if (C.fus['_' + vid]) return; C.fus['_' + vid] = 1;
    try {
      if (!online()) throw new Error('offline');
      const L = await res(SB.from('esq_fusiveis').select('*').eq('veiculo_id', vid).eq('oficina_id', OF));
      C.fus[vid] = L || []; IDB.set(KU(vid), C.fus[vid]);
    } catch (x) { const g = await IDB.get(KU(vid)); if (g) C.fus[vid] = g; else if (!quieto) C.fus['!' + vid] = msgErro(x) }
    finally { delete C.fus['_' + vid]; if (!quieto || C.fus[vid]) redesenha() }
  }
  ESQ.carregaFus = carregaFus;
  function telaFus(v, f) {
    const L = C.fus[v.id];
    if (!L) { if (C.fus['!' + v.id]) return `<div class="esq-msg erro" role="alert">Não deu para carregar os fusíveis. ${e(C.fus['!' + v.id])}<div class="bar"><button type="button" class="pr esq-bt" onclick="delete ESQ.C.fus['!${v.id}'];ESQ.carregaFus('${v.id}')">Tentar de novo</button></div></div>`; carregaFus(v.id); return '<div class="card esq-load" role="status"><span class="esq-spin"></span>Carregando os fusíveis…</div>' }
    if (!L.length) return `<div class="esq-msg">Nenhum fusível ou relé cadastrado para este carro.${DONO() ? `<div class="bar"><button type="button" class="pr esq-bt" onclick="go('esqadm',null,null,{vv:'${v.id}',aba:'fus'})">Cadastrar fusíveis</button></div>` : ''}</div>`;
    const cx = {}; L.forEach((x) => { const k = x.caixa || 'Sem caixa'; (cx[k] = cx[k] || []).push(x) });
    if (f.hl) setTimeout(() => { const el = $q('#esqf-' + f.hl); if (el) el.scrollIntoView({ block: 'center' }) }, 50);
    return Object.keys(cx).sort(natural).map((k) => { const F = cx[k].sort((a, b) => natural(a.posicao, b.posicao)), loc = F.map((x) => x.localizacao_caixa).find(Boolean);
      return `<div class="esq-cx"><h3>${e(k)}</h3>${loc ? `<div class="muted" style="font-size:15px">${ICON('esqpin').replace('<svg', '<svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;vertical-align:-2px"')} ${e(loc)}</div>` : ''}
        ${F.map((x) => { const a = +x.amperagem || 0, cor = FCOR[a]; return `<div class="esq-fus${f.hl == x.id ? ' hl' : ''}" id="esqf-${x.id}"><span class="p">${e(x.posicao || '—')}</span><span>${x.tipo == 'rele' ? '<span class="esq-rl">Relé</span>' : ''}${e(x.circuito || 'Sem descrição')}</span><span class="a">${a ? `${cor ? `<i style="background:${cor}" title="Cor padrão do fusível de ${a} A"></i>` : ''}${String(a).replace('.', ',')} A` : ''}</span></div>` }).join('')}</div>` }).join('') +
      '<p class="muted" style="font-size:14px">A cor ao lado da amperagem é a cor padrão do fusível de lâmina. Confira sempre no carro.</p>';
  }

  /* ---------- legenda de cores ---------- */
  function legenda() {
    return `<div class="esq-leg">${Object.entries(CORES).map(([k, [n, c]]) => `<div><span class="esq-fio liso" style="--a:${c}"></span><b>${k}</b>${n}</div>`).join('')}</div>
      <div class="esq-h"><h2>Fio com listra</h2></div>
      <div class="esq-msg" style="border-style:solid">${corFio('VM/BR')} = vermelho com listra branca.<br><small class="muted">A primeira sigla é a cor do fio; a segunda, a cor da listra.</small></div>`;
  }
  ESQ.legenda = legenda;


  /* =====================================================================
     VISUALIZADOR (tela esqv): pinça, arrastar, tela cheia, páginas do PDF, brilho e modo noite
     ===================================================================== */
  const PDFDIR = 'lib/pdfjs-4.10.38/';
  let PDFJS = null, PDFW = null;
  const pdfjs = async () => {
    if (PDFJS) return PDFJS;
    const base = new URL(PDFDIR, location.href).href;
    const m = await import(base + 'pdf.mjs');
    m.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.mjs';
    /* um trabalhador só, criado com internet e reaproveitado (sem internet não daria para criar outro) */
    try { PDFW = new m.PDFWorker({ name: 'esquemas' }) } catch (z) {}
    return (PDFJS = m);
  };
  ESQ.pdfjs = pdfjs;
  ESQ.abrePdf = async (data) => { const P = await pdfjs(); return P.getDocument({ data, isEvalSupported: false, ...(PDFW && !PDFW.destroyed ? { worker: PDFW } : {}) }).promise };
  /* guarda na memória só os 3 últimos arquivos abertos */
  const lembra = (id, b) => { C.blob[id] = b; const k = Object.keys(C.blob); if (k.length > 3) delete C.blob[k[0]]; return b };
  /* 2.57: os 3 últimos arquivos abertos ficam guardados no aparelho (abrem na hora, até sem internet) */
  const KRA = () => 'esq_recarq:' + OF, KR2 = (id) => 'esq:rec:' + id;
  async function guardaRec(x, blob) {
    if (!blob || blob.size > 20 * 1048576 || C.off[x.id]) return;
    try {
      await IDB.set(KR2(x.id), { blob, path: x.arquivo_path, em: Date.now() });
      let L = []; try { L = JSON.parse(localStorage.getItem(KRA()) || '[]') } catch (z) {}
      L = [x.id, ...L.filter((i) => i != x.id)]; L.slice(3).forEach((i) => IDB.del(KR2(i)));
      localStorage.setItem(KRA(), JSON.stringify(L.slice(0, 3)));
    } catch (z) {}
  }
  async function arquivo(x) {
    if (C.blob[x.id]) return C.blob[x.id];
    const a = C.off[x.id] && (await IDB.get(KA(x.id)));
    if (a && a.blob) return lembra(x.id, a.blob);
    if (!x.arquivo_path) { const z = new Error('Este esquema ainda não tem arquivo.'); z.sem = 1; throw z }
    const r0 = await IDB.get(KR2(x.id)).catch(() => null);
    if (r0 && r0.blob && r0.path == x.arquivo_path) return lembra(x.id, r0.blob);
    if (!online()) { const z = new Error('Este esquema não foi baixado para usar sem internet.'); z.off = 1; throw z }
    const r = await fetch(await urlAss(x.arquivo_path, 600)); if (!r.ok) throw new Error('o arquivo não abriu (erro ' + r.status + ')');
    const b = await r.blob(); guardaRec(x, b);
    return lembra(x.id, b);
  }
  ESQ.arquivo = arquivo;

  let LS = {}; try { LS = JSON.parse(localStorage.getItem('esq_visor') || '{}') } catch (x) {}
  const VW = { id: null, pag: 1, n: 1, s: 1, tx: 0, ty: 0, cw: 0, ch: 0, q: 1, doc: null, el: null, nat: null, noite: !!LS.noite, br: LS.br || 1, anotar: false, erro: '', carregando: false, gen: 0, gav: false, alto: false, limpo: false, pre: null, hlFeito: false };
  ESQ.VW = VW;
  const guardaLS = () => { try { localStorage.setItem('esq_visor', JSON.stringify({ noite: VW.noite, br: VW.br })) } catch (x) {} };
  const filtro = () => (VW.noite ? 'invert(1) hue-rotate(180deg) ' : '') + (VW.br != 1 ? `brightness(${VW.br})` : '');
  const dpr = () => Math.min(3, window.devicePixelRatio || 1);
  const ZMAX = 10;

  function aplica() {
    const p = $q('#esq-pan'), st = $q('#esq-stage'); if (!p || !st) return;
    const W = st.clientWidth, H = st.clientHeight, w = VW.cw * VW.s, h = VW.ch * VW.s;
    VW.tx = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, VW.tx));
    VW.ty = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, VW.ty));
    p.style.transform = `translate(${VW.tx}px,${VW.ty}px) scale(${VW.s})`;
    p.style.setProperty('--is', 1 / VW.s);
    const fit = $q('#esq-bfit'); if (fit) fit.hidden = VW.s < 1.05;
  }
  function zoomEm(ns, px, py) {
    ns = Math.max(1, Math.min(ZMAX, ns)); const k = ns / VW.s;
    VW.tx = px - (px - VW.tx) * k; VW.ty = py - (py - VW.ty) * k; VW.s = ns; aplica(); nitido();
  }
  G.esqZoom = function (k) {
    const st = $q('#esq-stage'); if (!st) return;
    if (!k) { VW.s = 1; VW.tx = VW.ty = 0; aplica(); nitido(); return }
    zoomEm(VW.s * k, st.clientWidth / 2, st.clientHeight / 2);
  };

  /* tamanho base: a página cabe na largura (ou inteira, se for deitada e a tela também) */
  function medida(nw, nh) {
    const st = $q('#esq-stage'); const W = st.clientWidth || innerWidth, H = st.clientHeight || innerHeight;
    const k = nw / nh > W / H ? W / nw : Math.min(W / nw, (W > H ? H : H * 1.6) / nh);
    return { cw: Math.max(50, nw * k), ch: Math.max(50, nh * k), k: W + 'x' + H };
  }
  function base(nw, nh) { const m = medida(nw, nh); VW.cw = m.cw; VW.ch = m.ch }

  /* PDF: a página inteira na resolução da tela; com zoom, só o pedaço que aparece é redesenhado nítido (rápido em qualquer zoom) */
  async function pagina(n) {
    const pg = await VW.doc.getPage(n), v1 = pg.getViewport({ scale: 1 }), m = medida(v1.width, v1.height);
    let esc = (m.cw / v1.width) * dpr();
    const MAXPX = 16e6; if (v1.width * esc * v1.height * esc > MAXPX) esc = Math.sqrt(MAXPX / (v1.width * v1.height));
    const vp = pg.getViewport({ scale: esc }), cv = document.createElement('canvas');
    cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
    cv.style.width = m.cw + 'px'; cv.style.height = m.ch + 'px';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Página ' + n + ' do esquema');
    await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    return { cv, n, cw: m.cw, ch: m.ch, k: m.k, nat: [v1.width, v1.height] };
  }
  async function desenhaPdf() {
    const g = ++VW.gen, n = VW.pag, doc = VW.doc; let r;
    const st = $q('#esq-stage'), k = st ? st.clientWidth + 'x' + st.clientHeight : '';
    if (VW.pre && VW.pre.n == n && VW.pre.k == k && VW.pre.doc == doc) { r = VW.pre; VW.pre = null } else r = await pagina(n);
    if (g != VW.gen || doc != VW.doc) return;
    VW.cw = r.cw; VW.ch = r.ch; VW.nat = r.nat; VW.q = 1; VW.el = r.cv; limpaDet(); poe(r.cv); nitido();
    if (n == 1) miniLocal();
    /* a próxima página já fica pronta (troca de página sem espera) */
    const pre = () => { if (g != VW.gen || VW.pag >= VW.n) return; pagina(VW.pag + 1).then((p) => { if (g == VW.gen) VW.pre = { ...p, doc } }).catch(() => {}) };
    if ('requestIdleCallback' in window) requestIdleCallback(pre, { timeout: 1200 }); else setTimeout(pre, 400);
  }
  ESQ.desenhaPdf = desenhaPdf;
  let NT = 0, DT = null;
  function limpaDet() { clearTimeout(NT); try { if (DT) DT.cancel() } catch (z) {} DT = null; const b = $q('#esq-dt'); if (b) b.innerHTML = '' }
  function nitido() { clearTimeout(NT); if (!VW.doc) return; if (VW.s < 1.25) { limpaDet(); return } NT = setTimeout(detalhe, 160) }
  async function detalhe() {
    const box = $q('#esq-dt'), st = $q('#esq-stage'); if (!box || !st || !VW.doc || VW.s < 1.25 || !VW.cw) return;
    const W = st.clientWidth, H = st.clientHeight, s = VW.s, d = dpr(), g = VW.gen, pag = VW.pag;
    const x0 = Math.max(0, -VW.tx / s), y0 = Math.max(0, -VW.ty / s), x1 = Math.min(VW.cw, (W - VW.tx) / s), y1 = Math.min(VW.ch, (H - VW.ty) / s);
    if (x1 <= x0 || y1 <= y0) return;
    const pg = await VW.doc.getPage(pag); if (g != VW.gen || s != VW.s) return;
    const v1 = pg.getViewport({ scale: 1 }), k0 = VW.cw / v1.width;
    const cw = Math.ceil((x1 - x0) * s * d), ch = Math.ceil((y1 - y0) * s * d); if (cw * ch > 16e6) return;
    const vp = pg.getViewport({ scale: k0 * s * d, offsetX: -x0 * s * d, offsetY: -y0 * s * d });
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.className = 'esq-det';
    Object.assign(cv.style, { left: x0 + 'px', top: y0 + 'px', width: x1 - x0 + 'px', height: y1 - y0 + 'px', filter: filtro() });
    try { if (DT) DT.cancel() } catch (z) {}
    const t = DT = pg.render({ canvasContext: cv.getContext('2d'), viewport: vp });
    try { await t.promise } catch (z) { return }
    if (t != DT || g != VW.gen || pag != VW.pag || s != VW.s) return;
    box.innerHTML = ''; box.appendChild(cv); VW.q = s;
  }
  /* PDF sem miniatura: guarda a da página 1 no aparelho (a lista fica com o desenho) */
  async function miniLocal() {
    const x = esqm(VW.id); if (!x || x.miniatura_path || C.thumb[x.id] || !VW.el) return;
    try {
      const w = 360, h = Math.round((VW.el.height * w) / VW.el.width), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(VW.el, 0, 0, w, h);
      const b = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.78)); if (!b) return;
      await IDB.set('esq:min:' + x.id, b); C.thumb[x.id] = URL.createObjectURL(b);
    } catch (z) {}
  }
  function poe(el) {
    const box = $q('#esq-pg'); if (!box) return;
    if (el.parentNode !== box) { box.innerHTML = ''; box.appendChild(el) }
    const pins = $q('#esq-pins'); if (pins) { pins.style.width = VW.cw + 'px'; pins.style.height = VW.ch + 'px' }
    el.style.filter = filtro(); aplica(); pinta();
    const ov = $q('#esq-over'); if (ov) ov.remove();
  }
  function poeImg(blob, x) {
    const im = new Image(); im.alt = x.titulo; im.decoding = 'async'; im.draggable = false;
    im.onload = () => {
      let nw = im.naturalWidth, nh = im.naturalHeight; if (!nw || !nh) { nw = 1200; nh = 900 }
      VW.nat = [nw, nh]; base(nw, nh); im.style.width = VW.cw + 'px'; im.style.height = VW.ch + 'px'; VW.el = im; poe(im);
    };
    im.onerror = () => falha('A imagem não abriu. O arquivo pode estar com defeito.');
    im.src = URL.createObjectURL(blob);
  }
  function falha(t, off) {
    VW.erro = t; const ov = $q('#esq-over'); if (!ov) return;
    ov.innerHTML = `<p style="margin:0;max-width:320px">${e(t)}</p>${off ? '<p style="margin:0;font-size:15px;opacity:.9">Conecte-se à internet e toque em <b>⋯ → Baixar para usar sem internet</b>.</p>' : ''}<div class="bar"><button type="button" class="pr esq-bt" onclick="ESQ.VW.id=null;render()">Tentar de novo</button></div>`;
  }
  /* estado do visualizador ao trocar de esquema */
  function novoVW(x) {
    if (VW.id == x.id) return;
    Object.assign(VW, { id: x.id, pag: 1, n: x.paginas || 1, s: 1, tx: 0, ty: 0, doc: null, el: null, nat: null, erro: '', anotar: false, q: 1, gav: false, alto: false, limpo: false, pre: null, hlFeito: false, pf: '' });
    VW.gen++; lembraRec(x.id);
  }
  async function monta() {
    const x = esqm(S.id), st = $q('#esq-stage'); if (!x || !st) return;
    novoVW(x);
    gestos(st); gaveta(); pgs();
    if (!C.det[x.id]) carregaDet(x.id); else abreHl();
    if (!C.nota[x.id]) carregaNotas(x.id);
    /* voltou para a tela (ex.: depois de abrir uma janela): reaproveita o desenho */
    if (VW.el) { if (VW.nat && !VW.doc) base(VW.nat[0], VW.nat[1]); poe(VW.el); nitido(); return }
    if (VW.carregando) return; VW.carregando = true;
    try {
      /* o leitor de PDF carrega junto com o arquivo (não um depois do outro) */
      const pj = x.tipo == 'pdf' ? pdfjs().catch(() => null) : null;
      const b = await arquivo(x);
      if (VW.id != x.id) return;
      if (x.tipo == 'pdf' || /pdf/.test(b.type)) {
        await pj; VW.doc = await ESQ.abrePdf(new Uint8Array(await b.arrayBuffer()));
        if (VW.id != x.id) return;
        VW.n = VW.doc.numPages; pgs(); await desenhaPdf();
      } else poeImg(b.type ? b : new Blob([b], { type: x.tipo == 'svg' ? 'image/svg+xml' : 'image/jpeg' }), x);
    } catch (z) { falha(z.sem || z.off ? z.message : 'Não deu para abrir o arquivo. ' + msgErro(z), z.off) }
    finally { VW.carregando = false }
  }
  function pgs() { const a = $q('#esq-pgs'), n = $q('#esq-pgn'); if (!a || !n) return; a.hidden = VW.n <= 1; n.textContent = VW.pag + ' / ' + VW.n }
  G.esqPag = function (d) { const p = Math.max(1, Math.min(VW.n, VW.pag + d)); if (p == VW.pag || !VW.doc) return; VW.pag = p; VW.s = 1; VW.tx = VW.ty = 0; pgs(); desenhaPdf() };
  const filtroTudo = () => { document.querySelectorAll('#esq-pg canvas,#esq-pg img,#esq-dt canvas').forEach((c) => { c.style.filter = filtro() }) };
  G.esqNoite = function () { VW.noite = !VW.noite; guardaLS(); filtroTudo(); const b = $q('#esq-bnoite'); if (b) { b.classList.toggle('on', VW.noite); b.setAttribute('aria-pressed', VW.noite) } const st = $q('#esq-stage'); if (st) st.classList.toggle('noite', VW.noite) };
  G.esqBrilho = function (v) { VW.br = Math.max(0.5, Math.min(1.6, (+v || 100) / 100)); guardaLS(); filtroTudo() };
  /* um toque no desenho esconde/mostra as barras (o desenho fica com a tela inteira) */
  G.esqLimpo = function (on) { VW.limpo = on === undefined ? !VW.limpo : !!on; const vw = $q('#esq-vw'); if (vw) vw.classList.toggle('limpo', VW.limpo) };
  /* tela cheia do aparelho (some a barra do celular) e deita a tela; no iPhone, esconde as barras */
  G.esqCheia = async function () {
    const vw = $q('#esq-vw'); if (!vw) return;
    if (document.fullscreenElement || vw.classList.contains('cheia')) { try { if (document.fullscreenElement) await document.exitFullscreen() } catch (x) {} vw.classList.remove('cheia'); esqLimpo(false); setTimeout(ajusta, 120); return }
    try { if (vw.requestFullscreen) { await vw.requestFullscreen({ navigationUI: 'hide' }); try { await screen.orientation.lock('landscape') } catch (x) {} } else { vw.classList.add('cheia'); esqLimpo(true) } }
    catch (x) { vw.classList.add('cheia'); esqLimpo(true) }
    setTimeout(ajusta, 150);
  };
  /* tamanho da área mudou (girou, gaveta, tela cheia): refaz o tamanho base; só redesenha se mudou de verdade */
  function ajusta() {
    if (S.v != 'esqv' || !VW.el || !VW.nat) return;
    const m = medida(VW.nat[0], VW.nat[1]);
    if (Math.abs(m.cw - VW.cw) < 1.5 && Math.abs(m.ch - VW.ch) < 1.5) { aplica(); nitido(); return }
    if (VW.doc) { VW.pre = null; desenhaPdf() }
    else { VW.cw = m.cw; VW.ch = m.ch; VW.el.style.width = VW.cw + 'px'; VW.el.style.height = VW.ch + 'px'; poe(VW.el) }
  }
  let RZ = 0; addEventListener('resize', () => { clearTimeout(RZ); RZ = setTimeout(ajusta, 200) });
  document.addEventListener('fullscreenchange', () => { const b = $q('#esq-bfull'); if (b) b.classList.toggle('on', !!document.fullscreenElement); setTimeout(ajusta, 150) });

  /* gestos: 1 dedo arrasta, 2 dedos dão zoom (pinça), toque duplo aproxima no ponto, 1 toque esconde as barras, roda do mouse dá zoom */
  function gestos(st) {
    if (st._esq) return; st._esq = 1;
    const P = new Map(); let ini = null, tap = { t: 0, x: 0, y: 0 }, mexeu = false, t0 = 0, TT = 0;
    const pos = (ev) => { const r = st.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top } };
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    st.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.esq-over button,.esq-mk')) return;
      try { st.setPointerCapture(ev.pointerId) } catch (z) {} P.set(ev.pointerId, pos(ev));
      if (P.size == 1) { mexeu = false; t0 = Date.now() }
      const L = [...P.values()]; ini = { s: VW.s, tx: VW.tx, ty: VW.ty, p: L.map((p) => ({ ...p })), d: L.length > 1 ? dist(L[0], L[1]) : 0 };
    });
    st.addEventListener('pointermove', (ev) => {
      if (!P.has(ev.pointerId) || !ini) return; P.set(ev.pointerId, pos(ev)); const L = [...P.values()];
      if (L.length == 1) { const dx = L[0].x - ini.p[0].x, dy = L[0].y - ini.p[0].y; if (Math.abs(dx) + Math.abs(dy) > 8) mexeu = true; if (!mexeu) return; VW.tx = ini.tx + dx; VW.ty = ini.ty + dy; aplica() }
      else if (L.length >= 2 && ini.d) {
        mexeu = true; const m0 = { x: (ini.p[0].x + ini.p[1].x) / 2, y: (ini.p[0].y + ini.p[1].y) / 2 }, m1 = { x: (L[0].x + L[1].x) / 2, y: (L[0].y + L[1].y) / 2 };
        const ns = Math.max(1, Math.min(ZMAX, ini.s * dist(L[0], L[1]) / ini.d)), k = ns / ini.s;
        VW.s = ns; VW.tx = m1.x - (m0.x - ini.tx) * k; VW.ty = m1.y - (m0.y - ini.ty) * k; aplica();
      }
    });
    const fim = (ev) => {
      if (!P.has(ev.pointerId)) return; const p = P.get(ev.pointerId); P.delete(ev.pointerId);
      if (P.size) { const L = [...P.values()]; ini = { s: VW.s, tx: VW.tx, ty: VW.ty, p: L.map((q) => ({ ...q })), d: 0 }; return }
      ini = null; nitido();
      if (mexeu || Date.now() - t0 > 450 || ev.type == 'pointercancel') return;
      /* toque */
      if (VW.anotar) { const cx = (p.x - VW.tx) / VW.s / VW.cw, cy = (p.y - VW.ty) / VW.s / VW.ch; if (cx >= 0 && cx <= 1 && cy >= 0 && cy <= 1) { G.esqAnotar(false); esqNotaNova(VW.id, +cx.toFixed(4), +cy.toFixed(4), VW.pag) } return }
      const ag = Date.now(); clearTimeout(TT);
      if (ag - tap.t < 320 && Math.hypot(p.x - tap.x, p.y - tap.y) < 30) { zoomEm(VW.s > 1.2 ? 1 : 2.5, p.x, p.y); tap.t = 0 }
      else { tap = { t: ag, x: p.x, y: p.y }; TT = setTimeout(() => { if (tap.t == ag) esqLimpo() }, 330) }
    };
    st.addEventListener('pointerup', fim); st.addEventListener('pointercancel', fim);
    st.addEventListener('wheel', (ev) => { ev.preventDefault(); const p = pos(ev); zoomEm(VW.s * (ev.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y) }, { passive: false });
  }

  /* gaveta de baixo (ou do lado, deitado): conectores, anotações e informações */
  G.esqGav = function (on) {
    VW.gav = on === undefined ? !VW.gav : !!on; if (!VW.gav) VW.alto = false;
    const vw = $q('#esq-vw'); if (vw) { vw.classList.toggle('gav', VW.gav); vw.classList.toggle('alto', VW.alto) }
    const b = $q('#esq-bpainel'); if (b) b.setAttribute('aria-expanded', VW.gav);
    if (VW.gav) esqLimpo(false);
    setTimeout(ajusta, 240);
  };
  G.esqGavAlto = function () { if (!VW.gav) return esqGav(true); VW.alto = !VW.alto; const vw = $q('#esq-vw'); if (vw) vw.classList.toggle('alto', VW.alto); setTimeout(ajusta, 240) };
  /* puxar a alça: para cima aumenta, para baixo diminui ou fecha */
  function gaveta() {
    const pg = $q('#esq-gav .pega'); if (!pg || pg._esq) return; pg._esq = 1;
    let y0 = null;
    pg.addEventListener('pointerdown', (ev) => { y0 = ev.clientY; try { pg.setPointerCapture(ev.pointerId) } catch (z) {} });
    pg.addEventListener('pointerup', (ev) => {
      if (y0 == null) return; const dy = ev.clientY - y0; y0 = null;
      if (Math.abs(dy) < 10) return; /* toque: o onclick cuida */
      ev.preventDefault(); pg._arr = Date.now();
      if (dy < 0) { if (!VW.alto) esqGavAlto() } else if (VW.alto) esqGavAlto(); else esqGav(false);
    });
    pg.addEventListener('click', (ev) => { if (pg._arr && Date.now() - pg._arr < 400) { ev.stopImmediatePropagation(); ev.preventDefault() } }, true);
  }

  /* volta: pelo histórico (mantém a busca e o filtro); se abriu direto pelo link, vai para a lista do carro */
  G.esqVolta = function () {
    const x = esqm(S.id); if (document.fullscreenElement) { try { document.exitFullscreen() } catch (z) {} }
    if (history.state && history.state.fm && history.length > 1) history.back(); else go('esq', null, null, x ? { vv: x.veiculo_id } : {});
  };
  /* saindo do visualizador: sai da tela cheia */
  const _go = go; G.go = go = function (v) { if (S.v == 'esqv' && v != 'esqv') { try { if (document.fullscreenElement) document.exitFullscreen() } catch (x) {} } return _go.apply(this, arguments) };
  /* modo foco: no visualizador somem o topo e a barra de baixo do app; o topo do módulo diz "Esquemas Elétricos" em todas as telas */
  const _rr = render; G.render = render = function () {
    const r = _rr.apply(this, arguments);
    try {
      document.body.classList.toggle('esq-foco', S.v == 'esqv' && !!$q('#esq-vw'));
      if (naTela()) { const bt = $q('#nav .brand .bt'); if (bt && !/Esquemas El/.test(bt.textContent)) { bt.classList.add('tt'); bt.innerHTML = '<b>Esquemas Elétricos</b><small>Oficina</small>' } }
    } catch (z) {}
    return r;
  };

  const nPinos = (id) => { const d = C.det[id]; return d ? d.con.reduce((a, c) => a + (d.pin[c.id] || []).length, 0) : 0 };
  ESQ.V.esqv = function () {
    if (!C.cat && !C.erro) { carregaCat(); return topo() + '<div class="card esq-load" role="status"><span class="esq-spin"></span>Carregando…</div>' }
    const x = esqm(S.id);
    if (!x) return topo() + `<div class="esq-msg erro" role="alert">${C.erro ? 'Não deu para carregar. ' + e(C.erro) : 'Esquema não encontrado. Ele pode ter sido apagado.'}<div class="bar"><button type="button" class="pr esq-bt" onclick="go('esq')">Ver os esquemas</button></div></div>`;
    novoVW(x);
    const v = veic(x.veiculo_id), s = sist(x.sistema_id), f = S.f || {}, fav = C.fav.has(x.id), off = !!C.off[x.id];
    const o = f.os && typeof od == 'function' && od(f.os), anex = o && (o.esqs || []).some((a) => a && a.id == x.id);
    const vt = f.vt || 'pin', np = nPinos(x.id), nn = (C.nota[x.id] || []).length, nc = C.det[x.id] ? C.det[x.id].con.length : 0;
    setTimeout(monta, 0);
    const tabs = [['pin', 'Conectores', nc || ''], ['not', 'Anotações', nn || ''], ['info', 'Sobre', '']];
    return `<div class="esq-vw${VW.gav ? ' gav' : ''}${VW.alto ? ' alto' : ''}${VW.limpo ? ' limpo' : ''}" id="esq-vw" data-noptr role="region" aria-label="Visualizador do esquema">
      <div class="esq-area">
        <div class="esq-stage${VW.noite ? ' noite' : ''}" id="esq-stage" aria-label="Esquema: um toque esconde as barras, dois toques aproximam, dois dedos dão zoom e um arrasta">
          <div class="esq-pan" id="esq-pan"><div id="esq-pg"></div><div id="esq-dt"></div><div class="esq-pins" id="esq-pins"></div></div>
          <div class="esq-over" id="esq-over" role="status"><span class="esq-spin"></span>Abrindo o arquivo…</div>
          ${VW.anotar ? '<div class="esq-dica" id="esq-dica">Toque no ponto do esquema</div>' : ''}
        </div>
        <div class="esq-vbar top">
          <button type="button" class="esq-ib" aria-label="Voltar" onclick="esqVolta()">${ICON('osback')}</button>
          <div class="t"><b>${e(x.titulo)}</b><small>${off ? `<svg viewBox="0 0 24 24" id="esq-offok" role="img" aria-label="Disponível sem internet">${ICO.esqok}</svg>` : ''}<span>${e([s.nome, vNome(v)].filter(Boolean).join(' · '))}</span></small></div>
          <button type="button" class="esq-ib${fav ? ' fav' : ''}" id="esq-bfav" aria-pressed="${fav}" aria-label="${fav ? 'Tirar dos favoritos' : 'Favoritar'}" onclick="esqFav('${x.id}')">${ICON('esqstar')}</button>
          <button type="button" class="esq-ib" id="esq-bmais" aria-label="Mais opções: brilho, anotar, baixar" onclick="esqMais()">${ICON('esqdots')}</button>
        </div>
        ${o ? `<button type="button" class="esq-chip2 esq-osb${anex ? ' ok' : ''}" onclick="esqAnexa('${o.id}','${x.id}')">${anex ? 'Anexado à O.S. ' + e(o.num) + ' ✓' : 'Anexar à O.S. ' + e(o.num)}</button>` : ''}
        <button type="button" class="esq-chip2 esq-fit" id="esq-bfit" aria-label="Ajustar à tela" onclick="esqZoom(0)" ${VW.s >= 1.05 ? '' : 'hidden'}>${ICON('esqgira')}Ajustar</button>
        <div class="esq-vbar bot">
          <span class="esq-pg2" id="esq-pgs" hidden><button type="button" class="esq-ib" aria-label="Página anterior" onclick="esqPag(-1)">‹</button><span id="esq-pgn">${VW.pag} / ${VW.n}</span><button type="button" class="esq-ib" aria-label="Próxima página" onclick="esqPag(1)">›</button></span>
          <span class="sp"></span>
          <button type="button" class="esq-ib${VW.noite ? ' on' : ''}" id="esq-bnoite" aria-pressed="${VW.noite}" aria-label="Modo noite: inverter as cores" onclick="esqNoite()">${ICON('esqlua')}</button>
          <button type="button" class="esq-ib" id="esq-bfull" aria-label="Tela cheia" onclick="esqCheia()">${ICON('esqfull')}</button>
          <button type="button" class="esq-pbt" id="esq-bpainel" aria-expanded="${VW.gav}" aria-controls="esq-gav" aria-label="Conectores, pinos e anotações" onclick="esqGav()">${ICON('esqfio')}<span class="l">Pinos</span>${np ? `<small>${np}</small>` : ''}</button>
        </div>
      </div>
      <div class="esq-gav" id="esq-gav">
        <div class="esq-gav-h"><button type="button" class="pega" aria-label="Aumentar ou diminuir a gaveta" onclick="esqGavAlto()"></button>
          <div class="esq-seg" role="tablist">${tabs.map(([k, l, n]) => `<button type="button" role="tab" class="${vt == k ? 'on' : ''}" aria-selected="${vt == k}" onclick="esqVT('${k}')">${l}${n !== '' ? `<small>${n}</small>` : ''}</button>`).join('')}</div>
          <button type="button" class="esq-ib" aria-label="Fechar a gaveta" onclick="esqGav(false)">${ICON('esqx')}</button></div>
        <div class="esq-gav-b" id="esq-painel">${painel(x, vt)}</div>
      </div>
    </div>`;
  };
  /* ⋯: o que se usa pouco fica aqui (brilho, zoom pelos botões, anotar, baixar, anexar, editar) */
  G.esqMais = function () {
    const x = esqm(VW.id || S.id); if (!x) return; const off = !!C.off[x.id], f = S.f || {}, o = f.os && typeof od == 'function' && od(f.os), anex = o && (o.esqs || []).some((a) => a && a.id == x.id);
    sheet('Opções do esquema', `<div class="esq-gm">
      <div class="esq-br">${ICON('esqsol')}<input type="range" min="50" max="160" step="5" value="${Math.round(VW.br * 100)}" oninput="esqBrilho(this.value)" aria-label="Brilho do esquema"></div>
      <div class="esq-zm"><button type="button" aria-label="Diminuir o zoom" onclick="esqZoom(1/1.6)">${ICON('esqmenos')}Menos zoom</button><button type="button" aria-label="Aumentar o zoom" onclick="esqZoom(1.6)">${ICON('esqmais')}Mais zoom</button></div>
      <button type="button" onclick="closeM();esqCheia()">${ICON('esqfull')}<span>Tela cheia<small>Deita a tela e esconde a barra do celular</small></span></button>
      <button type="button" id="esq-banot" onclick="closeM();esqAnotar(true)">${ICON('esqpin')}<span>Marcar um ponto<small>Toque no esquema para prender uma anotação</small></span></button>
      <button type="button" onclick="closeM();esqNotaNova('${x.id}')">${ICON('esqnota')}<span>Nova anotação<small>Só você vê</small></span></button>
      <button type="button" id="esq-boff" class="${off ? 'on' : ''}" onclick="closeM();${off ? 'esqTira' : 'esqBaixa'}('${x.id}')">${ICON(off ? 'esqok' : 'esqoff')}<span>${off ? 'Já abre sem internet' : 'Baixar para usar sem internet'}<small>${off ? 'Tocar para tirar do aparelho' : 'Guarda o arquivo, os pinos e os fusíveis'}</small></span></button>
      ${o ? `<button type="button" onclick="closeM();esqAnexa('${o.id}','${x.id}')">${ICON('esqfio')}<span>${anex ? 'Tirar da O.S. ' + e(o.num) : 'Anexar à O.S. ' + e(o.num)}</span></button>` : ''}
      ${DONO() ? `<button type="button" onclick="closeM();go('esqadm',null,null,{ed:'${x.id}'})">${ICON('esqger')}<span>Editar no cadastro<small>Título, sistema, conectores e pinos</small></span></button>` : ''}
    </div>`);
  };
  G.esqBrilhoMostra = G.esqMais;
  G.esqVT = function (k) {
    S.f = { ...S.f, vt: k }; try { history.replaceState({ ...(history.state || {}), s: { ...((history.state || {}).s || {}), f: S.f } }, '') } catch (z) {}
    document.querySelectorAll('#esq-gav .esq-seg button').forEach((b) => { const on = b.getAttribute('onclick').includes(`'${k}'`); b.classList.toggle('on', on); b.setAttribute('aria-selected', on) });
    const x = esqm(S.id), p = $q('#esq-painel'); if (x && p) { p.innerHTML = painel(x, k); p.scrollTop = 0 }
    if (!VW.gav) esqGav(true);
  };
  /* aberto pela busca ("relé bomba", "sonda"): abre a gaveta com os pinos que combinam destacados */
  function abreHl() {
    if (VW.hlFeito || S.v != 'esqv') return; const f = S.f || {}; if (!f.q) return; VW.hlFeito = true;
    setTimeout(() => { const el = $q('#esq-painel .esq-pr.hl'); if (!el) return; if ((f.vt || 'pin') != 'pin') esqVT('pin'); else esqGav(true); setTimeout(() => { const y = $q('#esq-painel .esq-pr.hl'); if (y) y.scrollIntoView({ block: 'center' }) }, 260) }, 0);
  }
  function painel(x, k) {
    if (k == 'not') return painelNotas(x);
    if (k == 'info') return painelInfo(x);
    return painelPinos(x);
  }
  function repinta() {
    if (S.v != 'esqv') return; const x = esqm(S.id), p = $q('#esq-painel'); if (!x || !p) return;
    p.innerHTML = painel(x, (S.f || {}).vt || 'pin'); pinta();
    const np = nPinos(x.id), b = $q('#esq-bpainel'); if (b) { const sm = b.querySelector('small'); if (np && !sm) b.insertAdjacentHTML('beforeend', `<small>${np}</small>`); else if (sm) { if (np) sm.textContent = np; else sm.remove() } }
    const nc = C.det[x.id] ? C.det[x.id].con.length : 0, nn = (C.nota[x.id] || []).length;
    document.querySelectorAll('#esq-gav .esq-seg button').forEach((t) => { const k = (t.getAttribute('onclick').match(/'(\w+)'/) || [])[1], n = k == 'pin' ? nc : k == 'not' ? nn : 0; let sm = t.querySelector('small'); if (n) { if (!sm) { sm = document.createElement('small'); t.appendChild(sm) } sm.textContent = n } else if (sm) sm.remove() });
    abreHl();
  }
  /* 2.56.0: apagar para trocar por um atualizado (dono) */
  const pacoteDe = (x) => ((x.tags || []).find((t) => /^pacote:/.test(t)) || '').slice(7);
  function botoesApagar(x) {
    const k = pacoteDe(x), n = k ? cat().esquemas.filter((y) => (y.tags || []).includes('pacote:' + k)).length : 0;
    return `<div class="bar" style="margin-top:12px"><button type="button" class="esq-bt" onclick="go('esqadm',null,null,{ed:'${x.id}'})">Editar no cadastro</button></div>
      <div class="esq-h"><h2>Apagar</h2></div><p class="muted" style="font-size:15px;margin:0 0 8px">Para trocar por um atualizado: apague e adicione o novo.${k ? ' Pacote importado de novo (revisão nova) também atualiza sozinho.' : ''}</p>
      <div class="bar"><button type="button" class="esq-bt" style="color:#B4472E" onclick="esqApaga('${x.id}')">Apagar este esquema</button>${n > 1 ? `<button type="button" class="esq-bt" style="color:#B4472E" onclick="esqApagaPac('${e(k)}')">Apagar o pacote inteiro (${n} esquemas)</button>` : ''}</div>`;
  }
  G.esqApaga = (id) => esqCarrega('esqadm').then(() => esqEsqDel(id)).catch(() => toast('Não deu para apagar agora. Confira a internet.', 'erro'));
  G.esqApagaPac = (k) => esqCarrega('esqadm').then(() => esqPacoteDel(k)).catch(() => toast('Não deu para apagar agora. Confira a internet.', 'erro'));
  ESQ.pacoteDe = pacoteDe;
  function painelInfo(x) {
    const v = veic(x.veiculo_id), s = sist(x.sistema_id);
    const L = [['Carro', vNome(v)], ['Anos', anos(v)], ['Combustível', v && v.combustivel], ['Sistema', s.nome], ['Arquivo', (TIPO[x.tipo] || 'Sem arquivo') + (x.tipo == 'pdf' ? ' · ' + plural(VW.id == x.id ? VW.n : x.paginas || 1, 'página', 'páginas') : '')], ['Etiquetas', (x.tags || []).filter((t) => !/^(pacote|item):/.test(t)).join(', ')], ['Descrição', x.descricao]].filter((r) => r[1]);
    return `<table class="esq-tab"><tbody>${L.map(([a, b]) => `<tr><th scope="row" style="width:34%">${a}</th><td style="white-space:pre-wrap;overflow-wrap:anywhere">${e(b)}</td></tr>`).join('')}</tbody></table>
      ${C.off[x.id] ? `<p class="muted" style="font-size:14px">Guardado no aparelho em ${e(new Date(C.off[x.id].em).toLocaleDateString('pt-BR'))}${C.off[x.id].tam ? ' · ' + (C.off[x.id].tam / 1048576).toFixed(1).replace('.', ',') + ' MB' : ''}.</p>` : ''}
      ${DONO() ? botoesApagar(x) : ''}`;
  }
  ESQ.monta = monta;

  /* =====================================================================
     CONECTORES E PINOS (etapa 5)
     ===================================================================== */
  async function carregaDet(id, quieto) {
    if (C.det['_' + id]) return; C.det['_' + id] = 1;
    try {
      if (!online()) throw new Error('offline');
      const con = await res(SB.from('esq_conectores').select('*').eq('esquema_id', id).eq('oficina_id', OF));
      const ids = (con || []).map((c) => c.id);
      const pin = ids.length ? await res(SB.from('esq_pinos').select('*').in('conector_id', ids)) : [];
      const P = {}; (pin || []).forEach((p) => { (P[p.conector_id] = P[p.conector_id] || []).push(p) });
      Object.values(P).forEach((L) => L.sort((a, b) => natural(a.numero, b.numero)));
      C.det[id] = { con: (con || []).sort((a, b) => natural(a.codigo, b.codigo)), pin: P };
      IDB.set(KD(id), C.det[id]);
    } catch (x) { const g = await IDB.get(KD(id)); if (g) C.det[id] = g; else C.det['!' + id] = msgErro(x) }
    finally { delete C.det['_' + id]; if (!quieto) { if (S.v == 'esqadm') redesenha(); else repinta() } }
  }
  ESQ.carregaDet = carregaDet;
  /* 2.57: pinos em tabela (Pino | Cor | Função · valor), com filtro; os que combinam com a busca ficam destacados */
  const palavras = (q) => nrm(q || '').split(/[\s,;/]+/).filter(Boolean);
  const corNomes = (t) => String(t || '').replace(/\*/g, '').split(/\s*[\/\-–+]\s*/).map((p) => { const k = sigla(p); return k ? k + ' ' + CORES[k][0] : p }).join(' ');
  const chaveP = (c, p) => nrm([p.numero, p.cor_fio, corNomes(p.cor_fio), p.funcao, p.valor_esperado, c.codigo, c.nome].join(' '));
  function combinaHl(c, p, W) { if (!W.length) return false; const k = nrm([p.funcao, p.valor_esperado].join(' ')); return W.some((w) => w.length >= 3 && !/^\d+$/.test(w) && k.includes(w)) }
  function painelPinos(x) {
    const d = C.det[x.id];
    if (!d) { if (C.det['!' + x.id]) return `<div class="esq-msg erro" role="alert">Não deu para carregar os conectores. ${e(C.det['!' + x.id])}<div class="bar"><button type="button" class="pr esq-bt" onclick="delete ESQ.C.det['!${x.id}'];ESQ.carregaDet('${x.id}')">Tentar de novo</button></div></div>`; return '<div class="card esq-load" role="status"><span class="esq-spin"></span>Carregando os conectores…</div>' }
    if (!d.con.length) return `<div class="esq-msg">Nenhum conector cadastrado neste esquema.${DONO() ? `<div class="bar"><button type="button" class="pr esq-bt" onclick="go('esqadm',null,null,{ed:'${x.id}',aba:'con'})">Cadastrar conectores e pinos</button></div>` : ''}</div>`;
    const W = palavras((S.f || {}).q), tot = nPinos(x.id), fq = VW.pf || '';
    const lin = (c, p) => `<div class="esq-pr${combinaHl(c, p, W) ? ' hl' : ''}" role="row" data-k="${e(chaveP(c, p))}" data-n="${e(nrm(String(p.numero || '')))}"><span class="n" role="cell" aria-label="Pino ${e(p.numero)}">${e(p.numero)}</span><span class="c" role="cell">${corFio(p.cor_fio)}</span><span class="f" role="cell">${e(p.funcao || 'Função não informada')}${p.valor_esperado ? `<small>${e(p.valor_esperado)}</small>` : ''}</span><span class="v" role="cell">${e(p.valor_esperado || '—')}</span></div>`;
    const h = (tot > 5 ? `<div class="esq-pfil">${ICON('search')}<input id="esq-pf" type="search" autocomplete="off" enterkeyhint="search" placeholder="Filtrar: pino 12, VD, sonda…" aria-label="Filtrar pinos por número, cor ou função" value="${e(fq)}" oninput="esqPF(this.value)"></div>` : '') +
      d.con.map((c) => { const P = d.pin[c.id] || [];
        return `<section class="esq-cn" data-c="${e(c.id)}"><h3><span class="c">${e(c.codigo)}</span><span class="nm">${e(c.nome || '')}</span><small>${plural(P.length, 'pino', 'pinos')}</small></h3>${c.localizacao ? `<div class="loc">${e(c.localizacao)}</div>` : ''}
          ${P.length ? `<div class="esq-pt" role="table" aria-label="Pinos do conector ${e(c.codigo)}"><div class="esq-pr hd" role="row"><span role="columnheader">Pino</span><span role="columnheader">Cor</span><span role="columnheader">Função</span><span class="v" role="columnheader">Valor esperado</span></div>${P.map((p) => lin(c, p)).join('')}</div>` : '<p class="muted" style="margin:6px 0 0">Nenhum pino cadastrado.</p>'}</section>` }).join('') +
      '<div class="esq-msg" id="esq-pfn" hidden></div>' +
      `<details style="margin-top:6px"><summary style="min-height:48px;display:flex;align-items:center;font-size:16px">Legenda das cores dos fios</summary>${legenda()}</details>`;
    if (fq) setTimeout(() => esqPF(fq), 0);
    return h;
  }
  /* filtro: cada palavra precisa aparecer; número sozinho (ou "pino 12") é o número do pino */
  G.esqPF = function (q) {
    VW.pf = q; const W = palavras(q).filter((w) => !/^pinos?$/.test(w)), box = $q('#esq-painel'); if (!box) return;
    let vis = 0;
    box.querySelectorAll('.esq-cn').forEach((sec) => {
      let n = 0;
      sec.querySelectorAll('.esq-pr:not(.hd)').forEach((r) => { const k = r.dataset.k || '', num = r.dataset.n || ''; const ok = W.every((w) => /^\d+$/.test(w) ? num == w : k.includes(w)); r.hidden = !ok; if (ok) n++ });
      sec.hidden = W.length > 0 && !n; vis += n;
    });
    const m = $q('#esq-pfn'); if (m) { m.hidden = !W.length || vis > 0; m.textContent = 'Nenhum pino para “' + q + '”.' }
  };

  /* =====================================================================
     ANOTAÇÕES PESSOAIS (presas a um ponto da página ou soltas)
     ===================================================================== */
  async function carregaNotas(id) {
    if (C.nota['_' + id]) return; C.nota['_' + id] = 1;
    try {
      if (!online()) throw new Error('offline');
      const L = await res(SB.from('esq_anotacoes').select('*').eq('esquema_id', id).eq('user_id', meu()));
      C.nota[id] = (L || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))); IDB.set(KN(id), C.nota[id]);
    } catch (x) { const g = await IDB.get(KN(id)); C.nota[id] = g || []; if (!g) C.nota['!' + id] = msgErro(x) }
    finally { delete C.nota['_' + id]; repinta() }
  }
  ESQ.carregaNotas = carregaNotas;
  const numNota = (id) => { const L = (C.nota[id] || []).filter((n) => n.x != null); return (n) => L.indexOf(n) + 1 };
  function pinta() {
    const box = $q('#esq-pins'); if (!box || !VW.id) return; const L = C.nota[VW.id] || [], nn = numNota(VW.id);
    box.innerHTML = L.filter((n) => n.x != null && (n.pagina || 1) == VW.pag).map((n) => `<button type="button" class="esq-mk" style="left:${n.x * 100}%;top:${n.y * 100}%" aria-label="Anotação ${nn(n)}: ${e(n.texto)}" onclick="esqNotaVer('${n.id}')"><span>${nn(n)}</span></button>`).join('');
  }
  function painelNotas(x) {
    const L = C.nota[x.id];
    if (!L) return '<div class="card esq-load" role="status"><span class="esq-spin"></span>Carregando suas anotações…</div>';
    const nn = numNota(x.id);
    return `<p class="muted" style="font-size:15px;margin:0 0 8px">Só você vê as suas anotações. Para prender num ponto, toque no alfinete ${ICON('esqpin').replace('<svg', '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;vertical-align:-3px"')} e depois no esquema.</p>
      ${C.nota['!' + x.id] ? `<div class="esq-msg erro" role="alert" style="margin:0 0 8px">Não deu para buscar as anotações. ${e(C.nota['!' + x.id])}</div>` : ''}
      ${L.length ? L.map((n) => `<div class="esq-nota" id="esqn-${n.id}">${n.x != null ? `<span class="mk">${nn(n)}</span>` : `<span class="mk" style="background:var(--ln);color:inherit">✎</span>`}<div class="tx">${e(n.texto)}<small>${n.x != null ? 'Página ' + (n.pagina || 1) + ' · ' : ''}${e(new Date(n.created_at || Date.now()).toLocaleDateString('pt-BR'))}</small></div><button type="button" class="esq-ib" aria-label="Apagar anotação" onclick="esqNotaDel('${n.id}')">×</button></div>`).join('') : '<div class="esq-msg">Nenhuma anotação ainda.</div>'}
      <div class="bar" style="margin-top:10px"><button type="button" class="pr esq-bt" onclick="esqNotaNova('${x.id}')">+ Anotação</button><button type="button" class="esq-bt" onclick="esqAnotar(true)">${ICON('esqpin').replace('<svg', '<svg style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;vertical-align:-4px"')} Prender num ponto</button></div>`;
  }
  G.esqAnotar = function (on) {
    VW.anotar = on === undefined ? !VW.anotar : !!on;
    const b = $q('#esq-banot'); if (b) { b.classList.toggle('on', VW.anotar); b.setAttribute('aria-pressed', VW.anotar) }
    const st = $q('#esq-stage'); let d = $q('#esq-dica');
    if (VW.anotar && st && !d) { d = document.createElement('div'); d.className = 'esq-dica'; d.id = 'esq-dica'; d.textContent = 'Toque no ponto do esquema'; st.appendChild(d); esqLimpo(false) }
    if (!VW.anotar && d) d.remove();
  };
  G.esqNotaNova = function (id, x, y, pag) {
    const preso = x != null;
    sheet(preso ? 'Anotação neste ponto' : 'Nova anotação', `<form class="esq-form" onsubmit="event.preventDefault();esqNotaSalva('${id}',${preso ? x : 'null'},${preso ? y : 'null'},${preso ? pag : 'null'},this)">
      ${preso ? `<p class="muted" style="margin:0 0 8px;font-size:15px">Página ${pag}. Só você vê.</p>` : '<p class="muted" style="margin:0 0 8px;font-size:15px">Só você vê.</p>'}
      <label>Anotação<textarea name="t" required maxlength="2000" placeholder="Ex.: fio rompido perto do conector; medi 11,8 V aqui"></textarea></label>
      <div class="bar" style="margin-top:12px"><span class="sp"></span><button type="button" class="esq-bt" onclick="closeM()">Cancelar</button><button class="pr esq-bt">Salvar</button></div></form>`);
    setTimeout(() => { const t = $q('#modal textarea'); if (t) t.focus() }, 60);
  };
  G.esqNotaSalva = async function (id, x, y, pag, form) {
    const t = String(form.t.value || '').trim(); if (!t) return toast('Escreva a anotação');
    const b = form.querySelector('.pr'); b.disabled = true; b.textContent = 'Salvando…';
    try {
      if (!online()) throw new Error('offline');
      const r = await res(SB.from('esq_anotacoes').insert({ oficina_id: OF, esquema_id: id, pagina: pag, x, y, texto: t }).select().single());
      (C.nota[id] = C.nota[id] || []).push(r); IDB.set(KN(id), C.nota[id]); closeM(); toast('Anotação salva');
      if (S.v == 'esqv') { if ((S.f || {}).vt != 'not') esqVT('not'); else repinta(); pinta() }
    } catch (z) { b.disabled = false; b.textContent = 'Salvar'; toast(semNet(z) ? 'Sem internet: a anotação precisa de conexão para salvar.' : 'Erro ao salvar: ' + msgErro(z), 'erro') }
  };
  G.esqNotaVer = function (nid) {
    const L = C.nota[VW.id] || [], n = L.find((z) => z.id == nid); if (!n) return;
    sheet('Anotação ' + numNota(VW.id)(n), `<p style="font-size:17px;white-space:pre-wrap;overflow-wrap:anywhere">${e(n.texto)}</p><p class="muted">Página ${n.pagina || 1}</p><div class="bar"><button type="button" class="esq-bt" onclick="closeM();esqNotaDel('${n.id}')">Apagar</button><span class="sp"></span><button type="button" class="pr esq-bt" onclick="closeM()">Fechar</button></div>`);
  };
  /* apagar na hora com Desfazer (2.53): o Desfazer grava de novo a mesma anotação */
  G.esqNotaDel = async function (nid) {
    const id = VW.id || S.id, L = C.nota[id] || [], i = L.findIndex((n) => n.id == nid); if (i < 0) return; const n = L[i];
    try {
      if (!online()) throw new Error('offline');
      await res(SB.from('esq_anotacoes').delete().eq('id', nid));
      L.splice(i, 1); IDB.set(KN(id), L); repinta();
      if (typeof desfazCom == 'function') desfazCom('Anotação apagada', async () => { try { await res(SB.from('esq_anotacoes').insert({ id: n.id, oficina_id: n.oficina_id, esquema_id: n.esquema_id, pagina: n.pagina, x: n.x, y: n.y, texto: n.texto, created_at: n.created_at })); L.splice(Math.min(i, L.length), 0, n); IDB.set(KN(id), L); repinta() } catch (z) { toast('Não deu para desfazer: ' + msgErro(z), 'erro') } });
    } catch (z) { toast(semNet(z) ? 'Sem internet: para apagar a anotação precisa de conexão.' : 'Erro ao apagar: ' + msgErro(z), 'erro') }
  };

  /* =====================================================================
     FAVORITOS
     ===================================================================== */
  G.esqFav = async function (id) {
    const tinha = C.fav.has(id), b = $q('#esq-bfav');
    const liga = (on) => { if (on) C.fav.add(id); else C.fav.delete(id); if (b) { b.classList.toggle('fav', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Tirar dos favoritos' : 'Favoritar') } IDB.set(KF(), [...C.fav]) };
    liga(!tinha);
    try {
      if (!online()) throw new Error('offline');
      if (tinha) await res(SB.from('esq_favoritos').delete().eq('esquema_id', id).eq('user_id', meu()));
      else await res(SB.from('esq_favoritos').insert({ oficina_id: OF, esquema_id: id }));
      toast(tinha ? 'Tirado dos favoritos' : 'Nos favoritos');
    } catch (z) { liga(tinha); toast(semNet(z) ? 'Sem internet: favoritar precisa de conexão.' : 'Erro: ' + msgErro(z), 'erro') }
  };

  /* =====================================================================
     USAR SEM INTERNET: arquivo, miniatura, conectores, pinos, fusíveis e anotações no IndexedDB
     ===================================================================== */
  async function baixa(id) {
    const x = esqm(id); if (!x) return false;
    const blob = await arquivo(x);
    let min = null; if (x.miniatura_path) { try { min = await blobDe(x.miniatura_path, 300) } catch (z) {} }
    await carregaDet(id, true); await carregaNotas(id); C.fus['_' + x.veiculo_id] = 0; await carregaFus(x.veiculo_id, true);
    if (x.tipo == 'pdf') { try { await pdfjs(); await fetch(PDFDIR + 'pdf.worker.mjs') } catch (z) {} }
    await IDB.set(KA(id), { blob, min, tipo: x.tipo, em: Date.now() });
    C.off[id] = { em: Date.now(), tam: blob.size || 0 }; await IDB.set(KO(), C.off);
    IDB.del(KR2(id));
    IDB.set(KC(), { ...cat(), em: C.em });
    return true;
  }
  G.esqBaixa = async function (id) {
    if (!esqm(id)) return;
    if (!online()) return toast('Sem internet agora. Conecte-se para baixar.', 'erro');
    toast('Baixando para usar sem internet…');
    try { await baixa(id); toast('Pronto: este esquema abre sem internet') }
    catch (z) { toast('Não deu para baixar: ' + (z.sem ? z.message : msgErro(z)), 'erro') }
    if (naTela()) render();
  };
  /* 2.57: baixar o carro inteiro (todos os esquemas, pinos e fusíveis) de uma vez */
  let BXC = '';
  G.esqBaixaCarro = async function (vid) {
    const L = cat().esquemas.filter((x) => x.veiculo_id == vid && x.arquivo_path), F = L.filter((x) => !C.off[x.id]);
    if (!L.length || BXC) return;
    if (!F.length) return toast('Os ' + plural(L.length, 'esquema', 'esquemas') + ' deste carro já abrem sem internet');
    if (!online()) return toast('Sem internet agora. Conecte-se para baixar.', 'erro');
    BXC = vid; render(); let ok = 0;
    for (let i = 0; i < F.length; i++) { toast('Baixando ' + (i + 1) + ' de ' + F.length + '…'); try { if (await baixa(F[i].id)) ok++ } catch (z) {} }
    BXC = '';
    toast(ok == F.length ? 'Pronto: ' + plural(ok, 'esquema', 'esquemas') + ' deste carro abrem sem internet' : 'Baixados ' + ok + ' de ' + F.length + '. Toque de novo para tentar o resto.', ok == F.length ? '' : 'erro');
    if (naTela()) render();
  };
  G.esqTira = async function (id) {
    const x = esqm(id); if (!C.off[id]) return;
    const a = await IDB.get(KA(id)), antes = C.off[id];
    await IDB.del(KA(id)); delete C.off[id]; await IDB.set(KO(), C.off); render();
    if (typeof desfazCom == 'function') desfazCom('Tirado do aparelho' + (x ? ': ' + x.titulo : ''), async () => { if (a) await IDB.set(KA(id), a); C.off[id] = antes; await IDB.set(KO(), C.off); render() });
  };

  /* =====================================================================
     ANEXAR À O.S. (fica no JSON da oficina: o.esqs = [ids])
     ===================================================================== */
  /* guarda o título junto, para a O.S. mostrar o anexo sem precisar abrir o módulo */
  G.esqAnexa = function (oid, id) {
    const o = od(oid); if (!o) return; const L = o.esqs = Array.isArray(o.esqs) ? o.esqs : [];
    const i = L.findIndex((a) => (a && a.id) == id), x = esqm(id);
    const faz = () => { if (i >= 0) L.splice(i, 1); else L.push({ id, t: x ? x.titulo : 'Esquema', s: x ? sist(x.sistema_id).nome || '' : '' }); save(); render() };
    if (typeof desfazivel == 'function') desfazivel(faz, (i >= 0 ? 'Tirado da O.S. ' : 'Anexado à O.S. ') + o.num + (x ? ': ' + x.titulo : '')); else faz();
  };

  G.addEventListener('online', () => { if (C.velha) { C.velha = false; carregaCat(1) } });
})(window);
