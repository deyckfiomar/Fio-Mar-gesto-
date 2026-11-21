/* Fio-Mar Gestor — rapidez e produtividade (versão 2.23.0)
   1. Receber: um toque no cartão da O.S., com valor e forma de pagamento em botões.
   2. Arrastar o cartão (lista do pátio) para a esquerda avança a situação.
   3. Serviços favoritos: os mais usados, um toque para lançar no orçamento ou na O.S.
   4. Painel curto: quadros em uma faixa; fechamento do dia; clientes para chamar de volta.
   5. Abas da O.S. em uma linha.
   10. Mensagens prontas de WhatsApp (textos editáveis).
   11. Lembrete de retorno ao entregar o carro.
   12. Fechamento do dia.
   13. Tela "A receber".
   14. Horário da oficina na agenda.
   15. Desconto junto do total, em R$ ou %. */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const sheet=(tit,body)=>{$('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)},addM=(s,n)=>{const d=new Date(s+'T12:00');d.setMonth(d.getMonth()+n);return ymd(d)};
const diasDe=d=>d?Math.max(0,Math.round((new Date(today()+'T12:00')-new Date(String(d).slice(0,10)+'T12:00'))/864e5)):0;
const resto=o=>Math.max(0,oTot(o)-paid(o));
const nome1=c=>String(c&&c.nome||'').trim().split(/\s+/)[0]||'';
const copia=t=>{try{navigator.clipboard.writeText(t).then(()=>toast('Copiado'),()=>toast('Não consegui copiar'))}catch(x){toast('Não consegui copiar')}};

/* =============== 1) Receber =============== */
let RC=null;const FPR=['PIX','Dinheiro','Débito','Crédito','Parcelado','Transferência'];
/* ---- taxa da maquininha (2.27.0): a O.S. fica paga com o valor cheio; a taxa vira despesa "Taxa de cartão" no dia do pagamento ---- */
const TXC={deb:'txDeb',cred:'txCred',p6:'txP6',p12:'txP12'},TXN={deb:'Débito',cred:'Crédito à vista',p6:'Crédito parcelado 2x a 6x',p12:'Crédito parcelado 7x a 12x'};
G.ehCartao=f=>/^(Débito|Crédito|Parcelado|Cartão)$/.test(f||'');
G.txKey=(f,parc)=>{parc=parseInt(parc)||1;if(f=='Débito')return'deb';if(f=='Crédito'||f=='Cartão')return parc>1?(parc<=6?'p6':'p12'):'cred';if(f=='Parcelado')return parc<=6?'p6':'p12';return''};
G.txPct=k=>{const v=(db.cfg||{})[TXC[k]];return v==null||v===''||isNaN(+v)?null:+v};
const r2=v=>Math.round(v*100)/100,pctS=v=>String(+(+v).toFixed(2)).replace('.',',');
const temParc=f=>f=='Crédito'||f=='Parcelado';
G.recebe=function(id,pre){const o=od(id||S.id);if(!o||!o.id)return;const rest=resto(o);if(rest<=0.005)return toast('A O.S. '+o.num+' já está paga');
 let fm=(pre&&pre.forma)||'PIX';if(fm=='Cartão')fm='Crédito';RC={id:o.id,forma:fm,txEd:0};const c=cl(o.cli),v=pre&&pre.valor!=null?+pre.valor:rest,pc=(pre&&pre.parc)||(fm=='Parcelado'?2:1);
 sheet('Receber · O.S. '+e(o.num),`<form id="rcf" onsubmit="event.preventDefault();recebeOk()" oninput="recebeTx()">
 <p class="muted" style="margin:-4px 0 10px">${e(c.nome||'Sem cliente')}${o.veh?' · '+e(vlabel(vh(o.veh))):''} · falta <b style="color:var(--ink)">${R(rest)}</b></p>
 <label>Valor recebido (R$)<input name="valor" inputmode="decimal" data-num="1" autocomplete="off" value="${nShow(v)}"></label>
 <div class="rcq">${rest>0?`<button type="button" class="agc" onclick="recebeV(${rest})">Tudo · ${R(rest)}</button><button type="button" class="agc" onclick="recebeV(${Math.round(rest*50)/100})">Metade · ${R(Math.round(rest*50)/100)}</button>`:''}</div>
 <div class="lb">Forma de pagamento<div class="rcfp">${FPR.map(f=>`<button type="button" class="rcf${RC.forma==f?' on':''}" data-f="${f}" aria-pressed="${RC.forma==f}" onclick="recebeF('${f}')">${f=='PIX'?'Pix':f}</button>`).join('')}</div></div>
 <input type="hidden" name="forma" value="${RC.forma}">
 <label id="rcparc" ${temParc(RC.forma)?'':'hidden'}>Parcelas<input name="parc" inputmode="numeric" value="${pc}"></label>
 <div id="rctx" class="rctx" ${ehCartao(RC.forma)?'':'hidden'}><label><span id="rctxl">Taxa da maquininha</span><input name="txp" autocomplete="off" oninput="recebeTxEd()"></label><div id="rctxr" class="rctxr"></div></div>
 <label>Data<input type="date" name="data" data-cru="1" value="${(pre&&pre.data)||today()}" max="${today()}"></label>
 <div class="bar" style="margin:12px 0 0"><button class="pr">Registrar pagamento</button>${typeof pixCobra=='function'?`<button type="button" onclick="closeM();pixCobra('${o.id}')">Cobrar com Pix</button>`:''}</div></form>`);recebeTx(1)};
G.recebeTxEd=()=>{if(RC)RC.txEd=1};
/* mostra a taxa e quanto a oficina recebe de verdade */
G.recebeTx=function(troca){const f=$q('#rcf');if(!f||!RC)return;const fm=f.forma.value,cart=ehCartao(fm),box=$q('#rctx');if(box)box.hidden=!cart;if(!cart)return;
 const k=txKey(fm,f.parc.value),cfg=txPct(k);if(troca||!RC.txEd){f.txp.value=cfg!=null?pctS(cfg):'';RC.txEd=0}
 $q('#rctxl').textContent='Taxa da maquininha · '+TXN[k];
 const v=nBR(f.valor.value)||0,p=nBR(f.txp.value),t=isFinite(p)&&p>0?r2(v*p/100):0,r=$q('#rctxr');
 r.innerHTML=!f.txp.value.trim()&&cfg==null?`<span class="muted">Sem taxa guardada para ${TXN[k].toLowerCase()}. Digite a % da sua maquininha: ela fica guardada para as próximas vezes.</span>`
  :p>=30?'<span style="color:var(--rd,#B4472E)">Taxa muito alta. Confira a %.</span>'
  :`Taxa <b>− ${R(t)}</b> · você recebe <b class="rctxv">${R(v-t)}</b>${cfg!=null&&RC.txEd&&Math.abs(p-cfg)>0.001?`<br><small class="muted">Só neste pagamento. A taxa guardada é ${pctS(cfg)}%.</small>`:''}`};
G.recebeV=v=>{const i=$q('#rcf [name=valor]');if(i){i.value=nShow(v);i.dispatchEvent(new Event('input',{bubbles:true}))}};
G.recebeF=f=>{if(!RC)return;const ant=RC.forma;RC.forma=f;document.querySelectorAll('.rcf').forEach(b=>{const on=b.dataset.f==f;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});$q('#rcf [name=forma]').value=f;$q('#rcparc').hidden=!temParc(f);
 const pc=$q('#rcf [name=parc]');if(f=='Parcelado'&&(parseInt(pc.value)||1)<2)pc.value=2;if(f=='Crédito'&&ant=='Parcelado')pc.value=1;recebeTx(1)};
G.recebeOk=function(){const f=$q('#rcf'),o=RC&&od(RC.id);if(!f||!o)return;const v=nBR(f.valor.value)||0,rest=oTot(o)-paid(o);
 if(!(v>0))return toast('Informe um valor maior que zero');if(v>rest+0.005)return toast('Valor maior que o restante da O.S. ('+R(Math.max(0,rest))+')');
 const fm=f.forma.value,parc=Math.max(1,parseInt(f.parc.value)||1),pg={id:uid(),forma:fm=='Crédito'&&parc>1?'Parcelado':fm,valor:r2(v),parc:String(temParc(fm)?parc:1),data:f.data.value||today()};let msg='';
 if(ehCartao(fm)){const p=nBR(f.txp.value);if(f.txp.value.trim()&&!(isFinite(p)&&p>=0&&p<30))return toast('Taxa inválida. Digite a % da maquininha, por exemplo 3,19');
  if(p>0){pg.txp=+p.toFixed(2);pg.taxa=r2(v*p/100);const k=txKey(fm,parc);if(txPct(k)==null){db.cfg=db.cfg||{};db.cfg[TXC[k]]=pg.txp;msg=' · taxa de '+pctS(pg.txp)+'% guardada'}}}
 o.pags.push(pg);save();closeM();render(1);
 const fal=resto(o);toast('Recebido '+R(v)+(pg.taxa?' (fica '+R(v-pg.taxa)+')':'')+' da O.S. '+o.num+(fal>0.005?' · falta '+R(fal):' · O.S. paga')+msg)};
/* configurar as taxas (Configurações) */
G.editTaxas=function(){const T={};Object.keys(TXC).forEach(k=>{const v=txPct(k);T[TXC[k]]=v==null?'':pctS(v)});
 modal('Taxas da maquininha',[['txDeb','Débito (%)'],['txCred','Crédito à vista (%)'],['txP6','Crédito parcelado 2x a 6x (%)'],['txP12','Crédito parcelado 7x a 12x (%)']],T,o=>{
  const N={};for(const k of Object.keys(TXC)){const c=TXC[k],x=String(o[c]==null?'':o[c]).replace('%','').trim();if(!x){N[c]='';continue}const v=nBR(x);if(!(isFinite(v)&&v>=0&&v<30)){toast('Taxa inválida em '+TXN[k]);return}N[c]=+v.toFixed(2)}
  db.cfg=db.cfg||{};Object.assign(db.cfg,N);save();render();toast('Taxas guardadas')})};
G.addPag=addPag=function(pre){recebe(S.id,pre)};

/* =============== 2) Arrastar o cartão para avançar a situação =============== */
const PROX={Aberta:'Em andamento','Em andamento':'Concluída','Aguardando peças':'Em andamento','Concluída':'Entregue'};
let SW=null,SWBLOCK=0;
document.addEventListener('touchstart',ev=>{const c=ev.target.closest&&ev.target.closest('.lc[data-o],.plst .kc[data-o]');if(!c||ev.touches.length!=1||ev.target.closest('button,a,input,select'))return;
 const o=od(c.dataset.o),nx=o&&PROX[o.status];if(!nx)return;SW={c,id:o.id,nx,x:ev.touches[0].clientX,y:ev.touches[0].clientY,on:false,dx:0}},{passive:true});
document.addEventListener('touchmove',ev=>{if(!SW)return;const dx=ev.touches[0].clientX-SW.x,dy=ev.touches[0].clientY-SW.y;
 if(!SW.on){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){SW=null;return}if(dx<-14&&Math.abs(dx)>Math.abs(dy)*1.5){SW.on=true;SW.c.classList.add('swon');SW.c.dataset.sw='→ '+SW.nx}else return}
 SW.dx=Math.min(0,dx);SW.c.style.transform=`translateX(${Math.max(-150,SW.dx)}px)`;SW.c.classList.toggle('swgo',SW.dx<-90)},{passive:true});
const swFim=()=>{if(!SW)return;const s=SW;SW=null;if(!s.on)return;s.c.style.transform='';s.c.classList.remove('swon','swgo');delete s.c.dataset.sw;SWBLOCK=Date.now();
 if(s.dx<-90&&typeof stMuda=='function'){stMuda(s.id,s.nx);if(['Concluída','Entregue'].includes(s.nx))toast('O.S. '+od(s.id).num+': '+s.nx)}};
document.addEventListener('touchend',swFim);document.addEventListener('touchcancel',swFim);
document.addEventListener('click',ev=>{if(Date.now()-SWBLOCK<350&&ev.target.closest&&ev.target.closest('.lc[data-o],.plst .kc[data-o]')){ev.stopPropagation();ev.preventDefault()}},true);

/* =============== 3) Serviços favoritos =============== */
let FAV=[],FAVK='';
function favs(){const k=db.orders.length+'|'+db.quotes.length+'|'+(db.orders.length?db.orders[db.orders.length-1].items.length:0);if(k==FAVK)return FAV;FAVK=k;const M=new Map();
 const put=(i,dt)=>{const d=String(i.d||'').trim();if(!d||i.t=='Peça'||!(+i.v>0))return;const key=nrm(d),x=M.get(key)||{d,t:i.t||'Serviço',v:+i.v,n:0,dt:''};x.n++;if(dt>=x.dt){x.dt=dt;x.v=+i.v;x.d=d;x.t=i.t||'Serviço'}M.set(key,x)};
 db.orders.forEach(o=>(o.items||[]).forEach(i=>put(i,o.aberta||'')));db.quotes.forEach(q=>(q.items||[]).forEach(i=>put(i,q.data||'')));
 return FAV=[...M.values()].filter(x=>x.n>=2).sort((a,b)=>b.n-a.n).slice(0,6)}
G.favHTML=function(alvo){const F=favs(),w=alvo=='q'?S.q:od(S.id);if(!F.length||!w)return'';const tem=new Set((w.items||[]).map(i=>nrm(i.d||'')));
 return`<div class="favs"><small>Mais usados · um toque lança</small><div class="favl">${F.map((x,i)=>`<button type="button" class="fav${tem.has(nrm(x.d))?' ja':''}" onclick="favAdd('${alvo}',${i})"><b>${e(x.d)}</b><span>${R(x.v)}</span></button>`).join('')}</div></div>`};
G.favAdd=function(alvo,i){const x=favs()[i],w=alvo=='q'?S.q:od(S.id);if(!x||!w)return;w.items=w.items||[];const ja=w.items.find(it=>nrm(it.d||'')==nrm(x.d)&&+it.v==x.v);
 if(ja)ja.q=(+ja.q||0)+1;else w.items.push({t:x.t,d:x.d,q:1,v:x.v,iid:uid()});if(alvo!='q')save();render();toast(ja?x.d+': '+ja.q+'x':'Lançado: '+x.d+' · '+R(x.v))};

/* =============== 15) Desconto junto do total, em R$ ou % =============== */
const subQ=q=>(q.items||[]).reduce((a,i)=>a+(+i.q||0)*(+i.v||0),0);
function qAjusta(q){if(q&&+q.descp>0)q.desc=Math.round(subQ(q)*Math.min(100,+q.descp))/100}
G.qTotais=function(q){qAjusta(q);const sub=subQ(q),pc=+q.descp>0,d=+q.desc||0;
 return`<div class="qtt"><div class="qtl"><span>Subtotal</span><b>${R(sub)}</b></div>
 <div class="qtl qtd"><span>Desconto</span><span class="qtdi"><input type="text" inputmode="decimal" autocomplete="off" data-cru="1" aria-label="Desconto" value="${pc?nShow(q.descp):(d?nShow(d):'')}" placeholder="0" onchange="qDesc(this.value)"><span class="seg qtm" role="group"><button type="button" class="${pc?'':'on'}" aria-pressed="${!pc}" onclick="qDescM(0)">R$</button><button type="button" class="${pc?'on':''}" aria-pressed="${pc}" onclick="qDescM(1)">%</button></span></span></div>
 ${d>0?`<div class="qtl"><span class="muted">${pc?nShow(q.descp)+'% de desconto':'Desconto'}</span><b style="color:#B4472E">${R(-d)}</b></div>`:''}
 <div class="qtl qtf"><span>Total</span><b class="tot" id="qt">${R(sum(q.items,q.desc))}</b></div></div>`};
G.qDesc=function(v){const q=S.q;if(!q)return;const n=String(v).trim()===''?0:Math.max(0,nBR(v)||0);
 if(+q.descp>0||q.descPct){q.descp=Math.min(100,n);q.descPct=1;qAjusta(q);if(!q.descp)q.desc=0}else{q.descp=0;qs('desc',v)}render()};
G.qDescM=function(pct){const q=S.q;if(!q)return;const sub=subQ(q),d=+q.desc||0;
 if(pct){q.descPct=1;q.descp=sub>0&&d>0?Math.round(d/sub*1000)/10:0;qAjusta(q)}else{q.descPct=0;q.descp=0}render()};

/* =============== 10) Mensagens prontas de WhatsApp =============== */
const MSG0=[['pronto','Carro pronto','Olá, {nome}! Seu {carro} está pronto para retirada.\n\nFuncionamos das {abre} às {fecha}.\n\n{oficina}'],
 ['orc','Orçamento enviado','Olá, {nome}! Enviei o orçamento do seu {carro}. Fico no aguardo da sua aprovação para começar o serviço.\n\n{oficina}'],
 ['cobra','Lembrar pagamento','Olá, {nome}! Tudo bem? Passando para lembrar do valor de {valor} referente ao serviço do seu {carro} (O.S. {os}). Posso mandar a chave Pix?\n\n{oficina}'],
 ['peca','Aguardando peça','Olá, {nome}! O serviço do seu {carro} está aguardando a chegada da peça. Assim que chegar eu aviso e sigo com o reparo.\n\n{oficina}'],
 ['ret','Lembrete de retorno','Olá, {nome}! Já faz um tempo desde o último serviço no seu {carro}. Está na hora de {motivo}. Quer agendar um horário?\n\n{oficina}'],
 ['obg','Agradecimento','Olá, {nome}! Obrigado pela confiança. Qualquer coisa com o {carro}, é só chamar.\n\n{oficina}']];
const msgTxt=k=>{const m=(db.cfg&&db.cfg.msgs)||{};return m[k]!=null&&String(m[k]).trim()?m[k]:MSG0.find(x=>x[0]==k)[2]};
function msgMonta(k,c,o,extra){const v=o&&o.veh?vh(o.veh):(extra&&extra.veh?vh(extra.veh):null)||db.vehicles.find(x=>x.cli==c.id)||{},H=typeof agHor=='function'?agHor():{i:8,f:17};
 const M={nome:nome1(c)||'tudo bem',carro:v.modelo||'carro',valor:o?R(resto(o)):'',os:o?o.num:'',oficina:empNome(),abre:pad(H.i)+':00',fecha:pad(H.f)+':00',motivo:(extra&&extra.motivo)||'fazer a revisão'};
 return msgTxt(k).replace(/\{(\w+)\}/g,(a,x)=>M[x]!=null?M[x]:a).replace(/ \(O\.S\. \)/,'')}
G.msgs=function(cli,osId,extra){const c=cl(cli),o=osId?od(osId):null;if(!c.id)return toast('Escolha o cliente');G.MSGX={cli,osId,extra};
 sheet('Mensagens prontas',`<p class="muted" style="margin:-4px 0 10px">Para ${e(c.nome||'')}${c.tel?'':' · <b style="color:var(--hi)">sem telefone: você escolhe o contato no WhatsApp</b>'}</p>
 ${MSG0.filter(([k])=>k!='cobra'||(o&&resto(o)>0.005)).map(([k,t])=>`<button type="button" class="msgr" onclick="msgVai('${k}')"><span><b>${t}</b><small>${e(msgMonta(k,c,o,extra).split('\n')[0])}</small></span><i class="wa">Enviar</i></button>`).join('')}
 ${DONO()?`<div class="bar" style="margin:10px 0 0"><button type="button" class="sm" onclick="msgsEdit()">Editar os textos</button></div>`:''}`)};
G.msgVai=function(k){const X=G.MSGX;if(!X)return;const c=cl(X.cli),o=X.osId?od(X.osId):null;wa(c.tel,msgMonta(k,c,o,X.extra));if(k=='pronto'&&o&&!o.avisado){o.avisado=today();save()}closeM();render(1)};
G.msgsEdit=function(){sheet('Textos das mensagens',`<p class="muted" style="margin:-4px 0 10px;font-size:13px">Use {nome}, {carro}, {valor}, {os}, {motivo} e {oficina}: o app troca pelo dado certo na hora de enviar.</p>
 <form id="msgf" onsubmit="event.preventDefault();msgsSalva()">${MSG0.map(([k,t])=>`<label>${t}<textarea name="${k}" rows="4">${e(msgTxt(k))}</textarea></label>`).join('')}
 <div class="bar" style="margin:10px 0 0"><button class="pr">Salvar textos</button><button type="button" onclick="if(confirm('Voltar todos os textos para o padrão?')){db.cfg.msgs={};save();msgsEdit()}">Voltar ao padrão</button></div></form>`)};
G.msgsSalva=function(){const f=$q('#msgf');if(!f)return;db.cfg=db.cfg||{};const m={};MSG0.forEach(([k,,d])=>{const v=f[k].value.trim();if(v&&v!=d)m[k]=v});db.cfg.msgs=m;save();closeM();toast('Textos salvos')};

/* =============== 11) Lembrete de retorno =============== */
const RT=()=>db.rets=Array.isArray(db.rets)?db.rets:[];
function retPergunta(o){if(!o||!o.cli||RT().some(r=>r.os==o.id))return;
 sheet('Chamar o cliente de volta?',`<p style="margin:-4px 0 10px">${e(cl(o.cli).nome||'Cliente')}${o.veh?' · '+e(vlabel(vh(o.veh))):''}</p>
 <label>Para quê?<input id="rtm" value="Revisão e troca de óleo" autocomplete="off"></label>
 <div class="lb">Lembrar em<div class="rcfp">${[[3,'3 meses'],[6,'6 meses'],[12,'1 ano']].map(([n,t])=>`<button type="button" class="rcf" onclick="retCria('${o.id}',${n})">${t}</button>`).join('')}</div></div>
 <div class="bar" style="margin:12px 0 0"><button type="button" onclick="closeM()">Agora não</button></div>
 <p class="muted" style="font-size:13px;margin:10px 0 0">Na data, o cliente aparece no Painel em "Chamar de volta", com a mensagem pronta.</p>`)}
G.retCria=function(osId,meses){const o=od(osId);if(!o)return;const m=($q('#rtm')||{}).value||'Revisão';RT().push({id:uid(),cli:o.cli,veh:o.veh||'',os:o.id,motivo:String(m).trim()||'Revisão',data:addM(today(),meses),criado:today()});save();closeM();render(1);toast('Lembrete criado para '+D(addM(today(),meses)))};
G.retFeito=function(id,adia){const r=RT().find(x=>x.id==id);if(!r)return;if(adia){r.data=addD(today(),adia)}else r.feito=today();save();render()};
G.retMsg=function(id){const r=RT().find(x=>x.id==id);if(!r)return;const c=cl(r.cli);wa(c.tel,msgMonta('ret',c,null,{veh:r.veh,motivo:String(r.motivo||'fazer a revisão').replace(/^./,x=>x.toLowerCase())}));r.avisado=today();save();render()};
G.retDash=function(){const lim=addD(today(),7),L=RT().filter(r=>!r.feito&&r.data<=lim&&cl(r.cli).id).sort((a,b)=>a.data.localeCompare(b.data));if(!L.length)return'';
 return sech('Chamar de volta',plural(L.length,'cliente','clientes'))+L.slice(0,5).map(r=>{const c=cl(r.cli),v=r.veh?vh(r.veh):{};return lcard({c:'#8E5BD0',n:r.data<=today()?'Hoje':D(r.data),pill:r.avisado?mb('Avisado '+D(r.avisado).slice(0,5),KG):'',t:e(c.nome||''),m:`${e(v.modelo?vlabel(v):'')}${v.modelo?' · ':''}${e(r.motivo)}`,
  f:`<button class="sm wa" onclick="retMsg('${r.id}')">Chamar no WhatsApp</button><button class="sm" onclick="retFeito('${r.id}')">Feito</button><button class="sm" onclick="retFeito('${r.id}',30)">Adiar 30 dias</button>`})}).join('')};
const _setSt2=setSt;G.setSt=setSt=function(v){const o=od(S.id),antes=o&&o.status;_setSt2(v);if(o&&v=='Entregue'&&antes!='Entregue')setTimeout(()=>{if(!$q('#modal .ov'))retPergunta(o)},700)};

/* =============== 12) Fechamento do dia (2.35.0: navegar entre dias, conferir o caixa e fechar o dia) =============== */
const FCH=()=>db.fechs=Array.isArray(db.fechs)?db.fechs:[];/* fica na linha do dono (PRIVK) */
const fchDe=d=>FCH().find(x=>x.d==d);
const ymdL=s=>{if(!s)return'';const t=new Date(s);if(isNaN(t))return String(s).slice(0,10);return t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate())};
const fmF=f=>f=='PIX'?'Pix':f;
function fechaDados(d){const pg=[],porF={};let rec=0,tx=0,din=0;db.orders.forEach(o=>(o.pags||[]).forEach(p=>{if(p.data==d){const v=+p.valor||0;rec+=v;tx+=+p.taxa||0;const f=p.forma||'Outros';porF[f]=(porF[f]||0)+v;if(/dinheiro/i.test(f))din+=v;pg.push({o,p})}}));
 let r7=0,n7=0;for(let i=1;i<=7;i++){const dd=addD(d,-i);let s=0;db.orders.forEach(o=>(o.pags||[]).forEach(p=>{if(p.data==dd)s+=+p.valor||0}));if(s>0){r7+=s;n7++}}
 const conc=db.orders.filter(o=>osFim(o)&&String(o.conc||'').slice(0,10)==d),fat=conc.reduce((a,o)=>a+oTot(o),0),arec=conc.reduce((a,o)=>a+resto(o),0),
  entr=db.orders.filter(o=>o.status=='Entregue'&&ymdL(o.stAt)==d),pat=db.orders.filter(o=>!osFim(o)),prontos=db.orders.filter(o=>o.status=='Concluída'),
  dsp=(db.desp||[]).filter(x=>x.rec!='1'&&x.data==d),tdsp=dsp.reduce((a,x)=>a+(+x.valor||0),0),ents=db.orders.filter(o=>o.aberta==d),
  amL=AG().filter(a=>a.data==addD(d,1)&&a.status!='Cancelado').sort((a,b)=>String(a.hora).localeCompare(String(b.hora))),
  pecas=(db.peds||[]).filter(p=>p.status=='Enviado');
 return{rec,tx,din,porF,pg,conc,fat,arec,entr,pat,prontos,dsp,tdsp,ents,ent:ents.length,amL,am:amL.length,pecas,med:n7?r7/n7:0,
  liq:DONO()&&typeof finDiaDados=='function'?((finDiaDados(d)||{}).liq):null}}
const fchVeh=o=>{const v=vh(o.veh),c=cl(o.cli);return[vlabel(v),c.nome].filter(Boolean).join(' · ')};
const fchAg=a=>[a.hora,(cl(a.cli)||{}).nome,a.veh?vlabel(vh(a.veh)):'',a.svc].filter(Boolean).join(' · ');
const fchPat=X=>{const g={};X.pat.forEach(o=>g[o.status]=(g[o.status]||0)+1);return Object.entries(g).map(([s,n])=>n+' '+s.toLowerCase()).join(', ')};
function fechaTxt(d){const X=fechaDados(d),F=fchDe(d),L=[`*Fechamento do dia ${D(d)}* · ${empNome()}`,'',`*Recebido: ${R(X.rec)}*`];
 Object.entries(X.porF).sort((a,b)=>b[1]-a[1]).forEach(([f,v])=>L.push(`• ${fmF(f)}: ${R(v)}`));
 if(X.tx>0)L.push(`Taxas de cartão: − ${R(X.tx)} (ficou ${R(X.rec-X.tx)})`);
 if(X.liq!=null)L.push(`*Lucro do dia: ${R(X.liq)}*`);
 if(F&&F.contado!=null)L.push('',`Caixa: deveria ter ${R(F.esperado)}, contei ${R(F.contado)} → ${Math.abs(F.dif)<0.005?'bateu ✓':(F.dif>0?'sobrou ':'faltou ')+R(Math.abs(F.dif))}`);
 if(F&&F.obs)L.push(`Obs.: ${F.obs}`);
 L.push('',`Carros que entraram: ${X.ent}`,`O.S. concluídas: ${X.conc.length} (${R(X.fat)})`);if(X.entr.length)L.push(`Carros entregues: ${X.entr.length}`);if(X.arec>0.005)L.push(`Ficou a receber de hoje: ${R(X.arec)}`);
 if(X.tdsp>0)L.push(`Despesas do dia: ${R(X.tdsp)}`);
 L.push('',`*Para amanhã*`,`Carros no pátio: ${X.pat.length}${X.pat.length?' ('+fchPat(X)+')':''}`);
 if(X.prontos.length)L.push(`Prontos para entregar: ${X.prontos.length}`);if(X.pecas.length)L.push(`Peças a chegar: ${plural(X.pecas.length,'pedido','pedidos')}`);
 if(X.am){L.push(`Agenda de amanhã: ${plural(X.am,'horário','horários')}`);X.amL.slice(0,10).forEach(a=>L.push('• '+fchAg(a)))}
 return L.join('\n')}
G.fechaDia=function(d){d=d||today();const hj=today(),X=fechaDados(d),F=fchDe(d),ln=(a,b,c)=>`<div class="fcl"><span>${a}</span><b${c?` style="color:${c}"`:''}>${b}</b></div>`;G.FCD=d;
 const dt=(x=>x.charAt(0).toUpperCase()+x.slice(1))(new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})),eh=d==hj,
  cmp=X.med>0&&X.rec>0?(()=>{const p=Math.round((X.rec/X.med-1)*100);return`<small class="fccmp" style="color:${p>=0?'#2E8B57':'#C98200'}">${p>=0?'▲':'▼'} ${Math.abs(p)}% ${p>=0?'acima':'abaixo'} da média dos últimos dias (${R(X.med)})</small>`})():'';
 const fundo=F&&F.fundo!=null?F.fundo:(+((db.cfg||{}).fundoCx)||0),cont=F&&F.contado!=null?F.contado:'';
 const caixa=DONO()?`<details class="fcd fcx"${F?'':' open'}><summary>Conferir o dinheiro da gaveta</summary>
  <label class="fcin"><span>Troco do começo do dia</span><input id="fcfun" inputmode="decimal" value="${fundo?String(fundo).replace('.',','):''}" placeholder="0,00" oninput="fcCalc()"></label>
  ${ln('Recebido em dinheiro',R(X.din))}<div class="fcl"><span><b>Deveria ter na gaveta</b></span><b id="fcesp">${R(fundo+X.din)}</b></div>
  <label class="fcin"><span>Quanto tem na gaveta (contei)</span><input id="fccon" inputmode="decimal" value="${cont!==''?String(cont).replace('.',','):''}" placeholder="0,00" oninput="fcCalc()"></label>
  <div id="fcres" class="fcres"></div>
  <label class="fcin fcobs"><span>Observação (opcional)</span><input id="fcobs" value="${e((F&&F.obs)||'')}" placeholder="Ex.: paguei o motoboy com dinheiro da gaveta"></label></details>`:'';
 const recL=X.pg.length?`<details class="fcd"><summary>Ver os ${plural(X.pg.length,'pagamento','pagamentos')}</summary>${X.pg.map(({o,p})=>`<button type="button" class="fcpg" onclick="closeM();go('order','${o.id}','pag')"><span>O.S. ${e(o.num)} · ${e((cl(o.cli)||{}).nome||'')}<small>${e(fmF(p.forma||''))}</small></span><b>${R(+p.valor||0)}</b></button>`).join('')}</details>`:'';
 const mov=`<details class="fcd"><summary>Movimento do dia</summary>${ln('Carros que entraram',X.ent)}${X.ents.map(o=>`<small class="fcp">${e(fchVeh(o))}</small>`).join('')}
  ${ln('O.S. concluídas',X.conc.length+' · '+R(X.fat))}${X.conc.map(o=>`<small class="fcp">O.S. ${e(o.num)} · ${e(fchVeh(o))}</small>`).join('')}
  ${X.entr.length?ln('Carros entregues',X.entr.length):''}${X.tdsp>0?ln('Despesas do dia',R(X.tdsp),'#B4472E')+X.dsp.map(x=>`<small class="fcp">${e(x.desc||x.cat||'')} · ${R(+x.valor||0)}</small>`).join(''):''}</details>`;
 const am=`<details class="fcd"${eh?' open':''}><summary>Para amanhã</summary>${ln('Carros no pátio',X.pat.length)}${X.pat.length?`<small class="fcp">${e(fchPat(X))}</small>`:''}
  ${X.prontos.length?ln('Prontos para entregar',X.prontos.length,'#2E8B57')+X.prontos.slice(0,8).map(o=>`<small class="fcp">${e(fchVeh(o))}${resto(o)>0.005?' · falta receber '+R(resto(o)):''}</small>`).join(''):''}
  ${X.pecas.length?ln('Peças a chegar',plural(X.pecas.length,'pedido','pedidos'),'#C98200')+X.pecas.slice(0,6).map(p=>`<small class="fcp">${e(p.forn||'Fornecedor')} · ${plural((p.itens||[]).length,'item','itens')}</small>`).join(''):''}
  ${ln('Agenda de amanhã',X.am?plural(X.am,'horário','horários'):'livre')}${X.amL.slice(0,10).map(a=>`<small class="fcp">${e(fchAg(a))}</small>`).join('')}</details>`;
 sheet('Fechamento do dia',`<div class="fcnav"><button type="button" aria-label="Dia anterior" onclick="fechaDia('${addD(d,-1)}')">‹</button><span>${eh?'Hoje, '+dt.charAt(0).toLowerCase()+dt.slice(1):dt}</span><button type="button" aria-label="Próximo dia" ${eh?'disabled':''} onclick="fechaDia('${addD(d,1)}')">›</button></div>
 ${F?`<div class="fcok">✓ Dia fechado às ${e(F.hora||'')}${F.contado!=null?' · caixa '+(Math.abs(F.dif)<0.005?'bateu':(F.dif>0?'sobrou ':'faltou ')+R(Math.abs(F.dif))):''}</div>`:''}
 <div class="fcb"><div class="fct"><small>Recebido${eh?' hoje':''}</small><b>${R(X.rec)}</b>${cmp}</div>${Object.entries(X.porF).sort((a,b)=>b[1]-a[1]).map(([f,v])=>ln(fmF(f),R(v))).join('')||'<small class="muted">Nenhum pagamento neste dia.</small>'}${X.tx>0?ln('Taxas de cartão','− '+R(X.tx),'#B4472E')+ln('Ficou para a oficina',R(X.rec-X.tx),'#2E8B57'):''}
  ${X.liq!=null?ln('Lucro do dia',R(X.liq),X.liq<0?'#B4472E':'#2E8B57'):''}${X.arec>0.005?ln('Ficou a receber deste dia',R(X.arec),'#C98200'):''}${recL}</div>
 ${caixa}${mov}${am}
 <div class="fcbt">${DONO()?`<button type="button" class="pr" onclick="fechaSalva('${d}')">${F?'Atualizar o fechamento':'Fechar o dia'}</button>`:''}
  <div class="bar"><button type="button" class="wa" onclick="fechaManda()">Mandar no meu WhatsApp</button><button type="button" onclick="fechaCopia()">Copiar</button>${X.arec>0.005&&V.receber?`<button type="button" onclick="closeM();go('receber')">Ver a receber</button>`:''}</div></div>`);
 fcCalc()};
const nV=v=>{v=String(v==null?'':v).trim().replace(/\s/g,'');if(!v)return null;if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');const n=+v;return isFinite(n)?n:NaN};
G.fcCalc=function(){const fi=$q('#fcfun'),ci=$q('#fccon'),out=$q('#fcres');if(!fi||!out)return;const X=fechaDados(G.FCD||today()),f=nV(fi.value)||0,esp=f+X.din,c=nV(ci.value);$q('#fcesp').textContent=R(esp);
 if(c==null||isNaN(c)){out.className='fcres';out.textContent=c==null?'Conte o dinheiro e digite acima.':'Valor inválido';return}
 const dif=c-esp;out.className='fcres '+(Math.abs(dif)<0.005?'ok':dif>0?'mais':'menos');out.textContent=Math.abs(dif)<0.005?'✓ Bateu certinho':(dif>0?'Sobrou ':'Faltou ')+R(Math.abs(dif))};
G.fechaSalva=function(d){const X=fechaDados(d),fi=$q('#fcfun'),ci=$q('#fccon'),ob=$q('#fcobs'),f=fi?nV(fi.value)||0:0,c=ci?nV(ci.value):null;if(c!=null&&isNaN(c))return toast('Confira o valor contado na gaveta');
 const t=new Date(),reg={id:d,d,hora:pad(t.getHours())+':'+pad(t.getMinutes()),fundo:f,esperado:f+X.din,contado:c,dif:c==null?null:c-(f+X.din),obs:(ob&&ob.value||'').trim(),rec:X.rec,liq:X.liq};
 const L=FCH(),i=L.findIndex(x=>x.d==d);if(i>=0)L[i]=reg;else L.push(reg);db.fechs=L.sort((a,b)=>a.d<b.d?-1:1).slice(-400);db.cfg=db.cfg||{};if(d==today())db.cfg.fundoCx=f;
 save();toast(reg.dif==null||Math.abs(reg.dif)<0.005?'Dia fechado':'Dia fechado · caixa '+(reg.dif>0?'sobrou ':'faltou ')+R(Math.abs(reg.dif)));fechaDia(d);render()};
G.fechaTxtG=()=>fechaTxt(G.FCD||today());G.fechaCopia=()=>copia(fechaTxt(G.FCD||today()));G.fechaManda=()=>wa((db.cfg||{}).tel1||'',fechaTxt(G.FCD||today()));
G.dashExtra=function(){if(!DONO())return'';const h=new Date().getHours(),F=fchDe(today());return`<div class="bar dshx"><button type="button" class="sm${!F&&h>=17?' pr':''}${F?' fcfeito':''}" onclick="fechaDia()">${svgi('fin')} ${F?'Dia fechado ✓':'Fechamento do dia'}</button></div>`};

/* =============== 13) A receber =============== */
function Vreceber(){const L=db.orders.filter(o=>resto(o)>0.005).sort((a,b)=>(osFim(b)-osFim(a))||String(a.conc||a.aberta||'').localeCompare(String(b.conc||b.aberta||''))),F=L.filter(osFim),A=L.filter(o=>!osFim(o)),
  tot=F.reduce((a,o)=>a+resto(o),0),tota=A.reduce((a,o)=>a+resto(o),0),velho=F.filter(o=>diasDe(o.conc)>=7).length;
 const card=o=>{const c=cl(o.cli),n=diasDe(o.conc||o.aberta),fim=osFim(o);return lcard({c:fim?(n>=7?KR:KA):KB,n:'O.S. '+e(o.num),pill:fim?mb(n?'pronta há '+plural(n,'dia','dias'):'pronta hoje',n>=7?KR:KA):pill(o.status),v:R(resto(o)),t:e(c.nome||'Sem cliente'),
  m:`${e(vlabel(vh(o.veh)))}${paid(o)>0?' · já pagou '+R(paid(o))+' de '+R(oTot(o)):''}`,f:`<button class="sm pr" onclick="event.stopPropagation();recebe('${o.id}')">Receber</button>${typeof pixCobra=='function'?`<button class="sm" onclick="event.stopPropagation();pixCobra('${o.id}')">Cobrar com Pix</button>`:''}${fim?`<button class="sm wa" onclick="event.stopPropagation();cobraMsg('${o.id}')">Lembrar</button>`:''}`,on:`go('order','${o.id}','pag')`})};
 return head({back:"go('dash')",kick:'Financeiro',title:'A receber',c:KA,sub:hsub(plural(F.length,'serviço pronto','serviços prontos'),velho?velho+' há mais de 7 dias':'nenhum atrasado','Total',R(tot))})+
 (F.length?sech('Serviço pronto, falta receber',R(tot))+F.map(card).join(''):empty('ospag','Nenhum serviço pronto esperando pagamento.'))+
 (A.length?sech('Ainda em serviço',R(tota))+`<p class="muted" style="margin:-4px 0 8px;font-size:13px">O carro ainda está na oficina. Entram aqui para você receber um sinal.</p>`+A.map(card).join(''):'')}
G.cobraMsg=function(id){const o=od(id);if(!o)return;const c=cl(o.cli);wa(c.tel,msgMonta('cobra',c,o));o.cobrado=today();save()};
try{V.receber=Vreceber}catch(x){}

/* =============== 14) Horário da oficina + seções das Configurações =============== */
G.editHorario=function(){const H=typeof agHor=='function'?agHor():{i:8,f:17,sab:12,dom:0},hs=(a,b)=>{const L=[];for(let h=a;h<=b;h++)L.push(pad(h)+':00');return L},n=v=>v=='Fechado'?0:parseInt(v);
 modal('Horário da oficina',[['i','Abre às','select',hs(5,12)],['f','Fecha às (segunda a sexta)','select',hs(12,23)],['sab','Sábado até','select',['Fechado',...hs(10,20)]],['dom','Domingo até','select',['Fechado',...hs(10,20)]]],
  {i:pad(H.i)+':00',f:pad(H.f)+':00',sab:H.sab?pad(H.sab)+':00':'Fechado',dom:H.dom?pad(H.dom)+':00':'Fechado'},o=>{db.cfg=db.cfg||{};db.cfg.agIni=n(o.i);db.cfg.agFim=n(o.f);db.cfg.agSab=n(o.sab);db.cfg.agDom=n(o.dom);save();render()})};
G.cfgExtra=function(){if(typeof cfgSec!='function')return'';const H=typeof agHor=='function'?agHor():null;
 const TX=Object.keys(TXC).map(k=>[TXN[k],txPct(k)]);
 return(DONO()?cfgSec('tax','Taxas da maquininha',`<div class="card"><p style="margin:0 0 8px">${TX.map(([n,v])=>`${n}: <b>${v==null?'—':pctS(v)+'%'}</b>`).join('<br>')}</p><p class="muted" style="font-size:13px;margin:0 0 10px">No Receber, o cartão já desconta a taxa e mostra quanto fica para a oficina. A taxa entra nas Finanças como despesa “Taxa de cartão”.</p><button class="sm pr" style="margin:0" onclick="editTaxas()">Alterar taxas</button></div>`):'')+(H?cfgSec('hor','Horário da oficina',`<div class="card"><p style="margin:0 0 8px">Segunda a sexta: <b>${pad(H.i)}:00 às ${pad(H.f)}:00</b><br>Sábado: <b>${H.sab?'até '+pad(H.sab)+':00':'fechado'}</b> · Domingo: <b>${H.dom?'até '+pad(H.dom)+':00':'fechado'}</b></p><p class="muted" style="font-size:13px;margin:0 0 10px">A agenda só oferece horários livres dentro deste horário.</p>${DONO()?'<button class="sm pr" style="margin:0" onclick="editHorario()">Alterar horário</button>':''}</div>`):'')+
 cfgSec('msg','Mensagens do WhatsApp',`<div class="card"><p class="muted" style="font-size:13px;margin:0 0 10px">${MSG0.map(x=>x[1]).join(' · ')}. Aparecem no botão "Mensagens" da O.S. e do cliente.</p>${DONO()?'<button class="sm pr" style="margin:0" onclick="msgsEdit()">Editar os textos</button>':''}</div>`)};

/* =============== 5) abas da O.S. em uma linha: mantém a aba atual à vista =============== */
const _r=render;G.render=render=function(...a){const r=_r(...a);try{const t=document.getElementById('ostabs'),on=t&&t.querySelector('.ost.on');if(on&&t.scrollWidth>t.clientWidth)t.scrollLeft=Math.max(0,on.offsetLeft-t.offsetLeft-(t.clientWidth-on.offsetWidth)/2);
 const b=document.getElementById('bnav');document.documentElement.style.setProperty('--bnh',(b&&getComputedStyle(b).display!='none'?b.offsetHeight:0)+'px')}catch(x){}return r};

const st=document.createElement('style');st.textContent=`
body:has(.qbar) #vzfab{transform:translateY(-70px)}
/* painel curto */
.kts{display:flex!important;gap:8px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity;scrollbar-width:none}.kts::-webkit-scrollbar{display:none}
.kts .kt{flex:none;min-width:112px;max-width:160px;padding:8px 11px!important;scroll-snap-align:start}.kts .kt svg{display:none}.kts .kt .num{font-size:22px!important}.kts .kt .num.sm{font-size:19px!important}
/* 2.27.1: Painel com todos os números à vista (sem rolar de lado) */
.kts.kq,.kts.km{display:grid!important;overflow:visible;padding-bottom:0;gap:6px;margin-bottom:6px}
.kts.kq{grid-template-columns:repeat(var(--n,4),minmax(0,1fr))}.kts.km{grid-template-columns:repeat(auto-fit,minmax(0,1fr));margin-bottom:12px}
.kq .kt,.km .kt{min-width:0!important;max-width:none!important;border-top-width:3px}
.kq .kt{align-items:center;text-align:center;justify-content:flex-start;padding:9px 4px 10px!important;font-size:12px!important;line-height:1.15!important;gap:2px}
.kq .kt .num{font-size:26px!important;color:var(--ink)}.kq .kt.zero{opacity:.55}.kq .kt.zero .num{color:var(--mut)}
.km .kt{flex-direction:column-reverse!important;align-items:flex-start;padding:8px 12px 10px!important;font-size:12.5px!important}
.km .kt .num,.km .kt .num.sm{font-size:21px!important;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dshx{margin:2px 0 4px}.dshx button{margin:0}.dshx svg,.rcb svg{width:16px;height:16px;vertical-align:-3px;fill:none;stroke:currentColor;stroke-width:2}
/* abas da O.S. em uma linha */
#ostabs{display:flex!important;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}#ostabs::-webkit-scrollbar{display:none}
#ostabs .ost{flex:none;min-width:96px;padding:8px 10px}#ostabs .ost svg{width:18px;height:18px}
/* receber */
.rcb{background:color-mix(in srgb,#2E8B57 20%,transparent)!important;color:#3fb06f!important;border-color:color-mix(in srgb,#2E8B57 60%,transparent)!important}
.rcq{display:flex;gap:6px;flex-wrap:wrap;margin:-4px 0 12px}
.rcfp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px}
.rctx{margin:10px 0 2px;padding:10px 12px 12px;border:1px solid var(--ln);border-radius:12px;background:color-mix(in srgb,var(--hi) 6%,transparent)}.rctx label{margin:0}.rctxr{font-size:14px;margin-top:8px;line-height:1.45}.rctxv{color:#2E8B57;font-size:16px}
.rcf{margin:0;min-height:48px;border-radius:12px;font-weight:700;border:1px solid var(--ln);background:transparent;color:var(--ink)}.rcf.on{background:var(--hi);border-color:var(--hi);color:#1a1a1a}
/* arrastar */
.lc[data-o],.plst .kc[data-o]{touch-action:pan-y;transition:transform .18s}.lc.swon,.kc.swon{transition:none;position:relative}
.lc.swon::after,.kc.swon::after{content:attr(data-sw);position:absolute;left:100%;top:0;bottom:0;width:150px;display:flex;align-items:center;padding-left:12px;font-weight:700;color:var(--mut);white-space:nowrap}.lc.swgo::after,.kc.swgo::after{color:#2E8B57}
.swdica{display:block;margin:0 0 6px;font-size:12.5px}@media (hover:hover) and (pointer:fine){.swdica{display:none}}
/* favoritos */
.favs{margin:10px 0 0;padding-top:8px;border-top:1px dashed var(--ln)}.favs>small{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px}
.favl{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.favl::-webkit-scrollbar{display:none}
.fav{flex:none;max-width:190px;margin:0;padding:6px 11px;border-radius:10px;border:1px solid var(--ln);background:transparent;color:var(--ink);text-align:left;display:flex;flex-direction:column;gap:1px}
.fav b{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:168px}.fav span{font-size:12.5px;color:var(--hi);font-weight:700}.fav.ja{opacity:.55}
/* totais do orçamento */
.qtt{margin-top:12px;border-top:1px solid var(--ln);padding-top:8px;display:grid;gap:6px}.qtl{display:flex;align-items:center;justify-content:space-between;gap:10px}.qtl>span:first-child{color:var(--mut)}
.qtdi{display:flex;align-items:center;gap:6px}.qtdi input{width:96px;margin:0;text-align:right}.qtm{margin:0;flex:none}.qtm button{min-width:44px;padding:6px 8px}
.qtf{border-top:1px solid var(--ln);padding-top:8px}.qtf>span:first-child{color:var(--ink);font-weight:700}.qtf .tot{font-size:26px}
/* mensagens, fechamento */
.msgr{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 6px;padding:10px 12px;border:1px solid var(--ln);border-radius:12px;background:transparent;color:var(--ink);text-align:left}
.msgr span{flex:1;min-width:0}.msgr b{display:block}.msgr small{display:block;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.msgr i{flex:none;font-style:normal;font-weight:700;font-size:13px;padding:5px 10px;border-radius:99px;background:#1f8f4e;color:#fff}
.fcb{border:1px solid var(--ln);border-radius:12px;padding:10px 12px;margin:0 0 8px;display:grid;gap:5px}.fct small{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--mut)}.fct b{font:700 30px/1.1 'Barlow Condensed','Barlow',sans-serif;color:#3fb06f}
.fcl{display:flex;justify-content:space-between;gap:10px}.fcl span{color:var(--mut)}.fcp{display:block;color:var(--mut);padding-left:8px}
.fcnav{display:flex;align-items:center;gap:8px;margin:-4px 0 10px}.fcnav span{flex:1;text-align:center;color:var(--mut);font-size:14.5px}
.fcnav button{margin:0;min-width:48px;min-height:44px;font-size:24px;font-weight:700;padding:0}.fcnav button[disabled]{opacity:.3}
.fcok{border-radius:10px;padding:8px 12px;margin:0 0 8px;background:color-mix(in srgb,#2E8B57 16%,var(--sf));color:#3fb06f;font-weight:700;font-size:14px}
.fccmp{display:block;font-size:12.5px;font-weight:600;margin-top:2px}
.fcd{border:1px solid var(--ln);border-radius:12px;padding:0 12px;margin:0 0 8px}.fcd>summary{cursor:pointer;list-style:none;font-weight:700;padding:12px 0;display:flex;justify-content:space-between}.fcd>summary::-webkit-details-marker{display:none}
.fcd>summary::after{content:'›';transform:rotate(90deg);color:var(--mut);transition:transform .15s}.fcd[open]>summary::after{transform:rotate(-90deg)}.fcd[open]{padding-bottom:10px}.fcd .fcl{margin:4px 0}
.fcb .fcd{border:0;padding:0;margin:4px 0 0}.fcb .fcd>summary{padding:6px 0;font-weight:600;color:var(--hi);font-size:14px}
.fcpg{display:flex;justify-content:space-between;align-items:center;width:100%;margin:0 0 6px;min-height:46px;padding:6px 10px;text-align:left;border-radius:9px}.fcpg small{display:block;color:var(--mut);font-weight:500}
.fcin{display:block;margin:8px 0}.fcin span{display:block;font-size:13px;color:var(--mut);margin-bottom:4px}.fcin input{width:100%;margin:0;min-height:48px;font-size:18px;font-weight:700}.fcobs input{font-size:15px;font-weight:500}
.fcres{margin:6px 0 2px;padding:10px 12px;border-radius:10px;font-weight:800;font-size:16px;text-align:center;color:var(--mut);background:var(--sf)}.fcres.ok{color:#3fb06f;background:color-mix(in srgb,#2E8B57 16%,var(--sf))}.fcres.mais{color:#C98200;background:color-mix(in srgb,#C98200 16%,var(--sf))}.fcres.menos{color:#E07A5F;background:color-mix(in srgb,#E07A5F 16%,var(--sf))}
.fcbt{margin-top:12px}.fcbt>.pr{width:100%;min-height:54px;margin:0 0 8px;font-size:17px;font-weight:800}.fcbt .bar{margin:0}
.dshx .fcfeito{border-color:#2E8B57;color:#3fb06f}
`;document.head.appendChild(st);
})(window);
