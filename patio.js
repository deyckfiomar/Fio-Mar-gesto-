/* Fio-Mar Gestor — pátio e visual (versão 2.9.0)
   Pátio em quadro, ícones fixos de situação, atalhos na lista de O.S.,
   linha do tempo do veículo, marcador de combustível e tema garagem. */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const HAZ='repeating-linear-gradient(-45deg,var(--hi) 0 10px,#17181A 10px 20px)';
const dias=a=>a?Math.max(0,Math.round((new Date(today()+'T12:00')-new Date(a+'T12:00'))/864e5)):0;
const sheet=(rot,tit,body)=>{$('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(rot)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};

/* ---------- ícones ---------- */
Object.assign(ICO,{
 patio:'<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
 stin:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
 stwr:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
 sthg:'<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
 stok:'<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
 stkey:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2"/><path d="M17 6l3 3"/><path d="M14 9l2 2"/>',
 stpen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 stx:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
 tema:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
 lista:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke-width="3"/>',
 hist:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>'});

/* ---------- estilos ---------- */
const ESC=[['.p,.mb,.pchip','color:color-mix(in srgb,var(--c) 58%,#fff)'],['.plc','border-color:#000;border-top-color:#0B3FA8'],['.kbc','background:color-mix(in srgb,var(--c) 9%,var(--bg))'],['button.dg','color:#E8846B;border-color:#E8846B']];
const escuro=p=>p+'{color-scheme:dark}'+ESC.map(([s,b])=>s.split(',').map(x=>p+' '+x).join(',')+'{'+b+'}').join('');
const css=`
button.pr,.btn.pr{font-weight:700}
.pfaz{position:relative;overflow:hidden;padding-top:10px!important}.pfaz::before{content:"";position:absolute;left:0;right:0;top:0;height:6px;background:${HAZ}}
@media (max-width:760px){#bnav{border-top:0!important}#bnav::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:${HAZ};opacity:.9}}
.osbt{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;color:var(--ink);border-radius:8px;white-space:nowrap}.osbt span{overflow:hidden;text-overflow:ellipsis}
.osbt svg{width:16px;height:16px;stroke:var(--c);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}.osbt i{font-style:normal;color:var(--mut)}
.osh3 .sm svg,.kbs svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px}
.plc{display:inline-block;background:#fff;color:#111;border:1.5px solid #111;border-top:5px solid #0B3FA8;border-radius:4px;padding:0 6px;font:700 14px/1.35 "Barlow Condensed",Impact,sans-serif;letter-spacing:.09em;white-space:nowrap;vertical-align:1px}
.lcf .sp{flex:1}
/* quadro do pátio */
.kbs{display:flex;gap:6px;overflow-x:auto;margin:0 0 10px;scrollbar-width:none}.kbs::-webkit-scrollbar{display:none}
.kbs button{flex:1 0 auto;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:99px;padding:6px 11px;font-size:13px;margin:0;border-color:color-mix(in srgb,var(--c) 50%,var(--ln))}
.kbs button svg{stroke:var(--c)}.kbs button b{font:700 16px/1 "Barlow Condensed",sans-serif}
.kb{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:start}
.kbc{background:color-mix(in srgb,var(--c) 7%,var(--bg));border:1px solid var(--ln);border-top:4px solid var(--c);border-radius:12px;padding:8px;min-width:0}
.kbh{display:flex;align-items:center;gap:7px;padding:4px 4px 9px;font:600 18px/1.1 "Barlow Condensed",sans-serif}
.kbh svg{width:19px;height:19px;fill:none;stroke:var(--c);stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;flex:none}
.kbh i{margin-left:auto;font-style:normal;min-width:26px;text-align:center;padding:1px 7px;border-radius:99px;background:var(--c);color:#fff;font-size:15px}
.kbv{color:var(--mut);font-size:13px;text-align:center;padding:18px 6px;border:1.5px dashed var(--ln);border-radius:10px}
.kc{background:var(--sf);border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:8px;cursor:pointer}.kc:last-child{margin-bottom:0}
.kc1{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.kc1 small{color:var(--mut);font-weight:600}.kc1 .sp{flex:1}
.kct{display:block;font-size:16px;margin-top:6px;overflow-wrap:anywhere}.kc>small{display:block;color:var(--mut);overflow-wrap:anywhere}
.kcp{font-style:italic;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:3px}
.kcf{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}.kcf .sp{flex:1}
.kca{display:flex;gap:6px;margin-top:9px}.kca button{flex:1 1 0;margin:0;padding:8px 6px;font-size:13.5px}
@media (max-width:760px){.kb{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -14px;padding:0 14px 6px;scroll-padding:0 14px;scrollbar-width:none}.kb::-webkit-scrollbar{display:none}.kbc{flex:0 0 84%;scroll-snap-align:start}}

#patio{scroll-margin-top:96px}.pth{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.pth h2{flex:1;margin:0}
.pvt{display:inline-flex;border:1px solid var(--ln);border-radius:10px;overflow:hidden;background:var(--sf)}
.pvt button{display:inline-flex;align-items:center;gap:6px;margin:0;border:0;border-radius:0;padding:7px 12px;font-size:14px;background:transparent;color:var(--mut)}
.pvt button+button{border-left:1px solid var(--ln)}.pvt button.on{background:var(--ac);color:var(--on);font-weight:700}
.pvt svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.kbs button.z{opacity:.55}.kbs button.on{background:color-mix(in srgb,var(--c) 18%,var(--sf));border-color:var(--c);font-weight:700}
.plh{display:flex;align-items:center;gap:8px;margin:14px 2px 8px;font:600 17px "Barlow Condensed",sans-serif;color:var(--c)}.plh:first-of-type{margin-top:4px}
.plh svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
.plh i{font-style:normal;font-size:13px;padding:0 8px;border-radius:99px;background:var(--c);color:#fff}
@media (min-width:761px){.kbs{display:none}}
@media (max-width:760px){.kbc.vz{flex:0 0 46%}.kbc.vz .kbv{padding:10px 4px}}
@media (min-width:761px){nav .nt{flex-wrap:wrap;overflow:visible;row-gap:2px}}
/* folha de situação */
.stg{display:flex;flex-direction:column;gap:6px}
.stg button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin:0;padding:12px;border-radius:10px;border:1.5px solid color-mix(in srgb,var(--c) 45%,var(--ln));border-left:6px solid var(--c);font-size:15.5px}
.stg button svg{width:20px;height:20px;fill:none;stroke:var(--c);stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;flex:none}
.stg button.on{background:color-mix(in srgb,var(--c) 16%,var(--sf))}.stg button i{margin-left:auto;font-style:normal;font-size:12px;color:var(--mut);font-weight:500}
.stab{width:100%;margin:0 0 4px;padding:13px;font-size:16px}
/* linha do tempo */
.tl{position:relative;margin:4px 0 0 7px;padding-left:20px;border-left:2px solid var(--ln)}
.tly{font:600 15px "Barlow Condensed",sans-serif;letter-spacing:.08em;color:var(--mut);margin:14px 0 6px}.tly:first-child{margin-top:0}
.tle{position:relative}.tle::before{content:"";position:absolute;left:-28px;top:15px;width:14px;height:14px;border-radius:50%;background:var(--c);border:3px solid var(--bg);box-sizing:border-box}
.tle ul{margin:6px 0 0;padding-left:18px;font-size:14px}.tle .tlq{margin-top:6px;font-size:13.5px}
.tlph{display:flex;gap:6px;margin-top:8px}.tlph img{width:56px;height:56px;object-fit:cover;border-radius:7px;cursor:zoom-in}
.kt.st{cursor:default}.pgh .osh1+.osh3{margin-top:10px}
/* marcador de combustível */
.fuel{max-width:250px;margin:4px auto 10px}.fuel svg{display:block;width:100%;height:auto;touch-action:manipulation}
.fuel .ft{fill:none;stroke:var(--ln);stroke-width:12}.fuel .fr{fill:none;stroke:#B4472E;stroke-width:12;opacity:.55}
.fuel .fa{fill:none;stroke:var(--hi);stroke-width:12;transition:stroke-dasharray .35s}.fuel .fa.r{stroke:#D0492B}
.fuel .fk{stroke:var(--mut);stroke-width:2}.fuel text{fill:var(--mut);font:600 13px Barlow,sans-serif;text-anchor:middle}
.fuel .fn{stroke:#D0492B;stroke-width:4;stroke-linecap:round;transform-origin:100px 100px;transition:transform .4s cubic-bezier(.3,1.5,.5,1),opacity .2s}
.fuel .fh{fill:var(--ink)}.fuel .fv{fill:var(--ink);font:700 18px "Barlow Condensed",sans-serif}.fuel[data-v=""] .fv{fill:var(--mut);font:500 13px Barlow,sans-serif}
.fuel .fz{fill:transparent;cursor:pointer}.fuel .fz:focus-visible{outline:none;fill:color-mix(in srgb,var(--hi) 25%,transparent)}
.fuelm{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--mut);white-space:nowrap}.fuelm svg{width:30px;height:18px}
${escuro(':root[data-theme="dark"]')}
@media (prefers-color-scheme:dark){${escuro(':root:not([data-theme="light"])')}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- 13) tema garagem: claro / escuro / automático ---------- */
const TK='fm_tema',TN={auto:'automático (segue o celular)',light:'claro',dark:'escuro'};
const temaGet=()=>{try{const t=localStorage.getItem(TK);return TN[t]?t:'auto'}catch(x){return'auto'}};
function temaAplica(){const t=temaGet(),d=document.documentElement;if(t=='auto')d.removeAttribute('data-theme');else d.setAttribute('data-theme',t)}
G.temaTroca=function(){const t={auto:'dark',dark:'light',light:'auto'}[temaGet()];try{localStorage.setItem(TK,t)}catch(x){}temaAplica();toast('Tema: '+TN[t])};
temaAplica();
const _nav=navHtml;G.navHtml=navHtml=function(){return _nav().replace('<div class="nbr">',`<div class="nbr"><button type="button" class="nbtn ptema" aria-label="Mudar o tema (claro ou escuro)" onclick="temaTroca()">${svgi('tema')}<span>Tema</span></button>`)};

/* ---------- placa e título do veículo ---------- */
G.plc=v=>v&&v.placa?`<span class="plc">${e(v.placa)}</span>`:'';
G.vtit=v=>(v&&(v.modelo||v.placa))?`${e(v.modelo||'')} ${plc(v)}`.trim():'Sem veículo';

/* ---------- 11) marcador de combustível ---------- */
const FV={Reserva:.05,'1/4':.25,'1/2':.5,'3/4':.75,Cheio:1},FL=['Reserva','1/4','1/2','3/4','Cheio'],FB=[0,.125,.375,.625,.875,1];
const pt=(f,r)=>[(100-r*Math.cos(Math.PI*f)).toFixed(1),(100-r*Math.sin(Math.PI*f)).toFixed(1)];
const FCB={os:v=>U('comb',v),ci:v=>ciSetComb(v)};
const ARC='M20 100A80 80 0 0 1 180 100';
G.fuelG=function(v,key){const f=FV[v]||0;
 return`<div class="fuel" data-v="${e(v||'')}" role="group" aria-label="Combustível"><svg viewBox="0 0 200 138">
 <path class="ft" d="${ARC}"/><path class="fr" d="${ARC}" pathLength="100" stroke-dasharray="12.5 100"/><path class="fa${v=='Reserva'?' r':''}" d="${ARC}" pathLength="100" stroke-dasharray="${f*100} 100"/>
 ${[0,.25,.5,.75,1].map(x=>{const a=pt(x,70),b=pt(x,60);return`<line class="fk" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`}).join('')}
 <text x="66" y="71">¼</text><text x="100" y="56">½</text><text x="134" y="71">¾</text><text x="20" y="119">R</text><text x="180" y="119">C</text>
 <line class="fn" x1="100" y1="100" x2="38" y2="100" style="transform:rotate(${f*180}deg);opacity:${v?1:.25}"/><circle class="fh" cx="100" cy="100" r="7"/>
 <text class="fv" x="100" y="134">${v?e(v):'Toque para marcar'}</text>
 ${FL.map((l,i)=>{const a=pt(FB[i],96),b=pt(FB[i+1],96);return`<path class="fz" tabindex="0" role="button" aria-label="${l}" d="M100 100L${a[0]} ${a[1]}A96 96 0 0 1 ${b[0]} ${b[1]}Z" onclick="fuelSet('${key}','${l}',this)" onkeydown="if(event.key=='Enter'||event.key==' '){event.preventDefault();fuelSet('${key}','${l}',this)}"/>`}).join('')}
 </svg></div>`};
G.fuelSet=function(key,v,el){const w=el.closest('.fuel');if(!w)return;const nv=w.dataset.v==v?'':v,f=FV[nv]||0;w.dataset.v=nv;
 const n=w.querySelector('.fn'),a=w.querySelector('.fa');n.style.transform=`rotate(${f*180}deg)`;n.style.opacity=nv?1:.25;a.setAttribute('stroke-dasharray',f*100+' 100');a.classList.toggle('r',nv=='Reserva');
 w.querySelector('.fv').textContent=nv||'Toque para marcar';if(FCB[key])FCB[key](nv)};
G.fuelMini=function(v){if(!FV[v])return'';const f=FV[v];
 return`<span class="fuelm" title="Combustível na entrada: ${e(v)}"><svg viewBox="10 12 180 100" aria-hidden="true"><path d="${ARC}" fill="none" stroke="var(--ln)" stroke-width="20"/><path d="${ARC}" fill="none" stroke="${v=='Reserva'?'#D0492B':'var(--hi)'}" stroke-width="20" pathLength="100" stroke-dasharray="${f*100} 100"/><line x1="100" y1="100" x2="40" y2="100" stroke="var(--ink)" stroke-width="9" stroke-linecap="round" transform="rotate(${f*180} 100 100)"/></svg>${e(v)}</span>`};

/* ---------- 7 e 9) situação com cor e ícone fixos; atalhos ---------- */
const tempo=o=>{const n=dias(o.aberta);return n==0?'hoje':n==1?'há 1 dia':'há '+n+' dias'};
G.stMuda=function(id,v){closeM();const o=od(id);if(!o||o.status==v)return;const keep=S.id,fora=S.v!='order';S.id=id;
 try{setSt(v)}finally{if(fora){S.id=keep;render(1)}}
 if(!['Concluída','Entregue'].includes(v))toast('O.S. '+o.num+': '+v)};
G.stSheet=function(id,naOS){const o=od(id);if(!o)return;const v=vh(o.veh),c=cl(o.cli);
 sheet('Situação da O.S. '+o.num,vtit(v),`<p class="muted" style="margin:-6px 0 12px">O.S. ${e(o.num)} · ${e(c.nome||'Sem cliente')} · entrou ${tempo(o)}</p>
 ${naOS?'':`<button type="button" class="pr stab" onclick="closeM();go('order','${o.id}')">Abrir a O.S.</button>`}
 <small class="psec">Mudar a situação</small><div class="stg">${ST.map(s=>`<button type="button" class="${o.status==s?'on':''}" style="--c:${SC[s]}" ${o.status==s?'aria-current="true"':''} onclick="stMuda('${o.id}','${s}')">${stIco(s)}<span>${s}</span>${o.status==s?'<i>atual</i>':''}</button>`).join('')}</div>
 <div class="bar" style="margin:12px 0 0">${c.tel?`<button type="button" class="wa" onclick="closeM();waCarro('${o.id}')">WhatsApp</button>`:''}${o.veh?`<button type="button" onclick="closeM();go('veiculo','${o.veh}')">Histórico do carro</button>`:''}</div>`)};
G.waCarro=function(id){const o=od(id);if(!o)return;const c=cl(o.cli),v=o.veh?vlabel(vh(o.veh)):'veículo';
 if(o.status=='Concluída'&&typeof avisaPronto=='function')return avisaPronto(id);
 const m={Aberta:`recebemos o seu ${v} e já vamos avaliar. Assim que tiver novidade, eu aviso.`,'Em andamento':`o seu ${v} está em serviço. Assim que ficar pronto, eu aviso.`,'Aguardando peças':`estamos aguardando a chegada das peças para o seu ${v}. Assim que chegarem, seguimos com o serviço.`}[o.status]||`sobre o seu ${v} (O.S. ${o.num}): `;
 wa(c.tel,`Olá, ${c.nome||''}! Aqui é da ${empNome()}: ${m}`)};
G.osAtalhos=function(o){const c=cl(o.cli);
 return`<span class="sp"></span>${c.tel?`<button type="button" class="sm wa" onclick="event.stopPropagation();waCarro('${o.id}')">WhatsApp</button>`:''}<button type="button" class="sm" onclick="event.stopPropagation();stSheet('${o.id}')">Situação</button>`};

/* ---------- 1) pátio em quadro ---------- */
const COLS=['Aberta','Em andamento','Aguardando peças','Concluída'];
const PASSO={Aberta:[['Em andamento','Começar o serviço',1]],'Em andamento':[['Aguardando peças','Falta peça'],['Concluída','Pronto',1]],'Aguardando peças':[['Em andamento','Peça chegou',1]],'Concluída':[['Entregue','Entregar',1]]};
let KBX=0,ANT='';
function kcard(o){const v=vh(o.veh),c=cl(o.cli),tot=oTot(o),rest=tot-paid(o),n=dias(o.aberta),par=o.status=='Aguardando peças'&&o.stAt?dias(o.stAt):0;
 const b=(PASSO[o.status]||[]).map(([s,l,p])=>`<button type="button" class="${p?'pr':''}" onclick="event.stopPropagation();stMuda('${o.id}','${s}')">${l}</button>`).join('');
 const av=o.status=='Concluída'&&c.tel&&!o.avisado?`<button type="button" class="wa" onclick="event.stopPropagation();waCarro('${o.id}')">Avisar</button>`:'';
 return`<div class="kc" role="button" tabindex="0" aria-label="O.S. ${e(o.num)}, ${e(vlabel(v))}. Toque para mudar a situação" onclick="stSheet('${o.id}')" onkeydown="if(event.key=='Enter')stSheet('${o.id}')">
 <div class="kc1">${plc(v)}<small>O.S. ${e(o.num)}</small><span class="sp"></span>${mb(par?'peça há '+par+(par==1?' dia':' dias'):tempo(o),(par>=3||n>=7)&&o.status!='Concluída'?KR:'')}</div>
 <b class="kct">${e(v.modelo||(v.placa?'':'Sem veículo'))}</b><small>${e(c.nome||'Sem cliente')}${o.mec?' · '+e(o.mec):''}</small>${o.problema?`<small class="kcp">${e(o.problema)}</small>`:''}
 <div class="kcf">${tot>0?(rest<=0.005?mb('Pago',KG):mb(paid(o)>0?'Falta '+R(rest):R(tot),KA)):mb('Sem itens')}${o.status=='Concluída'&&o.avisado?mb('Avisado',KG):''}<span class="sp"></span>${fuelMini(o.comb)}</div>
 <div class="kca">${av}${b}</div></div>`}
/* pátio no Painel: quadro (cartões) ou lista, escolha guardada no aparelho */
const PK='fm_patio',modo=()=>{try{return localStorage.getItem(PK)=='lista'?'lista':'quadro'}catch(x){return'quadro'}};
G.patioModo=function(m){try{localStorage.setItem(PK,m)}catch(x){}KBX=0;render(1)};
const naPatio=()=>db.orders.filter(o=>COLS.includes(o.status));
const porSt=(O,s)=>O.filter(o=>o.status==s).sort((a,b)=>(a.aberta||'').localeCompare(b.aberta||''));
function quadro(O){return`<div class="kbs" role="tablist" aria-label="Situações">${COLS.map((s,i)=>{const n=porSt(O,s).length;return`<button type="button" role="tab" class="${i?'':'on'}${n?'':' z'}" style="--c:${SC[s]}" onclick="kbVai(${i})">${stIco(s)}<span>${s}</span><b>${n}</b></button>`}).join('')}</div>
 <div class="kb" onscroll="kbX(this)">${COLS.map(s=>{const L=porSt(O,s);return`<section class="kbc${L.length?'':' vz'}" style="--c:${SC[s]}" aria-label="${s}"><div class="kbh">${stIco(s)}<span>${s}</span><i>${L.length}</i></div>${L.map(kcard).join('')||'<div class="kbv">Nenhum carro aqui</div>'}</section>`}).join('')}</div>`}
function listaP(O){return COLS.map(s=>{const L=porSt(O,s);return L.length?`<div class="plh" style="--c:${SC[s]}">${stIco(s)}<span>${s}</span><i>${L.length}</i></div>${L.map(osCard).join('')}`:''}).join('')}
G.patioDash=function(){const O=naPatio(),m=modo(),bt=(k,l,ic)=>`<button type="button" class="${m==k?'on':''}" aria-pressed="${m==k}" onclick="patioModo('${k}')">${svgi(ic)}<span>${l}</span></button>`;
 return`<div id="patio" class="sech pth"><h2>Carros no pátio${O.length?` <span class="muted">(${O.length})</span>`:''}</h2><div class="pvt" role="group" aria-label="Mostrar como">${bt('quadro','Quadro','patio')}${bt('lista','Lista','lista')}</div></div>`+
 (O.length?(m=='lista'?listaP(O):quadro(O)):empty('vehicles','Nenhum carro no pátio agora.',`<button class="pr" onclick="checkin()">+ Entrada do carro</button>`))};
G.kbX=function(el){KBX=el.scrollLeft;const C=el.querySelectorAll('.kbc');if(!C.length)return;let i=0,best=1e9;C.forEach((c,k)=>{const d=Math.abs(c.offsetLeft-el.offsetLeft-14-el.scrollLeft);if(d<best){best=d;i=k}});
 document.querySelectorAll('.kbs button').forEach((b,k)=>b.classList.toggle('on',k==i))};
G.kbVai=i=>{const c=document.querySelectorAll('.kb .kbc')[i],k=$q('.kb');if(c&&k)k.scrollTo({left:c.offsetLeft-k.offsetLeft-14,behavior:'smooth'})};
/* a tela "Pátio" antiga agora é a seção do Painel */
V.patio=()=>V.dash();
const _go=go;G.go=go=function(k,...r){if(k=='patio'){_go('dash');setTimeout(()=>{const x=$q('#patio');if(x)x.scrollIntoView({behavior:'smooth',block:'start'})},60);return}return _go(k,...r)};
const _render=render;G.render=render=function(k){if(!(S.v=='dash'&&ANT=='dash'))KBX=0;const x=KBX;_render(k);ANT=S.v;if(S.v=='dash'&&x){const b=$q('.kb');if(b){b.style.scrollSnapType='none';b.scrollLeft=x;KBX=x;kbX(b);requestAnimationFrame(()=>{b.style.scrollSnapType=''})}}};

/* ---------- 6) linha do tempo do veículo ---------- */
function Vveic(){const v=vh(S.id);if(!v.id)return Vvehicles();const c=cl(v.cli),t0=today();
 const O=db.orders.filter(o=>o.veh==v.id).sort((a,b)=>(b.aberta||'').localeCompare(a.aberta||'')),ab=O.find(o=>!osFim(o));
 const Q=db.quotes.filter(q=>q.veh==v.id&&!(q.os&&od(q.os))&&['Rascunho','Aguardando','Aprovado'].includes(q.status));
 const A=AG().filter(a=>a.veh==v.id&&a.data>=t0&&a.status!='Cancelado').sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
 const tot=O.reduce((a,o)=>a+oTot(o),0),deve=O.reduce((a,o)=>a+Math.max(0,oTot(o)-paid(o)),0),kms=O.map(o=>+String(o.km||'').replace(/\D/g,'')||0).concat(+v.km||0),km=Math.max(0,...kms),ult=O.find(o=>osFim(o));
 const K=(ic,num,l,col)=>`<div class="kt st" style="--c:${col}">${svgi(ic)}<span class="num${String(num).length>5?' sm':''}">${num}</span><span>${l}</span></div>`;
 let ano='';const ev=O.map(o=>{const y=(o.aberta||'').slice(0,4),it=o.items||[],rest=oTot(o)-paid(o),df=o.dg&&o.dg.fim&&o.dg.def,ft=(o.fotos||[]).slice(0,4);
  const h=(y!=ano?`<div class="tly">${y||'Sem data'}</div>`:'');ano=y;
  return h+`<div class="tle" style="--c:${SC[o.status]||'#777'}">${lcard({c:SC[o.status],n:D(o.aberta)+(o.km?' · '+e((+String(o.km).replace(/\D/g,'')||0).toLocaleString('pt-BR'))+' km':''),pill:pill(o.status),v:R(oTot(o)),t:'O.S. '+e(o.num)+(o.problema?` <span class="muted" style="font-weight:400">· ${e(o.problema)}</span>`:''),
   m:(it.length?`<ul>${it.slice(0,5).map(i=>`<li>${e(i.d)}</li>`).join('')}${it.length>5?`<li class="muted">e mais ${it.length-5}</li>`:''}</ul>`:'Sem itens lançados')+(df?`<div class="tlq"><b>Defeito encontrado:</b> ${e(o.dg.def)}</div>`:'')+
    (ft.length?`<div class="tlph">${ft.map(f=>`<img ${fimg(f.src)} alt="${e(f.t||'Foto')}" onclick="event.stopPropagation();verFoto(this.src)">`).join('')}</div>`:''),
   f:[oTot(o)>0?(rest<=0.005?mb('Pago',KG):mb('Falta '+R(rest),KA)):'',o.mec?mb(e(o.mec)):'',fuelMini(o.comb)].join(''),on:`go('order','${o.id}')`})}</div>`}).join('');
 const prox=A.map(a=>`<div class="tle" style="--c:${SC[a.status]||KB}">${lcard({c:SC[a.status]||KB,n:D(a.data)+' · '+e(a.hora||''),pill:pill(a.status),t:'Agendado: '+e(a.svc||'serviço'),on:`go('agenda')`})}</div>`).join('')+
  Q.map(q=>`<div class="tle" style="--c:${SC[q.status]}">${lcard({c:SC[q.status],n:'Orçamento '+e(q.n),pill:pill(q.status),v:R(sum(q.items,q.desc)),t:(q.items||[]).slice(0,3).map(i=>e(i.d)).join(' · ')||'Sem itens',on:`editQuote('${q.id}')`})}</div>`).join('');
 return head({back:"go('vehicles')",kick:'Histórico do veículo',title:e(v.modelo||'Veículo')+(v.ano?` <span class="muted" style="font-size:.7em">${e(v.ano)}</span>`:''),c:ab?SC[ab.status]:PCOL.vehicles,
  sub:`<div>${plc(v)||'<b>Sem placa</b>'}<small style="margin-top:4px">${[c.nome||'Sem cliente',v.cor,v.motor].filter(Boolean).map(e).join(' · ')}</small></div>`,
  acts:`${ab?`<button class="sm pr" onclick="go('order','${ab.id}')">Abrir O.S. ${e(ab.num)}</button>`:`<button class="sm pr" onclick="checkin({placa:'${e(v.placa||'')}'})">+ Entrada do carro</button>`}${c.tel?`<button class="sm wa" onclick="waCli('${c.id}')">WhatsApp</button>`:''}<button class="sm" onclick="editVeh('${v.id}')">Editar cadastro</button>`})+
 `<div class="kts">${K('orders',O.length,O.length==1?'Serviço':'Serviços',KB)}${K('ospag',R(tot),deve>0.005?'Total · falta '+R(deve):'Total em serviços',deve>0.005?KA:KG)}${K('clock',ult?D(ult.conc||ult.aberta):'—',km?'Última visita · '+km.toLocaleString('pt-BR')+' km':'Última visita','#17A2B8')}</div>`+
 (prox?sech('Em aberto e agendado')+`<div class="tl">${prox}</div>`:'')+
 sech('Linha do tempo',O.length?plural(O.length,'O.S.','O.S.'):'')+(O.length?`<div class="tl">${ev}</div>`:empty('hist','Este carro ainda não tem serviço registrado.',`<button class="pr" onclick="checkin({placa:'${e(v.placa||'')}'})">+ Entrada do carro</button>`))}
V.veiculo=Vveic;

if(typeof render=='function'&&typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);
})(window);
