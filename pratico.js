/* Fio-Mar Gestor — uso prático (versão 2.8.0)
   Menu embaixo no celular, botão "+", busca única, entrada do carro, o que fazer agora,
   aviso de carro pronto, lembrete de revisão e kits de itens. */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const chip=(t,c)=>`<span class="pchip" style="--c:${c||'#5B7083'}">${t}</span>`;
const sheet=(tit,body,cls)=>{$('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh ${cls||''}" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};
const dias=(a,b)=>Math.round((new Date((b||today())+'T12:00')-new Date(a+'T12:00'))/864e5);
const addMes=(d,m)=>{const x=new Date(d+'T12:00');x.setMonth(x.getMonth()+m);return x.toISOString().slice(0,10)};
const ABERTA=o=>['Aberta','Em andamento','Aguardando peças'].includes(o.status);
const tel=c=>c&&c.tel;

/* ---------- estilos ---------- */
const css=`
.pchip{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent)}
#bnav{display:none}
@media (max-width:760px){
 nav .nt{display:none}
 #bnav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:17;background:#15212B;border-top:1px solid #2A3743;padding:4px 4px calc(4px + env(safe-area-inset-bottom,0px));justify-content:space-around;align-items:flex-end}
 #bnav a{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;color:#B2C0CB;font-size:11px;font-weight:500;cursor:pointer;border-radius:10px;min-width:0}
 #bnav a svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
 #bnav a.on{color:#fff}#bnav a.on svg{stroke:var(--hi)}
 #bnav a.pl{flex:1 1 0}#bnav a.pl span.c{width:52px;height:52px;margin-top:-22px;border-radius:50%;background:var(--hi);color:#15212B;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}
 #bnav a.pl span.c svg{stroke:#15212B;width:28px;height:28px;stroke-width:2.4}
 main{padding-bottom:96px!important}footer.ver{padding-bottom:84px}
 #vzfab{bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}
 #toast{bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}
 nav .nbtn.pmais{display:none}
}
nav .nbtn.pbus span{display:inline}
@media (max-width:760px){nav .nbtn.pbus span{display:none}}
.psh-ov{align-items:flex-end}
.psh{max-width:560px;border-radius:16px 16px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px));max-height:88vh}
@media (min-width:761px){.psh-ov{align-items:center}.psh{border-radius:12px}}
.psh-h{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px}.psh-h h2{margin:0;font-size:20px}.psh-h .ib{font-size:22px;width:40px;height:40px;padding:0}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pgrid button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;font-weight:600;font-size:13px;text-align:center;border-radius:12px}
.pgrid button svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pgrid button.big{grid-column:1/-1;flex-direction:row;justify-content:center;font-size:16px;padding:16px}
.pres{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.pres h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:10px 0 2px}
.pres button{display:flex;justify-content:space-between;gap:10px;text-align:left;width:100%;padding:10px 12px;align-items:center}
.pres button small{display:block;color:var(--mut);font-weight:400}
.pci .pfnd{border:1px solid var(--ln);border-radius:10px;padding:10px 12px;margin:0 0 10px}
.pci .pcomb{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 12px}.pci .pcomb button{flex:1 1 0;min-width:56px;padding:9px 4px}.pci .pcomb button.on{background:var(--hi);color:#15212B;border-color:var(--hi)}
.pci .pthumbs{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}.pci .pthumbs img{width:64px;height:64px;object-fit:cover;border-radius:8px}
.pci .psug{display:flex;flex-direction:column;gap:4px;margin:-6px 0 10px}.pci .psug button{text-align:left;padding:8px 10px}
.pfaz{padding:4px 16px}.pfaz .pf{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--ln)}.pfaz .pf:first-of-type{border-top:0}
.pfaz .pf div{flex:1;min-width:0}.pfaz .pf small{display:block;color:var(--mut)}.pfaz .pf button{flex:none}
.pkit button.pk{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px}
.pkit button.pk small{display:block;color:var(--mut);font-weight:400}
.pent{border:1px solid var(--ln);border-radius:10px;padding:10px 12px;margin:0 0 12px}.pent b{display:block;margin-bottom:4px}
`;
const st=document.createElement('style');st.id='pr-css';st.textContent=css;document.head.appendChild(st);
if(typeof ICO!='undefined'){Object.assign(ICO,{plus:'<path d="M12 5v14M5 12h14"/>',mais:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',busca:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',entrada:'<path d="M3 13l2-5h14l2 5v5H3z"/><circle cx="7.5" cy="15.5" r="1.3"/><circle cx="16.5" cy="15.5" r="1.3"/><path d="M12 2v5M9.5 4.5L12 7l2.5-2.5"/>',kit:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18"/>',sino:'<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0"/>'})}

/* ---------- 1) menu embaixo ---------- */
const BN=[['dash','Painel'],['agenda','Agenda'],['plus',''],['diag','Diagnóstico'],['mais','Mais']];
const grupo=v=>({order:'orders',recibo:'orders',agsvc:'agenda'}[v]||v);
function bnav(){let b=document.getElementById('bnav');const show=SES&&!PEND&&!BLOQ&&!SEMOF;
 if(!b){b=document.createElement('div');b.id='bnav';b.setAttribute('role','navigation');b.setAttribute('aria-label','Menu principal');document.body.appendChild(b)}
 if(!show){b.innerHTML='';b.style.visibility='hidden';return}b.style.visibility='';const g=grupo(S.v),base=['dash','agenda','diag'];
 b.innerHTML=BN.map(([k,l])=>k=='plus'?`<a class="pl" role="button" aria-label="Novo" onclick="maisAcoes()"><span class="c">${svgi('plus')}</span></a>`:
  `<a class="${(k=='mais'?!base.includes(g):g==k)?'on':''}" onclick="${k=='mais'?'menuMais()':`go('${k}')`}">${svgi(k)}<span>${l}</span></a>`).join('')}
const _render=render;G.render=render=function(k){_render(k);try{bnav()}catch(x){}};
const _nav=navHtml;G.navHtml=navHtml=function(){return _nav().replace('<div class="nbr">',`<div class="nbr"><button type="button" class="nbtn pbus" aria-label="Buscar" onclick="buscaG()">${svgi('busca')}<span>Buscar</span></button><button type="button" class="nbtn pmais" onclick="maisAcoes()">${svgi('plus')}<span>Novo</span></button>`)};
G.menuMais=function(){const L=NAVX().filter(([k])=>!['dash','agenda','diag','out'].includes(k)).sort((a,b)=>(b[0]=='orders')-(a[0]=='orders'));
 sheet('Mais',`<div class="pgrid">${L.map(([k,l])=>`<button type="button" onclick="closeM();${k=='inst'?'instalarApp()':`go('${k}')`}">${svgi(k)}<span>${e(l)}</span></button>`).join('')}<button type="button" onclick="closeM();doOut()">${svgi('out')}<span>Sair</span></button></div>`)};

/* ---------- 2) botão "+" ---------- */
G.maisAcoes=function(){const A=[['entrada','Entrada do carro','closeM();checkin()','big'],['quotes','Orçamento',"closeM();go('quotes');editQuote()"],['agenda','Agendar','closeM();editAg()'],['diag','Diagnosticar','closeM();go(\'diag\');DG.novo()'],['clients','Cliente','closeM();editClient()'],['vehicles','Veículo','closeM();editVeh()'],...(DONO()?[['fin','Despesa',"closeM();go('fin');editDesp()"]]:[])];
 sheet('O que você quer fazer?',`<div class="pgrid">${A.map(([i,l,f,c])=>`<button type="button" class="${c||''}${c?' pr':''}" onclick="${f}">${svgi(i)}<span>${l}</span></button>`).join('')}</div>`)};

/* ---------- 3) busca única ---------- */
let BQ='';
G.buscaG=function(){sheet('Buscar',`<input id="pbq" type="search" autocomplete="off" placeholder="Placa, nome, telefone ou nº da O.S." value="${e(BQ)}" oninput="buscaR(this.value)"><div id="pbr" class="pres"></div>`);const i=$q('#pbq');i.focus();buscaR(BQ)};
G.buscaR=function(v){BQ=v;const box=$q('#pbr');if(!box)return;const q=nrm(v).trim(),qp=normPl(v),qd=String(v).replace(/\D/g,'');
 if(q.length<2&&!(qd.length>=1&&/^\d+$/.test(String(v).trim()))){box.innerHTML='<p class="muted" style="margin:6px 2px">Digite pelo menos 2 letras ou o número da O.S.</p>';return}
 const has=(s)=>nrm(s).includes(q),abertaV={};db.orders.forEach(o=>{if(ABERTA(o))abertaV[o.veh]=o});
 const OS=db.orders.filter(o=>(qd&&String(+o.num)==String(+qd)&&/^\d+$/.test(String(v).trim()))||(qp.length>=3&&normPl(vh(o.veh).placa).includes(qp))||has(cl(o.cli).nome)).slice().reverse().slice(0,6);
 const VE=db.vehicles.filter(x=>(qp.length>=3&&normPl(x.placa).includes(qp))||has(x.modelo)||has(cl(x.cli).nome)).slice(0,6);
 const CL=db.clients.filter(c=>has(c.nome)||(qd.length>=4&&String(c.tel||'').replace(/\D/g,'').includes(qd))||has(c.doc)).slice(0,6);
 const QU=db.quotes.filter(x=>(qd&&String(x.n)==String(+qd)&&/^\d+$/.test(String(v).trim()))||has(cl(x.cli).nome)||(qp.length>=3&&normPl(vh(x.veh).placa).includes(qp))).slice().reverse().slice(0,4);
 const it=(t,s,r,f)=>`<button type="button" onclick="closeM();${f}"><span><b>${t}</b><small>${s}</small></span>${r||''}</button>`;
 box.innerHTML=(OS.length?'<h3>O.S.</h3>'+OS.map(o=>it('O.S. '+e(o.num)+' · '+e(vlabel(vh(o.veh))),e(cl(o.cli).nome||'')+' · '+D(o.aberta)+' · '+R(oTot(o)),chip(e(o.status),SC[o.status]),`go('order','${o.id}')`)).join(''):'')+
  (VE.length?'<h3>Veículos</h3>'+VE.map(x=>{const a=abertaV[x.id];return it(e(vlabel(x)),e(cl(x.cli).nome||'Sem cliente')+(a?' · na O.S. '+e(a.num):''),a?chip('No pátio','#2F80ED'):'',a?`go('order','${a.id}')`:`go('vehicles',0,0,{q:'${e(x.placa||x.modelo||'')}'})`)}).join(''):'')+
  (CL.length?'<h3>Clientes</h3>'+CL.map(c=>it(e(c.nome),e(c.tel||'Sem telefone')+' · '+plural(db.vehicles.filter(x=>x.cli==c.id).length,'veículo','veículos'),'',`go('clients',0,0,{q:'${e(String(c.nome||'').replace(/'/g,''))}'})`)).join(''):'')+
  (QU.length?'<h3>Orçamentos</h3>'+QU.map(x=>it('Orçamento Nº '+e(x.n)+' · '+e(vlabel(vh(x.veh))),e(cl(x.cli).nome||'')+' · '+R(sum(x.items,x.desc)),chip(e(x.status),'#8E5BD0'),`editQuote('${x.id}')`)).join(''):'')||
  `<p class="muted" style="margin:6px 2px">Nada encontrado para “${e(v)}”.</p><button type="button" class="pr" style="width:100%" onclick="closeM();checkin({placa:'${e(qp.length>=5?qp:'')}'})">Fazer a entrada de um carro</button>`};

/* ---------- 4) entrada do carro ---------- */
let CI=null;const COMB=['Reserva','1/4','1/2','3/4','Cheio'];
G.checkin=function(pre){pre=pre||{};CI={fotos:[],comb:'',veh:null,cli:null,...pre};
 sheet('Entrada do carro',`<form class="pci" onsubmit="event.preventDefault();ciSalva()" autocomplete="off">
 <label>Placa<input name="placa" id="cipl" value="${e(pre.placa||'')}" placeholder="ABC1D23" maxlength="8" autocapitalize="characters" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9-]/g,'');ciAch()"></label>
 <div class="bar" style="margin:-4px 0 10px"><label class="btn sm" style="margin:0">Escanear placa<input type="file" accept="image/*" capture="environment" class="fi" onchange="ciScan(this.files[0]);this.value=''"></label><span class="muted" id="pst" style="font-size:13px"></span></div>
 <div id="cifnd"></div>
 <div id="cinovo" style="display:none">
  <label>Cliente<input name="cnome" id="cinome" placeholder="Nome do cliente" oninput="ciSug(this.value)"></label><div id="cisug" class="psug"></div>
  <label>Telefone (WhatsApp)<input name="ctel" id="citel" inputmode="tel" placeholder="(11) 99999-0000"></label>
  <label>Marca/modelo<input name="modelo" id="cimod" placeholder="Ex.: Fiat Strada 1.4"></label>
  <div class="g2"><label>Cor<input name="cor" id="cicor"></label><label>Ano<input name="ano" id="ciano" inputmode="numeric"></label></div><input type="hidden" name="motor"><input type="hidden" name="chassi">
 </div>
 <div class="g2"><label>Km atual<input id="cikm" inputmode="numeric" placeholder="Ex.: 85000"></label><span></span></div>
 <small class="muted">Combustível</small><div class="pcomb">${COMB.map(c=>`<button type="button" onclick="ciComb('${c}',this)">${c}</button>`).join('')}</div>
 <label>Problema relatado pelo cliente<textarea id="ciprob" placeholder="Ex.: luz da injeção acesa, falhando na lenta"></textarea></label>
 <label>Avarias já existentes (riscos, amassados)<input id="ciav" placeholder="Ex.: risco na porta traseira esquerda"></label>
 <small class="muted">Fotos de entrada (protegem a oficina)</small><div class="pthumbs" id="cith"></div>
 <div class="bar" style="margin:-4px 0 12px"><label class="btn sm" style="margin:0">${svgi('cam')} Tirar foto<input type="file" accept="image/*" capture="environment" class="fi" onchange="ciFoto(this.files)"></label><label class="btn sm" style="margin:0">Da galeria<input type="file" accept="image/*" multiple class="fi" onchange="ciFoto(this.files)"></label></div>
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cidg" style="width:22px;height:22px;margin:0"> Começar o diagnóstico depois</label>
 <div class="bar" style="margin:14px 0 0"><button type="button" onclick="closeM()">Cancelar</button><span class="sp"></span><button class="pr">Abrir O.S.</button></div></form>`,'pci');
 setTimeout(()=>{const p=$q('#cipl');if(p){if(p.value)ciAch();else p.focus()}},40)};
G.ciAch=function(){const p=normPl(($q('#cipl')||{}).value||''),f=$q('#cifnd'),nv=$q('#cinovo');if(!f)return;const v=p.length>=5?db.vehicles.find(x=>normPl(x.placa)==p):null;CI.veh=v?v.id:null;
 if(v){const c=cl(v.cli),a=db.orders.filter(o=>o.veh==v.id&&ABERTA(o)).pop();nv.style.display='none';
  f.innerHTML=`<div class="pfnd"><b>${e(vlabel(v))}</b> ${chip('Já cadastrado','#1E9E55')}<small class="muted" style="display:block">${e(c.nome||'Sem cliente')}${c.tel?' · '+e(c.tel):''}${v.km?' · último km '+e(v.km):''}</small>${a?`<p style="margin:8px 0 0;color:#C98200"><b>Já tem a O.S. ${e(a.num)} aberta.</b> <button type="button" class="sm" onclick="closeM();go('order','${a.id}')">Abrir essa O.S.</button></p>`:''}</div>`;
  const km=$q('#cikm');if(km&&!km.value&&v.km)km.placeholder='Último: '+v.km}
 else{f.innerHTML=p.length>=5?`<p class="muted" style="margin:-4px 0 8px">Carro novo: preencha os dados abaixo.</p>`:'';nv.style.display=p.length>=5||CI.semPlaca?'':'none';if(p.length>=7&&typeof buscaPlaca=='function'){clearTimeout(CI.t);CI.t=setTimeout(()=>{try{buscaPlaca(true)}catch(x){}},700)}}};
G.ciScan=function(f){if(!f||typeof scanPlaca!='function')return;Promise.resolve(scanPlaca(f)).then(()=>ciAch()).catch(()=>{})};
G.ciSug=function(v){const b=$q('#cisug');CI.cli=null;const q=nrm(v).trim();if(!b)return;if(q.length<2){b.innerHTML='';return}
 const L=db.clients.filter(c=>nrm(c.nome).includes(q)).slice(0,4);b.innerHTML=L.map(c=>`<button type="button" onclick="ciCli('${c.id}')"><b>${e(c.nome)}</b> <small class="muted">${e(c.tel||'')} · já cadastrado</small></button>`).join('')};
G.ciCli=function(id){const c=cl(id);CI.cli=id;$q('#cinome').value=c.nome||'';$q('#citel').value=c.tel||'';$q('#cisug').innerHTML=`<small class="muted">✓ Cliente já cadastrado</small>`};
G.ciComb=function(c,b){CI.comb=CI.comb==c?'':c;document.querySelectorAll('.pcomb button').forEach(x=>x.classList.toggle('on',x.textContent==CI.comb))};
G.ciFoto=function(files){[...(files||[])].forEach(f=>{CI.fotos.push(f);const u=URL.createObjectURL(f),th=$q('#cith');if(th)th.insertAdjacentHTML('beforeend',`<img src="${u}" alt="Foto de entrada">`)})};
G.ciSalva=function(){const p=normPl(($q('#cipl')||{}).value||'');if(p.length<5&&!CI.veh){const x=$q('#cipl');x.focus();return toast('Digite a placa do carro')}
 let v=CI.veh?vh(CI.veh):null;
 if(!v){const nome=($q('#cinome').value||'').trim(),mod=($q('#cimod').value||'').trim();if(!nome&&!CI.cli){$q('#cinome').focus();return toast('Escreva o nome do cliente')}if(!mod){$q('#cimod').focus();return toast('Escreva a marca/modelo do carro')}
  let cid=CI.cli;if(!cid){const n={id:uid(),nome,tel:($q('#citel').value||'').trim()};db.clients.push(n);cid=n.id}
  v={id:uid(),cli:cid,placa:p,modelo:mod,cor:($q('#cicor').value||'').trim(),ano:($q('#ciano').value||'').trim(),km:''};
  const fm=$q('form.pci');['motor','chassi'].forEach(k=>{if(fm&&fm.elements[k]&&fm.elements[k].value)v[k]=fm.elements[k].value});db.vehicles.push(v)}
 const km=($q('#cikm').value||'').replace(/\D/g,'');if(km)v.km=km;
 const o={id:uid(),num:String(db.seq++).padStart(4,'0'),cli:v.cli,veh:v.id,problema:($q('#ciprob').value||'').trim(),mec:'',status:'Aberta',items:[],desc:0,ck:{},laudo:{data:today()},fotos:[],pags:[],horas:'',pecas:'',aberta:today(),km:km||'',comb:CI.comb||'',avarias:($q('#ciav').value||'').trim()};
 db.orders.push(o);const dg=$q('#cidg')&&$q('#cidg').checked,fs=CI.fotos.slice();save();closeM();
 fs.forEach(f=>picRef(f,ref=>{const x=od(o.id);if(!x||!x.id)return;x.fotos.push({id:uid(),t:'Entrada do veículo',src:ref,obs:o.avarias||''});save();if(S.id==o.id)render()}));
 toast('O.S. '+o.num+' aberta'+(fs.length?' · '+plural(fs.length,'foto','fotos'):''));if(dg&&G.DG)DG.open(o.id);else go('order',o.id)};

/* ---------- 6) aviso de carro pronto ---------- */
function msgPronto(o){const c=cl(o.cli),t=oTot(o),pg=paid(o),rs=Math.max(0,t-pg);
 return`Olá, ${c.nome||''}! Tudo bem?\n\nSeu ${vlabel(vh(o.veh))} está pronto para retirada (O.S. ${o.num}).\n\nTotal: ${R(t)}${pg>0.005?`\nJá pago: ${R(pg)}\nFalta pagar: ${R(rs)}`:''}\n\nQualquer dúvida, estou à disposição.\n\n${typeof empNome=='function'?empNome():''}`}
G.avisaPronto=function(id){const o=od(id||S.id);if(!o||!o.id)return;wa(cl(o.cli).tel,msgPronto(o));o.avisado=today();save();if(S.v=='dash'||S.id==o.id)render()};
const _setSt=setSt;G.setSt=setSt=function(v){const o=od(S.id),antes=o&&o.status;_setSt(v);if(!o||!o.id||antes==v)return;o.stAt=today();save();
 if(v=='Concluída'&&!o.avisado)setTimeout(()=>{sheet('Carro pronto!',`<p style="margin:0 0 10px">Avisar ${e(cl(o.cli).nome||'o cliente')} pelo WhatsApp que o ${e(vlabel(vh(o.veh)))} está pronto?</p><pre class="pmsg" style="white-space:pre-wrap;background:var(--bg);padding:10px;border-radius:8px;font:13px/1.4 Barlow,sans-serif;max-height:40vh;overflow:auto">${e(msgPronto(o))}</pre><div class="bar" style="margin:12px 0 0"><button type="button" onclick="closeM()">Agora não</button><span class="sp"></span><button type="button" class="wa" onclick="closeM();avisaPronto('${o.id}')">Avisar pelo WhatsApp</button></div>`)},700)};

/* ---------- 7) lembrete de revisão ---------- */
const revMeses=()=>+((db.cfg||{}).revMeses)||6;
function revisoes(){const out=[],h=today(),lim=addMes(h,0);
 db.vehicles.forEach(v=>{const L=db.orders.filter(o=>o.veh==v.id).sort((a,b)=>String(a.conc||a.aberta||'').localeCompare(String(b.conc||b.aberta||'')));if(!L.length)return;
  const ult=L[L.length-1];if(ABERTA(ult))return;const rv=[...L].reverse().find(o=>['Concluída','Entregue'].includes(o.status)&&(o.items||[]).some(i=>/oleo|revis/.test(nrm(i.d))));if(!rv)return;
  const base=rv.conc||rv.aberta,due=addMes(base,revMeses());if(dias(due,h)<-7||dias(due,h)>90)return;if(v.lemb&&v.lemb>=addMes(due,-1))return;out.push({v,o:rv,base,due})});
 return out.sort((a,b)=>a.due.localeCompare(b.due))}
function msgRev(r){const c=cl(r.v.cli);return`Olá, ${c.nome||''}! Tudo bem?\n\nJá faz ${revMeses()} meses da última troca de óleo/revisão do seu ${vlabel(r.v)} (em ${D(r.base)}). Que tal agendar a próxima?\n\nÉ só responder com o melhor dia e horário.\n\n${typeof empNome=='function'?empNome():''}`}
G.lembra=function(vid){const r=revisoes().find(x=>x.v.id==vid);if(!r)return;wa(cl(r.v.cli).tel,msgRev(r));r.v.lemb=today();save();render()};
G.lembraOk=function(vid){const v=vh(vid);if(!v||!v.id)return;v.lemb=today();save();render()};

/* ---------- 5) o que fazer agora ---------- */
function fazer(){const F=[],h=today();
 db.orders.filter(o=>o.status=='Concluída'&&!o.avisado).forEach(o=>F.push([1,'Carro pronto: avisar o cliente',`${e(vlabel(vh(o.veh)))} · ${e(cl(o.cli).nome||'')} · O.S. ${e(o.num)}`,`<button class="wa sm" onclick="avisaPronto('${o.id}')">Avisar</button>`]));
 db.quotes.filter(q=>q.status=='Aguardando'&&(!q.env||dias(q.env,h)>=2)).forEach(q=>F.push([2,'Orçamento sem resposta'+(q.env?' há '+dias(q.env,h)+' dias':''),`Nº ${e(q.n)} · ${e(cl(q.cli).nome||'')} · ${R(sum(q.items,q.desc))}`,`<button class="sm" onclick="cobraOrc('${q.id}')">Perguntar</button>`]));
 db.orders.filter(o=>o.status=='Aguardando peças'&&dias(o.stAt||o.aberta,h)>=3).forEach(o=>F.push([3,'Aguardando peças há '+dias(o.stAt||o.aberta,h)+' dias',`${e(vlabel(vh(o.veh)))} · O.S. ${e(o.num)}`,`<button class="sm" onclick="go('order','${o.id}')">Abrir</button>`]));
 db.orders.filter(o=>o.status=='Entregue'&&oTot(o)-paid(o)>0.005).forEach(o=>F.push([4,'A receber: '+R(oTot(o)-paid(o)),`${e(cl(o.cli).nome||'')} · O.S. ${e(o.num)} · entregue ${D(o.conc||o.aberta)}`,`<button class="sm" onclick="cobraOS('${o.id}')">Cobrar</button>`]));
 revisoes().forEach(r=>F.push([5,'Lembrar revisão'+(dias(r.due,h)>0?' (venceu '+D(r.due)+')':' ('+D(r.due)+')'),`${e(vlabel(r.v))} · ${e(cl(r.v.cli).nome||'')} · última em ${D(r.base)}`,`<button class="wa sm" onclick="lembra('${r.v.id}')">Lembrar</button><button class="sm" aria-label="Dispensar" onclick="lembraOk('${r.v.id}')">×</button>`]));
 return F.sort((a,b)=>a[0]-b[0])}
G.cobraOrc=function(id){const q=db.quotes.find(x=>x.id==id);if(!q)return;const c=cl(q.cli);wa(c.tel,`Olá, ${c.nome||''}! Tudo bem?\n\nConseguiu ver o orçamento Nº ${q.n}${q.veh?' do seu '+vlabel(vh(q.veh)):''} (${R(sum(q.items,q.desc))})? Se quiser, posso tirar alguma dúvida ou ajustar alguma coisa.\n\n${typeof empNome=='function'?empNome():''}`);q.env=today();save();render()};
G.cobraOS=function(id){const o=od(id);if(!o||!o.id)return;const c=cl(o.cli);wa(c.tel,`Olá, ${c.nome||''}! Tudo bem?\n\nPassando para lembrar do saldo de ${R(oTot(o)-paid(o))} do serviço no seu ${vlabel(vh(o.veh))} (O.S. ${o.num}). Pode ser por PIX, se preferir.\n\n${typeof empNome=='function'?empNome():''}`);o.cobrado=today();save()};
G.fazerHTML=function(){const F=fazer();if(!F.length)return'';return sech('O que fazer agora',plural(F.length,'item','itens'))+`<div class="card pfaz">${F.slice(0,8).map(([,t,s,b])=>`<div class="pf"><div><b>${t}</b><small>${s}</small></div>${b}</div>`).join('')}${F.length>8?`<small class="muted">E mais ${F.length-8}.</small>`:''}</div>`};

/* ---------- 8) kits e serviços com preço ---------- */
const KT=()=>db.kits=db.kits||[];
let KW=null;
G.kits=function(alvo){KW=alvo;const w=alvo=='q'?S.q:od(S.id);if(!w)return;
 sheet('Kits e serviços prontos',`<div class="pkit"><input type="search" id="pkq" placeholder="Buscar: revisão, óleo, freio…" oninput="kitsR(this.value)" autocomplete="off"><div id="pkr" style="margin-top:10px"></div>
  <div class="bar" style="margin:12px 0 0">${(w.items||[]).length?`<button type="button" onclick="kitNovo()">Criar kit com estes itens</button>`:''}<span class="sp"></span>${KT().length?`<button type="button" onclick="kitsGer()">Gerenciar kits</button>`:''}</div></div>`);kitsR('')};
G.kitsR=function(v){const q=nrm(v).trim(),b=$q('#pkr');if(!b)return;
 const K=KT().filter(k=>!q||nrm(k.nome+' '+k.itens.map(i=>i.d).join(' ')).includes(q)),SV=(db.svcs||[]).filter(s=>+s.preco>0&&(!q||nrm(s.nome).includes(q)));
 b.innerHTML=(K.length?K.map(k=>`<button type="button" class="pk" onclick="kitUsa('${k.id}')"><span><b>${e(k.nome)}</b><small>${e(k.itens.map(i=>(+i.q!=1?i.q+'× ':'')+i.d).join(', '))}</small></span><b>${R(sum(k.itens,0))}</b></button>`).join(''):'')+
  (SV.length?`<small class="muted">Serviços da agenda</small>`+SV.map(s=>`<button type="button" class="pk" onclick="kitSvc('${s.id}')"><span><b>${e(s.nome)}</b><small>Serviço</small></span><b>${R(+s.preco)}</b></button>`).join(''):'')||
  `<p class="muted">${KT().length?'Nada encontrado.':'Nenhum kit ainda. Lance os itens de um serviço que se repete (ex.: revisão com óleo, filtro e mão de obra) e toque em “Criar kit com estes itens”.'}</p>`};
function kitPush(itens){const w=KW=='q'?S.q:od(S.id);if(!w)return;w.items=w.items||[];itens.forEach(i=>{const c=JSON.parse(JSON.stringify(i));c.iid=uid();delete c.baixa;delete c.dgfee;w.items.push(c)});if(KW=='q')saveQuote(1);else save();closeM();render()}
G.kitUsa=function(id){const k=KT().find(x=>x.id==id);if(!k)return;kitPush(k.itens);toast('Kit “'+k.nome+'” lançado: '+plural(k.itens.length,'item','itens'))};
G.kitSvc=function(id){const s=(db.svcs||[]).find(x=>x.id==id);if(!s)return;kitPush([{t:'Serviço',d:s.nome,q:1,v:+s.preco}]);toast(s.nome+' lançado')};
G.kitNovo=function(){const w=KW=='q'?S.q:od(S.id);if(!w||!(w.items||[]).length)return;const its=w.items.filter(i=>!i.dgfee);
 modal('Criar kit',[['nome','Nome do kit','text',0,1]],{nome:''},f=>{const n=String(f.nome||'').trim();if(!n)return toast('Dê um nome ao kit');KT().push({id:uid(),nome:n,itens:its.map(i=>{const c={t:i.t,d:i.d,q:+i.q||1,v:+i.v||0};if(i.custo!=null&&i.custo!=='')c.custo=+i.custo;if(i.pid)c.pid=i.pid;if(i.ncm)c.ncm=i.ncm;return c})});save();toast('Kit “'+n+'” criado com '+plural(its.length,'item','itens'))},`<p class="muted" style="margin:0">Entram ${plural(its.length,'item','itens')}: ${e(its.map(i=>i.d).join(', '))}. Os valores ficam salvos no kit e podem ser ajustados depois de lançar.</p>`)};
G.kitsGer=function(){sheet('Gerenciar kits',`<div class="pkit">${KT().map(k=>`<div class="pf" style="display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--ln)"><div style="flex:1;min-width:0"><b>${e(k.nome)}</b><small class="muted" style="display:block">${plural(k.itens.length,'item','itens')} · ${R(sum(k.itens,0))}</small></div><button type="button" class="sm" onclick="kitRen('${k.id}')">Renomear</button><button type="button" class="dg sm" onclick="confirmDel(this,()=>kitDel('${k.id}'))">Excluir</button></div>`).join('')||'<p class="muted">Nenhum kit.</p>'}</div>`)};
G.kitRen=function(id){const k=KT().find(x=>x.id==id);if(!k)return;modal('Renomear kit',[['nome','Nome','text',0,1]],{nome:k.nome},f=>{k.nome=String(f.nome||'').trim()||k.nome;save();kitsGer()})};
G.kitDel=function(id){db.kits=KT().filter(x=>x.id!=id);save();kitsGer();toast('Kit excluído')};

/* ---------- 9) orçamento e O.S. juntos ---------- */
G.approve=approve=function(){saveQuote(1);modal('Aceite do cliente',[['nome','Nome de quem aprova (assinatura)','text',0,1]],{},f=>{Object.assign(S.q,{status:'Aprovado',aprov:{nome:f.nome,data:today()}});
  if(!S.q.os){saveQuote(1);makeOS();const o=od(S.q.os);toast('Orçamento aprovado · O.S. '+(o&&o.num||'')+' aberta com os itens');return}saveQuote();render()},`<p class="muted">${TERMOS}</p>`)};
const _saveQuote=saveQuote;G.saveQuote=saveQuote=function(quiet){const q=S.q;if(quiet||!q||!q.os||q.status!='Aprovado')return _saveQuote(quiet);
 const o=od(q.os);if(!o||!o.id)return _saveQuote(quiet);_saveQuote(1);const Df=qDif(q,o);if(!Df.tem)return toast('Orçamento salvo');
 const arrisca=qNF(o)||['Concluída','Entregue'].includes(o.status)||Df.alt.some(([x,n])=>x.baixa&&(String(x.pid||'')!==String(n.pid||'')||(+x.q||0)!==(+n.q||0)));
 if(arrisca)return qSync();const antes=oTot(o);qSyncOk();toast('Orçamento salvo · O.S. '+o.num+' atualizada junto ('+R(antes)+' → '+R(oTot(o))+')')};
const _waQuote=G.waQuote;if(typeof _waQuote=='function')G.waQuote=waQuote=async function(){const q=S.q;const r=await _waQuote();if(q&&q.status=='Aguardando'&&!q.env){q.env=today();saveQuote(1)}return r};

if(typeof render=='function'&&typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);
})(window);
