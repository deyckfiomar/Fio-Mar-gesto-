/* Fio-Mar Gestor — Finanças pessoais do dono (versão 2.24.0)
   - Só o dono vê. Fica na linha privada do dono no servidor (db.pess), separado da oficina.
   - Gastos do dia e contas de todo mês, por categoria, com mês a mês.
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
const CATS=[['Alimentação','#E58E26'],['Casa','#2F6FB0'],['Transporte','#17A2B8'],['Saúde','#2E8B57'],['Contas e assinaturas','#8E5BD0'],['Lazer','#D8577E'],['Educação','#B8860B'],['Outros','#7A7F87']];
const corCat=c=>(CATS.find(x=>x[0]==c)||CATS[7])[1];
const ativa=(x,m)=>x.mensal&&String(x.data||'').slice(0,7)<=m&&(!x.fim||x.fim>=m);
const valM=(x,m)=>+((x.vals||{})[m]!=null?x.vals[m]:x.valor)||0;

/* ---------- tela ---------- */
function Vpessoal(){if(!DONO())return empty('fin','Só o dono da oficina vê esta tela.');
 const t=today(),m=/^\d{4}-\d{2}$/.test(S.f.pm||'')?S.f.pm:t.slice(0,7),L=PS(),av=L.filter(x=>!x.mensal&&String(x.data).slice(0,7)==m),fx=L.filter(x=>ativa(x,m)),
  tA=av.reduce((a,x)=>a+(+x.valor||0),0),tF=fx.reduce((a,x)=>a+valM(x,m),0),tot=tA+tF,pg=fx.filter(x=>(x.pagos||{})[m]),hoje=L.filter(x=>!x.mensal&&x.data==t).reduce((a,x)=>a+(+x.valor||0),0),
  nd=m==t.slice(0,7)?+t.slice(8,10):dimM(m),cats={};av.forEach(x=>cats[x.cat||'Outros']=(cats[x.cat||'Outros']||0)+(+x.valor||0));fx.forEach(x=>cats[x.cat||'Outros']=(cats[x.cat||'Outros']||0)+valM(x,m));
 const cl=Object.entries(cats).sort((a,b)=>b[1]-a[1]),mx=cl.length?cl[0][1]:1,ml=(x=>x[0].toUpperCase()+x.slice(1))(new Date(m+'-15T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}));
 const dias=[...new Set(av.map(x=>x.data))].sort().reverse();
 const kpi=(l,v,s)=>`<div class="kpi" style="--c:${ROXO}"><span>${l}</span><div class="num">${v}</div>${s?`<small class="muted">${s}</small>`:''}</div>`;
 return head({back:"go('fin')",kick:'Só você vê',title:'Finanças pessoais',c:ROXO,right:`<button class="pr hb pspr" onclick="psNovo()">+ Gasto</button>`})+
 `<div class="psav" role="note">${svgi('lock')}<div><b>Separado da oficina</b><span>Estes gastos são seus. Não entram no lucro, no caixa nem nos relatórios da oficina, e os mecânicos não veem.</span></div></div>
 <div class="psm"><button type="button" class="ib" aria-label="Mês anterior" onclick="S.f.pm='${mAdd(m,-1)}';render()">‹</button><b>${ml}</b><button type="button" class="ib" aria-label="Mês seguinte" ${m>=t.slice(0,7)?'disabled':''} onclick="S.f.pm='${mAdd(m,1)}';render()">›</button></div>
 <div class="kpis psk">${m==t.slice(0,7)?kpi('Hoje',R(hoje),'gastos do dia'):''}${kpi('No mês',R(tot),'média '+R(tot/Math.max(1,nd))+' por dia')}${kpi('Contas do mês',R(tF),fx.length?`${pg.length} de ${fx.length} pagas`:'nenhuma cadastrada')}${m==t.slice(0,7)?'':kpi('Gastos do dia a dia',R(tA),plural(av.length,'lançamento','lançamentos'))}</div>
 ${cl.length?`<div class="card"><b>Por categoria</b><div class="psc">${cl.map(([c,v])=>`<div class="pscl"><span>${e(c)}</span><i style="--w:${Math.max(3,v/mx*100)}%;--c:${corCat(c)}"></i><b>${R(v)}</b></div>`).join('')}</div></div>`:''}
 ${sech('Contas de todo mês',fx.length?R(tF):'')}${fx.length?`<div class="card psl">${fx.sort((a,b)=>(+(a.dia||28))-(+(b.dia||28))).map(x=>{const pago=(x.pagos||{})[m];return`<div class="psr${pago?' ok':''}"><button type="button" class="psck" aria-pressed="${!!pago}" aria-label="${pago?'Paga':'Marcar como paga'}" onclick="psPago('${x.id}','${m}')">${pago?'✓':''}</button><div class="psd" onclick="psEdit('${x.id}')"><b>${e(x.desc)}</b><small>${e(x.cat||'Outros')}${x.dia?' · vence dia '+e(x.dia):''}${pago?' · paga em '+D(pago).slice(0,5):''}</small></div><b class="psv">${R(valM(x,m))}</b></div>`}).join('')}</div>`
  :`<p class="muted" style="margin:0 0 12px">Cadastre aluguel, luz, internet, escola... Fale no microfone "conta de luz 180 todo mês".</p>`}
 ${sech('Gastos do dia a dia',av.length?R(tA):'')}${dias.length?dias.map(d=>{const I=av.filter(x=>x.data==d);return`<div class="psdia"><small>${d==t?'Hoje':d==addD(t,-1)?'Ontem':new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'})}<b>${R(I.reduce((a,x)=>a+(+x.valor||0),0))}</b></small><div class="card psl">${I.map(x=>`<div class="psr" onclick="psEdit('${x.id}')"><i class="psdot" style="background:${corCat(x.cat)}"></i><div class="psd"><b>${e(x.desc)}</b><small>${e(x.cat||'Outros')}</small></div><b class="psv">${R(x.valor)}</b></div>`).join('')}</div></div>`}).join('')
  :empty('fin','Nenhum gasto anotado em '+ml+'.',`<button class="pr" onclick="psNovo()">+ Anotar gasto</button>`)}
 <div style="height:80px"></div>${psFab()}`}
const psFab=()=>`<button type="button" id="psfab" aria-label="Falar um gasto pessoal" onclick="psVoz()">${svgi('mic')}<span>Gasto</span></button>`;

/* ---------- formulário ---------- */
const TIPOS=[['dia','Gasto do dia'],['mes','Conta de todo mês']];
function psForm(x,titulo,dica){const novo=!x.id,v={desc:x.desc||'',valor:x.valor||'',cat:x.cat||'Outros',data:x.data||today(),tipo:x.mensal?'mes':'dia',dia:x.dia||''};
 modal(titulo||(novo?'Anotar gasto pessoal':'Editar gasto pessoal'),[['desc','O que foi','text',null,1],['valor','Valor (R$)','number',null,1],['cat','Categoria','select',CATS.map(c=>c[0])],['tipo','Tipo','select',TIPOS],['data','Data (de quando começa, se for conta de todo mês)','date'],['dia','Vence no dia (contas de todo mês)','text']],v,o=>{
  const val=nBR(o.valor);if(!(val>0))return toast('Informe o valor');if(!String(o.desc||'').trim())return toast('Diga o que foi o gasto');
  const it=novo?{id:uid()}:PS().find(y=>y.id==x.id);if(!it)return;
  Object.assign(it,{desc:o.desc.trim(),valor:Math.round(val*100)/100,cat:o.cat||'Outros',data:o.data||today(),mensal:o.tipo=='mes'?1:0,dia:o.tipo=='mes'?String(o.dia||'').replace(/\D/g,'').slice(0,2):''});
  if(novo)PS().push(it);save();render();toast((novo?'Anotado: ':'Salvo: ')+it.desc+' · '+R(it.valor)+(it.mensal?' todo mês':''),'ok')},
  `<div class="psav sm">${svgi('lock')}<span>${dica?e(dica)+' · ':''}Só você vê. Não entra nas contas da oficina.</span></div>`,novo?null:()=>{G.psDel(x.id)});
 const f=$q('#modal form');if(f&&f.tipo){const tg=()=>{const mes=f.tipo.value=='mes';f.dia.closest('label').hidden=!mes};f.tipo.addEventListener('change',tg);tg()}}
G.psNovo=pre=>psForm(pre||{});
G.psEdit=id=>{const x=PS().find(y=>y.id==id);if(x)psForm(x)};
G.psDel=id=>{db.pess=PS().filter(x=>x.id!=id);save();render();toast('Gasto excluído')};
G.psPago=(id,m)=>{const x=PS().find(y=>y.id==id);if(!x)return;x.pagos=x.pagos||{};if(x.pagos[m])delete x.pagos[m];else x.pagos[m]=today();save();render()};

/* ---------- entender a frase falada ---------- */
const NUM={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,três:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,quatorze:14,catorze:14,quinze:15,dezesseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,duzentos:200,trezentos:300,quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,oitocentos:800,novecentos:900};
function palNum(t){/* "trinta e cinco" -> 35 ; "mil e duzentos" -> 1200 */return t.replace(/\b((?:(?:zero|uma?|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil)(?:\s+e\s+|\s+|$))+)/gi,g=>{
 const w=g.trim().toLowerCase().split(/\s+e\s+|\s+/);if(w.length==1&&/^(uma?|dois|duas)$/.test(w[0]))return g;let tot=0,cur=0,ok=false;w.forEach(x=>{if(x=='mil'){tot+=(cur||1)*1000;cur=0;ok=true}else if(NUM[x]!=null){cur+=NUM[x];ok=true}});return ok?' '+(tot+cur)+' ':g})}
/* limites de palavra que entendem acento (o \\b do JavaScript corta “almoço” no ç) */
const B0='(?<![\\p{L}\\d])',B1='(?![\\p{L}\\d])';
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
 let cat='Outros';for(const [c,re] of KW){if(new RegExp(B0+'('+re+')'+B1,'u').test(t)){cat=c;break}}
 let desc=palNum(' '+orig.replace(/r\$\s*/gi,' ')+' ').replace(/(?:vence\s+(?:no\s+)?)?dia\s+\d{1,2}/gi,' ').replace(/\d+(?:[.,]\d+)*(?:\s*(?:reais|real|conto|contos|pila))?(?:\s+e\s+\d{1,2}\s*centavos?)?/gi,' ')
  .replace(new RegExp(B0+'(gastei|paguei|comprei|anota|anotar|anote|coloca|lança|lancar|lançar|registra|hoje|ontem|anteontem|todo m[eê]s|todos os meses|mensal|por m[eê]s|vence|reais|real|centavos?)'+B1,'giu'),' ').replace(/\s+/g,' ').trim()
  .replace(new RegExp(B0+'(de|do|da)\\s+(?=(pra|para|de|do|da)'+B1+')','giu'),'')
  .replace(new RegExp('^(?:(?:foi|deu|com|de|do|da|no|na|em|um|uma|o|a|os|as|e|pra|para)'+B1+'\\s*)+','iu'),'').replace(new RegExp('(?:\\s*'+B0+'(?:foi|deu|com|de|do|da|no|na|em|um|uma|o|a|os|as|e|pra|para))+$','iu'),'');
 if(!desc)desc=cat=='Outros'?'Gasto':cat;desc=desc[0].toUpperCase()+desc.slice(1);
 return{desc,valor:Math.round(valor*100)/100,cat,data,mensal:mensal?1:0,dia,frase:orig}};

/* ---------- microfone próprio ---------- */
let REC=null;
G.psVoz=function(){if(!DONO())return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Este navegador não aceita ditado. Digite o gasto.','av');return psNovo()}
 psVozFim();const ov=document.createElement('div');ov.id='psvz';ov.innerHTML=`<div class="psvb"><div class="psvi">${svgi('mic')}</div><b>Fale o gasto pessoal</b><p id="psvt">Ex.: “almoço 35 reais”, “gasolina 100 ontem”, “conta de luz 180 todo mês”</p><small>${svgi('lock')} Só anota nas suas finanças pessoais, separado da oficina.</small><div class="bar" style="justify-content:center;margin:14px 0 0"><button type="button" onclick="psVozFim()">Cancelar</button><button type="button" onclick="psVozFim();psNovo()">Digitar</button></div></div>`;
 ov.addEventListener('click',ev=>{if(ev.target===ov)psVozFim()});document.body.appendChild(ov);
 let txt='';try{REC=new SR();REC.lang='pt-BR';REC.interimResults=true;REC.continuous=false;REC.maxAlternatives=1;
  REC.onresult=ev=>{txt=[...ev.results].map(r=>r[0].transcript).join(' ');const p=$q('#psvt');if(p)p.textContent='“'+txt+'”'};
  REC.onerror=ev=>{const m=ev.error=='not-allowed'?'Libere o microfone para este site nas configurações do Chrome.':ev.error=='no-speech'?'Não ouvi nada. Toque no microfone e fale de novo.':'Não consegui ouvir. Tente de novo ou digite.';const p=$q('#psvt');if(p)p.textContent=m;txt=''};
  REC.onend=()=>{REC=null;if(!txt.trim())return;const x=psEntende(txt);psVozFim();
   if(!(x.valor>0))return psForm({desc:x.desc,cat:x.cat,data:x.data,mensal:x.mensal,dia:x.dia},'Confira o gasto','Não entendi o valor de “'+x.frase+'”');
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
const _Vfin=V.fin;if(typeof _Vfin=='function')V.fin=function(){let h=_Vfin();if(!DONO())return h;const L=PS(),m=today().slice(0,7),tot=L.filter(x=>!x.mensal&&String(x.data).slice(0,7)==m).reduce((a,x)=>a+(+x.valor||0),0)+L.filter(x=>ativa(x,m)).reduce((a,x)=>a+valM(x,m),0);
 const b=`<button type="button" class="psbt" onclick="go('pessoal')">${svgi('lock')}<span><b>Finanças pessoais</b><small>Só você vê · separado da oficina${tot?' · '+R(tot)+' no mês':''}</small></span><i>›</i></button>`;
 const i=h.indexOf('<div class="card fdia"');return i>=0?h.slice(0,i)+b+h.slice(i):h+b};
/* nesta tela o microfone do assistente dá lugar ao microfone dos gastos */
const _r=render;G.render=render=function(...a){const r=_r(...a);document.body.classList.toggle('pss',S.v=='pessoal');return r};

const st=document.createElement('style');st.textContent=`
body.pss #vzfab{display:none!important}
.psbt{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;border-radius:14px;border:1px solid color-mix(in srgb,${ROXO} 55%,transparent);background:color-mix(in srgb,${ROXO} 14%,var(--sf));color:var(--ink);text-align:left}
.psbt svg{width:24px;height:24px;flex:none;fill:none;stroke:${ROXO};stroke-width:2}.psbt span{flex:1;min-width:0}.psbt b{display:block;font-size:16px}.psbt small{display:block;color:var(--mut);font-size:12.5px}.psbt i{font-style:normal;font-size:24px;color:${ROXO}}
.pspr{background:${ROXO}!important;border-color:${ROXO}!important;color:#fff!important}
.psav{display:flex;gap:10px;align-items:flex-start;margin:0 0 12px;padding:10px 12px;border-radius:12px;border:1px dashed color-mix(in srgb,${ROXO} 70%,transparent);background:color-mix(in srgb,${ROXO} 10%,transparent)}
.psav svg{width:20px;height:20px;flex:none;fill:none;stroke:${ROXO};stroke-width:2;margin-top:1px}.psav b{display:block;color:${ROXO};font-size:14.5px}.psav span{display:block;font-size:13px;color:var(--mut)}
.psav.sm{margin:-4px 0 12px;padding:7px 10px;align-items:center}.psav.sm span{font-size:12.5px}
.psm{display:flex;align-items:center;gap:10px;margin:0 0 10px}.psm b{flex:1;text-align:center;font:700 19px/1.2 'Barlow Condensed','Barlow',sans-serif}.psm .ib{margin:0;font-size:22px}.psm .ib:disabled{opacity:.3}
.psk{grid-template-columns:repeat(3,1fr)!important}@media (max-width:420px){.psk{grid-template-columns:1fr 1fr!important}.psk .kpi:first-child{grid-column:1/-1}}.psk .kpi .num{font-size:20px}
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
