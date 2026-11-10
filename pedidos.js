/* Fio-Mar Gestor — pedido de peças (versão 2.10.0)
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
G.pdNovo=function(abre){const n=db.pseq=(+db.pseq||PD().length)+1,ult=PD().slice().reverse().find(p=>p.forn)||{};
 const p={id:uid(),n:String(n).padStart(4,'0'),data:today(),status:'Montando',forn:'',ftel:'',obs:'',itens:[]};PD().push(p);save();if(abre!==0)go('ped',p.id);return p};
const montando=()=>PD().slice().reverse().find(p=>p.status=='Montando');

/* ---------- lista ---------- */
function Vpeds(){const f=S.f.pd||'abertos',L=PD().slice().reverse(),n=k=>L.filter(p=>k=='abertos'?aberto(p):p.status==k).length;
 const tl=[['abertos','Em aberto','pedido',String(n('abertos')),n('abertos')?KB:KM],['Recebido','Recebidos','caixa',String(n('Recebido')),n('Recebido')?KG:KM],['Cancelado','Cancelados','alert',String(n('Cancelado'))]];
 const V2=L.filter(p=>f=='abertos'?aberto(p):p.status==f);
 return head({back:"go('stock')",kick:'Estoque',title:'Pedidos de peças',c:PCOL.stock,right:`<button class="pr hb" onclick="pdNovo()">+ Novo pedido</button>`})+ftiles(tl,f,'pd')+
 (V2.map(p=>{const F=p.itens.flatMap(i=>i.fotos||[]).slice(0,5),nq=p.itens.length;
  return lcard({c:ST[p.status],n:'Pedido '+e(p.n)+' · '+D(p.data),pill:pill(p.status),t:e(p.forn||'Fornecedor não informado'),
   m:nq?p.itens.slice(0,4).map(i=>e(i.nome)).join(' · ')+(nq>4?' e mais '+(nq-4):''):'Nenhuma peça ainda',
   f:`${F.length?`<span class="pdths">${F.map(s=>thumb(s,'pdtm')).join('')}</span>`:''}${mb(plural(nq,'peça','peças'))}${p.status=='Parcial'?mb('Faltam '+p.itens.filter(falta).length,KA):''}`,on:`go('ped','${p.id}')`})}).join('')||
  empty('pedido',f=='abertos'?'Nenhum pedido em aberto. Monte um pedido com a foto e o nome de cada peça e mande o PDF para o fornecedor.':'Nenhum pedido aqui.',f=='abertos'?`<button class="pr" onclick="pdNovo()">+ Novo pedido</button>`:''))}

/* ---------- pedido ---------- */
function itemCard(p,i,k){const fl=falta(i),os=i.os&&od(i.os),pr=i.pid&&prod(i.pid);
 return`<div class="card pdit${fl||p.status=='Montando'?'':' ok'}"><div class="pdit1">${(i.fotos||[]).length?`<div class="pdfs">${i.fotos.slice(0,3).map(s=>thumb(s)).join('')}</div>`:`<button type="button" class="pdsf" onclick="pdItem('${p.id}','${i.id}')">${svgi('osfotos')}<span>Sem foto</span></button>`}
 <div class="pdtx"><b>${k+1}. ${e(i.nome)}</b><small><b>${e(i.q)} ${e(i.un||'un')}</b>${i.cod?' · Ref. '+e(i.cod):''}</small>${i.carro?`<small>Carro: ${e(i.carro)}</small>`:''}${i.obs?`<small>${e(i.obs)}</small>`:''}
 <div class="pdtg">${os?mb('O.S. '+e(os.num),KB):''}${+i.rec?mb(fl?'Chegou '+i.rec+' de '+i.q:'Chegou',fl?KA:KG):''}${pr&&pr.id?mb('No estoque: '+e(pr.nome),KG):''}</div></div></div>
 ${p.status=='Montando'||p.status=='Enviado'?`<div class="bar" style="margin:8px 0 0"><span class="sp"></span><button type="button" class="sm" onclick="pdItem('${p.id}','${i.id}')">Editar</button><button type="button" class="sm" aria-label="Remover ${e(i.nome)}" onclick="confirmDel(this,()=>pdItemDel('${p.id}','${i.id}'))">Remover</button></div>`:''}</div>`}
function Vped(){const p=ped(S.id);if(!p)return Vpeds();const pode=['Montando','Enviado','Parcial'].includes(p.status),nf=p.itens.filter(falta).length,rec=p.itens.some(i=>+i.rec);
 const acts=[p.itens.length?`<button class="sm pr" onclick="pdPDF('${p.id}')">${svgi('notas')} PDF com fotos</button>`:'',p.itens.length?`<button class="sm wa" onclick="pdWa('${p.id}')">Mandar ao fornecedor</button>`:'',
  ['Enviado','Parcial'].includes(p.status)||(p.status=='Montando'&&p.itens.length)?`<button class="sm${p.status=='Montando'?'':' pr'}" onclick="pdReceber('${p.id}')">${svgi('caixa')} Chegaram as peças</button>`:'',
  `<span class="sp"></span>`,p.status=='Montando'&&p.itens.length?`<button class="sm" onclick="pdStatus('${p.id}','Enviado')">Marcar como enviado</button>`:'',
  pode&&!rec?`<button class="sm" onclick="pdStatus('${p.id}','Cancelado')">Cancelar pedido</button>`:'',p.status=='Cancelado'?`<button class="sm" onclick="pdStatus('${p.id}','Montando')">Reabrir</button>`:'',
  DONO()&&!rec?`<button class="sm dg" onclick="confirmDel(this,()=>pdDel('${p.id}'))">Excluir</button>`:''].join('');
 return head({back:"go('peds')",kick:'Pedido de peças · '+D(p.data),title:'Nº '+e(p.n),c:ST[p.status],right:pill(p.status),
  sub:`<div><b>${e(p.forn||'Fornecedor não informado')}</b><small>${p.ftel?e(p.ftel)+' · ':''}<a href="#" onclick="event.preventDefault();pdForn('${p.id}')">${p.forn?'Alterar':'Informar fornecedor'}</a></small></div><div class="osv"><small>Peças</small><b>${p.itens.length}</b></div>`,acts})+
 (p.status=='Parcial'?`<div class="fbar">${svgi('caixa')}<span>Chegou parte do pedido. Faltam <b>${plural(nf,'peça','peças')}</b>.</span></div>`:'')+
 (p.itens.map((i,k)=>itemCard(p,i,k)).join('')||empty('osfotos','Adicione as peças: tire a foto da peça velha (ou da etiqueta) e escreva o nome. O fornecedor recebe o PDF com as fotos.'))+
 (p.status=='Montando'||p.status=='Enviado'?`<button type="button" class="pr pdadd" onclick="pdItem('${p.id}')">${svgi('osfotos')} Adicionar peça</button>${PR().some(isLow)?`<button type="button" class="mais" onclick="pdBaixo('${p.id}')">+ Peças com estoque baixo (${PR().filter(isLow).length})</button>`:''}`:'')+
 `<label style="margin-top:12px">Observação para o fornecedor<textarea placeholder="Ex.: entregar até sexta, preferência marca original" onchange="pdObs('${p.id}',this.value)">${e(p.obs||'')}</textarea></label>`}
V.peds=Vpeds;V.ped=Vped;

G.pdObs=(id,v)=>{const p=ped(id);if(p){p.obs=v;save()}};
G.pdStatus=function(id,s){const p=ped(id);if(!p)return;p.status=s;if(s=='Enviado'&&!p.env)p.env=today();save();render();toast('Pedido '+p.n+': '+s.toLowerCase())};
G.pdDel=function(id){db.peds=PD().filter(p=>p.id!=id);save();go('peds');toast('Pedido excluído')};
G.pdForn=function(id){const p=ped(id);if(!p)return;const sug=[...new Map(PD().filter(x=>x.forn).map(x=>[nrm(x.forn),x])).values()];
 modal('Fornecedor',[['forn','Nome do fornecedor (autopeças)','text',0,1],['ftel','Telefone / WhatsApp']],{forn:p.forn,ftel:p.ftel},o=>{p.forn=(o.forn||'').trim();p.ftel=(o.ftel||'').trim();save();render()},
  sug.length?`<div class="pdsug"><small class="muted">Fornecedores usados antes:</small>${sug.slice(-6).reverse().map(x=>`<button type="button" class="sm" data-n="${e(x.forn)}" data-t="${e(x.ftel||'')}" onclick="pdFornUsa(this)">${e(x.forn)}</button>`).join('')}</div>`:'')};
G.pdFornUsa=b=>{const f=$q('#modal form');if(!f)return;f.forn.value=b.dataset.n;f.ftel.value=b.dataset.t};

/* ---------- peça do pedido (foto + nome) ---------- */
let PI=null;
G.pdItem=function(pid,iid,pre){const p=ped(pid);if(!p)return;const i=iid?p.itens.find(x=>x.id==iid):null;PI={pid,iid:iid||null,fotos:[...((i&&i.fotos)||(pre&&pre.fotos)||[])]};const v={q:1,un:'un',...(pre||{}),...(i||{})};
 const OS=db.orders.filter(o=>!osFim(o)).slice().reverse(),nomes=[...new Set([...PR().map(x=>x.nome),...PD().flatMap(x=>x.itens.map(y=>y.nome))].filter(Boolean))].slice(0,300);
 sheet(i?'Editar peça':'Adicionar peça',`<form class="pdf" autocomplete="off" onsubmit="event.preventDefault();pdItemOk()">
 <small class="muted">Foto da peça (velha, da etiqueta ou do catálogo)</small><div class="pdfa" id="pdfa"></div>
 <div class="fbs" style="margin:0 0 12px">${fotoBtns('pdFoto(this.files)')}</div>
 <label>Nome da peça<input name="nome" list="pdnomes" required value="${e(v.nome||'')}" placeholder="Ex.: Bomba de combustível"></label><datalist id="pdnomes">${nomes.map(x=>`<option value="${e(x)}">`).join('')}</datalist>
 <div class="g2 pdg"><label>Quantidade<input name="q" inputmode="decimal" value="${e(v.q)}" required></label><label>Unidade<select name="un">${UN.map(u=>`<option ${v.un==u?'selected':''}>${u}</option>`).join('')}</select></label></div>
 <label>Código / referência (se souber)<input name="cod" value="${e(v.cod||'')}" placeholder="Ex.: 7086.30.0011"></label>
 <label>Para qual carro<select name="os" onchange="pdCarro(this.value)"><option value="">Estoque / outro carro</option>${OS.map(o=>`<option value="${o.id}" ${v.os==o.id?'selected':''}>O.S. ${e(o.num)} · ${e(vlabel(vh(o.veh)))}</option>`).join('')}</select></label>
 <label>Carro (modelo, ano, motor)<input name="carro" value="${e(v.carro||'')}" placeholder="Ex.: Onix 2015 1.0"></label>
 <label>Observação<input name="obs" value="${e(v.obs||'')}" placeholder="Ex.: lado esquerdo, com sensor de ABS"></label>
 <div class="bar" style="margin:6px 0 0"><button type="button" onclick="closeM()">Cancelar</button><span class="sp"></span><button class="pr">${i?'Salvar':'Adicionar ao pedido'}</button></div></form>`);pdFotos();
 if(!i&&pre&&pre.os&&!v.carro)pdCarro(pre.os)};
function pdFotos(){const b=$q('#pdfa');if(!b||!PI)return;b.innerHTML=PI.fotos.map((s,k)=>`<span class="pdfx"><img ${fimg(s)} alt="Foto ${k+1}"><button type="button" aria-label="Tirar foto ${k+1}" onclick="pdFotoDel(${k})">×</button></span>`).join('')||'<span class="muted pdfv">Nenhuma foto ainda</span>';setTimeout(fhyd,0)}
G.pdFoto=function(fs){if(!PI)return;const L=[...(fs||[])].slice(0,Math.max(0,4-PI.fotos.length));if(!L.length)return toast('Até 4 fotos por peça');L.forEach(f=>picRef(f,r=>{if(!PI)return;PI.fotos.push(r);pdFotos()}))};
G.pdFotoDel=k=>{if(PI){PI.fotos.splice(k,1);pdFotos()}};
G.pdCarro=function(oid){const f=$q('#modal form.pdf');if(!f)return;const o=oid&&od(oid);if(o){const c=carroOS(o);if(c)f.carro.value=c}};
G.pdItemOk=function(){const f=$q('#modal form.pdf'),p=PI&&ped(PI.pid);if(!f||!p)return;const q=nBR(f.q.value);if(!(q>0))return toast('Quantidade inválida');
 const o={nome:f.nome.value.trim(),q,un:f.un.value,cod:f.cod.value.trim(),os:f.os.value||'',carro:f.carro.value.trim(),obs:f.obs.value.trim(),fotos:PI.fotos.slice()};if(!o.nome)return toast('Escreva o nome da peça');
 if(PI.iid){const i=p.itens.find(x=>x.id==PI.iid);Object.assign(i,o)}else{const pr=PR().find(x=>nrm(x.nome)==nrm(o.nome));p.itens.push({id:uid(),...o,rec:0,...(pr?{pid:pr.id}:{})})}
 const volta=PI.volta;PI=null;save();closeM();render();toast(volta?'Peça adicionada ao pedido Nº '+p.n:'Peça salva no pedido')};
G.pdItemDel=function(pid,iid){const p=ped(pid);if(!p)return;p.itens=p.itens.filter(i=>i.id!=iid);save();render()};
G.pdBaixo=function(pid){const p=ped(pid);if(!p)return;let n=0;PR().filter(isLow).forEach(x=>{if(p.itens.some(i=>i.pid==x.id))return;const q=Math.max(1,(+x.min||0)-qty(x.id)+1);p.itens.push({id:uid(),nome:x.nome,q,un:x.un||'un',cod:x.cod||'',os:'',carro:'',obs:'Reposição de estoque',fotos:(x.fotos||[]).slice(0,2),rec:0,pid:x.id});n++});
 save();render();toast(n?plural(n,'peça adicionada','peças adicionadas'):'As peças com estoque baixo já estão no pedido')};
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
 ${L.map(i=>{const a=acha(i),os=i.os&&od(i.os);return`<div class="pdrr" data-i="${i.id}"><div class="pdrh">${(i.fotos||[])[0]?thumb(i.fotos[0],'pdtm'):''}<div><b>${e(i.nome)}</b><small>Pedido: ${e(falta(i))} ${e(i.un||'un')}${os?' · O.S. '+e(os.num):''}</small></div></div>
  <div class="g2 pdg"><label>Chegou<input name="q" inputmode="decimal" value="${e(falta(i))}"></label>${DONO()?`<label>Custo unitário (R$)<input name="custo" inputmode="decimal" placeholder="opcional"></label>`:'<span></span>'}</div>
  <label>Estoque<select name="dest" onchange="this.closest('.pdrr').querySelector('.pdnv').hidden=this.value!='novo'"><option value="novo" ${a?'':'selected'}>Cadastrar como peça nova no estoque</option>${P.map(x=>`<option value="${x.id}" ${x.id==a?'selected':''}>Somar em: ${e(x.nome)}${x.cod?' ('+e(x.cod)+')':''}</option>`).join('')}<option value="">Não lançar (vai direto para o carro)</option></select></label>
  <div class="pdnv" ${a?'hidden':''}><label>Preço de venda (R$)<input name="preco" inputmode="decimal" placeholder="opcional"></label></div></div>`}).join('')}
 <div class="bar" style="margin:10px 0 0"><button type="button" onclick="closeM()">Cancelar</button><span class="sp"></span><button class="pr">Confirmar o que chegou</button></div></form>`)};
G.pdRecOk=function(id){const p=ped(id),f=$q('#modal form.pdrc');if(!p||!f)return;let ne=0,nn=0;const osAg=new Set(),obs='Pedido '+p.n+(p.forn?' · '+p.forn:'');
 for(const r of f.querySelectorAll('.pdrr')){const i=p.itens.find(x=>x.id==r.dataset.i);if(!i)continue;const val=n=>{const x=r.querySelector(`[name=${n}]`);return x&&x.value.trim()?nBR(x.value):0};
  const q=Math.min(val('q'),falta(i));if(!(q>0))continue;i.rec=(+i.rec||0)+q;const dest=r.querySelector('[name=dest]').value,custo=DONO()?val('custo'):0;
  if(dest){let pr;if(dest=='novo'){pr={id:uid(),nome:i.nome,cod:i.cod||'',cat:'',un:i.un||'un',preco:val('preco')||0,min:0,fotos:(i.fotos||[]).slice(),...(DONO()?{custo:custo||0}:{})};PR().push(pr);nn++}
   else{pr=prod(dest);if(!pr.id)continue;if(!(pr.fotos||[]).length&&(i.fotos||[]).length)pr.fotos=i.fotos.slice(0,4);if(custo>0)pr.custo=custo}
   i.pid=pr.id;MV().push({id:uid(),pid:pr.id,tipo:'E',q,data:today(),obs});ne++}
  const o=i.os&&od(i.os);if(o&&o.status=='Aguardando peças')osAg.add(o.id)}
 const tudo=!p.itens.some(falta);p.status=tudo?'Recebido':'Parcial';if(tudo)p.rec=today();save();closeM();render();
 toast(`${tudo?'Pedido recebido':'Recebimento parcial'}${ne?' · '+plural(ne,'peça lançada','peças lançadas')+' no estoque':''}${nn?' ('+plural(nn,'nova','novas')+')':''}`);
 if(osAg.size)setTimeout(()=>sheet('Peças chegaram',`<p style="margin:0 0 10px">Estas O.S. estavam <b>aguardando peças</b>:</p>${[...osAg].map(oid=>{const o=od(oid);return`<div class="pf pdos"><div><b>O.S. ${e(o.num)}</b><small>${e(vlabel(vh(o.veh)))} · ${e(cl(o.cli).nome||'')}</small></div><button type="button" class="sm pr" onclick="pdOsAnda('${o.id}',this)">Voltar ao serviço</button></div>`}).join('')}<div class="bar" style="margin:12px 0 0"><span class="sp"></span><button type="button" onclick="closeM()">Fechar</button></div>`),600)};
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
.pdfs{display:grid;grid-template-columns:repeat(2,64px);gap:4px;flex:none}.pdfs img:first-child:last-child{width:96px;height:96px}
.pdsf{flex:none;width:72px;height:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:1.5px dashed var(--ln);border-radius:8px;color:var(--mut);background:transparent;font-size:11px;padding:0}.pdsf svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9}
.pdtx{min-width:0;flex:1}.pdtx b{display:block;font-size:16px;overflow-wrap:anywhere}.pdtx small{display:block;color:var(--mut);margin-top:2px;overflow-wrap:anywhere}.pdtx small b{display:inline;font-size:inherit;color:var(--ink)}
.pdtg{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.pdadd{width:100%;padding:13px;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 0 8px}.pdadd svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}
.pdfa{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px;min-height:20px}.pdfv{font-size:13px}
.pdfx{position:relative;display:inline-block}.pdfx img{width:84px;height:84px;object-fit:cover;border-radius:8px;display:block}
.pdfx button{position:absolute;top:-6px;right:-6px;width:26px;height:26px;padding:0;border-radius:50%;font-size:16px;line-height:1;background:var(--ink);color:var(--bg);border:0}
.pdgal{display:flex;gap:10px;flex-wrap:wrap}.pdgal .pdfx img{width:96px;height:96px;cursor:zoom-in}
.g2.pdg{grid-template-columns:1fr 1fr;gap:0 10px}.pdsug{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 12px}.pdsug small{width:100%}
.pdrr{border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:10px}.pdrh{display:flex;gap:10px;align-items:center;margin-bottom:8px}.pdrh small{display:block;color:var(--mut)}
.pdos{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--ln)}.pdos div{flex:1}.pdos small{display:block;color:var(--mut)}
`;document.head.appendChild(st);
if(typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);
})(window);
