/* Fio-Mar Gestor — consulta ao especialista em diagnóstico (IA Claude) (versão 2.12.0)
   Só o dono. Pacote mensal de consultas por oficina. Abrir uma consulta gasta 1;
   continuar na mesma O.S. é grátis até fechar o diagnóstico (máximo de 20 perguntas). */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s),esc=x=>e(x);
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
let SAL=null,CK={},EST=null,ENV=false,AUTO=null;
ICO.ia='<path d="M12 3v3M8 3h8"/><rect x="4" y="6" width="16" height="13" rx="4"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><path d="M9 16h6M2 12h2M20 12h2"/>';

async function chama(body){if(!navigator.onLine)throw new Error('Sem internet. A consulta à IA precisa de internet.');
 const{data,error}=await SB.functions.invoke('ia-diagnostico',{body:{oficina:OF,...body}});
 if(error){let j=null;try{j=await error.context.json()}catch(x){}const e=new Error((j&&j.msg)||'Não consegui falar com a IA. Confira a internet.');e.cod=j&&j.erro;throw e}
 if(data&&data.usadas!=null)SAL={usadas:data.usadas,limite:data.limite};return data}
const restam=()=>SAL?Math.max(0,SAL.limite-SAL.usadas):null;
const saldoTxt=()=>SAL?`${SAL.usadas} de ${SAL.limite} consultas usadas em ${MES[new Date().getMonth()]}`:'Carregando o saldo do mês…';

/* texto simples com ##, **negrito** e listas */
function md(t){const L=esc(String(t||'')).split('\n'),o=[];let lst=null;const fecha=()=>{if(lst){o.push(`</${lst}>`);lst=null}};
 const inl=s=>s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|\s)\*(\S.+?)\*(?=\s|$)/g,'$1<i>$2</i>');
 L.forEach(l=>{let m;if(m=l.match(/^#{1,4}\s+(.*)/)){fecha();o.push(`<h4>${inl(m[1])}</h4>`)}else if(m=l.match(/^\s*[-•*]\s+(.*)/)){if(lst!='ul'){fecha();o.push('<ul>');lst='ul'}o.push(`<li>${inl(m[1])}</li>`)}
  else if(m=l.match(/^\s*\d+[.)]\s+(.*)/)){if(lst!='ol'){fecha();o.push('<ol>');lst='ol'}o.push(`<li>${inl(m[1])}</li>`)}else if(!l.trim())fecha();else{fecha();o.push(`<p>${inl(l)}</p>`)}});fecha();return o.join('')}
const SUG='Já registrei os códigos, os sintomas e os testes que fiz e não encontrei o defeito. Com base em tudo, qual é o defeito mais provável? Diga o que os testes já descartaram e o que falta testar para confirmar.';
const nrmz=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const STOP=new Set('para com sem dos das nos nas uma uns umas pelo pela entre sobre teste testar medir verificar fazer checar conferir motor carro cilindro'.split(' '));
function parteApp(t){const i=String(t||'').indexOf('[[APP]]');if(i<0)return{txt:t,def:'',sis:'',tes:[]};const R={txt:t.slice(0,i).trim(),def:'',sis:'',tes:[]};
 t.slice(i+7).split('\n').forEach(l=>{const m=l.match(/^\s*(DEFEITO|SISTEMA|TESTE)\s*:\s*(.+?)\s*$/i);if(!m)return;const k=m[1].toUpperCase(),v=m[2].replace(/^[<"]|[>"]$/g,'');if(k=='DEFEITO')R.def=v.slice(0,120);else if(k=='SISTEMA')R.sis=v;else if(R.tes.length<3)R.tes.push(v.slice(0,120))});return R}
/* acha o teste do catálogo do app que mais parece com o que a IA sugeriu */
function testeDoCatalogo(nome,o){const T=DG.TESTS||{},d=o.dg||{},W=nrmz(nome).replace(/[^a-z0-9 ]/g,' ').split(' ').filter(w=>w.length>=4&&!STOP.has(w));if(!W.length)return null;let best=null,bs=0;
 Object.values(T).forEach(t=>{if(d.t&&d.t[t.id]&&d.t[t.id].r)return;const nm=nrmz(t.n),tx=nm+' '+nrmz(t.como||'');let s=0;W.forEach(w=>{const r=w.slice(0,Math.max(4,w.length-2));if(nm.includes(r))s+=2;else if(tx.includes(r))s+=1});if(s>bs){bs=s;best=t}});
 return bs>=Math.max(3,Math.ceil(W.length*1.2))?best:null}
function acoes(m){const A=parteApp(m.texto),o=EST&&od(EST.oid);if(!o||(!A.def&&!A.tes.length)||(o.dg&&o.dg.fim))return'';const d=o.dg||{},b=[];
 if(A.def){const ja=nrmz(d.def)==nrmz(A.def);b.push(`<button type="button" class="${ja?'':'pr '}sm" ${ja?'disabled':''} data-def="${esc(A.def)}" data-sis="${esc(A.sis)}" onclick="iaUsaDef(this)">${ja?'✓ Já está como defeito':'Usar como defeito: '+esc(A.def)}</button>`)}
 A.tes.forEach(n=>{const t=testeDoCatalogo(n,o);if(!t)return;const ja=(d.ext||[]).includes(t.id);b.push(`<button type="button" class="sm" ${ja?'disabled':''} onclick="iaAddTeste('${t.id}',this)">${ja?'✓ No plano: ':'+ Plano: '}${esc(t.n)}</button>`)});
 return b.length?`<div class="iaac"><small class="muted">Levar para o diagnóstico</small>${b.join('')}</div>`:''}
G.iaUsaDef=function(btn){const o=EST&&od(EST.oid);if(!o)return;const d=o.dg=o.dg||{};d.def=btn.dataset.def;const s=(DG.SIS||[]).find(x=>nrmz(x)==nrmz(btn.dataset.sis));if(s)d.sis=s;save();
 btn.disabled=true;btn.classList.remove('pr');btn.textContent='✓ Preenchido em Defeito encontrado';toast('Preenchido em "Defeito encontrado". Confirme com o teste antes de fechar o diagnóstico.')};
G.iaAddTeste=function(id,btn){const o=EST&&od(EST.oid);if(!o)return;const d=o.dg=o.dg||{};d.ext=Array.isArray(d.ext)?d.ext:[];if(!d.ext.includes(id))d.ext.push(id);save();btn.disabled=true;btn.textContent='✓ No plano: '+((DG.TESTS[id]||{}).n||'');toast('Teste adicionado ao plano')};
function bolha(m,ult){if(m.papel=='assistant'){const A=parteApp(m.texto);return`<div class="iam ia-r">${md(A.txt)}${ult?acoes(m):''}</div>`}
 const t=String(m.texto||''),dados=/^Dados do diagnóstico/.test(t),p=dados?(t.split(/\n\n(?=Pergunta do mecânico: |Analise o caso|Considere os dados)/)[1]||''):t;
 return`<div class="iam ia-u">${dados?`<span class="iachip">${svgi('osdiag')} ${/atualizados/.test(t)?'Dados atualizados do caso enviados':'Dados do caso enviados'}</span>`:''}${p?`<p>${p.includes(SUG)?'<b>Não achei o defeito.</b> Qual é o mais provável e o que falta testar?':esc(p.replace(/^Pergunta do mecânico: /,''))}</p>`:''}</div>`}

/* ---------- botão na página do diagnóstico ---------- */
G.iaBar=function(o){if(!DONO())return'';if(!SAL)chama({acao:'saldo'}).then(()=>{if(S.v=='diag')render(1)}).catch(()=>{});
 const k=CK[o.id],fim=o.dg&&o.dg.fim;
 return`<div class="card iabar"><span class="iaic">${svgi('ia')}</span><div class="iatx"><b>Especialista em diagnóstico (IA)</b><small>${k?`Consulta aberta · ${k.perguntas} de ${k.max} perguntas · continuar é grátis`:fim?'Diagnóstico fechado':saldoTxt()}</small></div>
 <button type="button" class="${fim?'':'pr'}" onclick="iaAbre('${o.id}')">${k?'Continuar':fim?'Ver conversa':'Consultar'}</button></div>`};

const pdfB=o=>`<div class="iapdf"><button type="button" onclick="DG.pdfEnvia('${o.id}')">${svgi('notas')} Enviar PDF do diagnóstico</button><button type="button" class="sm" onclick="DG.pdf('${o.id}')">Baixar</button></div>`;
G.iaAjuda=function(o,st){if(o.dg&&o.dg.fim)return'';if(!DONO())return`<div class="card iaaj"><div class="iaajh"><div><b>Não achou o defeito?</b><small>Gere um PDF com os dados do carro, os códigos, os sintomas e todos os testes feitos, com as fotos, para pedir ajuda.</small></div></div>${pdfB(o)}</div>`;const d=o.dg||{},nt=Object.values(d.t||{}).filter(x=>x&&x.r).length,nc=(d.cod||[]).length,ns=(d.sin||[]).length;
 return`<div class="card iaaj"><div class="iaajh"><span class="iaic">${svgi('ia')}</span><div><b>Não achou o defeito?</b><small>A IA cruza ${[nc&&plural(nc,'código','códigos'),ns&&plural(ns,'sintoma','sintomas'),plural(nt,'teste feito','testes feitos')].filter(Boolean).join(', ')} e sugere <b>o defeito mais provável</b> e o que falta testar.</small></div></div>
 ${nt?'':`<small class="muted iaajd">Fica mais certeira depois de registrar o resultado de alguns testes.</small>`}<button type="button" class="pr" onclick="iaSugere('${o.id}')">Pedir sugestão à IA</button>${pdfB(o)}</div>`};
G.iaSugere=function(oid){AUTO=SUG;iaAbre(oid)};
/* ---------- janela da conversa ---------- */
function tela(o,body,pe){const v=vh(o.veh);$('#modal').innerHTML=`<div class="ov psh-ov"><div class="md psh iash" role="dialog" aria-modal="true" aria-label="Especialista em diagnóstico">
 <div class="psh-h"><span class="iaic">${svgi('ia')}</span><div style="flex:1;min-width:0"><h2 style="margin:0">Especialista em diagnóstico</h2><small class="muted">${esc(vlabel(v))} · O.S. ${esc(o.num)}</small></div><button type="button" class="ib" aria-label="Fechar" onclick="iaFecha()">×</button></div>
 <div class="iabd" id="iabd">${body}</div>${pe||''}</div></div>`;const b=$q('#iabd');if(b)b.scrollTop=b.scrollHeight}
G.iaFecha=function(){AUTO=null;closeM();if(S.v=='diag')render(1)};
G.iaAbre=async function(oid){const o=od(oid);if(!o||!DONO())return;
 tela(o,`<div class="iaload"><i></i><i></i><i></i><span>Abrindo…</span></div>`);
 try{EST=await chama({acao:'abrir',os:oid});EST.oid=oid;if(EST.consulta)CK[oid]=EST.consulta;else delete CK[oid];desenha()}
 catch(e){tela(o,`<p class="iaerr">${esc(e.message)}</p>`)}};
function desenha(){const o=od(EST.oid);if(!o)return;const fim=o.dg&&o.dg.fim,k=fim?null:EST.consulta,msgs=EST.msgs||[];if(fim&&EST.consulta&&!EST.anterior)EST.anterior={criado_em:EST.consulta.criado_em||new Date().toISOString()};
 const lastA=msgs.map(x=>x.papel).lastIndexOf('assistant'),B=L=>L.map((m,i)=>bolha(m,i==lastA)).join('');
 if(k){tela(o,B(msgs)+`<div id="iafim"></div>`,campo(k));if(AUTO){const q=AUTO;AUTO=null;const t=$q('#iaq');if(t){t.value=q;iaEnvia()}}return}
 const ctx=DG.iaCtx(o),r=restam(),velha=msgs.length?`<details class="iaold"><summary>Conversa anterior desta O.S. (${new Date(EST.anterior.criado_em).toLocaleDateString('pt-BR')})</summary>${B(msgs)}</details>`:'';
 if(fim)return tela(o,velha+`<p class="iainfo">O diagnóstico desta O.S. já está fechado. Para consultar de novo, reabra o diagnóstico.</p>`);
 tela(o,velha+`<div class="iaintro"><p>O especialista analisa o caso e diz <b>as causas mais prováveis</b> e <b>os testes na ordem</b>, do mais barato ao mais caro.</p>
  <details><summary>O que vai junto (dados do diagnóstico)</summary><pre class="iactx">${esc(ctx)}</pre></details>
  <p class="iacusto">${svgi('ia')}<span>Abrir a consulta usa <b>1 consulta do mês</b>${r!=null?` (restam <b>${r}</b> de ${SAL.limite})`:''}. As perguntas seguintes nesta O.S. são <b>grátis</b> até fechar o diagnóstico (máximo de 20).</span></p>
  <label>Quer perguntar algo específico? (opcional)<textarea id="iaq" rows="${AUTO?4:2}" placeholder="Ex.: falha só com o motor quente, já troquei as velas">${AUTO?esc(AUTO):''}</textarea></label></div>`,
  `<div class="iape"><button type="button" class="pr iago" ${r===0?'disabled':''} onclick="iaEnvia(1)">${r===0?'As consultas do mês acabaram':AUTO?'Pedir sugestão (usa 1)':'Começar consulta (usa 1)'}</button></div>`)}
function campo(k){return`<div class="iape"><div class="iaqk">${['Fiz o teste e deu: ','Não tenho esse equipamento. Outra forma?','Explique melhor como fazer o teste 1','Qual o valor de referência?'].map(t=>`<button type="button" class="sm" onclick="iaQk(this)">${esc(t.replace(/: $/,''))}</button>`).join('')}</div>
 <div class="iain"><textarea id="iaq" rows="1" placeholder="Resultado do teste ou pergunta…" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea><button type="button" class="pr" aria-label="Enviar" onclick="iaEnvia()">${svgi('send')}</button></div>
 <div class="iarod"><small class="muted">Pergunta ${k.perguntas} de ${k.max} · grátis nesta O.S.</small><span class="sp"></span><button type="button" class="sm" onclick="iaEncerra()">Encerrar consulta</button></div></div>`}
ICO.send=ICO.send||'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>';
G.iaQk=function(b){const t=$q('#iaq');if(!t)return;const s=b.textContent;t.value=/^Fiz o teste/.test(s)?'Fiz o teste e deu: ':s;t.focus();try{t.setSelectionRange(t.value.length,t.value.length)}catch(x){}};
G.iaEnvia=async function(nova){if(ENV||!EST)return;AUTO=null;const o=od(EST.oid);if(!o)return;const t=$q('#iaq'),q=(t&&t.value||'').trim();
 if(!nova&&!q)return toast('Escreva o resultado do teste ou a pergunta');ENV=true;
 const bd=$q('#iabd');if(nova&&bd)bd.innerHTML='';if(bd){bd.insertAdjacentHTML('beforeend',(q||nova)?bolha({papel:'user',texto:nova?('Dados do diagnóstico registrados no app:\n\n'+(q?'Pergunta do mecânico: '+q:'')):q}):'');bd.insertAdjacentHTML('beforeend','<div class="iaload" id="iaw"><i></i><i></i><i></i><span>O especialista está analisando…</span></div>');bd.scrollTop=bd.scrollHeight}
 const pe=$q('.iape');if(pe)pe.classList.add('off');if(t)t.value='';
 try{const r=await chama({acao:'perguntar',os:o.id,nova:!!nova,pergunta:q,contexto:DG.iaCtx(o),num:o.num,carro:vlabel(vh(o.veh))});
  EST.consulta=r.consulta;CK[o.id]=r.consulta;EST.msgs=(nova?[]:EST.msgs||[]).concat([{papel:'user',texto:r.enviado},{papel:'assistant',texto:r.resposta}]);ENV=false;desenha();if(r.nova)toast('Consulta aberta · '+SAL.usadas+' de '+SAL.limite+' do mês')}
 catch(e){ENV=false;const w=$q('#iaw');if(w)w.outerHTML=`<p class="iaerr">${esc(e.message)}</p>`;if(pe)pe.classList.remove('off');if(t&&q)t.value=q;if(e.cod=='fechado'||e.cod=='limite'){EST.consulta=null;delete CK[o.id]}}};
G.iaEncerra=async function(){if(!EST||!EST.consulta)return;if(!confirm('Encerrar esta consulta? Para consultar de novo nesta O.S. vai usar outra consulta do mês.'))return;
 try{await chama({acao:'fechar',consulta:EST.consulta.id});delete CK[EST.oid];toast('Consulta encerrada');iaAbre(EST.oid)}catch(e){toast(e.message)}};

const st=document.createElement('style');st.textContent=`
.iabar{display:flex;align-items:center;gap:12px;padding:12px;margin:10px 0;border-left:4px solid var(--hi);background:linear-gradient(90deg,color-mix(in srgb,var(--hi) 12%,var(--sf)),var(--sf))}
.iaic{flex:none;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:var(--gr,#17181A);color:var(--hi)}
.iaic svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.iatx{flex:1;min-width:0}.iatx b{display:block}.iatx small{display:block;color:var(--mut);font-size:12.5px}.iabar button{margin:0;flex:none}
.iash{display:flex;flex-direction:column;max-height:94vh;height:94vh;padding-bottom:0}.iash .psh-h{gap:10px;align-items:center}
.iabd{flex:1;overflow-y:auto;padding:4px 2px 10px;overscroll-behavior:contain}
.iam{margin:8px 0;padding:10px 12px;border-radius:14px;font-size:15px;line-height:1.45;overflow-wrap:anywhere}
.ia-r{background:var(--bg);border:1px solid var(--ln);border-top-left-radius:4px;margin-right:6%}
.ia-u{background:color-mix(in srgb,var(--hi) 22%,var(--sf));margin-left:14%;border-top-right-radius:4px}
.iam h4{margin:10px 0 4px;font:700 17px "Barlow Condensed",sans-serif;letter-spacing:.02em;color:var(--ink);border-bottom:2px solid var(--hi);display:inline-block}.iam h4:first-child{margin-top:0}
.iam p{margin:4px 0}.iam ul,.iam ol{margin:4px 0;padding-left:20px}.iam li{margin:3px 0}
.iachip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--mut)}.iachip svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2}
.iaload{display:flex;align-items:center;gap:5px;margin:10px 4px;color:var(--mut);font-size:14px}.iaload span{margin-left:6px}
.iaload i{width:8px;height:8px;border-radius:50%;background:var(--hi);animation:iapu 1s infinite ease-in-out}.iaload i:nth-child(2){animation-delay:.15s}.iaload i:nth-child(3){animation-delay:.3s}
@keyframes iapu{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.iaload i{animation:none}}
.iaerr{margin:10px 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,#C2412A 14%,var(--sf));color:var(--ink)}
.iainfo{padding:10px 12px;border-radius:10px;background:var(--bg)}
.iaintro p{margin:6px 0}.iactx{white-space:pre-wrap;font-size:12.5px;background:var(--bg);padding:10px;border-radius:8px;max-height:220px;overflow:auto}
.iacusto{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--hi) 14%,var(--sf));font-size:14px}.iacusto svg{flex:none;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8}
.iaold{margin:0 0 12px;border:1px solid var(--ln);border-radius:10px;padding:8px 10px}.iaold summary{cursor:pointer;color:var(--mut);font-size:14px}
.iape{position:sticky;bottom:0;background:var(--sf);border-top:1px solid var(--ln);padding:8px 0 calc(10px + env(safe-area-inset-bottom));margin:0 -2px}.iape.off{opacity:.5;pointer-events:none}
.iago{width:100%;padding:13px;font-size:16px}
.iaqk{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}.iaqk::-webkit-scrollbar{display:none}.iaqk button{flex:none;margin:0;border-radius:99px;white-space:nowrap}
.iain{display:flex;gap:8px;align-items:flex-end}.iain textarea{margin:0;resize:none;min-height:44px;font-size:16px}.iain button{flex:none;width:48px;height:44px;margin:0;padding:0;display:flex;align-items:center;justify-content:center}
.iain button svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.iaaj{margin:14px 0;border:1.5px dashed color-mix(in srgb,var(--hi) 60%,var(--ln));background:color-mix(in srgb,var(--hi) 7%,var(--sf))}.iaajh{display:flex;gap:12px;align-items:center}.iaajh b{display:block;font-size:16px}.iaajh small{display:block;color:var(--mut);margin-top:2px}.iaajh small b{display:inline;font-size:inherit;color:var(--ink)}
.iaaj>button{width:100%;margin:12px 0 0;padding:12px}.iapdf{display:flex;gap:8px;margin-top:8px}.iapdf button{margin:0}.iapdf button:first-child{flex:1;padding:11px;display:flex;align-items:center;justify-content:center;gap:6px}.iapdf svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}.iaajd{display:block;margin-top:8px}
.iaac{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--ln)}.iaac button{margin:0;text-align:left;white-space:normal}
.iarod{display:flex;align-items:center;gap:8px;margin-top:6px}.iarod button{margin:0}
`;document.head.appendChild(st);
})(window);
