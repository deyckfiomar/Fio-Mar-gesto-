/* Fio-Mar Gestor — dia a dia da oficina (versão 2.28.0)
   1. Finanças: resumo Hoje / Semana / Mês no topo.
   2. Desfazer: apagar e mudar a situação viram uma ação na hora, com "Desfazer" no aviso.
   3. O.S.: botão grande "Próximo passo" e o resto das ações no menu ⋯.
   4. Microfone: menor, some ao rolar para baixo e não cobre o fim das telas.
   5. Lista de O.S.: dias na oficina com cor.
   6. Painel: "Prontos para entregar" e agenda vazia numa linha.
   7. Meus carros (mecânico).
   8. Entrada do carro pela foto da placa.
   9. Modo TV do pátio.
  10. (2.29.0) Mecânicos da equipe ligados às O.S.
  11. (2.30.0) Agenda, pátio, O.S. e orçamento ligados.
  12. (2.31.0) Mais prático, rápido e menos poluído (17 sugestões). */
(function(G){
const $q=s=>document.querySelector(s),$=$q;
const sheet=(tit,body)=>{$('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};
const addD=(d,n)=>{const t=new Date(d+'T12:00');t.setDate(t.getDate()+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
const ndias=d=>{if(!d)return 0;return Math.max(0,Math.round((new Date(today()+'T12:00')-new Date(String(d).slice(0,10)+'T12:00'))/864e5))};
G.osDias=ndias;

/* ---------- 1) Finanças: Hoje | Semana | Mês ---------- */
G.finResumo=function(){if(typeof finDiaDados!='function')return'';const hj=today(),k=['hoje','sem','mes'].includes(S.f.fres)?S.f.fres:'hoje';
 const lista=k=='hoje'?[hj]:k=='sem'?Array.from({length:7},(_,i)=>addD(hj,i-6)):Array.from({length:+hj.slice(8,10)},(_,i)=>hj.slice(0,8)+String(i+1).padStart(2,'0'));
 let fat=0,cus=0,liq=0,tx=0,mov=0;lista.forEach(d=>{const x=finDiaDados(d);if(!x)return;fat+=x.fat;cus+=x.custo+x.dsp;liq+=x.liq;tx+=x.tx||0;if(x.mov)mov++});
 const cx=typeof finModo!='function'||finModo()=='caixa',arec=db.orders.reduce((s,o)=>s+Math.max(0,oTot(o)-paid(o)),0);
 const ab=[['hoje','Hoje'],['sem','7 dias'],['mes','Este mês']].map(([v,t])=>`<button type="button" class="${k==v?'on':''}" aria-pressed="${k==v}" onclick="S.f.fres='${v}';render(1)">${t}</button>`).join('');
 const nm=k=='hoje'?'hoje':k=='sem'?'nos últimos 7 dias':'neste mês';
 return`<div class="card fres"><div class="fresab" role="group" aria-label="Período">${ab}</div>
 <div class="fresg"><div><small>${cx?'Recebeu':'Faturou'}</small><b>${R(fat)}</b></div><div><small>Custos e despesas</small><b class="fneg">${cus>0.004?'− ':''}${R(cus)}</b></div></div>
 <div class="fresl ${liq<0?'neg':''}"><small>${liq<0?'Prejuízo':'Lucro'} ${nm}</small><b>${R(Math.abs(liq))}</b></div>
 <p class="fresx">${tx>0.004?`Inclui ${R(tx)} de taxas de cartão. `:''}${k!='hoje'&&mov?`Média de ${R(liq/Math.max(1,mov))} por dia trabalhado. `:''}<a href="#" onclick="go('${V.receber?'receber':'orders'}',0,0,${V.receber?'{}':"{st:'receber'}"});return false">A receber: <b>${R(arec)}</b> ›</a></p></div>`};

/* ---------- 2) Desfazer ---------- */
let UNDO=null,UNDOT=0;
const snap=()=>JSON.stringify(db);
G.desfazivel=function(fn,msg,depois){const antes=snap(),tn=typeof TOASTN=='number'?TOASTN:0,vw={v:S.v,id:S.id,tab:S.tab};let r;try{r=fn()}catch(x){throw x}
 if(snap()===antes)return r;/* nada mudou (ex.: bloqueado) */
 const tt=$q('#toast .ttx'),txt=msg||(typeof TOASTN=='number'&&TOASTN!=tn&&tt?tt.childNodes[0]&&tt.childNodes[0].textContent:'')||'Apagado';
 UNDO={s:antes,...vw,depois};mostraUndo(txt);return r};
/* 2.53: Desfazer de algo que não está no db (rascunho, janela com o que foi digitado) */
G.desfazCom=function(msg,fn){if(typeof fn!='function')return;UNDO={fn};mostraUndo(msg)};
function mostraUndo(txt){const o=$q('#toast');if(!o)return;if(typeof TOASTN=='number')TOASTN++;o.className='t-ok tundo';
 o.innerHTML=`<span class="tic">✓</span><span class="ttx">${e(txt)}</span><button type="button" class="tundob" onclick="desfaz()">Desfazer</button>`;o.style.display='flex';
 clearTimeout(typeof TOT!='undefined'?TOT:0);clearTimeout(UNDOT);UNDOT=setTimeout(()=>{if(o.classList.contains('tundo'))o.style.display='none';UNDO=null},7000)}
G.desfaz=function(){if(!UNDO)return;const u=UNDO;UNDO=null;clearTimeout(UNDOT);if(u.fn){u.fn();toast('Desfeito');return}const d=JSON.parse(u.s);
 Object.keys(db).forEach(k=>{if(!(k in d))delete db[k]});Object.assign(db,d);save();
 if(['order','quote','recibo'].includes(u.v)&&u.id){S.v=u.v;S.id=u.id;S.tab=u.tab}
 /* o orçamento aberto aponta para o objeto de antes: troca pelo restaurado */
 if(S.q&&S.q.id&&!S.q.novo){const q=(db.quotes||[]).find(x=>x.id==S.q.id);if(q)S.q=q}
 closeM&&closeM(1);render();if(typeof u.depois=='function')try{u.depois()}catch(x){}toast('Desfeito')};
/* "Toque de novo para confirmar" vira apagar na hora com Desfazer.
   Continua pedindo dois toques o que mexe fora dos dados da oficina (equipe, bloqueio, limpar tudo, estorno de nota).
   2.53: "Remover" colaborador entrou na lista (antes saía com um toque só e sem Desfazer). */
const SEMDESF=/recusarReq|removeColab|statusOf|limparSim|entDesfazer/;
if(typeof confirmDel=='function'){const _cd=confirmDel;G.confirmDel=confirmDel=function(b,fn){if(SEMDESF.test(String(fn)))return _cd(b,fn);return desfazivel(fn)}}
/* ---------- 2.53: remover sem perguntar, com Desfazer ---------- */
/* orçamento: item e foto (o orçamento pode ainda não estar no db, então devolve no mesmo lugar) */
G.qItemRm=function(n){const q=S.q;if(!q||!q.items||!q.items[n])return;const i=q.items.splice(n,1)[0];render();
 desfazCom('Item tirado: '+(i.d||'item'),()=>{if(S.q!==q){S.q=q;go('quote')}q.items.splice(Math.min(n,q.items.length),0,i);render()})};
G.qFotoRm=function(n){const q=S.q;if(!q||!q.fotos||!q.fotos[n])return;const f=q.fotos.splice(n,1)[0];render();
 desfazCom('Foto tirada do orçamento',()=>{if(S.q!==q){S.q=q;go('quote')}q.fotos.splice(Math.min(n,q.fotos.length),0,f);render()})};
/* O.S.: foto da vistoria e foto do laudo */
G.osFotoRm=function(n){const o=od(S.id);if(!o||!o.fotos||!o.fotos[n])return;desfazivel(()=>{o.fotos.splice(n,1);save();render()},'Foto removida')};
if(typeof lFotoDel=='function'){const _lf=lFotoDel;G.lFotoDel=lFotoDel=function(i){return desfazivel(()=>_lf(i),'Foto do laudo removida')}}
if(typeof rmOS=='function'){const _rm=rmOS;G.rmOS=rmOS=function(n){const o=od(S.id),i=o&&o.items[n];return desfazivel(()=>_rm(n),i?'Item removido: '+i.d:'Item removido')}}
if(typeof stMuda=='function'){const _sm=stMuda;G.stMuda=stMuda=function(id,v){const o=od(id),a=o&&o.status;if(!o||a==v)return _sm(id,v);return desfazivel(()=>_sm(id,v),'O.S. '+o.num+': '+a+' → '+v)}}

/* ---------- 3) O.S.: próximo passo + menu ⋯ ---------- */
function passo(o){const rest=oTot(o)-paid(o),c=cl(o.cli),id=o.id;
 if(o.status=='Aberta')return['Começar o serviço',`stMuda('${id}','Em andamento')`,'pr'];
 if(o.status=='Em andamento')return['Carro pronto',`stMuda('${id}','Concluída')`,'pr'];
 if(o.status=='Aguardando peças')return['Peça chegou: continuar',`stMuda('${id}','Em andamento')`,'pr'];
 if(o.status=='Concluída'){if(!o.avisado&&c.tel&&typeof avisaPronto=='function')return['Avisar que está pronto',`avisaPronto('${id}')`,'wa'];
  if(rest>0.005&&typeof recebe=='function')return['Receber '+R(rest),`recebe('${id}')`,'pr'];return['Entregar o carro',`stMuda('${id}','Entregue')`,'pr']}
 if(o.status=='Entregue'&&rest>0.005&&typeof recebe=='function')return['Receber '+R(rest),`recebe('${id}')`,'pr'];
 return null}
G.osTopo=function(o){const p=passo(o),c=cl(o.cli),rest=oTot(o)-paid(o),seg=o.status=='Concluída'&&rest>0.005&&p&&!/^Receber/.test(p[0])&&typeof recebe=='function';
 return`<div class="osh3 osnx">${p?`<button type="button" class="osgo ${p[2]}" onclick="${p[1]}">${e(p[0])}</button>`:`<span class="osok">✓ ${o.status=='Entregue'?'Entregue e pago':'Tudo certo'}</span>`}
 ${seg?`<button type="button" class="sm" onclick="recebe('${o.id}')">Receber</button>`:''}${c.tel?`<button type="button" class="sm wa osic" aria-label="WhatsApp" onclick="waOS()">WhatsApp</button>`:''}<button type="button" class="sm osic" aria-label="Mais ações" onclick="osMais('${o.id}')">⋯</button></div>`};
G.osMais=function(id){const o=od(id);if(!o)return;const rest=oTot(o)-paid(o),ob=typeof osOrcBtn=='function'?/onclick="([^"]+)">([^<]+)</.exec(osOrcBtn(o,1)):null,
  q=!ob&&(db.quotes.find(x=>x.os==o.id)||(o.qid&&db.quotes.find(x=>x.id==o.qid)));
 const A=[ob?[ob[2].replace(/&amp;/g,'&'),ob[1],'quotes']:q?['Orçamento Nº '+q.n,`editQuote('${q.id}')`,'quotes']:['',''],
  ['Mensagens prontas',typeof msgs=='function'?`msgs('${o.cli}','${o.id}')`:'','clients'],
  ['PDF da O.S.','genOS(od(S.id))','oslaudo'],
  ['Histórico do carro',o.veh&&V.veiculo?`go('veiculo','${o.veh}')`:'','vehicles'],
  [o.avisado?'Avisar de novo que está pronto':'Avisar que está pronto',['Concluída','Entregue'].includes(o.status)&&typeof avisaPronto=='function'?`avisaPronto('${o.id}')`:'','oscheck'],
  /* 2.32.0: Receber e Mudar a situação saíram daqui (já estão no topo da O.S. e na aba Pagamento) */].filter(a=>a[1]);
 sheet('O.S. '+e(o.num),`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${typeof svgi=='function'?svgi(ic):''}<span>${e(t)}</span></button>`).join('')}</div>
 ${DONO()?`<button type="button" class="dg osdel" onclick="closeM();desfazivel(()=>delOS(),'O.S. ${e(o.num)} excluída')">Excluir esta O.S.</button>`:''}`)};

/* ---------- 5) lista de O.S.: dias na oficina + filtros compactos ---------- */
const FIM=['Concluída','Entregue'];
G.osDiasMb=function(o){if(!o||FIM.includes(o.status)||!o.aberta)return'';const n=ndias(o.aberta);
 return mb(n==0?'entrou hoje':n==1?'1 dia':n+' dias',n<=2?KG:n<=5?KA:KR)};
G.ktiles=function(L,cur,key){return`<div class="kts kq ktf" style="--n:3" role="group">${L.map(([k,l,ic,sub,c])=>{const num=String(sub).replace(/\s*(O\.S\.|carros?|p\/ entregar)$/,'').trim(),z=/^(0|R\$ 0,00)$/.test(num)&&cur!=k;
 return`<button type="button" class="kt pft${cur==k?' on':''}${z?' zero':''}" style="--c:${c&&c!=KM?c:'#6B7280'}" aria-pressed="${cur==k}" onclick="setF('${key}','${k}')"><span class="num${num.length>5?' sm':''}">${num}</span><span>${l}</span></button>`}).join('')}</div>`};

/* ---------- 6) Painel: prontos para entregar ---------- */
G.prontosDash=function(){const P=db.orders.filter(o=>o.status=='Concluída').sort((a,b)=>(a.conc||'').localeCompare(b.conc||''));if(!P.length)return'';
 return sech('Prontos para entregar',plural(P.length,'carro','carros'))+`<div class="card prl">${P.map(o=>{const v=vh(o.veh),c=cl(o.cli),rest=oTot(o)-paid(o),n=ndias(o.conc);
  const bt=!o.avisado&&c.tel?`<button type="button" class="sm wa" onclick="event.stopPropagation();avisaPronto('${o.id}')">Avisar</button>`:rest>0.005&&typeof recebe=='function'?`<button type="button" class="sm pr" onclick="event.stopPropagation();recebe('${o.id}')">Receber</button>`:`<button type="button" class="sm pr" onclick="event.stopPropagation();stMuda('${o.id}','Entregue')">Entregar</button>`;
  return`<div class="prr" role="button" tabindex="0" onclick="go('order','${o.id}')"><div class="prt"><b>${typeof vtit=='function'?vtit(v):e(vlabel(v))}</b><small>${e(c.nome||'Sem cliente')} · ${rest>0.005?'falta '+R(rest):'pago'}${o.avisado?' · avisado':''}${n>=2?` · <span style="color:${n>=5?KR:KA}">pronto há ${n} dias</span>`:''}</small></div>${bt}</div>`}).join('')}</div>`};

/* ---------- 7) Meus carros (mecânico) ---------- */
const EUK='fm_eu',NR=x=>(typeof nrm=='function'?nrm(x):String(x==null?'':x).toLowerCase()).replace(/\s+/g,' ').trim();
/* 2.29.0: o mecânico que entra com a própria conta já é reconhecido pelo nome cadastrado na Equipe */
const contaNome=()=>{try{return(typeof DONO=='function'&&!DONO()&&typeof OFS!='undefined'&&OFS&&OFS.mnome)||''}catch(x){return''}};
const eu=()=>{const c=contaNome();if(c)return c;try{return localStorage.getItem(EUK)||''}catch(x){return''}};
G.mecIgual=(a,b)=>!!NR(a)&&NR(a)==NR(b);
G.meuNome=function(n){try{localStorage.setItem(EUK,n)}catch(x){}render(1)};
const eqNomes=()=>{const q=db.cfg&&Array.isArray(db.cfg.equipe)?db.cfg.equipe:[];return q.map(x=>String(x&&x.n||'').trim()).filter(Boolean)};
/* nomes para escolher o mecânico: primeiro a equipe (contas), depois os outros nomes já usados nas O.S. */
G.mecLista=function(){const E=eqNomes(),R=E.map(n=>({n,eq:1})),vis=new Set(E.map(NR));
 db.orders.forEach(o=>{const n=String(o.mec||'').trim(),k=NR(n);if(n&&!vis.has(k)){vis.add(k);R.push({n,eq:0})}});
 R.sort((a,b)=>(b.eq-a.eq)||a.n.localeCompare(b.n,'pt-BR'));return R};
const mecNomes=()=>mecLista().map(x=>x.n);
G.meusPega=function(id){const o=od(id),n=eu();if(!o||!n)return;desfazivel(()=>{o.mec=n;save();render(1)},'Carro '+vlabel(vh(o.veh))+' ficou com '+n)};
G.meusTroca=function(){const L=mecNomes();sheet('Quem é você?',`<p class="muted" style="margin:-4px 0 10px">Escolha o seu nome. Fica guardado neste celular.</p><div class="meusn">${L.map(n=>`<button type="button" class="${mecIgual(eu(),n)?'pr':''}" onclick="closeM();meuNome('${e(n).replace(/'/g,"\\'")}')">${e(n)}</button>`).join('')}</div>
 <form onsubmit="event.preventDefault();const v=this.n.value.trim();if(v){closeM();meuNome(v)}" style="margin-top:12px"><label>Outro nome<input name="n" autocomplete="off" placeholder="Seu nome como aparece na O.S."></label><button class="pr" style="width:100%">Usar este nome</button></form>`)};
function mcard(o,meu){const v=vh(o.veh),c=cl(o.cli),id=o.id,ni=o.items.length;
 const B={Aberta:[['Começar',`stMuda('${id}','Em andamento')`,'pr']],'Em andamento':[['Terminei',`stMuda('${id}','Concluída')`,'pr'],['Falta peça',`stMuda('${id}','Aguardando peças')`,'']],'Aguardando peças':[['Peça chegou',`stMuda('${id}','Em andamento')`,'pr']]}[o.status]||[];
 const bt=meu?B.map(([t,f,c])=>`<button type="button" class="${c}" onclick="event.stopPropagation();${f}">${t}</button>`).join(''):`<button type="button" class="pr" onclick="event.stopPropagation();meusPega('${id}')">Pegar este carro</button>`;
 return`<div class="card mcard" style="--c:${SC[o.status]||'#777'}" role="button" tabindex="0" onclick="go('order','${id}')"><div class="mc1">${typeof plc=='function'?plc(v):''}<b>${e(v.modelo||'Sem veículo')}</b><span class="sp"></span>${osDiasMb(o)}</div>
 <small class="mcs">${e(c.nome||'Sem cliente')} · O.S. ${e(o.num)} · ${pill(o.status)}</small>${o.problema?`<p class="mcp">${e(o.problema)}</p>`:''}<small class="mcs">${ni?plural(ni,'item','itens')+': '+o.items.slice(0,3).map(i=>e(i.d)).join(', ')+(ni>3?'…':''):'Sem serviços lançados'}</small>
 <div class="mcb">${bt}</div></div>`}
V.meus=function(){const n=eu(),A=db.orders.filter(o=>!FIM.includes(o.status)),M=n?A.filter(o=>mecIgual(o.mec,n)):[],L=A.filter(o=>!String(o.mec||'').trim());
 const ord=(a,b)=>(a.aberta||'').localeCompare(b.aberta||'');
 const cn=contaNome();
 return head({ico:'patio',kick:n?'Mecânico: '+e(n):'Mecânico',title:'Meus carros',c:'#2F6FB0',right:cn?'':`<button class="hb" onclick="meusTroca()">${n?'Trocar nome':'Quem é você?'}</button>`,acts:`<span class="vzhw"></span><button class="sm" onclick="go('patio')">${svgi('patio')} Ver o pátio</button>`})+
 (!n?`<div class="card" style="text-align:center"><p style="margin:0 0 10px">Escolha o seu nome para ver os carros que estão com você.</p><button class="pr" onclick="meusTroca()">Escolher meu nome</button></div>`:
 sech('Comigo',plural(M.length,'carro','carros'))+(M.sort(ord).map(o=>mcard(o,1)).join('')||`<p class="muted">Nenhum carro com ${e(n)} agora.${L.length?' Pegue um carro abaixo.':''}</p>`))+
 (L.length?sech('Sem mecânico',plural(L.length,'carro','carros'))+L.sort(ord).map(o=>mcard(o,0)).join(''):'')};
G.patioExtraBtns=()=>`<button class="sm" aria-label="Mais opções do pátio" onclick="patioMais()">⋯ Mais</button>`;
G.patioMais=function(){const A=[['Todas as O.S.',"go('orders',0,0,{st:''})",'orders'],['Meus carros (mecânico)',"go('meus')",'clients'],...(typeof tvAbre=='function'?[['Modo TV (tela cheia)','tvAbre()','dash']]:[])];
 sheet('Pátio',`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`)};
/* 2.28.5: menu ⋯ da Agenda (avisos no celular e serviços da agenda) */
G.agMais=function(){const A=[...(typeof agAvItem=='function'?agAvItem():[]),['Serviços da agenda ('+SV().length+')',"go('agsvc')",'agenda']];
 sheet('Agenda',`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`)};
/* mecânico (não dono): o app abre em "Meus carros" */
if(typeof render=='function'){const _rd=render;let ini='';G.render=render=function(){if(typeof SES!='undefined'&&SES&&typeof OF!='undefined'&&OF&&typeof PAPEL!='undefined'&&PAPEL&&typeof DONO=='function'){const k=OF+'|'+PAPEL;if(ini!=k){ini=k;if(!DONO()&&S.v=='dash')S.v='meus';if(DONO())setTimeout(()=>{typeof eqBusca=='function'&&eqBusca()},6000)}}return _rd.apply(this,arguments)}}

/* ---------- 8) entrada do carro pela foto da placa ---------- */
if(typeof checkin=='function'){const _ci=checkin;G.checkin=checkin=function(pre){const r=_ci.apply(this,arguments);
 const inp=$q('.pci input.fi[capture]'),lb=inp&&inp.closest('label');if(lb){lb.className='btn pr ciscan';lb.childNodes.forEach(n=>{if(n.nodeType==3)n.textContent=''});lb.insertAdjacentHTML('afterbegin','<span>📷 Tirar foto da placa</span>');
  const bar=lb.closest('.bar'),pl=$q('#cipl'),plb=pl&&pl.closest('label');if(bar&&plb){bar.classList.add('ciscanb');plb.parentNode.insertBefore(bar,plb);for(const n of plb.childNodes){if(n.nodeType==3&&/placa/i.test(n.textContent)){n.textContent='Ou digite a placa';break}}}}
 return r}}
if(typeof ciAch=='function'){const _ca=ciAch;G.ciAch=ciAch=function(){const r=_ca.apply(this,arguments);const f=$q('#cifnd .pfnd');
 if(f&&!f.querySelector('.ciagora')&&!/Já tem a O.S./.test(f.textContent))f.insertAdjacentHTML('beforeend',`<button type="button" class="pr ciagora" onclick="ciSalva()">Abrir O.S. agora</button><small class="muted" style="display:block;margin-top:6px">Km, combustível e problema dá para pôr depois, na O.S.</small>`);return r}}

/* ---------- 9) modo TV do pátio ---------- */
let TVI=0,TVW=null;
const TVC=[['Aberta','Chegaram'],['Em andamento','Em serviço'],['Aguardando peças','Falta peça'],['Concluída','Prontos']];
function tvDesenha(){const t=$q('#tv');if(!t)return;const now=new Date(),hj=today();
 const col=([st,tt])=>{const L=db.orders.filter(o=>o.status==st).sort((a,b)=>(a.aberta||'').localeCompare(b.aberta||''));
  return`<section style="--c:${SC[st]||'#777'}"><h2>${tt}<b>${L.length}</b></h2>${L.map(o=>{const v=vh(o.veh),n=ndias(st=='Concluída'?o.conc:o.aberta),al=st!='Concluída'&&n>=6||st=='Concluída'&&n>=3;
   const ft=typeof carroFoto=='function'?carroFoto(o):'';return`<div class="tvc${al?' al':''}${ft?' tvf':''}">${ft?`<img class="tvim" ${fimg(ft)} alt="">`:''}<div class="tvb"><div class="tv1">${v.placa?`<span class="tvp">${e(v.placa)}</span>`:''}<b>${e(v.modelo||'Sem veículo')}</b></div><small>${e(cl(o.cli).nome||'')}${o.mec?' · 🔧 '+e(o.mec):''}</small><i>${st=='Concluída'?(o.avisado?'avisado · ':'')+(n?'pronto há '+n+(n==1?' dia':' dias'):'pronto hoje'):(n?n+(n==1?' dia':' dias'):'entrou hoje')}</i></div></div>`}).join('')||'<p class="tvz">—</p>'}</section>`};
 const ag=(typeof AG=='function'?AG():[]).filter(a=>a.data==hj&&!['Cancelado','Concluído'].includes(a.status)).sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
 t.innerHTML=`<header><b>${e((db.cfg&&db.cfg.nome)||'Fio-Mar')} · Pátio</b><span>${now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</span><strong>${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</strong><button type="button" onclick="tvFecha()">Sair</button></header>
 <main>${TVC.map(col).join('')}</main>${ag.length?`<footer><b>Agenda de hoje:</b> ${ag.slice(0,6).map(a=>`<span>${e(a.hora||'')} ${e(cl(a.cli).nome||a.nome||'')}</span>`).join('')}</footer>`:''}`}
G.tvAbre=function(){if($q('#tv'))return;const t=document.createElement('div');t.id='tv';document.body.appendChild(t);document.body.classList.add('tvon');tvDesenha();
 try{t.requestFullscreen&&t.requestFullscreen().catch(()=>{})}catch(x){}
 try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(w=>TVW=w).catch(()=>{})}catch(x){}
 clearInterval(TVI);let k=0;TVI=setInterval(()=>{k++;if(k%4==0&&typeof pull=='function'&&navigator.onLine!==false)Promise.resolve(pull(1)).catch(()=>{}).then(tvDesenha);else tvDesenha()},15000)};
G.tvFecha=function(){clearInterval(TVI);const t=$q('#tv');if(t)t.remove();document.body.classList.remove('tvon');try{document.fullscreenElement&&document.exitFullscreen()}catch(x){}try{TVW&&TVW.release();TVW=null}catch(x){}};
addEventListener('keydown',ev=>{if(ev.key=='Escape'&&$q('#tv'))tvFecha()});

/* ---------- 10) 2.28.3: menos poluição ---------- */
/* filtros das listas no formato compacto (número grande + nome), igual ao Painel */
if(typeof ftiles=='function'){G.ftiles=ftiles=function(L,cur,key){const n=L.length,cols=n<=4?n:3;
 return`<div class="kts kq ktf" style="--n:${cols}" role="group">${L.map(([k,l,ic,sub,c])=>{const sb=String(sub==null?'':sub).replace(/<[^>]*>/g,'').trim(),m=/^(R\$\s?[\d.,]+|\d+)/.exec(sb),num=m?m[1]:'',resto=m?sb.slice(m[0].length).trim():sb,z=(num=='0'||/^R\$\s?0,00$/.test(num))&&cur!=k;
  return`<button type="button" class="kt pft${cur==k?' on':''}${z?' zero':''}" style="--c:${c&&c!=KM?c:'#6B7280'}" aria-pressed="${cur==k}" onclick="setF('${key}','${k}')">${num?`<span class="num${num.length>5?' sm':''}">${num}</span>`:''}<span>${l}${!num&&resto?`<small class="ktsub">${e(resto)}</small>`:''}</span></button>`}).join('')}</div>`}}
/* botão "+": sem repetir o que está em "Ir para" */
if(typeof maisAcoes=='function'){G.maisAcoes=maisAcoes=function(){const bk=['dash','agenda','fin','patio','plus','busca',...[...document.querySelectorAll('#bnav a[onclick]')].map(x=>(/go\('(\w+)'/.exec(x.getAttribute('onclick'))||[])[1]).filter(Boolean)],IR=NAVX().filter(([k])=>!bk.includes(k)&&k!='out').sort((a,b)=>(b[0]=='orders')-(a[0]=='orders'));
 const A=[['entrada','Entrada do carro','closeM();checkin()','big'],['quotes','Orçamento',"closeM();go('quotes');editQuote()"],['agenda','Agendar','closeM();editAg()'],['pedido','Pedido de peças','closeM();pdNovo()'],...(DONO()?[['fin','Despesa',"closeM();go('fin');editDesp()"]]:[])];
 sheet('O que você quer fazer?',`<small class="psec">Novo</small><div class="pgrid">${A.map(([i,l,f,c])=>`<button type="button" class="${c||''}${c?' pr':''}" onclick="${f}">${svgi(i)}<span>${l}</span></button>`).join('')}</div>
 <small class="psec">Ir para</small><div class="pgrid">${IR.map(([k,l])=>`<button type="button" onclick="closeM();${k=='inst'?'instalarApp()':`go('${k}')`}">${svgi(k)}<span>${e(l)}</span></button>`).join('')}</div>`)}}

/* microfone dentro da barra de baixo ("Falar"): não fica mais por cima de botões e valores */
function micNaBarra(){document.body.classList.remove('vznav');const w=$q('.vzhw');if(!w||w.firstChild||!(G.VZ&&VZ.botaoSegurar))return;
 const b=document.createElement('button');b.type='button';b.className='vzhb';b.setAttribute('aria-label','Assistente de voz: toque para abrir, segure para falar');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>Falar</span>';w.appendChild(b);VZ.botaoSegurar(b)}
G.micNaBarra=micNaBarra;
/* o microfone fica só no Painel, na linha do "Fechamento do dia" (para o mecânico, a linha só tem o microfone) */
{const _dx=G.dashExtra;G.dashExtra=function(){const h=typeof _dx=='function'?_dx():'';return h&&h.includes('class="bar dshx"')?h.replace('<div class="bar dshx">','<div class="bar dshx"><span class="vzhw"></span>'):'<div class="bar dshx"><span class="vzhw"></span></div>'}}
if(typeof render=='function'){const _r2=render;G.render=render=function(){const x=_r2.apply(this,arguments);try{requestAnimationFrame(micNaBarra)}catch(e){}return x}}
addEventListener('resize',()=>setTimeout(micNaBarra,60));addEventListener('orientationchange',()=>setTimeout(micNaBarra,300));setTimeout(micNaBarra,500);setTimeout(micNaBarra,1500);

/* ---------- 4) microfone ---------- */
let ULT=0,RAF=0;
addEventListener('scroll',()=>{if(RAF)return;RAF=requestAnimationFrame(()=>{RAF=0;const y=scrollY,m=$q('#vzfab');if(m&&!document.body.classList.contains('vznav')){const fim=innerHeight+y>=document.documentElement.scrollHeight-40;m.classList.toggle('vzesc',y>ULT+4&&y>120&&!fim)}if(Math.abs(y-ULT)>4)ULT=y})},{passive:true});

/* ---------- 10) 2.29.0: mecânicos da equipe ligados às O.S. ----------
   - O dono guarda os nomes da Equipe (só nomes, sem e-mail) em db.cfg.equipe; só o dono pode mudar o cfg.
   - O mecânico que entra com a conta dele cai direto nos carros dele (nome da conta = nome na O.S.).
   - Na Equipe, o dono vê os carros de cada um e junta nomes antigos das O.S. ao nome da conta ("Zé" → "José"). */
G.eqSync=function(L){if(typeof DONO!='function'||!DONO()||(typeof SEMDADOS!='undefined'&&SEMDADOS))return;
 const nv=(L||[]).map(x=>({n:String(x.nome||'').trim(),p:x.papel=='dono'?'dono':'colab'})).filter(x=>x.n).sort((a,b)=>a.n.localeCompare(b.n,'pt-BR'));
 const at=db.cfg&&Array.isArray(db.cfg.equipe)?db.cfg.equipe:[];if(JSON.stringify(at)==JSON.stringify(nv))return;
 db.cfg=db.cfg||{};db.cfg.equipe=nv;save()};
/* o dono busca a equipe uma vez por entrada, para os nomes ficarem em dia nos celulares dos mecânicos */
let eqK='';G.eqBusca=async function(){try{if(typeof SB=='undefined'||!SB||!OF||!DONO()||SEMDADOS||eqK==OF)return;if(typeof RS!='undefined'&&RS.s&&RS.s.v==null)return;eqK=OF;
 const{data,error}=await SB.from('oficina_membros').select('papel,nome').eq('oficina_id',OF);if(!error&&data)eqSync(data)}catch(x){}};
const abertasDe=n=>db.orders.filter(o=>!FIM.includes(o.status)&&mecIgual(o.mec,n));
G.eqExtra=function(L){const nomes=(L||[]).map(x=>String(x.nome||'').trim()).filter(Boolean);
 const semM=db.orders.filter(o=>!FIM.includes(o.status)&&!String(o.mec||'').trim()).length;
 const cont={},nom={};db.orders.forEach(o=>{const n=String(o.mec||'').trim(),k=NR(n);if(n&&!nomes.some(m=>mecIgual(m,n))){cont[k]=(cont[k]||0)+1;if(!nom[k])nom[k]=n}});
 const sol=Object.keys(cont).sort((a,b)=>cont[b]-cont[a]||nom[a].localeCompare(nom[b],'pt-BR'));
 const lin=nomes.map(n=>{const k=abertasDe(n).length;return`<div class="eqln"><b>${e(n)}</b><span class="sp"></span><span class="muted">${k?plural(k,'carro','carros')+' em serviço':'nenhum carro agora'}</span></div>`}).join('');
 return`<div class="card eqc"><b>Carros com cada um</b><p class="muted" style="margin:4px 0 8px;font-size:13px">O nome cadastrado aqui é o nome que aparece na O.S. Quem entra com a própria conta vê os seus carros em “Meus carros”.</p>${lin}${semM?`<div class="eqln"><b>Sem mecânico</b><span class="sp"></span><span class="muted">${plural(semM,'carro','carros')}</span></div>`:''}</div>`+
 (sol.length&&nomes.length?`<div class="card eqc"><b>Nomes nas O.S. que não são da equipe</b><p class="muted" style="margin:4px 0 8px;font-size:13px">Se for a mesma pessoa com outro nome, junte ao nome da conta. As O.S. passam a mostrar o nome da equipe.</p>`+
  sol.map(k=>`<div class="eqj"><div><b>${e(nom[k])}</b><small class="muted">${cont[k]} O.S.</small></div><select aria-label="Juntar ${e(nom[k])} a"><option value="">Quem é?</option>${nomes.map(m=>`<option value="${e(m)}">${e(m)}</option>`).join('')}</select><button type="button" class="sm pr" data-n="${e(nom[k])}" onclick="eqJunta(this.dataset.n,this.previousElementSibling.value)">Juntar</button></div>`).join('')+`</div>`:'')};
G.eqJunta=function(velho,novo){if(!novo)return toast('Escolha o nome da equipe');const O=db.orders.filter(o=>mecIgual(o.mec,velho));if(!O.length)return;
 desfazivel(()=>{O.forEach(o=>{o.mec=novo;if(o.laudo&&mecIgual(o.laudo.tec,velho))o.laudo.tec=novo});save();render(1)},(O.length==1?'1 O.S. passou':O.length+' O.S. passaram')+' para '+novo)};

/* ---------- 11) 2.30.0: agenda → pátio → O.S. → orçamento, todos ligados ----------
   - Confirmar o agendamento já abre a O.S. (entra no pátio) e o orçamento ligado a ela.
   - "Gerar O.S." na agenda também já cria o orçamento.
   - Concluir em qualquer lugar (agenda, pátio, O.S., Meus carros) conclui os outros.
   - Voltar a O.S. para "em serviço" desfaz a conclusão automática do agendamento e do orçamento.
   - Só acontece em ações feitas neste aparelho (nunca na sincronização), para não criar O.S. em dobro. */
const OSFIM=['Concluída','Entregue'],osOk=o=>o&&o.id?o:null;
const agsDaOS=o=>(typeof AG=='function'?AG():[]).filter(a=>a.os==o.id);
const qDaOS=o=>db.quotes.filter(q=>(q.os==o.id||q.id==o.qid)&&q.status!='Recusado').sort((a,b)=>(+b.n||0)-(+a.n||0))[0];
const qcp=i=>{const c=JSON.parse(JSON.stringify(i));delete c.baixa;return c};
function qDaOSCria(o){if(!o||!o.cli||qDaOS(o))return qDaOS(o)||null;o.items=o.items||[];o.items.forEach(i=>{if(!i.iid)i.iid=uid()});
 const q={id:uid(),n:db.qseq++,cli:o.cli,veh:o.veh||'',items:o.items.map(qcp),desc:+o.desc||0,prazo:'',obs:o.problema||'',status:'Rascunho',os:o.id,daos:o.id,osk:o.items.map(qKey),data:today(),fotos:[]};
 db.quotes.push(q);return q}
function osDoAgCria(a){let o=osOk(a.os&&od(a.os));if(o)return o;const sv=SV().find(s=>s.nome==a.svc);
 o={id:uid(),num:String(db.seq++).padStart(4,'0'),cli:a.cli,veh:a.veh||'',ag:a.id,problema:[a.svc,a.obs].filter(Boolean).join(' - '),mec:'',status:'Aberta',items:sv?[{iid:uid(),t:'Serviço',d:sv.nome,det:'',q:1,v:+sv.preco||0,...(sv.ctrib?{ctrib:sv.ctrib}:{})}]:[],desc:0,ck:{},laudo:{data:today()},fotos:[],pags:[],horas:'',pecas:'',aberta:today()};
 db.orders.push(o);a.os=o.id;return o}
/* o que acontece quando o agendamento muda de situação */
G.agLiga=function(a,st,forca){if(!a||!a.id)return;
 if(st=='Confirmado'&&!forca&&a.data>today()&&!osOk(a.os&&od(a.os))){save();render(1);toast('Confirmado. No dia '+D(a.data)+', o carro aparece no pátio com o botão “Chegou”.');return}
 if(st=='Confirmado'){const tinha=osOk(a.os&&od(a.os)),o=osDoAgCria(a),tq=qDaOS(o),q=qDaOSCria(o);save();render(1);
  toast(tinha&&tq?'Agendamento confirmado':'Confirmado: O.S. '+o.num+' no pátio'+(q?' e orçamento Nº '+q.n:'')+(a.veh?'':'. Coloque o veículo na O.S.'));return}
 if(st=='Concluído'){const o=osOk(a.os&&od(a.os));if(o&&!OSFIM.includes(o.status)){stMuda(o.id,'Concluída');toast('Agendamento e O.S. '+o.num+' concluídos')}}};
/* o que acontece quando a O.S. muda de situação (pátio, O.S., Meus carros, agenda) */
function osLiga(o,antes,v){let mud=0;const fimA=OSFIM.includes(antes),fimV=OSFIM.includes(v);
 if(fimV&&!fimA){agsDaOS(o).forEach(a=>{if(!['Concluído','Cancelado'].includes(a.status)){a.status='Concluído';a.lig=1;mud=1}});
  const q=qDaOS(o);if(q&&q.status!='Aprovado'){q.items=(o.items||[]).map(qcp);q.desc=+o.desc||0;q.osk=(o.items||[]).map(qKey);q.status='Aprovado';q.aprov={nome:'Concluído junto com a O.S. '+o.num,data:today()};q.lig=1;mud=1}}
 if(fimA&&!fimV){agsDaOS(o).forEach(a=>{if(a.lig&&a.status=='Concluído'){a.status='Confirmado';delete a.lig;mud=1}});
  db.quotes.forEach(q=>{if(q.lig&&(q.os==o.id||q.id==o.qid)&&q.status=='Aprovado'){q.status='Rascunho';delete q.aprov;delete q.lig;mud=1}})}
 if(mud){save();render(1)}}
if(typeof setSt=='function'){const _ss=setSt;G.setSt=setSt=function(v){const o=od(S.id),antes=o&&o.status;const r=_ss.apply(this,arguments);if(o&&o.id&&antes!=v)osLiga(o,antes,v);return r}}
if(typeof setAg=='function'){const _sa=setAg;G.setAg=setAg=function(id,st){const a=ag(id);if(!a||!a.id||a.status==st||!['Confirmado','Concluído'].includes(st))return _sa(id,st);
 return desfazivel(()=>{_sa(id,st);agLiga(a,st)})}}
if(typeof agOS=='function'){const _ao=agOS;G.agOS=agOS=function(id){const a=ag(id),tinha=a&&a.os&&od(a.os);const r=_ao.apply(this,arguments);
 const o=a&&!tinha&&osOk(a.os&&od(a.os));if(o){o.ag=a.id;if(!['Confirmado','Concluído','Cancelado'].includes(a.status))a.status='Confirmado';const q=qDaOSCria(o);save();render(1);if(q)toast('O.S. '+o.num+' aberta, com o orçamento Nº '+q.n)}return r}}
/* na O.S.: atalhos para o agendamento e o orçamento ligados */
const SEMN=['dom','seg','ter','qua','qui','sex','sáb'];
if(typeof G.osTopo=='function'){const _ot=G.osTopo;G.osTopo=function(o){const h=_ot.apply(this,arguments);if(!o||!o.id)return h;
 const A=agsDaOS(o),q=qDaOS(o);if(!A.length&&!q)return h;
 const ch=A.map(a=>{const d=new Date((a.data||today())+'T12:00');return`<button type="button" class="oslg" onclick="editAg('${a.id}')">${svgi('agenda')}<span>Agenda ${SEMN[d.getDay()]} ${String(a.data||'').slice(8,10)}/${String(a.data||'').slice(5,7)} ${e(a.hora||'')}<small>${e(a.status)}</small></span></button>`}).join('')+
  (q?`<button type="button" class="oslg" onclick="osOrc('${o.id}')">${svgi('quotes')}<span>Orçamento Nº ${e(q.n)}<small>${e(q.status)}</small></span></button>`:'');
 return h+`<div class="oslgs" aria-label="Ligado a esta O.S.">${ch}</div>`}}
/* salvar o agendamento pelo formulário com "Confirmado" ou "Concluído" faz o mesmo que os botões */
if(typeof editAg=='function'){const _ea=editAg;G.editAg=editAg=function(id){const antes=id?ag(id).status:null,n0=AG().length;const r=_ea.apply(this,arguments);const f=$q('#modal form');
 if(f&&!f.dataset.liga){f.dataset.liga=1;f.addEventListener('submit',()=>setTimeout(()=>{const a=id?ag(id):(AG().length>n0?AG()[AG().length-1]:null);
  if(a&&a.id&&a.status!=antes&&['Confirmado','Concluído'].includes(a.status))desfazivel(()=>agLiga(a,a.status))},0))}return r}}

/* ---------- 12) 2.31.0: mais prático, rápido e menos poluído ---------- */
/* 17) "Chegou": agendamentos de hoje sem O.S. aparecem no topo do pátio */
const chegam=()=>(typeof AG=='function'?aOrd(AG()):[]).filter(a=>a.data==today()&&['Agendado','Confirmado'].includes(a.status)&&!osOk(a.os&&od(a.os)));
G.agChegou=function(id){const a=ag(id);if(!a||!a.id)return;desfazivel(()=>{a.status='Confirmado';agLiga(a,'Confirmado',1)})};
function chegamHTML(){const L=chegam();if(!L.length)return'';
 return`<div class="card chg"><b>${svgi('agenda')} Chegam hoje <i>${L.length}</i></b>${L.map(a=>{const v=a.veh?vh(a.veh):{},c=cl(a.cli);return`<div class="chgl"><span class="chgh">${e(a.hora||'')}</span><span class="chgt"><b>${e(v.modelo||'Sem veículo')}${v.placa?' · '+e(v.placa):''}</b><small>${e(c.nome||'')}${a.svc?' · '+e(a.svc):''}</small></span><button type="button" class="sm pr" onclick="agChegou('${a.id}')">Chegou</button></div>`}).join('')}</div>`}
if(typeof V!='undefined'&&V.patio){const _vp=V.patio;V.patio=function(){const h=_vp.apply(this,arguments),c=chegamHTML();if(!c)return h;const k='<div class="pfl"',i=h.indexOf(k);return i<0?c+h:h.slice(0,i)+c+h.slice(i)}}
/* 5) mecânicos no ⋯ Mais do pátio */
G.patioMais=function(){const P=db.orders.filter(o=>['Aberta','Em andamento','Aguardando peças','Concluída'].includes(o.status)),M=[...new Set(P.map(o=>String(o.mec||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 const A=[['Todas as O.S.',"go('orders',0,0,{st:''})",'orders'],['Meus carros (mecânico)',"go('meus')",'clients'],...(typeof tvAbre=='function'?[['Modo TV (tela cheia)','tvAbre()','dash']]:[])];
 sheet('Pátio',`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`+
  (M.length?`<small class="psec">Ver só os carros de</small><div class="osml">${M.map(n=>`<button type="button" data-m="${e(n)}" onclick="closeM();go('patio');patioM(this.dataset.m)">${svgi('stwr')}<span>${e(n)} <small class="muted">${P.filter(o=>mecIgual(o.mec,n)).length}</small></span></button>`).join('')}</div>`:''))};
/* 11) cada lista lembra o último filtro (enquanto o app está aberto) */
const MF={},LV=['patio','orders','agenda','quotes','clients','vehicles','stock','fin','notas','entradas','peds'];
{const _g=go;G.go=go=function(v,id,tab,f,...r){try{if(LV.includes(S.v))MF[S.v]=JSON.parse(JSON.stringify(S.f||{}));if(f==null&&LV.includes(v)&&MF[v])f=JSON.parse(JSON.stringify(MF[v]))}catch(x){}return _g(v,id,tab,f,...r)}}
/* 9) busca: placa completa leva direto à O.S. aberta (ou à entrada do carro); Enter abre */
if(typeof buscaR=='function'){const _br=buscaR;G.buscaR=buscaR=function(v){const r=_br.apply(this,arguments),box=$q('#pbr'),qp=normPl(v);if(!box||qp.length<7)return r;
 const ve=db.vehicles.find(x=>normPl(x.placa)==qp),OV=ve?db.orders.filter(x=>x.veh==ve.id&&x.status!='Entregue').reverse():[],o=OV.find(x=>x.status!='Concluída')||OV[0];
 const b=o?`<button type="button" class="pr pbtop" onclick="closeM();go('order','${o.id}')"><span><b>Abrir O.S. ${e(o.num)}</b><small>${e(vlabel(ve))} · ${e(o.status)}</small></span></button>`:`<button type="button" class="pr pbtop" onclick="closeM();checkin({placa:'${e(qp)}'})"><span><b>Entrada do carro</b><small>${ve?e(vlabel(ve))+' · sem O.S. aberta':'Placa '+e(qp)+' · carro novo'}</small></span></button>`;
 box.insertAdjacentHTML('afterbegin',b);return r}}
if(typeof buscaG=='function'){const _bg=buscaG;G.buscaG=buscaG=function(){const r=_bg.apply(this,arguments),i=$q('#pbq');if(i)i.addEventListener('keydown',ev=>{if(ev.key=='Enter'){const b=$q('#pbr .pbtop')||$q('#pbr button');if(b){ev.preventDefault();b.click()}}});return r}}
/* 12) receber: já vem com o que falta e a forma usada na última vez */
const UFK='fm_ultforma';
const ultForma=()=>{let f='';try{f=localStorage.getItem(UFK)||''}catch(x){}if(f)return f;let best=null;db.orders.forEach(o=>(o.pags||[]).forEach(p=>{if(p.forma&&(!best||String(p.data||'')>=String(best.data||'')))best=p}));return best?best.forma:''};
if(typeof recebe=='function'){const _rc=recebe;G.recebe=recebe=function(id,pre){if(!pre||!pre.forma){const f=ultForma();if(f)pre={...(pre||{}),forma:f}}return _rc(id,pre)}}
if(typeof recebeOk=='function'){const _ro=recebeOk;G.recebeOk=recebeOk=function(){const f=$q('#rcf [name=forma]');if(f&&f.value){try{localStorage.setItem(UFK,f.value)}catch(x){}}return _ro.apply(this,arguments)}}
/* 15) versão só no menu Mais */
if(typeof maisAcoes=='function'){const _ma=maisAcoes;G.maisAcoes=maisAcoes=function(){const r=_ma.apply(this,arguments),m=$q('#modal .psh');if(m&&typeof APP_VER!='undefined')m.insertAdjacentHTML('beforeend',`<p class="mver">Fio-Mar Gestor · versão ${e(APP_VER)}</p>`);return r}}
/* 1) barra do Fio-Mar some ao rolar para baixo e volta ao rolar para cima */
{let ly=0;addEventListener('scroll',()=>{const y=scrollY,b=document.body;if(document.querySelector('#modal .ov')){ly=y;return}
 if(y>ly+6&&y>90)b.classList.add('navoff');else if(y<ly-6||y<40)b.classList.remove('navoff');ly=y},{passive:true})}

/* ---------- 13) 2.32.0: segurança e menos poluição ---------- */
/* 1) topo: só a marca e o Buscar (Tema e Sair foram para o Mais) */
if(typeof navHtml=='function'){const _nh=navHtml;G.navHtml=navHtml=function(){return _nh.apply(this,arguments).replace(/<button[^>]*class="nbtn ptema"[^>]*>[\s\S]*?<\/button>/,'').replace(/<button[^>]*aria-label="Sair"[^>]*>[\s\S]*?<\/button>/,'')}}
if(typeof maisAcoes=='function'){const _ma2=maisAcoes;G.maisAcoes=maisAcoes=function(){const r=_ma2.apply(this,arguments),m=$q('#modal .psh');if(m){const f=`<div class="mfoot"><button type="button" onclick="temaTroca()">${svgi('tema')}<span>Tema</span></button><button type="button" onclick="sairSheet()">${svgi('out')}<span>Sair</span></button></div>`,v=m.querySelector('.mver');v?v.insertAdjacentHTML('beforebegin',f):m.insertAdjacentHTML('beforeend',f)}return r}}
ICO.tema=ICO.tema||'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>';
G.sairSheet=function(){sheet('Sair',`<div class="osml"><button type="button" onclick="closeM();doOut()">${svgi('out')}<span>Sair deste aparelho</span></button><button type="button" onclick="sairTodos(this)">${svgi('out')}<span>Sair de todos os aparelhos<small class="muted">Use se perder o celular. Os outros saem em até 1 hora.</small></span></button></div>`)};
G.sairTodos=function(b){if(b&&!b.dataset.ok){b.dataset.ok=1;b.classList.add('dg');b.querySelector('span').firstChild.textContent='Toque de novo para sair de todos';return}
 closeM();(async()=>{try{if(typeof DIRTY!='undefined'&&DIRTY)await push()}catch(x){}try{await SB.auth.signOut({scope:'global'})}catch(x){}await doOut();toast('Você saiu de todos os aparelhos')})()};
/* 6) Menu: Notas e Entradas saem da lista (Entradas fica no Estoque; Notas fiscais nas Finanças) */
try{for(const k of ['notas','entradas']){const i=NAV.findIndex(x=>x[0]==k);if(i>=0)NAV.splice(i,1)}}catch(x){}
if(V.fin){const _vf=V.fin;V.fin=function(){const h=_vf.apply(this,arguments);return DONO()?h+`<button type="button" class="card flink" onclick="go('notas')">${svgi('notas')}<span><b>Notas fiscais</b><small>NF-e e NFS-e emitidas e configuração</small></span><i>›</i></button>`:h}}
/* 7) Estoque: leitor de código dentro da busca; entradas no ⋯ */
if(V.stock){const _vs=V.stock;V.stock=function(){let h=_vs.apply(this,arguments);
 h=h.replace(/<div class="bcsr">[\s\S]*?<\/button><\/div>/,'').replace(`<button class="sm" onclick="go('entradas')">Entrada por nota fiscal</button>`,'')
  .replace(/(<div class="osh3">[\s\S]*?)(<\/div><\/div>)/,`$1<span class="sp"></span><button class="sm" aria-label="Mais opções do estoque" onclick="estMais()">⋯ Mais</button>$2`)
  .replace(/(<div class="srch">[\s\S]*?<input[^>]*placeholder="Buscar peça por nome ou código"[^>]*>)/,`$1<button type="button" class="srbc" aria-label="Ler código de barras" onclick="lerCodigo(scanAbre)">${svgi('barras')}</button>`);return h}}
G.estMais=function(){const A=[['Ler código de barras','lerCodigo(scanAbre)','barras'],['Entrada por bipe','entAbre()','stock'],...(DONO()?[['Entrada por nota fiscal',"go('entradas')",'entradas']]:[])].filter(a=>a[1]);
 sheet('Estoque',`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`)};
/* 8) O.S.: um botão "+ Adicionar" com uma busca só (kits, serviços, estoque e itens já usados) */
const nrm2=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
let OA=null;G.oaAlvo=x=>{OA=x};
function oaUsados(){const M=new Map();const put=(i,p)=>{const d=String(i.d||'').trim();if(!d||i.dgfee||i.pid)return;const k=nrm2(d),x=M.get(k);if(!x)M.set(k,{d,t:i.t||'Serviço',v:+i.v||0,custo:i.custo,n:1,p});else{x.n++;if(p>=x.p){x.v=+i.v||0;x.t=i.t||x.t;x.p=p}}};
 db.quotes.forEach(q=>(q.items||[]).forEach(i=>put(i,1)));db.orders.forEach(o=>(o.items||[]).forEach(i=>put(i,2)));return[...M.values()].sort((a,b)=>b.n-a.n)}
G.osAdd=function(id){const o=od(id||S.id);if(!o||!o.id)return;OA=o.id;
 sheet('Adicionar na O.S. '+e(o.num),`<div class="oaq"><input type="search" id="oaq" placeholder="O que vai entrar? Ex.: óleo, pastilha" autocomplete="off" oninput="oaR(this.value)"><button type="button" class="srbc" aria-label="Ler código de barras da peça" onclick="oaBip()">${svgi('barras')}</button></div><div id="oar"></div>
 <div class="oab"><button type="button" onclick="oaNovo()">${svgi('plus')}<span>Item novo</span></button><button type="button" onclick="closeM();pdDaOS('${o.id}')">${svgi('pedido')}<span>Pedir peça</span></button></div>`);oaR('')};
G.oaR=function(v){const b=$q('#oar');if(!b)return;const q=nrm2(v).trim(),ok=t=>!q||q.split(/\s+/).every(w=>nrm2(t).includes(w)),lim=q?8:4;
 const K=(db.kits||[]).filter(k=>ok(k.nome+' '+k.itens.map(i=>i.d).join(' '))).slice(0,lim),
  SV=(db.svcs||[]).filter(s=>+s.preco>0&&ok(s.nome)).slice(0,lim),
  P=PR().filter(p=>ok([p.nome,p.cod,p.ean,p.marca].join(' '))).slice(0,lim),
  U=oaUsados().filter(u=>ok(u.d)&&!SV.some(s=>nrm2(s.nome)==nrm2(u.d))).slice(0,q?8:6);
 const row=(f,t,s,v)=>`<button type="button" class="pk" onclick="${f}"><span><b>${e(t)}</b><small>${s}</small></span><b>${v}</b></button>`,sec=t=>`<small class="psec">${t}</small>`;
 b.innerHTML=(K.length?sec('Kits')+K.map(k=>row(`oaKit('${k.id}')`,k.nome,e(plural(k.itens.length,'item','itens')),R(sum(k.itens,0)))).join(''):'')+
  (SV.length?sec('Serviços prontos')+SV.map(s=>row(`oaSvc('${s.id}')`,s.nome,'Serviço',R(+s.preco))).join(''):'')+
  (P.length?sec('Peças do estoque')+P.map(p=>{const n=qty(p.id);return row(`oaPeca('${p.id}')`,p.nome,`<span style="color:${n>0?'var(--mut)':'#E07A5F'}">${n} ${e(p.un||'un')} em estoque</span>`,R(+p.preco||0))}).join(''):'')+
  (U.length?sec(q?'Já usados':'Mais usados')+U.map((u,i)=>row(`oaUsa(${i})`,u.d,e(u.t),R(u.v))).join(''):'')||
  `<p class="muted oavz">Nada encontrado${q?' para “'+e(v)+'”':''}. Toque em <b>Item novo</b> para lançar.</p>`;
 b.dataset.q=v;OA_U=U};
let OA_U=[];
function oaW(){if(OA=='q')return S.q||null;const o=od(OA);return o&&o.id?o:null}
function oaPush(its,msg){const w=oaW();if(!w)return;w.items=w.items||[];its.forEach(i=>{const c=JSON.parse(JSON.stringify(i));c.iid=uid();delete c.baixa;delete c.dgfee;w.items.push(c)});save();closeM();render();toast(msg)}
G.oaKit=function(id){const k=(db.kits||[]).find(x=>x.id==id);if(k)oaPush(k.itens,'Kit “'+k.nome+'” lançado: '+plural(k.itens.length,'item','itens'))};
G.oaSvc=function(id){const s=(db.svcs||[]).find(x=>x.id==id);if(s)oaPush([{t:'Serviço',d:s.nome,q:1,v:+s.preco}],s.nome+' lançado')};
G.oaUsa=function(i){const u=OA_U[i],w=oaW();if(!u||!w)return;closeM();addItem(w,{t:u.t,d:u.d,v:u.v,...(u.custo!=null&&u.custo!==''&&DONO()?{custo:u.custo}:{})})};
G.oaNovo=function(){const w=oaW(),q=($q('#oar')||{}).dataset;if(!w)return;closeM();addItem(w,q&&q.q?{d:q.q}:{})};
G.oaPeca=function(pid){const p=prod(pid),w=oaW();if(!p.id||!w)return;const n0=qty(p.id);
 sheet(e(p.nome),`<p class="muted" style="margin:0 0 10px">${n0} ${e(p.un||'un')} em estoque · ${R(+p.preco||0)} cada</p><div class="oaqt"><button type="button" onclick="oaQ(-1)" aria-label="Menos">−</button><input id="oaqn" inputmode="decimal" value="1" aria-label="Quantidade"><button type="button" onclick="oaQ(1)" aria-label="Mais">+</button></div>
 <button type="button" class="pr oaok" onclick="oaPecaOk('${p.id}')">Lançar na O.S. (dá baixa)</button>`)};
G.oaQ=function(d){const i=$q('#oaqn');if(!i)return;const n=Math.max(1,(+String(i.value).replace(',','.')||0)+d);i.value=n};
G.oaPecaOk=function(pid){const p=prod(pid),w=oaW(),n=+String(($q('#oaqn')||{}).value||'').replace(',','.');if(!p.id||!w)return;if(!(n>0))return toast('Quantidade inválida');if(n>qty(p.id))return toast('Estoque insuficiente: restam '+qty(p.id));
 w.items.push({t:'Peça',d:p.nome,det:p.cod?'Cód. '+p.cod:'',q:n,v:p.preco||0,pid:p.id,...(DONO()?{custo:+p.custo||0}:{}),baixa:true});MV().push({id:uid(),pid:p.id,tipo:'S',q:n,data:today(),obs:'O.S. '+w.num});save();closeM();render();toast(p.nome+' lançada · '+n+' '+(p.un||'un'))};
G.oaBip=function(){lerCodigo(c=>{const k=nrm2(c).replace(/\s/g,''),p=PR().find(x=>[x.ean,x.cod].some(y=>y&&nrm2(y).replace(/\s/g,'')==k));if(p){oaPeca(p.id);return true}toast('Código '+c+' não está em nenhuma peça do estoque');return true},{titulo:'Código de barras da peça'})};
if(V.order){const _vo=V.order;V.order=function(){const h=_vo.apply(this,arguments);
 return h.replace(/<div class="bar" style="margin-top:10px"><button onclick="addItem\(od\(S\.id\)\)">Adicionar item<\/button>[\s\S]*?<\/div>/,`<button type="button" class="pr oaadd" onclick="osAdd()">+ Adicionar serviço ou peça</button>`)}}
/* 4) e 5) menu ⋯ da O.S.: nota fiscal aparece aqui quando a aba está escondida */
if(typeof osMais=='function'){const _om=osMais;G.osMais=osMais=function(id){const r=_om.apply(this,arguments),o=od(id),l=$q('#modal .osml');if(l&&o&&DONO()&&typeof nfAba=='function'&&!nfAba(o))l.insertAdjacentHTML('beforeend',`<button type="button" onclick="closeM();osTab('nf')">${svgi('notas')}<span>Nota fiscal</span></button>`);return r}}


/* ---------- 14) 2.36.0: abas da O.S. com "Mais" ---------- */
ICO.osmais='<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>';
G.osTabMais=function(){const o=od(S.id);if(!o)return;const ti=osTabInfo(o),L=[['pag','Pagamento'],['check','Checklist'],['laudo','Laudo'],...((typeof nfAba=='function'&&nfAba(o))||S.tab=='nf'?[['nf','Nota fiscal']]:[])];
 sheet('Mais seções da O.S.',`<div class="osml">${L.map(([k,t])=>`<button type="button" class="${S.tab==k?'on':''}" onclick="closeM();osTab('${k}')">${svgi(OSICO[k])}<span>${t}<small style="color:${ti[k][1]}">${e(ti[k][0])}</small></span></button>`).join('')}</div>`)};

const css=document.createElement('style');css.textContent=`
#vzfab{width:50px!important;height:50px!important;transition:transform .15s,background .15s,translate .22s,opacity .22s}#vzfab svg{width:23px;height:23px}#vzfab.vzesc{translate:0 150%;opacity:0;pointer-events:none}
#main{padding-bottom:96px}
/* finanças */
.fres{padding:12px}.fresab{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border:1px solid var(--ln);border-radius:10px;margin-bottom:12px}
.fresab button{margin:0;min-height:40px;border:0;border-radius:8px;background:transparent;color:var(--mut);font-weight:700}.fresab button.on{background:var(--hi);color:#1a1a1a}
.fresg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fresg>div{padding:10px 12px;border:1px solid var(--ln);border-radius:10px}
.fresg small,.fresl small{display:block;color:var(--mut);font-size:12.5px}.fresg b{font-size:19px}.fresg .fneg{color:#E07A5F}
.fresl{margin-top:8px;padding:12px;border-radius:10px;background:color-mix(in srgb,#2E8B57 16%,transparent);border:1px solid color-mix(in srgb,#2E8B57 45%,transparent)}
.fresl b{font-size:30px;color:#3FBF7F;line-height:1.1}.fresl.neg{background:color-mix(in srgb,#B4472E 16%,transparent);border-color:color-mix(in srgb,#B4472E 45%,transparent)}.fresl.neg b{color:#E07A5F}
.fresx{margin:10px 0 0;font-size:13.5px;color:var(--mut)}.fresx a{color:var(--ink);text-decoration:none;white-space:nowrap}
.fbox{margin:10px 0;border:1px solid var(--ln);border-radius:12px;background:var(--sf)}.fbox>summary{list-style:none;cursor:pointer;padding:14px 40px 14px 14px;position:relative}
.fbox>summary::-webkit-details-marker{display:none}.fbox>summary::after{content:'▾';position:absolute;right:16px;top:50%;transform:translateY(-50%);color:var(--mut);transition:transform .2s}
.fbox[open]>summary::after{transform:translateY(-50%) rotate(180deg)}.fbox>summary b{display:block;font-size:16px}.fbox>summary small{color:var(--mut);font-size:13px}
.fboxb{padding:0 10px 10px}.fboxb>.card:first-child{margin-top:0}
/* O.S. */
/* 2.31.0 */
@media (max-width:760px){
 .pgh{padding:8px 12px;margin-bottom:10px;border-top-width:3px}.pgh .pic{display:none}
 .pgh .osh1{gap:8px}.pgh .osh-t small{font-size:9.5px}.pgh .osh-t h1{font-size:22px!important;white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
 .pgh .hb{min-height:40px;padding:6px 12px;font-size:15px;margin:0}.pgh .osh1+.osh3{margin-top:8px}
 nav{transition:transform .2s}body.navoff nav{transform:translateY(-110%)}
}
#ver{display:none}.mver{margin:14px 0 0;text-align:center;color:var(--mut);font-size:12px}
.dsh3 .kt{padding:10px 8px}.dshl{margin:-2px 0 12px;display:flex;flex-wrap:wrap;gap:6px}.dshl a{display:inline-flex;align-items:center;min-height:38px;padding:6px 12px;border:1px solid var(--ln);border-radius:999px;background:var(--sf);color:var(--ink);font-size:14px;font-weight:600;cursor:pointer}.dshl i{display:none}
.plst{display:grid;gap:10px;margin-bottom:12px}.plst .kc{margin:0}
.chg{border-left:5px solid var(--hi)}.chg>b{display:flex;align-items:center;gap:8px}.chg>b svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}.chg>b i{font-style:normal;margin-left:auto;color:var(--mut)}
.chgl{display:flex;align-items:center;gap:10px;padding:10px 0 0;margin-top:10px;border-top:1px solid var(--ln)}.chgh{font:800 17px/1 'Barlow Condensed','Barlow',sans-serif;min-width:46px}.chgt{flex:1;min-width:0}.chgt small{display:block;color:var(--mut)}.chgl button{margin:0;min-height:44px}
.pbtop{width:100%;margin:0 0 10px;min-height:56px;text-align:left;display:flex}#pbr .pbtop small{display:block;font-weight:600;color:#3B2E00!important;opacity:1}
button.wa:not(.osgo){background:transparent;color:#22A85C;border-color:#22A85C}
.oslgs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 0}.oslg{margin:0;display:flex;align-items:center;gap:8px;min-height:44px;padding:6px 12px;border-radius:10px;font-size:14px;text-align:left}.oslg svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;color:var(--hi)}.oslg small{display:block;color:var(--mut);font-size:12px}
.osnx{display:flex;gap:8px;align-items:stretch;flex-wrap:nowrap}.osnx .osgo{flex:1;min-height:50px;margin:0;font-size:16.5px;font-weight:800;border-radius:12px}
.osnx .osic{margin:0;min-width:50px;min-height:50px;border-radius:12px}.osnx .osic[aria-label="Mais ações"]{font-size:22px;line-height:1}
.osnx .osok{flex:1;display:flex;align-items:center;padding:0 12px;min-height:50px;border-radius:12px;color:#3FBF7F;font-weight:700;border:1px dashed color-mix(in srgb,#2E8B57 60%,transparent)}
.osnx .sm:not(.osic){margin:0;min-height:50px}
.osml{display:grid;gap:6px}.osml button{display:flex;align-items:center;gap:12px;margin:0;min-height:52px;padding:0 14px;text-align:left;border-radius:12px;font-weight:600;font-size:15.5px}
.osml button svg{width:22px;height:22px;flex:none;fill:none;stroke:var(--hi);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.osdel{width:100%;margin:14px 0 0;min-height:48px}
/* lista e painel */
.ktf{margin-bottom:12px}.ktf .kt .num.sm{font-size:17px!important}
.ktf .kt.on,.kq .kt.on{outline:3px solid var(--c);outline-offset:-1px;background:color-mix(in srgb,var(--c) 12%,var(--sf));opacity:1}
.agvz{display:flex;align-items:center;gap:10px;margin:14px 0;padding:10px 12px;border:1px dashed var(--ln);border-radius:12px;color:var(--mut);font-size:14.5px}
.agvz svg{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9}.agvz b{color:var(--ink)}.agvz button{margin:0 0 0 auto;white-space:nowrap}
.prl{padding:4px 12px}.prr{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--ln);cursor:pointer}.prr:last-child{border-bottom:0}
.prt{flex:1;min-width:0}.prt b{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.prt small{display:block;color:var(--mut);margin-top:2px}.prr button{margin:0;min-height:42px;white-space:nowrap}
/* contraste: cinza mais claro no tema escuro */
[data-theme="dark"]{--mut:#B3B8BF}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--mut:#B3B8BF}}
/* meus carros */
.mcard{border-left:5px solid var(--c);cursor:pointer}.mc1{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.mc1 b{font-size:18px}
.mcs{display:block;color:var(--mut);margin-top:6px}.mcp{margin:8px 0 0;padding:8px 10px;border-radius:8px;background:var(--bg);font-size:14.5px}
.mcb{display:flex;gap:8px;margin-top:12px}.mcb button{flex:1;margin:0;min-height:54px;font-size:17px;font-weight:800;border-radius:12px}
.eqln{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line,#8883)}.eqc p+.eqln{border-top:0}
.eqj{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--line,#8883)}.eqj small{display:block}.eqj select,.eqj button{margin:0}
.meusn{display:grid;grid-template-columns:1fr 1fr;gap:8px}.meusn button{margin:0;min-height:52px;font-size:16px;font-weight:700}
/* entrada pela placa */
.ciscanb{margin:0 0 6px!important}.ciscan{width:100%;min-height:56px;justify-content:center;font-size:17px!important;font-weight:800;display:flex!important;align-items:center}
.ciou{display:block;margin:6px 0 2px}.ciagora{width:100%;min-height:52px;margin:10px 0 0;font-size:17px;font-weight:800}
/* modo TV */
body.tvon{overflow:hidden}#tv{position:fixed;inset:0;z-index:100;background:#0E0F11;color:#F2F3F4;display:flex;flex-direction:column;padding:1.2vw 1.4vw;font-family:Barlow,sans-serif;gap:1vw}
#tv>header{position:static;background:none;border:0;box-shadow:none;padding:0;display:flex;align-items:center;gap:1.5vw;font-size:clamp(16px,2vw,34px)}#tv header span{color:#A9AEB5}#tv header strong{margin-left:auto;font-size:clamp(22px,3vw,52px);color:#F5B700}
#tv header button{margin:0;min-height:44px;font-size:clamp(14px,1.2vw,20px)}
#tv>main{max-width:none!important;width:100%;margin:0!important;padding:0!important;flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:1vw;min-height:0}
#tv section{background:#1A1C1F;border-radius:14px;border-top:6px solid var(--c);padding:1vw;overflow:hidden;display:flex;flex-direction:column;gap:.8vw}
#tv h2{margin:0;display:flex;justify-content:space-between;align-items:center;font-size:clamp(18px,2.1vw,38px)}#tv h2 b{background:var(--c);color:#111;border-radius:999px;padding:0 .8em;font-size:.85em}
.tvc{background:#24272B;border-radius:10px;padding:.8vw 1vw;border-left:5px solid var(--c)}
.tvc.tvf{display:flex;align-items:center;gap:1vw}.tvim{flex:none;width:7vw;height:7vw;max-width:110px;max-height:110px;border-radius:8px;object-fit:cover}.tvb{flex:1;min-width:0}.tvc.al{border-left-color:#E5484D;box-shadow:inset 0 0 0 2px #E5484D55}
.tv1{display:flex;align-items:center;gap:.7vw;flex-wrap:wrap}.tv1 b{font-size:clamp(17px,1.9vw,34px)}.tvp{background:#fff;color:#111;border-top:5px solid #1F4FB0;border-radius:4px;padding:0 .4em;font:800 clamp(14px,1.5vw,28px)/1.3 monospace;letter-spacing:.06em}
.tvc small{display:block;color:#C3C7CC;font-size:clamp(13px,1.3vw,24px);margin-top:.3vw}.tvc i{display:block;font-style:normal;color:#F5B700;font-size:clamp(12px,1.1vw,20px);margin-top:.2vw}.tvc.al i{color:#FF7A7A}
.tvz{color:#555;font-size:2vw;text-align:center}
#tv footer{font-size:clamp(14px,1.5vw,26px);color:#C3C7CC;display:flex;gap:1.4vw;flex-wrap:wrap}#tv footer span{color:#fff}
@media (orientation:portrait){#tv>main{grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr)}#tv{padding:10px;gap:8px}#tv header{flex-wrap:wrap;gap:6px 12px;font-size:15px}#tv header span{display:none}}
/* 2.28.3: filtros compactos e microfone na barra */
.ktf .kt small.ktsub{display:block;font-size:11px;color:var(--mut);margin-top:2px}
/* 2.32.0 */
.mfoot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0 0}.mfoot button{margin:0;min-height:48px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600}
.mfoot svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}.mfoot svg path[fill]{fill:currentColor}
.osml button span small{display:block;font-weight:500;font-size:12.5px;margin-top:2px}
.flink{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;color:var(--ink)}.flink svg{width:22px;height:22px;flex:none;fill:none;stroke:var(--hi);stroke-width:1.9}.flink small{display:block;color:var(--mut);font-weight:500}.flink i{margin-left:auto;font-style:normal;font-size:22px;color:var(--mut)}
.srch{position:relative}.srbc{position:absolute;right:6px;top:50%;transform:translateY(-50%);margin:0!important;min-height:38px!important;min-width:44px;padding:0 10px!important;border-radius:9px;display:flex;align-items:center;justify-content:center}
.srbc svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9}.srch:has(.srbc) input{padding-right:58px}
.oaq{position:relative}.oaq input{width:100%;margin:0;padding-right:58px;min-height:48px;font-size:16px}#oar{margin-top:6px;max-height:52vh;overflow:auto}#oar .psec{display:block;margin:12px 0 4px}
.oab{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.oab button{margin:0;min-height:50px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700}.oab svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}
#oar .pk{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;margin:0 0 6px;min-height:52px;padding:8px 12px;text-align:left;border-radius:10px}#oar .pk span{min-width:0}#oar .pk span b{display:block;font-size:15.5px}#oar .pk small{display:block;color:var(--mut);font-weight:500;font-size:12.5px}#oar .pk>b{white-space:nowrap;font-size:15px}
.oavz{margin:14px 0}.oaqt{display:grid;grid-template-columns:64px 1fr 64px;gap:8px;margin-bottom:12px}.oaqt button{margin:0;min-height:56px;font-size:26px;font-weight:800}.oaqt input{margin:0;text-align:center;font-size:24px;font-weight:800;min-height:56px}
.oaok{width:100%;min-height:54px;margin:0;font-size:17px;font-weight:800}.oaadd{width:100%;min-height:52px;margin:12px 0 0;font-size:16.5px;font-weight:800;border-radius:12px}
/* 3) cartão do pátio sem "Escolher mecânico" e sem o marcador de tanque */
.kc .kmec.z,.kc .fuelm{display:none!important}.kc .kcf:not(:has(.mb)){display:none}
/* 2) filtros em fileira fina (os números grandes ficam só no Painel) */
@media (max-width:760px){
 .kts.ktf,.kts.pfts{display:flex!important;flex-wrap:nowrap;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -12px 10px;padding:2px 12px}.kts.ktf::-webkit-scrollbar,.kts.pfts::-webkit-scrollbar{display:none}
 .kts.ktf .kt,.kts.pfts .kt{flex:none;display:inline-flex!important;flex-direction:row-reverse;align-items:center;gap:6px;min-height:40px;height:auto;padding:6px 14px!important;border-radius:999px;border-width:1px!important;border-top-width:1px!important;box-shadow:none}
 .kts.ktf .kt svg,.kts.pfts .kt svg,.kts.ktf .kt .ktsub{display:none}
 .kts.ktf .kt span,.kts.pfts .kt span{font-size:14px!important;margin:0!important;line-height:1.2;white-space:nowrap}
 .kts.ktf .kt .num,.kts.pfts .kt .num{font-size:14.5px!important;font-weight:800;color:var(--ink)}
 .kts.ktf .kt.zero:not(.on),.kts.pfts .kt.zero:not(.on){display:none!important}
 .kts.ktf .kt.on,.kts.pfts .kt.on{outline:0;border-color:var(--c)!important;background:color-mix(in srgb,var(--c) 22%,var(--sf))}
}
/* 2.36.0 */
.clc{display:flex;align-items:center;gap:12px;padding:12px;margin:0 0 8px;border:1px solid var(--ln);border-radius:14px;background:var(--sf);cursor:pointer}.clc:active{transform:scale(.99)}
.clav{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:16px;letter-spacing:.5px}
.clm{flex:1;min-width:0}.clm b{display:block;font-size:16.5px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.clm small{display:block;color:var(--mut);font-size:13px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.clr{flex:none;text-align:right;display:grid;gap:3px;justify-items:end}.clr b{font-size:15px}.clpt{--c:#3E7CB1;font-size:11.5px;font-weight:700;color:color-mix(in srgb,var(--c) 65%,var(--ink));background:color-mix(in srgb,var(--c) 18%,transparent);padding:2px 8px;border-radius:99px;white-space:nowrap}
.clplc{font-family:ui-monospace,monospace;font-weight:700;color:var(--ink);letter-spacing:.5px}.cldim{opacity:.6}.clr small.muted{font-size:12px}
#ostabs.ostabs.osq{display:grid!important;grid-template-columns:1fr 1.28fr .82fr 1.2fr .8fr;gap:6px;overflow:visible!important}#ostabs.osq .ost{min-width:0!important;width:auto!important;padding:8px 3px!important}#ostabs.osq .ost .l{font-size:12px;letter-spacing:-.2px}#ostabs.osq .ost .s{font-size:10.5px}
.ostabs.osq .ost .l,.ostabs.osq .ost .s{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.ostabs.osq .ost svg{fill:none;stroke:currentColor}
.ostabs .osmx{position:relative}.ostabs .osmx svg circle{fill:currentColor;stroke:none}.ostabs .osmx.dot::after{content:"";position:absolute;top:6px;right:8px;width:8px;height:8px;border-radius:50%;background:#E07A5F}
.osml button.on{border-color:var(--hi)}.osml button span small{display:block;font-size:12.5px;font-weight:600;margin-top:2px}
/* desfazer */
#toast.tundo{gap:10px}.tundob{margin:0 0 0 auto;min-height:38px;padding:0 14px;border-radius:9px;border:1px solid var(--hi);background:transparent;color:var(--hi);font-weight:800;white-space:nowrap}
`;document.head.appendChild(css);
})(window);

(function(){const st=document.createElement('style');st.textContent=`#vzfab#vzfab,#vz.hold~#vzfab#vzfab{display:none!important}
.vzhw{display:inline-flex}.vzhw:empty{display:none}.dshx{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.vzhb{height:38px;gap:6px;padding:0 14px!important;font-weight:600;font-size:15px;border-radius:10px;border:1px solid var(--line,#3a3d42);background:transparent;color:var(--hi);display:inline-flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.vzhb svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
.vzhb:active,.vzhb.cancel{transform:scale(.94)}.vzhb.cancel{background:#B4472E;color:#fff}
body:has(#vz.hold) .vzhb{background:#C0392B;color:#fff;border-color:#C0392B}`;document.head.appendChild(st)})();
