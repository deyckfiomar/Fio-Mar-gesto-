/* Fio-Mar Gestor — dia a dia da oficina (versão 2.28.0)
   1. Finanças: resumo Hoje / Semana / Mês no topo.
   2. Desfazer: apagar e mudar a situação viram uma ação na hora, com "Desfazer" no aviso.
   3. O.S.: botão grande "Próximo passo" e o resto das ações no menu ⋯.
   4. Microfone: menor, some ao rolar para baixo e não cobre o fim das telas.
   5. Lista de O.S.: dias na oficina com cor.
   6. Painel: "Prontos para entregar" e agenda vazia numa linha.
   7. Meus carros (mecânico).
   8. Entrada do carro pela foto da placa.
   9. Modo TV do pátio. */
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
G.desfazivel=function(fn,msg){const antes=snap(),tn=typeof TOASTN=='number'?TOASTN:0,vw={v:S.v,id:S.id,tab:S.tab};let r;try{r=fn()}catch(x){throw x}
 if(snap()===antes)return r;/* nada mudou (ex.: bloqueado) */
 const tt=$q('#toast .ttx'),txt=msg||(typeof TOASTN=='number'&&TOASTN!=tn&&tt?tt.childNodes[0]&&tt.childNodes[0].textContent:'')||'Apagado';
 UNDO={s:antes,...vw};mostraUndo(txt);return r};
function mostraUndo(txt){const o=$q('#toast');if(!o)return;if(typeof TOASTN=='number')TOASTN++;o.className='t-ok tundo';
 o.innerHTML=`<span class="tic">✓</span><span class="ttx">${e(txt)}</span><button type="button" class="tundob" onclick="desfaz()">Desfazer</button>`;o.style.display='flex';
 clearTimeout(typeof TOT!='undefined'?TOT:0);clearTimeout(UNDOT);UNDOT=setTimeout(()=>{if(o.classList.contains('tundo'))o.style.display='none';UNDO=null},7000)}
G.desfaz=function(){if(!UNDO)return;const u=UNDO;UNDO=null;clearTimeout(UNDOT);const d=JSON.parse(u.s);
 Object.keys(db).forEach(k=>{if(!(k in d))delete db[k]});Object.assign(db,d);save();
 if(['order','quote','recibo'].includes(u.v)&&u.id){S.v=u.v;S.id=u.id;S.tab=u.tab}closeM&&closeM(1);render();toast('Desfeito')};
/* "Toque de novo para confirmar" vira apagar na hora com Desfazer.
   Continua pedindo dois toques o que mexe fora dos dados da oficina (equipe, bloqueio, limpar tudo, estorno de nota). */
const SEMDESF=/recusarReq|statusOf|limparSim|entDesfazer/;
if(typeof confirmDel=='function'){const _cd=confirmDel;G.confirmDel=confirmDel=function(b,fn){if(SEMDESF.test(String(fn)))return _cd(b,fn);return desfazivel(fn)}}
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
  ['Receber pagamento',rest>0.005&&typeof recebe=='function'?`recebe('${o.id}')`:'','ospag'],
  ['Mudar a situação',typeof stSheet=='function'?`stSheet('${o.id}',1)`:'','orders']].filter(a=>a[1]);
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
const EUK='fm_eu',eu=()=>{try{return localStorage.getItem(EUK)||''}catch(x){return''}};
G.meuNome=function(n){try{localStorage.setItem(EUK,n)}catch(x){}render(1)};
const mecNomes=()=>{const s=new Set();db.orders.forEach(o=>{if(o.mec&&String(o.mec).trim())s.add(String(o.mec).trim())});return[...s].sort((a,b)=>a.localeCompare(b,'pt-BR'))};
G.meusPega=function(id){const o=od(id),n=eu();if(!o||!n)return;desfazivel(()=>{o.mec=n;save();render(1)},'Carro '+vlabel(vh(o.veh))+' ficou com '+n)};
G.meusTroca=function(){const L=mecNomes();sheet('Quem é você?',`<p class="muted" style="margin:-4px 0 10px">Escolha o seu nome. Fica guardado neste celular.</p><div class="meusn">${L.map(n=>`<button type="button" class="${eu()==n?'pr':''}" onclick="closeM();meuNome('${e(n).replace(/'/g,"\\'")}')">${e(n)}</button>`).join('')}</div>
 <form onsubmit="event.preventDefault();const v=this.n.value.trim();if(v){closeM();meuNome(v)}" style="margin-top:12px"><label>Outro nome<input name="n" autocomplete="off" placeholder="Seu nome como aparece na O.S."></label><button class="pr" style="width:100%">Usar este nome</button></form>`)};
function mcard(o,meu){const v=vh(o.veh),c=cl(o.cli),id=o.id,ni=o.items.length;
 const B={Aberta:[['Começar',`stMuda('${id}','Em andamento')`,'pr']],'Em andamento':[['Terminei',`stMuda('${id}','Concluída')`,'pr'],['Falta peça',`stMuda('${id}','Aguardando peças')`,'']],'Aguardando peças':[['Peça chegou',`stMuda('${id}','Em andamento')`,'pr']]}[o.status]||[];
 const bt=meu?B.map(([t,f,c])=>`<button type="button" class="${c}" onclick="event.stopPropagation();${f}">${t}</button>`).join(''):`<button type="button" class="pr" onclick="event.stopPropagation();meusPega('${id}')">Pegar este carro</button>`;
 return`<div class="card mcard" style="--c:${SC[o.status]||'#777'}" role="button" tabindex="0" onclick="go('order','${id}')"><div class="mc1">${typeof plc=='function'?plc(v):''}<b>${e(v.modelo||'Sem veículo')}</b><span class="sp"></span>${osDiasMb(o)}</div>
 <small class="mcs">${e(c.nome||'Sem cliente')} · O.S. ${e(o.num)} · ${pill(o.status)}</small>${o.problema?`<p class="mcp">${e(o.problema)}</p>`:''}<small class="mcs">${ni?plural(ni,'item','itens')+': '+o.items.slice(0,3).map(i=>e(i.d)).join(', ')+(ni>3?'…':''):'Sem serviços lançados'}</small>
 <div class="mcb">${bt}</div></div>`}
V.meus=function(){const n=eu(),A=db.orders.filter(o=>!FIM.includes(o.status)),M=n?A.filter(o=>String(o.mec||'').trim().toLowerCase()==n.toLowerCase()):[],L=A.filter(o=>!String(o.mec||'').trim());
 const ord=(a,b)=>(a.aberta||'').localeCompare(b.aberta||'');
 return head({ico:'patio',kick:n?'Mecânico: '+e(n):'Mecânico',title:'Meus carros',c:'#2F6FB0',right:`<button class="hb" onclick="meusTroca()">${n?'Trocar nome':'Quem é você?'}</button>`,acts:`<span class="vzhw"></span><button class="sm" onclick="go('patio')">${svgi('patio')} Ver o pátio</button>`})+
 (!n?`<div class="card" style="text-align:center"><p style="margin:0 0 10px">Escolha o seu nome para ver os carros que estão com você.</p><button class="pr" onclick="meusTroca()">Escolher meu nome</button></div>`:
 sech('Comigo',plural(M.length,'carro','carros'))+(M.sort(ord).map(o=>mcard(o,1)).join('')||`<p class="muted">Nenhum carro com ${e(n)} agora.${L.length?' Pegue um carro abaixo.':''}</p>`))+
 (L.length?sech('Sem mecânico',plural(L.length,'carro','carros'))+L.sort(ord).map(o=>mcard(o,0)).join(''):'')};
G.patioExtraBtns=()=>`<button class="sm" aria-label="Mais opções do pátio" onclick="patioMais()">⋯ Mais</button>`;
G.patioMais=function(){const A=[['Todas as O.S.',"go('orders')",'orders'],['Meus carros (mecânico)',"go('meus')",'clients'],...(typeof tvAbre=='function'?[['Modo TV (tela cheia)','tvAbre()','dash']]:[])];
 sheet('Pátio',`<div class="osml">${A.map(([t,f,ic])=>`<button type="button" onclick="closeM();${f}">${svgi(ic)}<span>${t}</span></button>`).join('')}</div>`)};
/* mecânico (não dono): o app abre em "Meus carros" */
if(typeof render=='function'){const _rd=render;let ini='';G.render=render=function(){if(typeof SES!='undefined'&&SES&&typeof OF!='undefined'&&OF&&typeof PAPEL!='undefined'&&PAPEL&&typeof DONO=='function'){const k=OF+'|'+PAPEL;if(ini!=k){ini=k;if(!DONO()&&S.v=='dash')S.v='meus'}}return _rd.apply(this,arguments)}}

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
   return`<div class="tvc${al?' al':''}"><div class="tv1">${v.placa?`<span class="tvp">${e(v.placa)}</span>`:''}<b>${e(v.modelo||'Sem veículo')}</b></div><small>${e(cl(o.cli).nome||'')}${o.mec?' · 🔧 '+e(o.mec):''}</small><i>${st=='Concluída'?(o.avisado?'avisado · ':'')+(n?'pronto há '+n+(n==1?' dia':' dias'):'pronto hoje'):(n?n+(n==1?' dia':' dias'):'entrou hoje')}</i></div>`}).join('')||'<p class="tvz">—</p>'}</section>`};
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
.tvc{background:#24272B;border-radius:10px;padding:.8vw 1vw;border-left:5px solid var(--c)}.tvc.al{border-left-color:#E5484D;box-shadow:inset 0 0 0 2px #E5484D55}
.tv1{display:flex;align-items:center;gap:.7vw;flex-wrap:wrap}.tv1 b{font-size:clamp(17px,1.9vw,34px)}.tvp{background:#fff;color:#111;border-top:5px solid #1F4FB0;border-radius:4px;padding:0 .4em;font:800 clamp(14px,1.5vw,28px)/1.3 monospace;letter-spacing:.06em}
.tvc small{display:block;color:#C3C7CC;font-size:clamp(13px,1.3vw,24px);margin-top:.3vw}.tvc i{display:block;font-style:normal;color:#F5B700;font-size:clamp(12px,1.1vw,20px);margin-top:.2vw}.tvc.al i{color:#FF7A7A}
.tvz{color:#555;font-size:2vw;text-align:center}
#tv footer{font-size:clamp(14px,1.5vw,26px);color:#C3C7CC;display:flex;gap:1.4vw;flex-wrap:wrap}#tv footer span{color:#fff}
@media (orientation:portrait){#tv>main{grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr)}#tv{padding:10px;gap:8px}#tv header{flex-wrap:wrap;gap:6px 12px;font-size:15px}#tv header span{display:none}}
/* 2.28.3: filtros compactos e microfone na barra */
.ktf .kt small.ktsub{display:block;font-size:11px;color:var(--mut);margin-top:2px}
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
