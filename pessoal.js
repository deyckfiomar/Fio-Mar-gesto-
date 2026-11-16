/* Fio-Mar Gestor — Finanças pessoais do dono (versão 2.25.0)
   - Só o dono vê. Fica na linha privada do dono no servidor (db.pess), separado da oficina.
   - Ganhos e gastos (avulsos e de todo mês), categorias editáveis e gráficos mês a mês.
   - Microfone próprio: só anota gastos pessoais ("almoço 35 reais", "conta de luz 180 todo mês"). */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const ROXO='#8E5BD0';
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)};
const mAdd=(m,n)=>{const d=new Date(m+'-15T12:00');d.setMonth(d.getMonth()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
const dimM=m=>new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
const PS=()=>db.pess=Array.isArray(db.pess)?db.pess:[];
/* categorias (editáveis, guardadas na linha privada do dono em db.pcats) */
const CAT0={g:[['Alimentação','#E58E26'],['Casa','#2F6FB0'],['Transporte','#17A2B8'],['Saúde','#2E8B57'],['Contas e assinaturas','#8E5BD0'],['Lazer','#D8577E'],['Educação','#B8860B'],['Outros','#7A7F87']],
 r:[['Retirada da oficina','#2E8B57'],['Salário','#3FB06F'],['Extra / bico','#17A2B8'],['Aluguel recebido','#2F6FB0'],['Vendas','#E58E26'],['Outros ganhos','#7A7F87']]};
const PAL=['#E58E26','#2F6FB0','#17A2B8','#2E8B57','#8E5BD0','#D8577E','#B8860B','#3FB06F','#C0392B','#5D6D7E','#7A7F87'];
const PC=()=>{if(!Array.isArray(db.pcats)||!db.pcats.length)db.pcats=[...CAT0.g.map(([n,c])=>({t:'g',n,c})),...CAT0.r.map(([n,c])=>({t:'r',n,c}))];return db.pcats};
const cats=t=>PC().filter(x=>x.t==t);
const tp=x=>x&&x.tipo=='r'?'r':'g';
const outro=t=>t=='r'?'Outros ganhos':'Outros';
const corCat=(c,t)=>((PC().find(x=>x.n==c&&(!t||x.t==t))||{}).c)||'#7A7F87';
const ativa=(x,m)=>x.mensal&&String(x.data||'').slice(0,7)<=m&&(!x.fim||x.fim>=m);
const valM=(x,m)=>+((x.vals||{})[m]!=null?x.vals[m]:x.valor)||0;
/* tudo de um mês: itens avulsos + contas/ganhos fixos com o valor daquele mês */
function doMes(m,t){const L=PS().filter(x=>tp(x)==t),av=L.filter(x=>!x.mensal&&String(x.data).slice(0,7)==m),fx=L.filter(x=>ativa(x,m));
 return{av,fx,tA:av.reduce((a,x)=>a+(+x.valor||0),0),tF:fx.reduce((a,x)=>a+valM(x,m),0),get tot(){return this.tA+this.tF}}}

/* ---------- gráficos ---------- */
function grafMeses(m){const M=[];for(let k=5;k>=0;k--)M.push(mAdd(m,-k));const G2=M.map(x=>doMes(x,'r').tot),P=M.map(x=>doMes(x,'g').tot),mx=Math.max(1,...G2,...P);
 const W=360,H=170,pl=6,pb=34,pt=16,gw=(W-pl*2)/6,bw=Math.min(18,gw/3),Y=v=>pt+(H-pt-pb)*(1-v/mx);let g='';
 [0.5,1].forEach(f=>{const y=Y(mx*f);g+=`<line x1="${pl}" x2="${W-pl}" y1="${y}" y2="${y}" style="stroke:var(--ln)" stroke-width=".6" stroke-dasharray="3 3"/>`});
 M.forEach((x,i)=>{const cx=pl+gw*i+gw/2,on=x==m,ml=new Date(x+'-15T12:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
  g+=`<g style="cursor:pointer" onclick="S.f.pm='${x}';render()"><rect x="${pl+gw*i}" y="0" width="${gw}" height="${H}" fill="${on?'color-mix(in srgb,'+ROXO+' 14%,transparent)':'transparent'}" rx="6"/>
  <rect x="${cx-bw-1}" y="${Y(G2[i])}" width="${bw}" height="${Math.max(G2[i]?2:0,H-pb-Y(G2[i]))}" rx="3" fill="#3FB06F"><title>Ganhos ${R(G2[i])}</title></rect>
  <rect x="${cx+1}" y="${Y(P[i])}" width="${bw}" height="${Math.max(P[i]?2:0,H-pb-Y(P[i]))}" rx="3" fill="#E0553F"><title>Gastos ${R(P[i])}</title></rect>
  <text class="cht" x="${cx}" y="${H-18}" text-anchor="middle" ${on?'style="font-weight:700;fill:var(--ink)"':''}>${ml}</text>
  <text class="cht" x="${cx}" y="${H-4}" text-anchor="middle" style="fill:${G2[i]-P[i]>=0?'#3FB06F':'#E0553F'};font-weight:600">${G2[i]||P[i]?K(G2[i]-P[i]):''}</text></g>`});
 return`<div class="card psg"><div class="psgh"><b>Ganhos e gastos</b><span class="psleg"><i style="background:#3FB06F"></i>Ganhos<i style="background:#E0553F"></i>Gastos</span></div>${svg(W,H,g,'Ganhos e gastos dos últimos 6 meses')}<small class="muted">Embaixo de cada mês, o que sobrou (ou faltou). Toque num mês para ver.</small></div>`}
function grafDias(m,t){const n=dimM(m),hoje=today(),fim=m==hoje.slice(0,7)?+hoje.slice(8,10):n,G2=Array(n).fill(0),P=Array(n).fill(0);
 PS().forEach(x=>{if(x.mensal){if(ativa(x,m)){const d=Math.min(n,Math.max(1,+x.dia||+String(x.data).slice(8,10)||1))-1;(tp(x)=='r'?G2:P)[d]+=valM(x,m)}}else if(String(x.data).slice(0,7)==m){(tp(x)=='r'?G2:P)[+x.data.slice(8,10)-1]+=+x.valor||0}});
 let sg=0,sp=0;const AG=G2.map(v=>sg+=v),AP=P.map(v=>sp+=v),mx=Math.max(1,sg,sp),W=360,H=150,pl=8,pb=20,pt=12,X=i=>pl+(W-pl*2)*(i/(n-1)),Y=v=>pt+(H-pt-pb)*(1-v/mx);
 const ln=(A,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round" points="${A.slice(0,fim).map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}"/>`;
 let g=`<line x1="${pl}" x2="${W-pl}" y1="${H-pb}" y2="${H-pb}" style="stroke:var(--ln)"/>`;[1,10,20,n].forEach(d=>g+=`<text class="cht" x="${X(d-1)}" y="${H-5}" text-anchor="middle">${d}</text>`);
 g+=ln(AG,'#3FB06F')+ln(AP,'#E0553F');
 return`<div class="card psg"><div class="psgh"><b>No mês, dia a dia</b><span class="psleg"><i style="background:#3FB06F"></i>Ganhos ${R(sg)}<i style="background:#E0553F"></i>Gastos ${R(sp)}</span></div>${svg(W,H,g,'Ganhos e gastos acumulados no mês')}<small class="muted">${sg>=sp?'Os ganhos estão acima dos gastos.':'Os gastos passaram os ganhos'+(sg?' em '+R(sp-sg):'')+'.'}</small></div>`}
function barras(t,m){const Q=doMes(m,t),c={};Q.av.forEach(x=>c[x.cat||outro(t)]=(c[x.cat||outro(t)]||0)+(+x.valor||0));Q.fx.forEach(x=>c[x.cat||outro(t)]=(c[x.cat||outro(t)]||0)+valM(x,m));
 const L=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(!L.length)return'';const mx=L[0][1],tot=L.reduce((a,x)=>a+x[1],0);
 return`<div class="psc">${L.map(([n,v])=>`<div class="pscl"><span>${e(n)}</span><i style="--w:${Math.max(3,v/mx*100)}%;--c:${corCat(n,t)}"></i><b>${R(v)}<small>${Math.round(v/tot*100)}%</small></b></div>`).join('')}</div>`}

/* ---------- tela ---------- */
function Vpessoal(){if(!DONO())return empty('fin','Só o dono da oficina vê esta tela.');
 const t=today(),m=/^\d{4}-\d{2}$/.test(S.f.pm||'')?S.f.pm:t.slice(0,7),ab=S.f.pab||'g',Gm=doMes(m,'r'),Pm=doMes(m,'g'),saldo=Gm.tot-Pm.tot,
  hoje=PS().filter(x=>tp(x)=='g'&&!x.mensal&&x.data==t).reduce((a,x)=>a+(+x.valor||0),0),nd=m==t.slice(0,7)?+t.slice(8,10):dimM(m),
  ml=(x=>x[0].toUpperCase()+x.slice(1))(new Date(m+'-15T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}));
 const kpi=(l,v,s,c)=>`<div class="kpi" style="--c:${c}"><span>${l}</span><div class="num" style="color:${c}">${v}</div>${s?`<small class="muted">${s}</small>`:''}</div>`;
 const fixos=(t2)=>{const Q=t2=='r'?Gm:Pm;return Q.fx.length?`<div class="card psl">${Q.fx.slice().sort((a,b)=>(+(a.dia||28))-(+(b.dia||28))).map(x=>{const ok=(x.pagos||{})[m],esp=(x.vals||{})[m]!=null;return`<div class="psr${ok?' ok':''}"><button type="button" class="psck${t2=='r'?' r':''}" aria-pressed="${!!ok}" aria-label="${t2=='r'?(ok?'Recebido':'Marcar como recebido'):(ok?'Paga':'Marcar como paga')}" onclick="psPago('${x.id}','${m}')">${ok?'✓':''}</button><div class="psd" onclick="psEdit('${x.id}')"><b>${e(x.desc)}</b><small>${e(x.cat||outro(t2))}${x.dia?' · dia '+e(x.dia):''}${ok?(t2=='r'?' · recebido ':' · paga ')+D(ok).slice(0,5):''}${esp?' · valor só deste mês':''}${x.fim?' · até '+e(x.fim.slice(5)+'/'+x.fim.slice(0,4)):''}</small></div><b class="psv${t2=='r'?' r':''}">${R(valM(x,m))}</b></div>`}).join('')}</div>`:''};
 const dia=(t2)=>{const Q=t2=='r'?Gm:Pm,ds=[...new Set(Q.av.map(x=>x.data))].sort().reverse();return ds.map(d=>{const I=Q.av.filter(x=>x.data==d);return`<div class="psdia"><small>${d==t?'Hoje':d==addD(t,-1)?'Ontem':new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'})}<b>${R(I.reduce((a,x)=>a+(+x.valor||0),0))}</b></small><div class="card psl">${I.map(x=>`<div class="psr" onclick="psEdit('${x.id}')"><i class="psdot" style="background:${corCat(x.cat,t2)}"></i><div class="psd"><b>${e(x.desc)}</b><small>${e(x.cat||outro(t2))}</small></div><b class="psv${t2=='r'?' r':''}">${t2=='r'?'+ ':''}${R(x.valor)}</b></div>`).join('')}</div></div>`}).join('')};
 const aba=ab=='r'?`${sech('Ganhos fixos do mês',Gm.tF?R(Gm.tF):'')}${fixos('r')||'<p class="muted" style="margin:0 0 12px">Ex.: retirada da oficina todo mês. Fale “retirada da oficina 3000 todo mês dia 5”.</p>'}
  ${sech('Outros ganhos',Gm.tA?R(Gm.tA):'')}${dia('r')||'<p class="muted" style="margin:0 0 12px">Nenhum ganho avulso em '+ml+'.</p>'}
  ${Gm.tot?`<div class="card"><b>Ganhos por categoria</b>${barras('r',m)}</div>`:''}`
  :`${sech('Contas de todo mês',Pm.tF?R(Pm.tF):'')}${fixos('g')||'<p class="muted" style="margin:0 0 12px">Cadastre aluguel, luz, internet, escola... Fale “conta de luz 180 todo mês”.</p>'}
  ${sech('Gastos do dia a dia',Pm.tA?R(Pm.tA):'')}${dia('g')||empty('fin','Nenhum gasto anotado em '+ml+'.',`<button class="pr" onclick="psNovo()">+ Anotar gasto</button>`)}
  ${Pm.tot?`<div class="card"><b>Gastos por categoria</b>${barras('g',m)}</div>`:''}`;
 return head({back:"go('fin')",kick:'Só você vê',title:'Finanças pessoais',c:ROXO,right:`<button class="hb ib" aria-label="Categorias" title="Categorias" onclick="psCats()">${svgi('cfg')}</button>`})+
 `<div class="psav" role="note">${svgi('lock')}<div><b>Separado da oficina</b><span>Estes ganhos e gastos são seus. Não entram no lucro, no caixa nem nos relatórios da oficina, e os mecânicos não veem.</span></div></div>
 <div class="psadd"><button type="button" class="psbg" onclick="psNovo()">− Gasto</button><button type="button" class="psbr" onclick="psNovo({tipo:'r'})">+ Ganho</button></div>
 <div class="psm"><button type="button" class="ib" aria-label="Mês anterior" onclick="S.f.pm='${mAdd(m,-1)}';render()">‹</button><b>${ml}</b><button type="button" class="ib" aria-label="Mês seguinte" ${m>=t.slice(0,7)?'disabled':''} onclick="S.f.pm='${mAdd(m,1)}';render()">›</button></div>
 <div class="pssal" style="--c:${saldo>=0?'#3FB06F':'#E0553F'}"><span>${saldo>=0?'Sobrou no mês':'Faltou no mês'}</span><b>${R(saldo)}</b><small>Ganhos ${R(Gm.tot)} − gastos ${R(Pm.tot)}${Gm.tot?' · gastou '+Math.round(Pm.tot/Gm.tot*100)+'% do que ganhou':''}</small></div>
 <div class="kpis psk">${kpi('Ganhos',R(Gm.tot),Gm.fx.length?`${Gm.fx.filter(x=>(x.pagos||{})[m]).length} de ${Gm.fx.length} fixos recebidos`:plural(Gm.av.length,'lançamento','lançamentos'),'#3FB06F')}${kpi('Gastos',R(Pm.tot),'média '+R(Pm.tot/Math.max(1,nd))+' por dia','#E0553F')}${m==t.slice(0,7)?kpi('Gastos hoje',R(hoje),'',ROXO):kpi('Contas pagas',`${Pm.fx.filter(x=>(x.pagos||{})[m]).length}/${Pm.fx.length}`,R(Pm.tF)+' em contas',ROXO)}</div>
 ${grafMeses(m)}${grafDias(m)}
 <div class="seg pstab" role="group"><button type="button" class="${ab=='g'?'on':''}" aria-pressed="${ab=='g'}" onclick="S.f.pab='g';render()">Gastos · ${R(Pm.tot)}</button><button type="button" class="${ab=='r'?'on':''}" aria-pressed="${ab=='r'}" onclick="S.f.pab='r';render()">Ganhos · ${R(Gm.tot)}</button></div>
 ${aba}<div style="height:80px"></div>${psFab()}`}
const psFab=()=>`<button type="button" id="psfab" aria-label="Falar um gasto ou ganho pessoal" onclick="psVoz()">${svgi('mic')}<span>Falar</span></button>`;

/* ---------- formulário (gasto ou ganho; avulso ou de todo mês) ---------- */
function psForm(x,titulo,dica){const novo=!x.id,t2=tp(x),m=/^\d{4}-\d{2}$/.test(S.f.pm||'')?S.f.pm:today().slice(0,7),mL=(y=>y[0].toUpperCase()+y.slice(1))(new Date(m+'-15T12:00').toLocaleDateString('pt-BR',{month:'long'}));
 const C=cats(t2).map(c=>c.n),cat=x.cat&&!C.includes(x.cat)?[x.cat,...C]:C;
 const v={desc:x.desc||'',valor:x.mensal&&!novo?valM(x,m):(x.valor||''),cat:x.cat||(t2=='r'?C[0]:outro('g')),data:x.data||today(),tipo:t2,mod:x.mensal?'mes':'dia',dia:x.dia||'',ap:'todos',fim:x.fim||''};
 const F=[['tipo','É um','select',[['g','Gasto'],['r','Ganho']]],['desc',t2=='r'?'De onde veio':'O que foi','text',null,1],['valor','Valor (R$)','number',null,1],['cat','Categoria','select',cat],['mod','Repete?','select',[['dia','Só uma vez'],['mes','Todo mês']]],['data','Data','date'],['dia','Dia do mês (vence ou cai)','text']];
 if(!novo&&x.mensal)F.push(['ap','Mudar o valor','select',[['todos','Em todos os meses'],['mes','Só em '+mL]]],['fim','Último mês (deixe vazio se continua)','month']);
 modal(titulo||(novo?(t2=='r'?'Anotar ganho pessoal':'Anotar gasto pessoal'):(t2=='r'?'Editar ganho':'Editar gasto')),F,v,o=>{
  const val=nBR(o.valor);if(!(val>0))return toast('Informe o valor');if(!String(o.desc||'').trim())return toast(o.tipo=='r'?'Diga de onde veio o ganho':'Diga o que foi o gasto');
  const it=novo?{id:uid()}:PS().find(y=>y.id==x.id);if(!it)return;const mes=o.mod=='mes',v2=Math.round(val*100)/100;
  if(!novo&&x.mensal&&mes&&o.ap=='mes'){it.vals=it.vals||{};it.vals[m]=v2}else{it.valor=v2;if(!novo&&mes&&it.vals&&it.vals[m]!=null&&o.ap!='mes')delete it.vals[m]}
  Object.assign(it,{tipo:o.tipo=='r'?'r':'g',desc:o.desc.trim(),cat:o.cat||outro(o.tipo),data:o.data||today(),mensal:mes?1:0,dia:mes?String(o.dia||'').replace(/\D/g,'').slice(0,2):''});
  if(mes&&o.fim!==undefined)it.fim=/^\d{4}-\d{2}$/.test(o.fim||'')?o.fim:'';if(!mes){delete it.fim;delete it.vals;delete it.pagos}
  if(novo)PS().push(it);S.f.pab=it.tipo;save();render();toast((novo?'Anotado: ':'Salvo: ')+it.desc+' · '+(it.tipo=='r'?'+':'')+R(v2)+(mes?' todo mês':''),'ok')},
  `<div class="psav sm">${svgi('lock')}<span>${dica?e(dica)+' · ':''}Só você vê. Não entra nas contas da oficina.</span></div>`,novo?null:()=>{G.psDel(x.id)});
 const f=$q('#modal form');if(!f)return;
 const tg=()=>{const mes=f.mod.value=='mes';f.dia.closest('label').hidden=!mes;f.data.closest('label').firstChild.textContent=mes?'Começa em':'Data';if(f.ap)f.ap.closest('label').hidden=!mes;if(f.fim)f.fim.closest('label').hidden=!mes};
 const tt=()=>{const r=f.tipo.value=='r',L=cats(r?'r':'g').map(c=>c.n),cur=f.cat.value;f.cat.innerHTML=L.map(n=>`<option ${n==cur?'selected':''}>${e(n)}</option>`).join('');if(!L.includes(cur))f.cat.value=r?L[0]:outro('g');
  f.desc.closest('label').firstChild.textContent=r?'De onde veio':'O que foi';const h=$q('#modal h2');if(h&&novo)h.textContent=r?'Anotar ganho pessoal':'Anotar gasto pessoal';$q('#modal .md').classList.toggle('psr-r',r)};
 f.mod.addEventListener('change',tg);f.tipo.addEventListener('change',tt);tg();$q('#modal .md').classList.toggle('psr-r',t2=='r')}
G.psNovo=pre=>psForm(pre||{});
G.psEdit=id=>{const x=PS().find(y=>y.id==id);if(x)psForm(x)};
G.psDel=id=>{const x=PS().find(y=>y.id==id);db.pess=PS().filter(y=>y.id!=id);save();render();toast((x&&tp(x)=='r'?'Ganho':'Gasto')+' excluído')};
G.psPago=(id,m)=>{const x=PS().find(y=>y.id==id);if(!x)return;x.pagos=x.pagos||{};if(x.pagos[m])delete x.pagos[m];else x.pagos[m]=today();save();render()};

/* ---------- categorias: criar, renomear, trocar a cor, excluir ---------- */
G.psCats=function(){const lin=t2=>cats(t2).map(c=>{const i=PC().indexOf(c),n=PS().filter(x=>tp(x)==t2&&x.cat==c.n).length;return`<div class="pscr"><button type="button" class="pscor" style="background:${c.c}" aria-label="Trocar cor" onclick="psCatCor(${i})"></button><span><b>${e(c.n)}</b><small>${n?plural(n,'lançamento','lançamentos'):'sem lançamentos'}</small></span><button type="button" class="sm" onclick="psCatEd(${i})">Renomear</button>${c.n==outro(t2)?'':`<button type="button" class="sm dg" onclick="psCatDel(${i})">Excluir</button>`}</div>`}).join('');
 $('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="Categorias"><div class="psh-h"><h2>Categorias</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>
 <h3 class="pscH" style="color:#E0553F">Gastos</h3>${lin('g')}<div class="bar" style="margin:6px 0 14px"><button type="button" class="sm" onclick="psCatEd(-1,'g')">+ Categoria de gasto</button></div>
 <h3 class="pscH" style="color:#3FB06F">Ganhos</h3>${lin('r')}<div class="bar" style="margin:6px 0 0"><button type="button" class="sm" onclick="psCatEd(-1,'r')">+ Categoria de ganho</button></div></div></div>`};
G.psCatEd=function(i,t2){const c=i>=0?PC()[i]:null,n=prompt(c?'Novo nome da categoria:':'Nome da nova categoria:',c?c.n:'');if(n==null)return;const nm=n.trim().replace(/\s+/g,' ');if(!nm)return;
 const tt=c?c.t:t2;if(PC().some(x=>x!==c&&x.t==tt&&nrm(x.n)==nrm(nm)))return toast('Já existe uma categoria com esse nome','av');
 if(c){const ant=c.n;c.n=nm;PS().forEach(x=>{if(tp(x)==tt&&x.cat==ant)x.cat=nm})}else PC().push({t:tt,n:nm,c:PAL[PC().filter(x=>x.t==tt).length%PAL.length]});save();psCats();render()};
G.psCatCor=function(i){const c=PC()[i];if(!c)return;c.c=PAL[(PAL.indexOf(c.c)+1)%PAL.length];save();psCats();render()};
G.psCatDel=function(i){const c=PC()[i];if(!c)return;const n=PS().filter(x=>tp(x)==c.t&&x.cat==c.n).length;if(!confirm('Excluir a categoria “'+c.n+'”?'+(n?'\n\n'+plural(n,'lançamento vai','lançamentos vão')+' para “'+outro(c.t)+'”.':'')))return;
 PS().forEach(x=>{if(tp(x)==c.t&&x.cat==c.n)x.cat=outro(c.t)});db.pcats=PC().filter(x=>x!==c);save();psCats();render()};

/* ---------- entender a frase falada ---------- */
const NUM={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,três:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,quatorze:14,catorze:14,quinze:15,dezesseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,duzentos:200,trezentos:300,quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,oitocentos:800,novecentos:900};
function palNum(t){/* "trinta e cinco" -> 35 ; "mil e duzentos" -> 1200 */return t.replace(/\b((?:(?:zero|uma?|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil)(?:\s+e\s+|\s+|$))+)/gi,g=>{
 const w=g.trim().toLowerCase().split(/\s+e\s+|\s+/);if(w.length==1&&/^(uma?|dois|duas)$/.test(w[0]))return g;let tot=0,cur=0,ok=false;w.forEach(x=>{if(x=='mil'){tot+=(cur||1)*1000;cur=0;ok=true}else if(NUM[x]!=null){cur+=NUM[x];ok=true}});return ok?' '+(tot+cur)+' ':g})}
/* limites de palavra que entendem acento (o \\b do JavaScript corta “almoço” no ç) */
const B0='(?<![\\p{L}\\d])',B1='(?![\\p{L}\\d])';
const KWR=[['Retirada da oficina','retirada|retirei|pr[oó][- ]?labore|oficina'],['Salário','sal[aá]rio'],['Aluguel recebido','aluguel'],['Vendas','vendi|venda'],['Extra / bico','bico|extra|servi[cç]o por fora']];
const KW=[['Alimentação','almoço|almoco|janta|jantar|café|cafe|lanche|mercado|supermercado|padaria|açougue|acougue|comida|restaurante|pizza|feira|marmita|hamburguer|sorvete|ifood|refeição'],
 ['Casa','aluguel|condomínio|condominio|luz|energia|água|agua|gás|gas|iptu|móvel|movel|reforma|faxina|diarista|casa'],
 ['Transporte','gasolina|combustível|combustivel|etanol|álcool|alcool|uber|99|ônibus|onibus|estacionamento|pedágio|pedagio|ipva|licenciamento|moto|lava jato|lavagem'],
 ['Saúde','farmácia|farmacia|remédio|remedio|médico|medico|dentista|plano de saúde|plano de saude|exame|consulta|hospital|academia'],
 ['Contas e assinaturas','internet|celular|telefone|netflix|spotify|streaming|assinatura|cartão|cartao|fatura|empréstimo|emprestimo|financiamento|parcela|prestação|prestacao|seguro|boleto|conta'],
 ['Lazer','cinema|bar|cerveja|viagem|passeio|festa|show|churrasco|presente|jogo'],
 ['Educação','escola|curso|faculdade|livro|material escolar|mensalidade escolar|creche']];
G.psEntende=function(frase){let t=' '+String(frase||'').toLowerCase().replace(/r\$\s*/g,' ')+' ';const orig=String(frase||'').trim();t=palNum(t);
 let valor=0;const t2=t.replace(/(?:vence\s+(?:no\s+)?)?dia\s+\d{1,2}/g,' '),mr=t2.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:reais|real|conto|contos|pila)(?:\s+e\s+(\d{1,2})\s*centavos?)?/),mc=mr||t2.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)(?:\s*(?:reais|real|conto|contos|pila))?(?:\s+e\s+(\d{1,2})\s*centavos?)?/);
 if(mc){valor=nBR(mc[1].replace(/\.(?=\d{3}\b)/g,''))||0;if(mc[2])valor+=(+mc[2])/100}
 const mensal=/todo m[eê]s|todos os meses|mensal|por m[eê]s|mensalidade|fixa\b|fixo\b/.test(t);
 let data=today();if(/\banteontem\b/.test(t))data=addD(today(),-2);else if(/\bontem\b/.test(t))data=addD(today(),-1);else{const md=t.match(/\bdia\s+(\d{1,2})\b/);if(md&&!mensal){const d=Math.min(28,+md[1]),h=today();let c=h.slice(0,8)+pad(d);if(c>h)c=(()=>{const x=new Date(h+'T12:00');x.setDate(1);x.setMonth(x.getMonth()-1);return ymd(x).slice(0,8)+pad(d)})();data=c}}
 let dia='';if(mensal){const mv=t.match(/vence\s+(?:no\s+)?dia\s+(\d{1,2})|\bdia\s+(\d{1,2})\b/);if(mv)dia=String(mv[1]||mv[2])}
 const ganho=new RegExp(B0+'(recebi|ganhei|entrou|entrada de|caiu|receita|ganho|retirada|retirei|pr[oó][- ]?labore|sal[aá]rio|vendi|me pagaram|me pagou|pix recebido)'+B1,'u').test(t);
 let cat=ganho?'Outros ganhos':'Outros';if(ganho){for(const [c,re] of KWR){if(new RegExp(B0+'('+re+')'+B1,'u').test(t)){cat=c;break}}}else{for(const [c,re] of KW){if(new RegExp(B0+'('+re+')'+B1,'u').test(t)){cat=c;break}}}
 if(!cats(ganho?'r':'g').some(x=>x.n==cat))cat=outro(ganho?'r':'g');
 let desc=palNum(' '+orig.replace(/r\$\s*/gi,' ')+' ').replace(/(?:vence\s+(?:no\s+)?)?dia\s+\d{1,2}/gi,' ').replace(/\d+(?:[.,]\d+)*(?:\s*(?:reais|real|conto|contos|pila))?(?:\s+e\s+\d{1,2}\s*centavos?)?/gi,' ')
  .replace(new RegExp(B0+'(gastei|paguei|comprei|recebi|ganhei|entrou|caiu|anota|anotar|anote|coloca|lança|lancar|lançar|registra|hoje|ontem|anteontem|todo m[eê]s|todos os meses|mensal|por m[eê]s|vence|reais|real|centavos?)'+B1,'giu'),' ').replace(/\s+/g,' ').trim()
  .replace(new RegExp(B0+'(de|do|da)\\s+(?=(pra|para|de|do|da)'+B1+')','giu'),'')
  .replace(new RegExp('^(?:(?:foi|deu|com|de|do|da|no|na|em|um|uma|o|a|os|as|e|pra|para)'+B1+'\\s*)+','iu'),'').replace(new RegExp('(?:\\s*'+B0+'(?:foi|deu|com|de|do|da|no|na|em|um|uma|o|a|os|as|e|pra|para))+$','iu'),'');
 if(!desc)desc=cat==outro(ganho?'r':'g')?(ganho?'Ganho':'Gasto'):cat;desc=desc[0].toUpperCase()+desc.slice(1);
 return{tipo:ganho?'r':'g',desc,valor:Math.round(valor*100)/100,cat,data,mensal:mensal?1:0,dia,frase:orig}};

/* ---------- microfone próprio ---------- */
let REC=null;
G.psVoz=function(){if(!DONO())return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Este navegador não aceita ditado. Digite o lançamento.','av');return psNovo()}
 psVozFim();const ov=document.createElement('div');ov.id='psvz';ov.innerHTML=`<div class="psvb"><div class="psvi">${svgi('mic')}</div><b>Fale o gasto ou o ganho</b><p id="psvt">Ex.: “almoço 35 reais”, “conta de luz 180 todo mês”, “recebi 500 de bico”</p><small>${svgi('lock')} Só anota nas suas finanças pessoais, separado da oficina.</small><div class="bar" style="justify-content:center;margin:14px 0 0"><button type="button" onclick="psVozFim()">Cancelar</button><button type="button" onclick="psVozFim();psNovo()">Digitar</button></div></div>`;
 ov.addEventListener('click',ev=>{if(ev.target===ov)psVozFim()});document.body.appendChild(ov);
 let txt='';try{REC=new SR();REC.lang='pt-BR';REC.interimResults=true;REC.continuous=false;REC.maxAlternatives=1;
  REC.onresult=ev=>{txt=[...ev.results].map(r=>r[0].transcript).join(' ');const p=$q('#psvt');if(p)p.textContent='“'+txt+'”'};
  REC.onerror=ev=>{const m=ev.error=='not-allowed'?'Libere o microfone para este site nas configurações do Chrome.':ev.error=='no-speech'?'Não ouvi nada. Toque no microfone e fale de novo.':'Não consegui ouvir. Tente de novo ou digite.';const p=$q('#psvt');if(p)p.textContent=m;txt=''};
  REC.onend=()=>{REC=null;if(!txt.trim())return;const x=psEntende(txt);psVozFim();
   if(!(x.valor>0))return psForm({tipo:x.tipo,desc:x.desc,cat:x.cat,data:x.data,mensal:x.mensal,dia:x.dia},'Confira','Não entendi o valor de “'+x.frase+'”');
   psForm(x,'Confira e salve','Você disse: “'+x.frase+'”')};
  REC.start()}catch(x){psVozFim();toast('Não consegui ligar o microfone. Digite o gasto.','av');psNovo()}};
G.psVozFim=function(){try{REC&&REC.abort()}catch(x){}REC=null;const o=$q('#psvz');if(o)o.remove()};
addEventListener('popstate',()=>psVozFim(),true);

/* ---------- ligar no app ---------- */
try{Object.assign(ICO,{lock:ICO.lock||'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',mic:ICO.mic||'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>'})}catch(x){}
try{V.pessoal=Vpessoal;if(Array.isArray(DONLY)&&!DONLY.includes('pessoal'))DONLY.push('pessoal')}catch(x){}
/* aviso a cada entrada */
const _go=go;G.go=go=function(k,...r){const de=S.v;const x=_go(k,...r);if(k=='pessoal'&&de!='pessoal'&&DONO())setTimeout(()=>toast('Finanças pessoais: separado da oficina. Só você vê.','in'),120);return x};
/* botão em Finanças */
const _Vfin=V.fin;if(typeof _Vfin=='function')V.fin=function(){let h=_Vfin();if(!DONO())return h;const m=today().slice(0,7),gg=doMes(m,'r').tot,pp=doMes(m,'g').tot,tot=gg||pp,sal=gg-pp;
 const b=`<button type="button" class="psbt" onclick="go('pessoal')">${svgi('lock')}<span><b>Finanças pessoais</b><small>Só você vê · separado da oficina${tot?` · ${sal>=0?'sobrou':'faltou'} ${R(Math.abs(sal))} no mês`:''}</small></span><i>›</i></button>`;
 const i=h.indexOf('<div class="card fdia"');return i>=0?h.slice(0,i)+b+h.slice(i):h+b};
/* nesta tela o microfone do assistente dá lugar ao microfone dos gastos */
const _r=render;G.render=render=function(...a){const r=_r(...a);document.body.classList.toggle('pss',S.v=='pessoal');return r};

const st=document.createElement('style');st.textContent=`
body.pss #vzfab{display:none!important}
.psadd{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 12px}.psadd button{margin:0;min-height:52px;border-radius:14px;font:700 18px/1 'Barlow',sans-serif}
.psbg{background:color-mix(in srgb,#E0553F 18%,transparent);color:#ff7a63;border:1px solid color-mix(in srgb,#E0553F 60%,transparent)}.psbr{background:color-mix(in srgb,#3FB06F 18%,transparent);color:#4fc97f;border:1px solid color-mix(in srgb,#3FB06F 60%,transparent)}
.pssal{border-radius:14px;padding:12px 16px;margin:0 0 10px;background:color-mix(in srgb,var(--c) 13%,transparent);border-left:5px solid var(--c)}.pssal span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)}.pssal b{display:block;font:700 32px/1.1 'Barlow Condensed','Barlow',sans-serif;color:var(--c)}.pssal small{color:var(--mut);font-size:13px}
.psg{padding:12px 12px 10px}.psgh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:4px}.psleg{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--mut)}.psleg i{width:10px;height:10px;border-radius:3px;margin-left:6px}
.pstab{margin:4px 0 10px}.pstab button{flex:1}
.psv.r{color:#3FB06F}.psck.r{border-color:color-mix(in srgb,#3FB06F 60%,transparent)}
.pscl b small{display:inline-block;margin-left:6px;color:var(--mut);font-weight:500;font-size:11.5px}
.pscH{font-size:13px;text-transform:uppercase;letter-spacing:.07em;margin:4px 0 6px}
.pscr{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--ln)}.pscr span{flex:1;min-width:0}.pscr b{display:block}.pscr small{display:block;color:var(--mut);font-size:12px}.pscr button{margin:0;flex:none}
.pscor{width:28px;height:28px;padding:0!important;border-radius:50%;border:2px solid rgba(255,255,255,.25)!important}
.md.psr-r{border-top:4px solid #3FB06F}
.psbt{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;border-radius:14px;border:1px solid color-mix(in srgb,${ROXO} 55%,transparent);background:color-mix(in srgb,${ROXO} 14%,var(--sf));color:var(--ink);text-align:left}
.psbt svg{width:24px;height:24px;flex:none;fill:none;stroke:${ROXO};stroke-width:2}.psbt span{flex:1;min-width:0}.psbt b{display:block;font-size:16px}.psbt small{display:block;color:var(--mut);font-size:12.5px}.psbt i{font-style:normal;font-size:24px;color:${ROXO}}
.pspr{background:${ROXO}!important;border-color:${ROXO}!important;color:#fff!important}
.psav{display:flex;gap:10px;align-items:flex-start;margin:0 0 12px;padding:10px 12px;border-radius:12px;border:1px dashed color-mix(in srgb,${ROXO} 70%,transparent);background:color-mix(in srgb,${ROXO} 10%,transparent)}
.psav svg{width:20px;height:20px;flex:none;fill:none;stroke:${ROXO};stroke-width:2;margin-top:1px}.psav b{display:block;color:${ROXO};font-size:14.5px}.psav span{display:block;font-size:13px;color:var(--mut)}
.psav.sm{margin:-4px 0 12px;padding:7px 10px;align-items:center}.psav.sm span{font-size:12.5px}
.psm{display:flex;align-items:center;gap:10px;margin:0 0 10px}.psm b{flex:1;text-align:center;font:700 19px/1.2 'Barlow Condensed','Barlow',sans-serif}.psm .ib{margin:0;font-size:22px}.psm .ib:disabled{opacity:.3}
.psk{grid-template-columns:repeat(3,1fr)!important}@media (max-width:420px){.psk{grid-template-columns:1fr 1fr!important}.psk .kpi:last-child{grid-column:1/-1}}.psk .kpi .num{font-size:20px}
.psc{display:grid;gap:7px;margin-top:8px}.pscl{display:grid;grid-template-columns:minmax(90px,38%) 1fr auto;gap:8px;align-items:center;font-size:13.5px}.pscl span{color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pscl i{height:10px;border-radius:5px;background:color-mix(in srgb,var(--ln) 70%,transparent);position:relative;overflow:hidden}.pscl i::after{content:'';position:absolute;inset:0 auto 0 0;width:var(--w);background:var(--c);border-radius:5px}.pscl b{font-variant-numeric:tabular-nums}
.psl{padding:2px 12px}.psr{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--ln);cursor:pointer}.psr:first-child{border-top:0}
.psd{flex:1;min-width:0}.psd b{display:block;font-weight:600;overflow-wrap:anywhere}.psd small{display:block;color:var(--mut);font-size:12.5px}.psv{flex:none;font-variant-numeric:tabular-nums}
.psr.ok .psd b,.psr.ok .psv{color:var(--mut);font-weight:500}.psck{flex:none;width:30px;height:30px;margin:0;padding:0;border-radius:8px;border:2px solid var(--ln);background:transparent;color:#fff;font-weight:800}.psr.ok .psck{background:#2E8B57;border-color:#2E8B57}
.psdot{flex:none;width:10px;height:10px;border-radius:50%}
.psdia>small{display:flex;justify-content:space-between;margin:12px 2px 6px;color:var(--mut);font-size:12.5px;text-transform:uppercase;letter-spacing:.06em}.psdia>small b{color:var(--ink);letter-spacing:0}
#psfab{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(var(--bnh,0px) + 18px + env(safe-area-inset-bottom,0px));z-index:18;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:66px;height:66px;border-radius:50%;border:0;padding:0;margin:0;background:${ROXO};color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.4)}
#psfab svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round}#psfab span{font-size:10.5px;font-weight:700}
body.kbopen #psfab{display:none}
#psvz{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;padding:16px}
.psvb{width:min(100%,460px);background:var(--sf);border:1px solid var(--ln);border-top:4px solid ${ROXO};border-radius:18px;padding:22px 18px 18px;text-align:center;margin-bottom:calc(env(safe-area-inset-bottom,0px) + 8px)}
.psvi{width:74px;height:74px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;background:${ROXO};color:#fff;animation:psp 1.4s ease-in-out infinite}.psvi svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round}
@keyframes psp{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,${ROXO} 60%,transparent)}50%{box-shadow:0 0 0 16px transparent}}
.psvb>b{display:block;font:700 22px/1.2 'Barlow Condensed','Barlow',sans-serif}.psvb p{margin:8px 0;color:var(--ink);font-size:16px;min-height:44px}.psvb small{display:flex;gap:6px;justify-content:center;align-items:center;color:var(--mut);font-size:12.5px}.psvb small svg{width:14px;height:14px;fill:none;stroke:${ROXO};stroke-width:2}
`;document.head.appendChild(st);
})(window);
