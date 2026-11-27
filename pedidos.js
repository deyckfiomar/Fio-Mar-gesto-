/* Fio-Mar Gestor — pedido de peças (versão 2.10.0; 2.48.0: mais rápido e menos poluído, ✓ por peça e cotação)
   Monta o pedido com foto e nome de cada peça, gera o PDF com as fotos para o fornecedor
   e, quando as peças chegam, lança no estoque. Fotos também nas peças do estoque. */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const PD=()=>db.peds=db.peds||[];
const ped=id=>PD().find(p=>p.id==id);
const ST={Montando:'#5B6B79',Enviado:'#2F6FB0',Parcial:'#C98200',Recebido:'#2E8B57',Cancelado:'#B4472E'};
Object.assign(SC,ST);Object.assign(STI,{Montando:'stpen',Enviado:'stin',Parcial:'sthg',Recebido:'stok'});
const UN=['un','par','jogo','kit','L','kg','m'];
const falta=i=>Math.max(0,(+i.q||0)-(+i.rec||0));
const aberto=p=>['Montando','Enviado','Parcial'].includes(p.status);
const sheet=(tit,body)=>{$('#modal').innerHTML=`<div class="ov psh-ov"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};
const thumb=(s,cls)=>`<img class="${cls||'pdth'}" ${fimg(s)} alt="Foto da peça" onclick="event.stopPropagation();verFoto(this.src)">`;
const carroOS=o=>{const v=vh(o.veh);return[v.modelo,v.ano,v.motor].filter(Boolean).join(' ')};
const nomeF=s=>String(s||'').replace(/[^\wÀ-ú]+/g,'_').replace(/^_|_$/g,'');
Object.assign(ICO,{pedido:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',caixa:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'});

/* ---------- novo pedido ---------- */
/* 2.44.1: pedido vazio (sem peça, sem fornecedor) não fica guardado: ao abrir de novo, reaproveita; ao sair, some */
const vazio=p=>p&&p.status=='Montando'&&!(p.itens||[]).length&&!String(p.forn||'').trim()&&!String(p.obs||'').trim();
function limpaVazios(menos){const L=PD(),fica=L.filter(p=>!vazio(p)||p.id==menos);if(fica.length<L.length){db.peds=fica;save()}}
G.pdNovo=function(abre){const re=PD().slice().reverse().find(vazio);if(re){if(abre!==0)go('ped',re.id);return re}
 const n=db.pseq=(+db.pseq||PD().length)+1,ult=PD().slice().reverse().find(p=>p.forn)||{};
 const p={id:uid(),n:String(n).padStart(4,'0'),data:today(),status:'Montando',forn:'',ftel:'',obs:'',itens:[]};PD().push(p);save();if(abre!==0)go('ped',p.id);return p};
const montando=()=>PD().slice().reverse().find(p=>p.status=='Montando');

/* ---------- lista ---------- */
/* 2.48.0: data curta, há quantos dias foi enviado, placa/O.S. que espera a peça, cotação */
const dCurta=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7):'';
const nDias=d=>{if(!d)return 0;return Math.max(0,Math.round((new Date(today()+'T12:00')-new Date(String(d).slice(0,10)+'T12:00'))/864e5))};
const fmtTel=t=>{let d=String(t||'').replace(/\D/g,'');if(d.length>=12&&d.startsWith('55'))d=d.slice(2);
 return d.length==11?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d.length==10?`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`:d.length==9?d.slice(0,5)+'-'+d.slice(5):String(t||'')};
G.pdFmtTel=fmtTel;
const osDoPed=p=>[...new Set(p.itens.map(i=>i.os).filter(Boolean))].map(id=>od(id)).filter(Boolean);
const osTxt=o=>{const v=vh(o.veh)||{};return v.placa?v.placa:'O.S. '+o.num};
function idade(p){if(!['Enviado','Parcial'].includes(p.status))return'';const n=nDias(p.env||p.data);return mb(n==0?'enviado hoje':'enviado há '+plural(n,'dia','dias'),n>2?KA:'#7F8C8D')}
function Vpeds(){limpaVazios();const f=S.f.pd||'abertos',L=PD().slice().reverse(),n=k=>L.filter(p=>k=='abertos'?aberto(p):p.status==k).length;
 const tl=[['abertos','Em aberto','pedido',String(n('abertos')),n('abertos')?KB:KM],['Recebido','Recebidos','caixa',String(n('Recebido')),n('Recebido')?KG:KM],['Cancelado','Cancelados','alert',String(n('Cancelado'))]];
 const V2=L.filter(p=>f=='abertos'?aberto(p):p.status==f);
 return head({back:"go('stock')",kick:'Estoque',title:'Pedidos de peças',c:PCOL.stock,right:`<button class="pr hb" aria-label="Novo pedido" onclick="pdNovo()">+ Novo</button>`})+ftiles(tl,f,'pd')+
 (V2.map(p=>{const F=p.itens.flatMap(i=>i.fotos||[]).slice(0,4),nq=p.itens.length,OS=aberto(p)?osDoPed(p):[],nc=(p.cot||[]).length;
  return lcard({c:ST[p.status],n:'Pedido '+e(p.n)+' · '+dCurta(p.data),pill:pill(p.status),t:e(p.forn||'Fornecedor não informado'),
   m:nq?p.itens.slice(0,4).map(i=>e(i.nome)).join(' · ')+(nq>4?' e mais '+(nq-4):''):'Nenhuma peça ainda',
   f:`${F.length?`<span class="pdths">${F.map(s=>thumb(s,'pdtm')).join('')}</span>`:''}${mb(plural(nq,'peça','peças'))}${idade(p)}${p.status=='Parcial'?mb('Faltam '+p.itens.filter(falta).length,KA):''}${p.status=='Montando'&&nc>1?mb('Cotação: '+nc,KB):''}${OS.slice(0,3).map(o=>mb(e(osTxt(o)),KB)).join('')}`,on:`go('ped','${p.id}')`})}).join('')||
  empty('pedido',f=='abertos'?'Nenhum pedido em aberto. Monte um pedido com a foto e o nome de cada peça e mande o PDF para o fornecedor.':'Nenhum pedido aqui.',f=='abertos'?`<button class="pr" onclick="pdNovo()">+ Novo pedido</button>`:''))}

/* ---------- pedido ---------- */
/* 2.48.0: peças em linhas finas (tocar edita, arrastar para a esquerda remove, ✓ = chegou) */
const editavel=p=>['Montando','Enviado'].includes(p.status);
function linha(p,i){const fl=falta(i),os=i.os&&od(i.os),ok=+i.rec&&!fl,ed=editavel(p),sw=ed&&!+i.rec,ck=['Enviado','Parcial','Recebido'].includes(p.status);
 const det=[`<b>${e(nShow(i.q))} ${e(i.un||'un')}</b>`,i.cod&&'Ref. '+e(i.cod),os?'O.S. '+e(os.num)+((vh(os.veh)||{}).placa?' · '+e(vh(os.veh).placa):''):i.carro&&e(i.carro),+i.rec&&fl&&'chegou '+e(nShow(i.rec))+' de '+e(nShow(i.q)),i.obs&&e(i.obs)].filter(Boolean).join(' · ');
 return`<div class="pdlw">${sw?'<span class="pdlx" aria-hidden="true">Remover</span>':''}<div class="pdl${ok?' ok':''}"${sw?' data-sw="1"':''} data-p="${p.id}" data-i="${i.id}"${ed?` role="button" tabindex="0" onclick="if(!this.dataset.nc)pdItem('${p.id}','${i.id}')"`:''}>
 ${(i.fotos||[]).length?`<span class="pdlfw">${thumb(i.fotos[0],'pdlf')}${i.fotos.length>1?`<span class="pdfc">+${i.fotos.length-1}</span>`:''}</span>`:''}
 <div class="pdlt"><b>${e(i.nome)}</b><small>${det}</small></div>
 ${ck?(fl?`<button type="button" class="pdck" aria-label="Chegou: ${e(i.nome)}" onclick="event.stopPropagation();pdChegou('${p.id}','${i.id}')">✓</button>`:`<span class="pdck on" role="img" aria-label="Chegou">✓</span>`):''}</div></div>`}
function cotMelhor(p){const L=(p.cot||[]).filter(c=>+c.v>0);if(!L.length)return null;return L.reduce((a,b)=>+b.v<+a.v?b:a)}
function Vped(){const p=ped(S.id);if(!p)return Vpeds();const nf=p.itens.filter(falta).length,ni=p.itens.length;
 const main=p.status=='Montando'&&ni?`<button class="pr wa pdmain" onclick="pdWa('${p.id}')">Mandar ao fornecedor</button>`:
  p.status=='Enviado'?`<button class="pr pdmain" onclick="pdReceber('${p.id}')">${svgi('caixa')} Chegaram as peças</button>`:
  p.status=='Parcial'?`<button class="pr pdmain" onclick="pdReceber('${p.id}')">${svgi('caixa')} Chegou o resto</button>`:'';
 const tel=p.ftel?fmtTel(p.ftel):'',fo=p.forn?`<div class="pdfo"><div role="button" tabindex="0" onclick="pdForn('${p.id}')"><b>${e(p.forn)}</b><small>${tel?e(tel):'Sem telefone · toque para pôr'}</small></div>${p.ftel?`<button type="button" class="pdwa" aria-label="Conversar com ${e(p.forn)} no WhatsApp" onclick="wa('${e(p.ftel)}','')">${WAI}</button>`:''}</div>`:
  `<div><button type="button" class="sm" onclick="pdForn('${p.id}')">Informar fornecedor</button></div>`;
 const mc=p.status=='Montando'&&(p.cot||[]).length?cotMelhor(p):null;
 return head({back:"go('peds')",kick:'Pedido de peças · '+dCurta(p.data),title:'Nº '+e(p.n),c:ST[p.status],right:`${pill(p.status)}<button type="button" class="ib pdmb" aria-label="Mais opções do pedido" onclick="pdMais('${p.id}')">⋯</button>`,
  sub:`${fo}<div class="osv"><small>${p.status=='Parcial'?'Faltam':'Peças'}</small><b>${p.status=='Parcial'?nf:ni}</b></div>`,acts:main})+
 (p.status=='Montando'&&(p.cot||[]).length?`<button type="button" class="pdcotb" onclick="pdCot('${p.id}')">${svgi('ospag')}<span>Cotação com ${plural(p.cot.length,'fornecedor','fornecedores')}${mc?' · mais barato: '+e(mc.forn)+' '+R(+mc.v):''}</span><b>›</b></button>`:'')+
 (ni?`<div class="card pdls">${p.itens.map(i=>linha(p,i)).join('')}</div>${editavel(p)?'<p class="pdhint">Toque na peça para mudar · arraste para a esquerda para tirar</p>':''}`:
  empty('osfotos','Adicione as peças: escreva o nome e, se quiser, tire a foto da peça velha (ou da etiqueta). O fornecedor recebe o PDF com as fotos.'))+
 (editavel(p)?`<button type="button" class="${p.status=='Montando'?'pr ':''}pdadd" onclick="pdItem('${p.id}')">${svgi('osfotos')} Adicionar peça</button>`:'')+
 `<details class="pdobs"${p.obs?' open':''}><summary>${p.obs?'Observação para o fornecedor':'+ Observação para o fornecedor'}</summary><textarea aria-label="Observação para o fornecedor" placeholder="Ex.: entregar até sexta, preferência marca original" onchange="pdObs('${p.id}',this.value)">${e(p.obs||'')}</textarea></details>`}
V.peds=Vpeds;V.ped=Vped;
const WAI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.6c0 3.3 2.9 6.3 6.3 6.4l1.2-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z"/></svg>';

/* ⋯ do pedido: tudo que não é o botão principal */
G.pdMais=function(id){const p=ped(id);if(!p)return;const ni=p.itens.length,rec=p.itens.some(i=>+i.rec),pode=aberto(p),nb=PR().filter(isLow).length;
 const A=[[ni?'PDF com fotos':'',`pdPDF('${p.id}')`,'notas'],
  [p.status=='Montando'&&ni?'Marcar como enviado (sem WhatsApp)':'',`pdStatus('${p.id}','Enviado')`,'oscheck'],
  [p.status=='Montando'&&ni?'Chegaram as peças (busquei no balcão)':'',`pdReceber('${p.id}')`,'stock'],
  [p.status=='Enviado'?'Mandar de novo ao fornecedor':p.status=='Parcial'?'Cobrar o que falta':'',`pdWa('${p.id}')`,'out'],
  [p.status=='Montando'&&ni?'Cotação: pedir preço a vários':'',`pdCot('${p.id}')`,'ospag'],
  [editavel(p)&&nb?`Pedir as peças com estoque baixo (${nb})`:'',`pdBaixo('${p.id}')`,'alert'],
  [pode?(p.forn?'Trocar fornecedor':'Informar fornecedor'):'',`pdForn('${p.id}')`,'clients'],
  [pode&&!rec?'Cancelar pedido':'',`pdStatus('${p.id}','Cancelado')`,'alert'],
  [p.status=='Cancelado'?'Reabrir pedido':'',`pdStatus('${p.id}','Montando')`,'orders']].filter(a=>a[0]);
 sheet('Pedido Nº '+e(p.n),`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${e(t)}</span></button>`).join('')}</div>
 ${DONO()&&!rec?`<button type="button" class="dg osdel" onclick="closeM();desfazivel(()=>pdDel('${p.id}'),'Pedido ${e(p.n)} excluído')">Excluir este pedido</button>`:''}`)};

G.pdObs=(id,v)=>{const p=ped(id);if(p){p.obs=v;save()}};
G.pdStatus=function(id,s){const p=ped(id);if(!p)return;p.status=s;if(s=='Enviado'&&!p.env)p.env=today();save();render();toast('Pedido '+p.n+': '+s.toLowerCase())};
G.pdDel=function(id){db.peds=PD().filter(p=>p.id!=id);save();go('peds');toast('Pedido excluído')};
G.pdForn=function(id){const p=ped(id);if(!p)return;const sug=[...new Map(PD().filter(x=>x.forn).map(x=>[nrm(x.forn),x])).values()];
 modal('Fornecedor',[['forn','Nome do fornecedor (autopeças)','text',0,1],['ftel','Telefone / WhatsApp']],{forn:p.forn,ftel:p.ftel},o=>{p.forn=(o.forn||'').trim();p.ftel=(o.ftel||'').trim();save();render()},
  sug.length?`<div class="pdsug"><small class="muted">Fornecedores usados antes:</small>${sug.slice(-6).reverse().map(x=>`<button type="button" class="sm" data-n="${e(x.forn)}" data-t="${e(x.ftel||'')}" onclick="pdFornUsa(this)">${e(x.forn)}</button>`).join('')}</div>`:'')};
G.pdFornUsa=b=>{const f=$q('#modal form');if(!f)return;f.forn.value=b.dataset.n;f.ftel.value=b.dataset.t};

/* ---------- peça do pedido ---------- */
/* 2.48.0: adicionar em sequência (nome + quantidade; o resto em "+ detalhes"), carro vindo da O.S.,
   fornecedor que leva a peça para o pedido certo */
let PI=null;
const fornsUsados=()=>[...new Map(PD().filter(x=>x.forn).map(x=>[nrm(x.forn),x])).values()].reverse();
const osAbertas=()=>db.orders.filter(o=>!osFim(o)).slice().reverse();
G.pdItem=function(pid,iid,pre){const p=ped(pid);if(!p)return;const i=iid?p.itens.find(x=>x.id==iid):null;
 PI={pid,iid:iid||null,fotos:[...((i&&i.fotos)||(pre&&pre.fotos)||[])],os:(i?i.os:pre&&pre.os)||'',add:[],troca:0};const v={q:1,un:'un',...(pre||{}),...(i||{})};
 const nomes=[...new Set([...PR().map(x=>x.nome),...PD().flatMap(x=>x.itens.map(y=>y.nome))].filter(Boolean))].slice(0,300);
 const abre=!!(i||(pre&&(pre.cod||pre.obs||(pre.fotos||[]).length))),cars=!PI.os;
 sheet(i?'Editar peça':'Adicionar peça',`<form class="pdf" autocomplete="off" onsubmit="event.preventDefault();pdItemOk()">
 ${i?'':'<div class="pdpara" id="pdpara"></div><div class="pdok" id="pdok" aria-live="polite"></div>'}
 <label>Nome da peça<input name="nome" list="pdnomes" required value="${e(v.nome||'')}" placeholder="Ex.: Bomba de combustível" onchange="pdNomeEst(this.value)" onkeydown="if(event.key=='Enter'&&!event.isComposing){event.preventDefault();pdItemOk()}"></label><datalist id="pdnomes">${nomes.map(x=>`<option value="${e(x)}">`).join('')}</datalist>
 <div class="g2 pdg"><label>Quantidade<input name="q" inputmode="decimal" value="${e(nShow(v.q))}" required></label><label>Unidade<select name="un">${UN.map(u=>`<option ${v.un==u?'selected':''}>${u}</option>`).join('')}</select></label></div>
 <details class="pdmais"${abre?' open':''}><summary>+ Foto, código, carro ou observação</summary>
 <small class="muted">Foto da peça (velha, da etiqueta ou do catálogo)</small><div class="pdfa" id="pdfa"></div>
 <div class="fbs" style="margin:0 0 12px">${fotoBtns('pdFoto(this.files)')}</div>
 <label>Código / referência (se souber)<input name="cod" value="${e(v.cod||'')}" placeholder="Ex.: 7086.30.0011"></label>
 <label>Para qual carro<select name="os" onchange="pdCarro(this.value)"><option value="">Estoque / outro carro</option>${osAbertas().map(o=>`<option value="${o.id}" ${PI.os==o.id?'selected':''}>O.S. ${e(o.num)} · ${e(vlabel(vh(o.veh)))}</option>`).join('')}</select></label>
 <label class="pdcar"${cars?'':' hidden'}>Carro (modelo, ano, motor)<input name="carro" value="${e(v.carro||'')}" placeholder="Ex.: Onix 2015 1.0"></label>
 <label>Observação<input name="obs" value="${e(v.obs||'')}" placeholder="Ex.: lado esquerdo, com sensor de ABS"></label>
 </details>
 <div class="bar" style="margin:10px 0 0">${i?`<button type="button" class="dg" onclick="pdItemRm()">Tirar do pedido</button>`:`<button type="button" onclick="pdPronto()">Pronto</button>`}<span class="sp"></span><button class="pr">${i?'Salvar':'Adicionar'}</button></div></form>`);
 pdFotos();pdPara()};
/* linha de cima: pedido e fornecedor (Trocar) e o carro da O.S. */
function pdPara(){const b=$q('#pdpara');if(!b||!PI)return;const p=ped(PI.pid);if(!p)return;const o=PI.os&&od(PI.os),fs=fornsUsados().filter(x=>nrm(x.forn)!=nrm(p.forn||'')).slice(0,6);
 const abre=PI.troca||(!p.forn&&!p.itens.length);
 b.innerHTML=`<div class="pdpl"><span>Pedido Nº ${e(p.n)} · <b>${e(p.forn||'sem fornecedor')}</b></span>${abre?'':`<button type="button" class="sm" onclick="pdTroca()">${p.forn?'Trocar':'Escolher'}</button>`}</div>
 ${abre?`<div class="pdsug">${fs.map(x=>`<button type="button" class="sm" data-n="${e(x.forn)}" onclick="pdParaF(this.dataset.n)">${e(x.forn)}</button>`).join('')}<span class="pdfnv"><input id="pdfnn" placeholder="${fs.length?'Outro fornecedor':'Nome do fornecedor'}" aria-label="Outro fornecedor" autocomplete="off" onkeydown="if(event.key=='Enter'){event.preventDefault();pdParaF(this.value)}"><button type="button" class="sm" onclick="pdParaF($('#pdfnn').value)">OK</button></span></div>`:''}
 ${o?`<div class="pdpl pdpo"><span>Para: <b>O.S. ${e(o.num)}</b> · ${e(vlabel(vh(o.veh)))}</span></div>`:''}`}
G.pdTroca=()=>{if(PI){PI.troca=1;pdPara();try{$q('#pdfnn').focus()}catch(x){}}};
G.pdParaF=function(n){n=String(n||'').trim();if(!PI||!n)return;const cur=ped(PI.pid);if(!cur)return;PI.troca=0;
 if(nrm(n)==nrm(cur.forn||''))return pdPara();
 const telDe=x=>{const a=PD().find(y=>y.ftel&&nrm(y.forn||'')==nrm(x));return a?a.ftel:''};let alvo;
 if(!cur.itens.length&&cur.status=='Montando'){alvo=cur;alvo.forn=n;alvo.ftel=telDe(n)}
 else{alvo=PD().find(x=>x.status=='Montando'&&x!==cur&&nrm(x.forn||'')==nrm(n));
  if(!alvo){alvo=pdNovo(0);if(alvo===cur||alvo.itens.length){const k=db.pseq=(+db.pseq||PD().length)+1;alvo={id:uid(),n:String(k).padStart(4,'0'),data:today(),status:'Montando',forn:'',ftel:'',obs:'',itens:[]};PD().push(alvo)}alvo.forn=n;alvo.ftel=telDe(n)}}
 PI.pid=alvo.id;save();pdPara();toast(alvo===cur?'Fornecedor: '+n:'As próximas peças vão para o pedido Nº '+alvo.n+' ('+n+')');try{$q('#modal form.pdf').nome.focus()}catch(x){}};
function pdFotos(){const b=$q('#pdfa');if(!b||!PI)return;b.innerHTML=PI.fotos.map((s,k)=>`<span class="pdfx"><img ${fimg(s)} alt="Foto ${k+1}"><button type="button" aria-label="Tirar foto ${k+1}" onclick="pdFotoDel(${k})">×</button></span>`).join('')||'<span class="muted pdfv">Nenhuma foto ainda</span>';setTimeout(fhyd,0)}
G.pdFoto=function(fs){if(!PI)return;const L=[...(fs||[])].slice(0,Math.max(0,4-PI.fotos.length));if(!L.length)return toast('Até 4 fotos por peça');L.forEach(f=>picRef(f,r=>{if(!PI)return;PI.fotos.push(r);pdFotos()}))};
G.pdFotoDel=k=>{if(PI){PI.fotos.splice(k,1);pdFotos()}};
G.pdNomeEst=function(n){const f=$q('#modal form.pdf'),x=n&&PR().find(y=>nrm(y.nome)==nrm(n));if(!f||!x)return;if(!f.cod.value.trim()&&(x.cod||x.ean))f.cod.value=x.cod||x.ean;if(x.un&&[...f.un.options].some(o=>o.value==x.un))f.un.value=x.un;if(PI&&!PI.fotos.length&&(x.fotos||[]).length){PI.fotos=x.fotos.slice(0,2);pdFotos()}};
G.pdCarro=function(oid){const f=$q('#modal form.pdf');if(!f)return;if(PI)PI.os=oid||'';const c=f.querySelector('.pdcar');if(c)c.hidden=!!oid;if(f.os&&f.os.value!=(oid||''))f.os.value=oid||'';pdPara()};
G.pdItemOk=function(){const f=$q('#modal form.pdf'),p=PI&&ped(PI.pid);if(!f||!p)return false;const q=nBR(f.q.value);
 const nome=f.nome.value.trim();if(!nome){toast('Escreva o nome da peça');try{f.nome.focus()}catch(x){}return false}if(!(q>0)){toast('Quantidade inválida');return false}
 if(f.forn){const fn=f.forn.value.trim();if(fn&&nrm(fn)!=nrm(p.forn||'')){p.forn=fn;const ant=PD().find(x=>x!==p&&x.ftel&&nrm(x.forn||'')==nrm(fn));if(ant)p.ftel=ant.ftel;else if(!p.ftel)p.ftel=''}}
 const os=(f.os&&f.os.value)||'',oo=os&&od(os);
 const o={nome,q,un:f.un.value,cod:f.cod.value.trim(),os,carro:oo?carroOS(oo):f.carro.value.trim(),obs:f.obs.value.trim(),fotos:PI.fotos.slice()};
 if(PI.iid){const i=p.itens.find(x=>x.id==PI.iid);Object.assign(i,o);PI=null;save();closeM();render();toast('Peça salva no pedido');return true}
 const pr=PR().find(x=>nrm(x.nome)==nrm(o.nome));p.itens.push({id:uid(),...o,rec:0,...(pr?{pid:pr.id}:{})});
 PI.add.push(o.nome+' · '+nShow(q)+' '+o.un);save();
 if(S.v=='ped'&&S.id!=p.id){limpaVazios(p.id);S.id=p.id}render();
 /* limpa para a próxima peça (mantém o carro e o fornecedor) */
 f.nome.value='';f.q.value='1';f.un.value='un';f.cod.value='';f.obs.value='';if(!os)f.carro.value='';PI.fotos=[];pdFotos();const d=f.querySelector('.pdmais');if(d)d.open=false;
 const k=$q('#pdok');if(k)k.innerHTML=`<b>${plural(PI.add.length,'peça adicionada','peças adicionadas')}</b>${PI.add.slice(-4).map(t=>`<span>✓ ${e(t)}</span>`).join('')}`;
 toast(o.nome+' adicionada');try{f.nome.focus()}catch(x){}return true};
/* Pronto: se ficou um nome escrito, adiciona antes de fechar */
G.pdPronto=function(){const f=$q('#modal form.pdf');if(f&&f.nome.value.trim()&&!pdItemOk())return;const volta=PI&&PI.volta,p=PI&&ped(PI.pid),n=PI?PI.add.length:0;PI=null;closeM();
 if(p&&S.v!='ped'&&volta&&n)toast(plural(n,'peça','peças')+' no pedido Nº '+p.n);render()};
G.pdItemRm=function(){if(!PI||!PI.iid)return;const p=ped(PI.pid),i=p&&p.itens.find(x=>x.id==PI.iid);const pid=PI.pid,iid=PI.iid;PI=null;closeM();if(i)desfazivel(()=>pdItemDel(pid,iid),i.nome+' tirada do pedido')};
G.pdItemDel=function(pid,iid){const p=ped(pid);if(!p)return;p.itens=p.itens.filter(i=>i.id!=iid);save();render()};
G.pdBaixo=function(pid){const p=ped(pid);if(!p)return;let n=0;PR().filter(isLow).forEach(x=>{if(p.itens.some(i=>i.pid==x.id))return;const q=Math.max(1,(+x.min||0)-qty(x.id)+1);p.itens.push({id:uid(),nome:x.nome,q,un:x.un||'un',cod:x.cod||'',os:'',carro:'',obs:'Reposição de estoque',fotos:(x.fotos||[]).slice(0,2),rec:0,pid:x.id});n++});
 save();render();toast(n?plural(n,'peça adicionada','peças adicionadas'):'As peças com estoque baixo já estão no pedido')};
/* pedir uma peça do estoque ao fornecedor */
G.pdProd=function(id){const x=prod(id);if(!x.id)return;const p=montando()||pdNovo(0);if(p.itens.some(i=>i.pid==x.id))return toast(x.nome+' já está no pedido Nº '+p.n);
 const q=Math.max(1,(+x.min||0)-qty(x.id)+1);pdItem(p.id,null,{nome:x.nome,cod:x.cod||'',un:x.un||'un',q,obs:'Reposição de estoque',fotos:(x.fotos||[]).slice(0,2)});if(PI)PI.volta=1};
/* pedir peça direto da O.S. */
G.pdDaOS=function(oid){const p=montando()||pdNovo(0);const o=od(oid);pdItem(p.id,null,{os:oid,carro:o?carroOS(o):''});if(PI)PI.volta=1};

/* ---------- PDF com fotos para o fornecedor ---------- */
async function genPed(p){if(noLib())return;await fpre(p);const Z=mkDoc('PEDIDO DE PEÇAS','Nº '+p.n,['Data: '+D(p.data),p.forn&&'Fornecedor: '+p.forn,plural(p.itens.length,'peça','peças')]),d=Z.d,M=Z.M,CW=Z.CW,tx=Z.tx,c=Z.c;
 Z.cards({t:'FORNECEDOR',rows:[['Nome',p.forn||'—',1],['Telefone',p.ftel]]},{t:'QUEM PEDE',rows:[['Oficina',c.nome,1],['Contato',[c.tel1,c.resp].filter(Boolean).join('  ·  ')]]});
 Z.sec('Peças solicitadas');
 p.itens.forEach((i,k)=>{const F=(i.fotos||[]).filter(s=>fdata(s)),tw=F.length?CW-74:CW-10,x0=F.length?M+70:M+6,
   L=[[`${k+1}. ${i.nome}`,12.5,1],[`Quantidade: ${i.q} ${i.un||'un'}`,10.5,1],i.cod&&['Código / referência: '+i.cod,10],i.carro&&['Carro: '+i.carro,10],i.obs&&['Obs.: '+i.obs,10]].filter(Boolean).map(([t,s,b])=>[Z.lines(t,tw,s,b),s,b]),
   th=L.reduce((a,[l,s])=>a+l.length*s*.42+1.6,0),ex=F.slice(1,4),h=Math.max(F.length?52:0,th+(ex.length?27:0)+8);
  Z.need(h+5);d.setDrawColor(...PC.ln);d.setFillColor(255,255,255);d.rect(M,Z.y,CW,h,'FD');d.setFillColor(...PC.ac);d.rect(M,Z.y,1.6,h,'F');
  if(F.length){d.setFillColor(...PC.bg);d.rect(M+3,Z.y+3,64,h-6,'F');Z.img(F[0],M+4,Z.y+4,62,h-8)}
  let y=Z.y+7;L.forEach(([l,s,b])=>{l.forEach(t=>{tx(t,x0,y,{s,b});y+=s*.42});y+=1.6});
  if(ex.length){let xx=x0;const yy=Z.y+h-25;ex.forEach(s=>{d.setDrawColor(...PC.ln);d.rect(xx,yy,30,22);Z.img(s,xx+.5,yy+.5,29,21);xx+=33})}
  Z.y+=h+4});
 Z.note('Observação',p.obs);Z.note('Por favor','Confirme a disponibilidade, a marca e o valor de cada peça. As fotos ajudam a achar a peça certa. Obrigado!');
 await Z.end(`Pedido-pecas-${p.n}${p.forn?'-'+nomeF(p.forn):''}`)}
G.pdPDF=async function(id){const p=ped(id);if(!p||!p.itens.length)return;toast('Gerando o PDF...');try{await genPed(p)}catch(x){toast('Não consegui gerar o PDF')}};
G.pdWa=async function(id){const p=ped(id);if(!p||!p.itens.length)return;
 if(!p.ftel){pdForn(id);return toast('Informe o telefone do fornecedor para mandar pelo WhatsApp')}
 const txt=`Olá${p.forn?', '+p.forn:''}! Aqui é da ${empNome()}.\n\nSegue o pedido de peças Nº ${p.n} com as fotos (${plural(p.itens.length,'peça','peças')}):\n${p.itens.map((i,k)=>`${k+1}. ${i.nome} — ${i.q} ${i.un||'un'}${i.carro?' ('+i.carro+')':''}`).join('\n')}\n\nPode confirmar disponibilidade e valores? Obrigado!`;
 const ok=await waDoc(genPed,p,p.ftel,txt);if(ok&&p.status=='Montando'){p.status='Enviado';p.env=today();save();render()}};

/* ---------- chegaram as peças: lança no estoque ---------- */
const acha=i=>i.pid&&prod(i.pid).id?i.pid:(PR().find(x=>nrm(x.nome)==nrm(i.nome)&&(!i.cod||!x.cod||nrm(x.cod)==nrm(i.cod)))||{}).id||'';
G.pdReceber=function(id){const p=ped(id);if(!p)return;const L=p.itens.filter(falta);if(!L.length)return toast('Todas as peças deste pedido já chegaram');
 const P=PR().slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
 sheet('Chegaram as peças',`<form class="pdrc" onsubmit="event.preventDefault();pdRecOk('${p.id}')"><p class="muted" style="margin:-4px 0 10px">Confira o que chegou. O que for para o estoque entra com a foto do pedido.</p>
 ${L.map(i=>{const a=acha(i),os=i.os&&od(i.os),osOk=os&&!osFim(os);return`<div class="pdrr" data-i="${i.id}"><div class="pdrh">${(i.fotos||[])[0]?thumb(i.fotos[0],'pdtm'):''}<div><b>${e(i.nome)}</b><small>Pedido: ${e(falta(i))} ${e(i.un||'un')}${os?' · O.S. '+e(os.num):''}</small></div></div>
  <div class="g2 pdg"><label>Chegou<input name="q" inputmode="decimal" value="${e(falta(i))}"></label>${DONO()?`<label>Custo unitário (R$)<input name="custo" inputmode="decimal" placeholder="opcional"></label>`:'<span></span>'}</div>
  <label>Estoque<select name="dest" onchange="pdDest(this)"><option value="novo" ${a?'':'selected'}>Cadastrar como peça nova no estoque</option>${P.map(x=>`<option value="${x.id}" ${x.id==a?'selected':''}>Somar em: ${e(x.nome)}${x.cod?' ('+e(x.cod)+')':''}</option>`).join('')}<option value="">Não lançar (vai direto para o carro)</option></select></label>
  <div class="pdnv" ${a?'hidden':''}><label>Preço de venda (R$)<input name="preco" inputmode="decimal" placeholder="opcional"></label></div>${osOk?`<label class="pdnaos"><input type="checkbox" name="naos" checked><span>Lançar no carro: <b>O.S. ${e(os.num)}</b> · ${e(vlabel(vh(os.veh)))}</span></label>`:''}</div>`}).join('')}
 <div class="bar" style="margin:10px 0 0"><button type="button" onclick="closeM()">Cancelar</button><span class="sp"></span><button class="pr">Confirmar o que chegou</button></div></form>`)};
/* lança uma peça que chegou: estoque e/ou O.S. (usado pelo "Chegaram as peças" e pelo ✓ da linha) */
function lanca(p,i,x){const r={est:0,nova:0,os:null,ag:null},obs='Pedido '+p.n+(p.forn?' · '+p.forn:''),q=Math.min(+x.q||0,falta(i));if(!(q>0))return r;
 i.rec=(+i.rec||0)+q;const dest=x.dest,custo=DONO()?(+x.custo||0):0;
 if(dest){let pr;if(dest=='novo'){pr={id:uid(),nome:i.nome,cod:i.cod||'',cat:'',un:i.un||'un',preco:+x.preco||0,min:0,fotos:(i.fotos||[]).slice(),...(DONO()?{custo:custo||0}:{})};PR().push(pr);r.nova=1}
  else{pr=prod(dest);if(!pr.id)return r;if(!(pr.fotos||[]).length&&(i.fotos||[]).length)pr.fotos=i.fotos.slice(0,4);if(custo>0)pr.custo=custo}
  i.pid=pr.id;MV().push({id:uid(),pid:pr.id,tipo:'E',q,data:today(),obs});r.est=1}
 const o=i.os&&od(i.os);
 if(o&&!osFim(o)&&x.naos){const pr=i.pid&&dest?prod(i.pid):null,pv=pr&&pr.id?(+pr.preco||0):(+x.preco||0),cu=pr&&pr.id?(+pr.custo||custo||0):custo;
  o.items=o.items||[];o.items.push({t:'Peça',d:i.nome,det:i.cod?'Cód. '+i.cod:'',q,v:pv||0,...(pr&&pr.id?{pid:pr.id,baixa:true}:{}),...(DONO()?{custo:cu||0}:{})});
  if(pr&&pr.id)MV().push({id:uid(),pid:pr.id,tipo:'S',q,data:today(),obs:'O.S. '+o.num});i.naOS=true;r.os=o.num}
 if(o&&o.status=='Aguardando peças')r.ag=o.id;return r}
function fechaPed(p){const tudo=!p.itens.some(falta);if(tudo){p.status='Recebido';p.rec=today()}else if(p.itens.some(i=>+i.rec))p.status='Parcial';if(!p.env)p.env=today();return tudo}
function avisaAg(ids){if(!ids.size)return;setTimeout(()=>sheet('Peças chegaram',`<p style="margin:0 0 10px">Estas O.S. estavam <b>aguardando peças</b>:</p>${[...ids].map(oid=>{const o=od(oid);return`<div class="pf pdos"><div><b>O.S. ${e(o.num)}</b><small>${e(vlabel(vh(o.veh)))} · ${e(cl(o.cli).nome||'')}</small></div><button type="button" class="sm pr" onclick="pdOsAnda('${o.id}',this)">Voltar ao serviço</button></div>`}).join('')}<div class="bar" style="margin:12px 0 0"><span class="sp"></span><button type="button" onclick="closeM()">Fechar</button></div>`),600)}
G.pdRecOk=function(id){const p=ped(id),f=$q('#modal form.pdrc');if(!p||!f)return;let ne=0,nn=0,nos=0;const osN=new Set(),osAg=new Set();
 for(const r of f.querySelectorAll('.pdrr')){const i=p.itens.find(x=>x.id==r.dataset.i);if(!i)continue;const val=n=>{const x=r.querySelector(`[name=${n}]`);return x&&x.value.trim()?nBR(x.value):0},nao=r.querySelector('[name=naos]');
  const x=lanca(p,i,{q:val('q'),dest:r.querySelector('[name=dest]').value,custo:val('custo'),preco:val('preco'),naos:nao&&nao.checked});
  ne+=x.est;nn+=x.nova;if(x.os){nos++;osN.add(x.os)}if(x.ag)osAg.add(x.ag)}
 const tudo=fechaPed(p);save();closeM();render();
 toast(`${tudo?'Pedido recebido':'Recebimento parcial'}${ne?' · '+plural(ne,'peça lançada','peças lançadas')+' no estoque':''}${nn?' ('+plural(nn,'nova','novas')+')':''}${nos?' · '+plural(nos,'peça lançada','peças lançadas')+' na O.S. '+[...osN].join(', '):''}`);
 avisaAg(osAg)};
/* 2.48.0: ✓ na linha = chegou a peça inteira (com Desfazer) */
G.pdChegou=function(pid,iid){const p=ped(pid),i=p&&p.itens.find(x=>x.id==iid);if(!i||!falta(i))return;
 const o=i.os&&od(i.os),osOk=o&&!osFim(o),a=acha(i),dest=a||(osOk?'':'novo');let r={};
 const msg=i.nome+' chegou'+(osOk?' · lançada na O.S. '+o.num:a?' · somada no estoque':' · entrou no estoque');
 desfazivel(()=>{r=lanca(p,i,{q:falta(i),dest,naos:osOk});fechaPed(p);save();render()},msg+(p.itens.filter(falta).length==1?' · pedido completo':''));
 if(r.ag&&od(r.ag)&&od(r.ag).status=='Aguardando peças'&&!p.itens.some(x=>x.os==r.ag&&falta(x)))avisaAg(new Set([r.ag]))};

/* ---------- 2.48.0: cotação (o mesmo pedido para vários fornecedores) ---------- */
const COT=p=>{p.cot=p.cot||[];if(!p.cot.length&&p.forn)p.cot.push({forn:p.forn,ftel:p.ftel||''});return p.cot};
G.pdCot=function(id){const p=ped(id);if(!p)return;const L=COT(p);save();const ja=new Set(L.map(c=>nrm(c.forn))),fs=fornsUsados().filter(x=>!ja.has(nrm(x.forn))).slice(0,6);
 sheet('Cotação · pedido Nº '+e(p.n),`<p class="muted" style="margin:-4px 0 10px">Mande o pedido para cada fornecedor, anote o total e o prazo e escolha o melhor.</p>
 <div id="pdcl">${L.map((c,k)=>`<div class="pdcr" data-k="${k}"><div class="pdcn"><div><b>${e(c.forn)}</b><small>${c.ftel?e(fmtTel(c.ftel)):'sem telefone'}${c.env?' · pedido de preço enviado':''}</small></div><button type="button" class="sm wa" onclick="pdCotWa('${p.id}',${k})">${c.env?'Mandar de novo':'Pedir preço'}</button></div>
  <div class="g2 pdg"><label>Total (R$)<input inputmode="decimal" value="${c.v!=null&&c.v!==''?e(nShow(c.v)):''}" placeholder="0,00" onchange="pdCotSet('${p.id}',${k},'v',this.value)"></label><label>Prazo (dias)<input inputmode="numeric" value="${c.dias!=null?e(c.dias):''}" placeholder="0" onchange="pdCotSet('${p.id}',${k},'dias',this.value)"></label></div>
  <div class="pdcb"><span class="pdctg"></span><span class="sp"></span><button type="button" class="sm" onclick="pdCotRm('${p.id}',${k})">Tirar</button><button type="button" class="sm pr" onclick="pdCotEsc('${p.id}',${k})">Escolher</button></div></div>`).join('')}</div>
 <div class="pdcadd"><b>+ Fornecedor na cotação</b>${fs.length?`<div class="pdsug">${fs.map(x=>`<button type="button" class="sm" data-n="${e(x.forn)}" data-t="${e(x.ftel||'')}" onclick="pdCotAdd('${p.id}',this.dataset.n,this.dataset.t)">${e(x.forn)}</button>`).join('')}</div>`:''}
 <div class="g2 pdg"><label>Nome<input id="pdcn" autocomplete="off" placeholder="Ex.: Autopeças Central"></label><label>WhatsApp<input id="pdct" type="tel" inputmode="tel" placeholder="(91) 99999-0000"></label></div><button type="button" class="sm" onclick="pdCotAdd('${p.id}',$('#pdcn').value,$('#pdct').value)">Pôr na cotação</button></div>`);cotTags(p)};
function cotTags(p){const L=p.cot||[],cv=L.filter(c=>+c.v>0),cd=L.filter(c=>c.dias!=null&&c.dias!==''),mv=cv.length>1?Math.min(...cv.map(c=>+c.v)):null,md=cd.length>1?Math.min(...cd.map(c=>+c.dias)):null;
 document.querySelectorAll('#pdcl .pdcr').forEach(r=>{const c=L[+r.dataset.k];if(!c)return;const t=[];if(mv!=null&&+c.v==mv)t.push(mb('mais barato',KG));if(md!=null&&c.dias!==''&&c.dias!=null&&+c.dias==md)t.push(mb('mais rápido',KB));r.querySelector('.pdctg').innerHTML=t.join('');r.classList.toggle('best',mv!=null&&+c.v==mv)})}
G.pdCotSet=function(id,k,campo,v){const p=ped(id),c=p&&(p.cot||[])[k];if(!c)return;v=String(v||'').trim();c[campo]=v===''?null:campo=='v'?(isFinite(nBR(v))?nBR(v):null):Math.max(0,parseInt(v)||0);save();cotTags(p);render(1)};
G.pdCotAdd=function(id,n,t){const p=ped(id);n=String(n||'').trim();if(!p)return;if(!n)return toast('Escreva o nome do fornecedor');const L=COT(p);if(L.some(c=>nrm(c.forn)==nrm(n)))return toast(n+' já está na cotação');
 L.push({forn:n,ftel:String(t||'').trim()||((PD().find(y=>y.ftel&&nrm(y.forn||'')==nrm(n))||{}).ftel||'')});save();pdCot(id);render()};
G.pdCotRm=function(id,k){const p=ped(id);if(!p||!p.cot||!p.cot[k])return;const c=p.cot[k],ir=()=>{p.cot.splice(k,1);save();pdCot(id);render()};
 if(typeof desfazivel!='function')return ir();desfazivel(ir,(c.forn||'Fornecedor')+' tirado da cotação',()=>pdCot(id))};
G.pdCotWa=async function(id,k){const p=ped(id),c=p&&(p.cot||[])[k];if(!c||!p.itens.length)return;
 const txt=`Olá, ${c.forn}! Aqui é da ${empNome()}.\n\nPode me passar o valor e o prazo destas peças (pedido Nº ${p.n})?\n${p.itens.map((i,j)=>`${j+1}. ${i.nome} — ${nShow(i.q)} ${i.un||'un'}${i.carro?' ('+i.carro+')':''}`).join('\n')}\n\nObrigado!`;
 const ok=await waDoc(genPed,{...p,forn:c.forn,ftel:c.ftel},c.ftel,txt);if(ok){c.env=1;save()}};
G.pdCotEsc=function(id,k){const p=ped(id),c=p&&(p.cot||[])[k];if(!c)return;p.forn=c.forn;p.ftel=c.ftel||p.ftel||'';p.cotEsc={forn:c.forn,v:c.v,dias:c.dias};save();closeM();render();
 toast(`Escolhido: ${c.forn}${+c.v>0?' · '+R(+c.v):''}\nAgora toque em “Mandar ao fornecedor” para confirmar o pedido.`,'ok')};

/* ---------- 2.48.0: arrastar a linha para a esquerda tira a peça (com Desfazer) ---------- */
{let SW=null;
 document.addEventListener('touchstart',ev=>{const r=ev.target.closest&&ev.target.closest('.pdl[data-sw]');if(!r||ev.target.closest('button,img'))return;const t=ev.touches[0];SW={r,x:t.clientX,y:t.clientY,dx:0,on:0}},{passive:true});
 document.addEventListener('touchmove',ev=>{if(!SW)return;const t=ev.touches[0],dx=t.clientX-SW.x,dy=t.clientY-SW.y;
  if(!SW.on){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){SW=null;return}if(dx<-12){SW.on=1;SW.r.classList.add('sw')}else return}
  SW.dx=Math.min(0,dx);SW.r.style.transform=`translateX(${SW.dx}px)`},{passive:true});
 const fim=()=>{if(!SW)return;const s=SW;SW=null;s.r.classList.remove('sw');if(!s.on)return;s.r.dataset.nc=1;setTimeout(()=>{delete s.r.dataset.nc},400);
  if(s.dx<-Math.min(140,s.r.offsetWidth*.35)){s.r.style.transform='translateX(-105%)';const pid=s.r.dataset.p,iid=s.r.dataset.i,p=ped(pid),i=p&&p.itens.find(x=>x.id==iid);
   setTimeout(()=>{if(i)desfazivel(()=>pdItemDel(pid,iid),i.nome+' tirada do pedido')},160)}else s.r.style.transform=''};
 document.addEventListener('touchend',fim,{passive:true});document.addEventListener('touchcancel',fim,{passive:true})}
G.pdDest=function(sel){const nv=sel.closest('.pdrr').querySelector('.pdnv');if(nv)nv.hidden=!(sel.value=='novo'||sel.value=='')};
G.pdOsAnda=function(oid,b){const keep=S.v,kid=S.id,o=od(oid);if(!o)return;S.id=oid;try{setSt('Em andamento')}finally{S.id=kid;S.v=keep}render(1);if(b){b.disabled=true;b.textContent='Em andamento'}};

/* ---------- fotos das peças do estoque ---------- */
G.pfFoto=function(pid,fs){const p=prod(pid);if(!p.id)return;const L=[...(fs||[])].slice(0,Math.max(0,6-(p.fotos||[]).length));if(!L.length)return toast('Até 6 fotos por peça');
 L.forEach(f=>picRef(f,r=>{p.fotos=p.fotos||[];p.fotos.push(r);save();render(1)}))};
G.pfDel=function(pid,k){const p=prod(pid);if(!p.id||!p.fotos)return;p.fotos.splice(k,1);save();render(1)};
G.pfFotosHTML=function(p){const F=p.fotos||[];return sech('Fotos da peça',F.length?plural(F.length,'foto','fotos'):'')+`<div class="card"><div class="pdgal">${F.map((s,k)=>`<span class="pdfx">${thumb(s,'')}<button type="button" aria-label="Apagar foto ${k+1}" onclick="confirmDel(this,()=>pfDel('${p.id}',${k}))">×</button></span>`).join('')||'<span class="muted">Nenhuma foto. A foto ajuda a achar a peça na prateleira e a pedir de novo.</span>'}</div><div class="fbs" style="margin-top:10px">${fotoBtns(`pfFoto('${p.id}',this.files)`)}</div></div>`};
G.pfThumb=p=>(p.fotos||[])[0]?thumb(p.fotos[0],'pdtl'):'';
G.pdAbertos=()=>PD().filter(aberto).length;

const st=document.createElement('style');st.textContent=`
.pdth{width:64px;height:64px;object-fit:cover;border-radius:8px;cursor:zoom-in;background:var(--bg)}
.pdtm{width:38px;height:38px;object-fit:cover;border-radius:6px;cursor:zoom-in}.pdths{display:inline-flex;gap:4px;margin-right:4px}
.pdtl{width:42px;height:42px;object-fit:cover;border-radius:7px;vertical-align:middle;margin-right:8px;cursor:zoom-in}
.pdit{padding:12px}.pdit.ok{opacity:.75}.pdit1{display:flex;gap:12px;align-items:flex-start}
.pdfs{position:relative;flex:none;width:84px;height:84px}.pdfs .pdth{width:84px;height:84px}.pdfc{position:absolute;right:4px;bottom:4px;padding:1px 7px;border-radius:99px;background:rgba(0,0,0,.7);color:#fff;font-size:12px;font-weight:700;pointer-events:none}
.pdsf{flex:none;width:72px;height:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:1.5px dashed var(--ln);border-radius:8px;color:var(--mut);background:transparent;font-size:11px;padding:0}.pdsf svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9}
.pdtx{min-width:0;flex:1}.pdtx b{display:block;font-size:16px;overflow-wrap:anywhere}.pdtx small{display:block;color:var(--mut);margin-top:2px;overflow-wrap:anywhere}.pdtx small b{display:inline;font-size:inherit;color:var(--ink)}
.pdtg{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;min-width:0}.pdtg .mb{white-space:normal}.pdchip{display:inline-flex;align-items:center;gap:4px;margin:0;padding:2px 9px;border-radius:99px;font-size:12px;font-weight:600;border:0;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c)}.pdchip svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2}.pdnaos{display:flex;align-items:center;gap:8px;margin:8px 0 0;font-weight:500}.pdnaos span{flex:1;min-width:0}.pdnaos input{flex:none;width:20px;height:20px;margin:0}
.pdadd{width:100%;padding:13px;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 0 8px}.pdadd svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}
.pdfa{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px;min-height:20px}.pdfv{font-size:13px}
.pdfx{position:relative;display:inline-block}.pdfx img{width:84px;height:84px;object-fit:cover;border-radius:8px;display:block}
.pdfx button{position:absolute;top:-6px;right:-6px;width:26px;height:26px;padding:0;border-radius:50%;font-size:16px;line-height:1;background:var(--ink);color:var(--bg);border:0}
.pdgal{display:flex;gap:10px;flex-wrap:wrap}.pdgal .pdfx img{width:96px;height:96px;cursor:zoom-in}
.g2.pdg{grid-template-columns:1fr 1fr;gap:0 10px}.pdsug{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 12px}.pdsug small{width:100%}
.pdrr{border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:10px}.pdrh{display:flex;gap:10px;align-items:center;margin-bottom:8px}.pdrh small{display:block;color:var(--mut)}
.pdos{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--ln)}.pdos div{flex:1}.pdos small{display:block;color:var(--mut)}
/* 2.48.0 */
.pdls{padding:0;overflow:hidden}
.pdlw{position:relative;overflow:hidden;border-top:1px solid var(--ln)}.pdlw:first-child{border-top:0}
.pdlx{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding-right:18px;background:#B4472E;color:#fff;font-weight:700;font-size:14px}
.pdl{position:relative;display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 12px 10px 14px;background:var(--sf);transition:transform .2s ease;touch-action:pan-y}
.pdl[role=button]{cursor:pointer}.pdl.sw{transition:none}.pdl.ok .pdlt{opacity:.55}.pdl.ok .pdlt b{text-decoration:line-through;text-decoration-thickness:1px}
.pdlfw{position:relative;flex:none}.pdlf{width:46px;height:46px;object-fit:cover;border-radius:8px;display:block;cursor:zoom-in}.pdlfw .pdfc{font-size:10px;padding:0 5px;right:2px;bottom:2px}
.pdlt{flex:1;min-width:0}.pdlt b{display:block;font-size:16px;line-height:1.25;overflow-wrap:anywhere}.pdlt small{display:block;color:var(--mut);margin-top:2px;font-size:13px;overflow-wrap:anywhere}.pdlt small b{display:inline;font-size:inherit;color:var(--ink)}
.pdck{flex:none;width:44px;height:44px;margin:0;padding:0;border-radius:50%;border:2px solid var(--ln);background:transparent;color:var(--mut);font-size:20px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center}
.pdck:active{transform:scale(.92)}.pdck.on{background:#2E8B57;border-color:#2E8B57;color:#fff}
.pdhint{font-size:12px;color:var(--mut);text-align:center;margin:-4px 0 10px}
.pdfo{display:flex;align-items:center;gap:10px;min-width:0}.pdfo>div{min-width:0;cursor:pointer}.pdfo b{display:block;overflow-wrap:anywhere}.pdfo small{display:block;color:var(--mut)}
.pdwa{flex:none;width:40px;height:40px;margin:0;padding:0;border-radius:50%;border:0;background:#1E9E55;color:#fff;display:flex;align-items:center;justify-content:center}.pdwa svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round}
.pdmb{font-size:22px;line-height:1;margin-left:6px}
.osh button.pdmain.wa{background:#1E9E55;color:#fff;border-color:#1E9E55}
.pdmain{width:100%;margin:0;padding:12px;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px}.pdmain svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}
.pdcotb{width:100%;display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:10px 12px;text-align:left;font-weight:500}.pdcotb span{flex:1;min-width:0}.pdcotb svg{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9}
.pdobs{margin:12px 0 0}.pdobs summary{cursor:pointer;color:var(--mut);font-weight:600;padding:8px 0;list-style:none}.pdobs summary::-webkit-details-marker{display:none}.pdobs textarea{margin-top:4px}
.pdmais{margin:2px 0 4px}.pdmais summary{cursor:pointer;color:var(--mut);font-weight:600;padding:8px 0;list-style:none}.pdmais summary::-webkit-details-marker{display:none}.pdmais[open] summary{margin-bottom:6px}
.pdpara{margin:0 0 10px}.pdpl{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--mut);margin:0 0 6px}.pdpl span{flex:1;min-width:0}.pdpl b{color:var(--ink)}.pdpl button{margin:0}
.pdpo{padding:6px 10px;border-radius:8px;background:color-mix(in srgb,#2F6FB0 14%,transparent)}
.pdfnv{display:flex;gap:6px;width:100%}.pdfnv input{flex:1;margin:0;min-width:0}.pdfnv button{margin:0}
.pdok{display:flex;flex-direction:column;gap:2px;font-size:13px;color:var(--mut);margin:0 0 6px}.pdok:empty{display:none}.pdok b{color:#2E8B57;font-size:13px}
.pdcr{border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:10px}.pdcr.best{border-color:#2E8B57}
.pdcn{display:flex;align-items:center;gap:8px;margin-bottom:6px}.pdcn>div{flex:1;min-width:0}.pdcn small{display:block;color:var(--mut)}.pdcn button{margin:0}
.pdcb{display:flex;align-items:center;gap:6px}.pdcb button{margin:0}.pdctg{display:flex;gap:4px;flex-wrap:wrap}
.pdcadd{border-top:1px solid var(--ln);padding-top:10px;margin-top:4px}.pdcadd>b{display:block;margin-bottom:6px}
`;document.head.appendChild(st);
if(typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);

/* 2.44.1: saiu de um pedido vazio: ele some */
{const _g=go;G.go=go=function(k,id,...r){const de=S.v=='ped'?S.id:null;const x=_g(k,id,...r);try{if(de&&!(k=='ped'&&id==de)){const p=ped(de);if(vazio(p)){db.peds=PD().filter(q=>q.id!=de);save();if(S.v=='peds')render(1)}}}catch(e){}return x}}
})(window);
