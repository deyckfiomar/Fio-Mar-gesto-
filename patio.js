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
.pfaz{position:relative;overflow:hidden}

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

.pfts{grid-template-columns:repeat(4,minmax(0,1fr))}.pft{text-align:left;cursor:pointer;margin:0;font:inherit;color:inherit}.pft.on{outline:3px solid var(--c);outline-offset:-1px;background:color-mix(in srgb,var(--c) 10%,var(--sf))}
@media (max-width:760px){.pfts{grid-template-columns:repeat(2,minmax(0,1fr))}}
.pfb{display:flex;flex-direction:column;gap:8px;margin:10px 0}
.pfq{position:relative;display:block;margin:0}.pfq svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;fill:none;stroke:var(--mut);stroke-width:2}.pfq input{padding-left:40px;margin:0;font-size:16px}
.pfm{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.pfm::-webkit-scrollbar{display:none}.pfm button{flex:none;margin:0;border-radius:99px;padding:6px 12px;font-size:13.5px}.pfm button.on{background:var(--ac);color:var(--on);border-color:var(--ac);font-weight:700}
.pfr{margin:0 2px 8px;font-size:13.5px}.pfn{text-align:center;margin:14px 0}
.pfe{margin-top:14px;border:1px solid var(--ln);border-radius:12px;padding:10px 12px;background:var(--sf)}.pfe summary{cursor:pointer;display:flex;align-items:center;gap:8px;font-weight:600}.pfe summary svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}.pfe summary b{margin-left:auto}
.kmec{display:inline-flex;align-items:center;gap:4px;margin:4px 0 0;padding:2px 8px;border-radius:99px;font-size:12.5px;font-weight:600;border:1px solid var(--ln);background:var(--bg);color:var(--ink)}.kmec.z{color:var(--mut);border-style:dashed}.kmec svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2}
.pfmn{display:flex;gap:8px;margin-top:10px}.pfmn input{margin:0;flex:1}.pfmn button{margin:0}
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
 <div class="bar" style="margin:12px 0 0">${c.tel?`<button type="button" class="wa" onclick="closeM();waCarro('${o.id}')">WhatsApp</button>`:''}${o.veh?`<button type="button" onclick="closeM();go('veiculo','${o.veh}')">Histórico do carro</button>`:''}<button type="button" onclick="closeM();pkFotoPega('${o.id}')">${typeof carroFoto=='function'&&carroFoto(o)?'Trocar a foto':'Foto do carro'}</button></div>`)};
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
/* ---------- 2.50.0: cartão compacto com foto, botão certo, mecânico, tempo em cor ---------- */
const CARRO='<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M8 27l4-10c1-3 3-4 6-4h28c3 0 5 1 6 4l4 10"/><path d="M5 27h54v6H5z"/><circle cx="17" cy="33" r="4"/><circle cx="47" cy="33" r="4"/><path d="M16 17h32"/></svg>';
/* foto do carro: a do cadastro do veículo; senão a da entrada desta O.S.; senão de outra visita */
G.carroFoto=function(o){const v=vh(o.veh)||{};if(v.foto)return v.foto;if(o.capa)return o.capa;
 const ent=L=>(L||[]).find(f=>f&&f.src&&/entrada/i.test(f.t||''))||(L||[]).find(f=>f&&f.src);
 let f=ent(o.fotos);if(f)return f.src;if(o.veh){for(const x of db.orders.filter(y=>y.veh==o.veh&&y!==o).reverse()){f=ent(x.fotos);if(f)return f.src}}return''};
let PKF='';
G.pkFotoPega=function(oid){PKF=oid;let i=document.getElementById('pkfi');if(!i){i=document.createElement('input');i.type='file';i.accept='image/*';i.setAttribute('capture','environment');i.id='pkfi';i.hidden=true;i.onchange=()=>{pkFoto(PKF,i.files);i.value=''};document.body.appendChild(i)}i.click()};
G.pkFoto=function(oid,fs){const o=od(oid),f=fs&&fs[0];if(!o||!f)return;toast('Guardando a foto...');picRef(f,ref=>{const x=od(oid);if(!x)return;const v=x.veh&&vh(x.veh);if(v&&v.id)v.foto=ref;else x.capa=ref;save();render(1);toast('Foto do carro guardada'+(v&&v.id?' · aparece nas próximas visitas':''))})};
const dCor=n=>n>7?'r':n>3?'a':'';
const dTxt=n=>n==0?'hoje':n==1?'há 1 dia':'há '+n+' dias';
const pedDa=o=>{const P=(db.peds||[]).filter(p=>['Montando','Enviado','Parcial'].includes(p.status)&&(p.itens||[]).some(i=>i.os==o.id));return P[P.length-1]};
function pkAcao(o,rest){const c=cl(o.cli),av=o.status=='Concluída'&&c.tel&&!o.avisado,rc=rest>0.005&&typeof recebe=='function',B=(t,f,cls)=>`<button type="button" class="pkb ${cls||'pr'}" onclick="event.stopPropagation();${f}">${t}</button>`;
 if(o.status=='Aberta')return B('Começar',`stMuda('${o.id}','Em andamento')`);
 if(o.status=='Em andamento')return B('Pronto',`stMuda('${o.id}','Concluída')`);
 if(o.status=='Aguardando peças'){const p=pedDa(o);return p?B('Pedido',`go('ped','${p.id}')`,''):B('Chegou',`stMuda('${o.id}','Em andamento')`)}
 if(o.status=='Concluída')return av?B('Avisar',`waCarro('${o.id}')`,'wa'):rc?B('Receber',`recebe('${o.id}')`):B('Entregar',`stMuda('${o.id}','Entregue')`);return''}
function kcard(o){const v=vh(o.veh)||{},c=cl(o.cli),tot=oTot(o),rest=tot-paid(o),ft=carroFoto(o),pr=o.status=='Concluída';
 const n=pr?dias(o.conc||o.stAt||o.aberta):dias(o.aberta),par=!pr&&o.status!='Aberta'&&o.stAt?dias(o.stAt):0;
 const p=o.status=='Aguardando peças'?pedDa(o):null,pinfo=p?(p.status=='Montando'?'pedido montando':'peça '+(p.env?(dias(p.env)?'enviada há '+plural(dias(p.env),'dia','dias'):'enviada hoje'):'pedida')):'';
 const [mi,mc]=o.mec?avIni(o.mec):['',''];
 const val=tot>0?(rest<=0.005?`<span class="pkv ok">Pago</span>`:`<span class="pkv">${paid(o)>0?'falta ':''}${R(rest)}</span>`):'';
 return`<div class="kc pk" data-o="${o.id}" style="--c:${SC[o.status]}" role="button" tabindex="0" aria-label="O.S. ${e(o.num)}, ${e(vlabel(v))}. Toque para ver as opções" onclick="kcMais('${o.id}')" onkeydown="if(event.key=='Enter')kcMais('${o.id}')">
 ${ft?`<img class="pkf" ${fimg(ft)} alt="Foto do ${e(v.modelo||'carro')}" onclick="event.stopPropagation();verFoto(this.src)">`:`<button type="button" class="pkf pkf0" aria-label="Pôr a foto do carro" onclick="event.stopPropagation();pkFotoPega('${o.id}')">${CARRO}<i>${svgi('osfotos')}</i></button>`}
 <div class="pkt"><div class="pk1">${plc(v)}<b>${e(v.modelo||(v.placa?'':'Sem veículo'))}</b></div>
 <small class="pk2">${e(c.nome||'Sem cliente')} · O.S. ${e(o.num)}</small>
 <div class="pk3"><button type="button" class="pkm${o.mec?'':' z'}" style="${o.mec?'--ac:'+mc:''}" aria-label="${o.mec?'Mecânico: '+e(o.mec)+'. Trocar':'Escolher mecânico'}" title="${e(o.mec||'Sem mecânico')}" onclick="event.stopPropagation();patioMec('${o.id}')">${o.mec?e(mi):'+'}</button><span class="pkd ${dCor(n)}">${pr?(n?'pronto '+dTxt(n):'pronto hoje'):dTxt(n)}</span>${par>=3?`<span class="pkd r">parado ${plural(par,'dia','dias')}</span>`:''}${pinfo?`<span class="pkd">${e(pinfo)}</span>`:''}${o.status=='Concluída'&&o.avisado?'<span class="pkd g">avisado</span>':''}</div></div>
 <div class="pka">${val}${pkAcao(o,rest)}</div></div>`}

/* 2.44.0: um botão só no cartão (o próximo passo); o resto fica no ⋯ */
function kcUm(o,rest){const c=cl(o.cli),P=PASSO[o.status]||[],pri=P.find(x=>x[2]),av=o.status=='Concluída'&&c.tel&&!o.avisado,rc=rest>0.005&&typeof recebe=='function';
 let b=pri?`<button type="button" class="pr" onclick="event.stopPropagation();stMuda('${o.id}','${pri[0]}')">${pri[1]}</button>`:'';
 if(o.status=='Concluída'&&av)b=`<button type="button" class="wa" onclick="event.stopPropagation();waCarro('${o.id}')">Avisar</button>`;
 else if(o.status=='Concluída'&&rc)b=`<button type="button" class="pr" onclick="event.stopPropagation();recebe('${o.id}')">Receber</button>`;
 const mais=P.filter(x=>!x[2]).length+(rc?1:0)+(av?1:0)+(pri?1:0);return b+(mais>1||!pri?`<button type="button" class="kcm" aria-label="Mais ações" onclick="event.stopPropagation();kcMais('${o.id}')">⋯</button>`:'')}
G.kcMais=function(id){const o=od(id);if(!o)return;const c=cl(o.cli),rest=oTot(o)-paid(o),P=PASSO[o.status]||[],B=[];
 P.forEach(([s,l,p])=>B.push([l,`closeM();stMuda('${id}','${s}')`,p]));
 if(o.status=='Concluída'&&c.tel&&!o.avisado)B.push(['Avisar no WhatsApp',`closeM();waCarro('${id}')`]);
 if(rest>0.005&&typeof recebe=='function')B.push(['Receber '+R(rest),`closeM();recebe('${id}')`]);
 B.push(['Abrir a O.S.',`closeM();go('order','${id}')`],['Mudar a situação',`closeM();stSheet('${id}')`]);
 if(c.tel&&!(o.status=='Concluída'&&!o.avisado))B.push(['WhatsApp do cliente',`closeM();waCarro('${id}')`]);
 B.push([typeof carroFoto=='function'&&carroFoto(o)?'Trocar a foto do carro':'Foto do carro',`closeM();pkFotoPega('${id}')`]);if(o.veh)B.push(['Histórico do carro',`closeM();go('veiculo','${o.veh}')`]);
 $('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="Ações"><div class="psh-h"><h2>${e(vlabel(vh(o.veh)))}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div><div class="kcml">${B.map(([l,f,p])=>`<button type="button" class="${p?'pr':''}" onclick="${f}">${e(l)}</button>`).join('')}</div></div></div>`};
/* pátio no Painel: quadro (cartões) ou lista, escolha guardada no aparelho */
const PK='fm_patio',modo=()=>{let m=null;try{m=localStorage.getItem(PK)}catch(x){}if(m=='lista'||m=='quadro')return m;return innerWidth<760?'lista':'quadro'};
G.patioModo=function(m){try{localStorage.setItem(PK,m)}catch(x){}KBX=0;render(1)};
const naPatio=()=>db.orders.filter(o=>COLS.includes(o.status));
const porSt=(O,s)=>O.filter(o=>o.status==s).sort((a,b)=>(a.aberta||'').localeCompare(b.aberta||''));
/* 2.50.0: seções finas e recolhíveis; "Prontos para entregar" primeiro */
const ORD=['Concluída','Em andamento','Aberta','Aguardando peças'],NOME={'Concluída':'Prontos para entregar'};
const RK='fm_pcol',recolh=()=>{try{return JSON.parse(localStorage.getItem(RK)||'[]')}catch(x){return[]}};
G.pkSec=function(s){let L=recolh();L=L.includes(s)?L.filter(x=>x!=s):[...L,s];try{localStorage.setItem(RK,JSON.stringify(L))}catch(x){}render(1)};
function listaP(O){const R0=recolh();return ORD.map(s=>{const L=porSt(O,s);if(!L.length)return'';const fe=R0.includes(s);
 return`<button type="button" class="plh pkh${fe?' fe':''}" style="--c:${SC[s]}" aria-expanded="${!fe}" onclick="pkSec('${s}')"><i class="pkdot"></i><span>${NOME[s]||s}</span><b>${L.length}</b><em aria-hidden="true">${fe?'▸':'▾'}</em></button>${fe?'':`<div class="plst">${L.map(kcard).join('')}</div>`}`}).join('')}
/* 11) quadro: colunas com as fotos; arrastar o cartão para outra coluna muda a situação */
function quadro(O){return`<div class="kbs" role="tablist" aria-label="Situações">${COLS.map((s,i)=>{const n=porSt(O,s).length;return`<button type="button" role="tab" class="${i?'':'on'}${n?'':' z'}" style="--c:${SC[s]}" onclick="kbVai(${i})">${stIco(s)}<span>${s}</span><b>${n}</b></button>`}).join('')}</div>
 <div class="kb" onscroll="kbX(this)">${COLS.map(s=>{const L=porSt(O,s);return`<section class="kbc${L.length?'':' vz'}" data-st="${s}" style="--c:${SC[s]}" aria-label="${s}" ondragover="pkSobre(event,this)" ondragleave="this.classList.remove('dz')" ondrop="pkSolta(event,this)"><div class="kbh">${stIco(s)}<span>${s}</span><i>${L.length}</i></div>${L.map(o=>kcard(o).replace('<div class="kc pk"','<div class="kc pk" draggable="true" ondragstart="pkPega(event)"')).join('')||'<div class="kbv">Solte um carro aqui</div>'}</section>`}).join('')}</div>`}
G.pkPega=ev=>{const c=ev.target.closest('.kc[data-o]');if(!c)return;ev.dataTransfer.setData('text/plain',c.dataset.o);ev.dataTransfer.effectAllowed='move';c.classList.add('drag')};
G.pkSobre=(ev,el)=>{ev.preventDefault();el.classList.add('dz')};
G.pkSolta=(ev,el)=>{ev.preventDefault();el.classList.remove('dz');const id=ev.dataTransfer.getData('text/plain'),s=el.dataset.st,o=od(id);document.querySelectorAll('.kc.drag').forEach(x=>x.classList.remove('drag'));if(o&&s&&o.status!=s)stMuda(id,s)};
G.patioDash=function(){const O=naPatio(),m=modo(),bt=(k,l,ic)=>`<button type="button" class="${m==k?'on':''}" aria-pressed="${m==k}" aria-label="${l}" title="${l}" onclick="patioModo('${k}')">${svgi(ic)}</button>`;
 return`<div id="patio" class="sech pth"><h2>Carros no pátio${O.length?` <span class="muted">(${O.length})</span>`:''}</h2><div class="pvt pvi" role="group" aria-label="Mostrar como">${bt('quadro','Quadro','patio')}${bt('lista','Lista','lista')}</div><button type="button" class="sm" style="margin:0" onclick="go('patio')">Abrir o pátio</button></div>`+
 (O.length?(m=='lista'?listaP(O):quadro(O)):empty('vehicles','Nenhum carro no pátio agora.',`<button class="pr" onclick="checkin()">+ Entrada do carro</button>`))};
G.kbX=function(el){KBX=el.scrollLeft;const C=el.querySelectorAll('.kbc');if(!C.length)return;let i=0,best=1e9;C.forEach((c,k)=>{const d=Math.abs(c.offsetLeft-el.offsetLeft-14-el.scrollLeft);if(d<best){best=d;i=k}});
 document.querySelectorAll('.kbs button').forEach((b,k)=>b.classList.toggle('on',k==i))};
G.kbVai=i=>{const c=document.querySelectorAll('.kb .kbc')[i],k=$q('.kb');if(c&&k)k.scrollTo({left:c.offsetLeft-k.offsetLeft-14,behavior:'smooth'})};
/* ---------- tela completa do Pátio ---------- */
const atras=o=>o.status!='Concluída'&&(dias(o.aberta)>=7||(o.status!='Aberta'&&o.stAt&&dias(o.stAt)>=3));
const FIL={'':o=>1,atras,pronto:o=>o.status=='Concluída',semmec:o=>!o.mec};
const busca=o=>{const v=vh(o.veh),c=cl(o.cli);return nrm([o.num,v.placa,(v.placa||'').replace(/\W/g,''),v.modelo,c.nome,o.mec,o.problema].join(' '))};
function Vpatio(){const T=naPatio(),f=S.f.pf||'',mc=S.f.pm||'',m=modo();
 let O=T.filter(FIL[f]||FIL['']);if(mc)O=O.filter(o=>mc=='-'?!o.mec:o.mec==mc);
 const hoje=db.orders.filter(o=>o.status=='Entregue'&&o.stAt==today()),rec=T.reduce((a,o)=>a+Math.max(0,oTot(o)-paid(o)),0),np=T.filter(FIL.pronto).length;
 const F=(k,l,n,col)=>n||k==''||f==k?`<button type="button" class="pfc${f==k?' on':''}" style="--c:${col}" aria-pressed="${f==k}" onclick="patioF('${k}')">${l} <b>${n}</b></button>`:'';
 const bt=(k,l,ic)=>`<button type="button" class="${m==k?'on':''}" aria-pressed="${m==k}" aria-label="Mostrar em ${l}" title="${l}" onclick="patioModo('${k}')">${svgi(ic)}</button>`;
 const res=[plural(T.length,'carro','carros'),np?plural(np,'pronto','prontos'):'',rec>0.005?R(rec)+' a receber':''].filter(Boolean).join(' · ');
 return head({ico:'patio',kick:'',title:'Pátio',c:PCOL.orders,right:`<button class="pr hb" onclick="checkin()">+ Entrada do carro</button>`,
  acts:`<span class="pkres">${res||'Nenhum carro'}</span><span class="sp"></span><div class="pvt pvi" role="group" aria-label="Mostrar como">${bt('quadro','Quadro','patio')}${bt('lista','Lista','lista')}</div>${typeof patioExtraBtns=='function'?patioExtraBtns().replace('⋯ Mais','⋯'):''}`})+
 `<div class="pfl" role="group" aria-label="Filtros">${F('','No pátio',T.length,KB)}${F('pronto','Prontos',np,KG)}${F('semmec','Sem mecânico',T.filter(FIL.semmec).length,KA)}${F('atras','Atrasados',T.filter(atras).length,KR)}</div>`+
 `<div class="pfb"><label class="pfq">${svgi('busca')}<input type="search" placeholder="Placa, modelo, cliente ou O.S." aria-label="Buscar no pátio" value="${e(S.f.pq||'')}" oninput="patioQ(this.value)"><button type="button" class="pkcam" aria-label="Ler a placa pela câmera" onclick="pkPlaca()">${svgi('osfotos')}</button></label>
  ${mc?`<div class="pfm" role="group" aria-label="Mecânico"><button type="button" class="on" onclick="patioM('')">${svgi('stwr')} ${mc=='-'?'Sem mecânico':e(mc)} ✕</button></div>`:''}</div>`+
 (O.length?(m=='lista'?listaP(O)+(O.length&&!f?'<p class="pkhint">Arraste o cartão para a esquerda para avançar · toque para ver tudo</p>':''):quadro(O)):T.length?`<div class="card muted" style="text-align:center">Nenhum carro com esse filtro. <button class="sm" onclick="patioLimpa()">Limpar filtros</button></div>`:empty('vehicles','Nenhum carro no pátio agora.',`<button class="pr" onclick="checkin()">+ Entrada do carro</button>`))+
 `<p class="muted pfn" id="pfn" hidden>Nenhum carro com essa busca.</p>`+
 (hoje.length?`<details class="pfe"><summary>${svgi('stkey')} Entregues hoje <b>${hoje.length}</b></summary>${hoje.map(osCard).join('')}</details>`:'')}
/* 5) busca pela câmera da placa */
G.pkPlaca=function(){let i=document.getElementById('pkpi');if(!i){i=document.createElement('input');i.type='file';i.accept='image/*';i.setAttribute('capture','environment');i.id='pkpi';i.hidden=true;i.onchange=()=>{const f=i.files[0];i.value='';if(f)pkPlacaLe(f)};document.body.appendChild(i)}i.click()};
G.pkPlacaLe=async function(f){sheet('Ler a placa','Placa pela foto',`<div class="pci pkpl"><label>Placa<input id="cipl" autocomplete="off" autocapitalize="characters" oninput="pkPlacaAcha(this.value)" placeholder="ABC1D23"></label><div id="pal" class="bar" style="margin:0 0 8px"></div><p id="pst" class="muted">Procurando a placa na foto...</p><div id="pkpr"></div></div>`);
 if(f&&typeof plFoto=='function'){const k=window.ciAch;window.ciAch=()=>{};try{await plFoto(f,()=>pst('Não achei a placa. Digite a placa acima.'))}catch(x){pst('Não consegui ler. Digite a placa acima.')}finally{window.ciAch=k}}};
G.pkPlacaAcha=function(v){const q=normPl(v||''),b=document.getElementById('pkpr');if(!b)return;if(q.length<7){b.innerHTML='';return}
 const O=naPatio().filter(o=>normPl((vh(o.veh)||{}).placa||'')==q),ve=(db.vehicles||[]).find(x=>normPl(x.placa||'')==q);
 if(O.length==1){closeM();S.f.pq=q;stSheet(O[0].id);return}
 b.innerHTML=O.length?O.map(o=>`<button type="button" class="pr" style="width:100%" onclick="closeM();stSheet('${o.id}')">O.S. ${e(o.num)} · ${e(vlabel(vh(o.veh)))}</button>`).join(''):`<p>Placa <b>${e(q)}</b> não está no pátio.</p><div class="bar">${ve?`<button type="button" onclick="closeM();go('veiculo','${ve.id}')">Ver o carro</button>`:''}<span class="sp"></span><button type="button" class="pr" onclick="closeM();checkin({placa:'${e(q)}'})">+ Entrada do carro</button></div>`};
V.patio=Vpatio;
G.patioF=k=>{S.f.pf=S.f.pf==k?'':k;KBX=0;render(1)};G.patioM=k=>{S.f.pm=k;KBX=0;render(1)};G.patioLimpa=()=>{S.f.pf='';S.f.pm='';S.f.pq='';render(1)};
/* busca no pátio: esconde os cartões que não batem, sem redesenhar a tela (o teclado não fecha) */
G.patioQ=function(q){S.f.pq=q;aplicaQ()};
function aplicaQ(){if(S.v!='patio')return;const q=nrm(S.f.pq||'').trim(),W=q.split(/\s+/).filter(Boolean);let vis=0;
 document.querySelectorAll('.kb .kc[data-o], .plst .kc[data-o], .plh ~ .lc[data-o]').forEach(el=>{const o=od(el.dataset.o),ok=!W.length||(o&&W.every(w=>busca(o).includes(w)));el.hidden=!ok;if(ok)vis++});
 document.querySelectorAll('.kbc').forEach(c=>{const n=c.querySelectorAll('.kc[data-o]:not([hidden])').length;const i=c.querySelector('.kbh i');if(i)i.textContent=n});
 const pn=document.getElementById('pfn');if(pn)pn.hidden=!(W.length&&!vis)}
/* mecânico do carro: tocar no nome no cartão */
G.patioMec=function(oid){const o=od(oid);if(!o)return;const nomes=typeof mecLista=='function'?mecLista().map(x=>x.n).slice(0,14):[...new Set(db.orders.map(x=>x.mec).filter(Boolean))].slice(-12);
 sheet('Mecânico',`Mecânico da O.S. ${e(o.num)}`,`<div class="stg">${nomes.map(n=>`<button type="button" class="${o.mec==n?'on':''}" style="--c:${KB}" data-m="${e(n)}" onclick="patioMecOk('${oid}',this.dataset.m)">${svgi('stwr')}<span>${e(n)}</span>${o.mec==n?'<i>atual</i>':''}</button>`).join('')}</div>
 <form class="pfmn" onsubmit="event.preventDefault();patioMecOk('${oid}',this.n.value)"><input name="n" placeholder="Outro nome" autocomplete="off"><button class="pr">Salvar</button></form>${o.mec?`<button type="button" class="sm" style="margin-top:8px" onclick="patioMecOk('${oid}','')">Tirar o mecânico</button>`:''}`)};
G.patioMecOk=function(oid,n){const o=od(oid);if(!o)return;o.mec=String(n||'').trim();save();closeM();render(1);toast(o.mec?'O.S. '+o.num+': '+o.mec:'Mecânico retirado')};
const _go=go;G.go=go=function(k,...r){const x=_go(k,...r);if(k=='patio')setTimeout(aplicaQ,0);return x};
const _render=render;G.render=render=function(k){if(!(S.v==ANT&&['dash','patio'].includes(S.v)))KBX=0;const x=KBX;_render(k);ANT=S.v;if(S.v=='patio')aplicaQ();if(['dash','patio'].includes(S.v)&&x){const b=$q('.kb');if(b){b.style.scrollSnapType='none';b.scrollLeft=x;KBX=x;kbX(b);requestAnimationFrame(()=>{b.style.scrollSnapType=''})}}};

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
  acts:`${ab?`<button class="sm pr" onclick="go('order','${ab.id}')">Abrir O.S. ${e(ab.num)}</button>`:`<button class="sm pr" onclick="checkin({placa:'${e(v.placa||'')}'})">+ Entrada do carro</button>`}${typeof novoOrc=='function'?`<button class="sm" onclick="novoOrc('${v.cli||''}','${v.id}')">Fazer orçamento</button><button class="sm" onclick="editAg(null,{cli:'${v.cli||''}',veh:'${v.id}'})">Agendar</button>`:''}${c.tel?`<button class="sm wa" onclick="waCli('${c.id}')">WhatsApp</button>`:''}<button class="sm" onclick="editVeh('${v.id}')">Editar cadastro</button>`})+
 `<div class="kts">${K('orders',O.length,O.length==1?'Serviço':'Serviços',KB)}${K('ospag',R(tot),deve>0.005?'Total · falta '+R(deve):'Total em serviços',deve>0.005?KA:KG)}${K('clock',ult?D(ult.conc||ult.aberta):'—',km?'Última visita · '+km.toLocaleString('pt-BR')+' km':'Última visita','#17A2B8')}</div>`+
 (prox?sech('Em aberto e agendado')+`<div class="tl">${prox}</div>`:'')+
 sech('Linha do tempo',O.length?plural(O.length,'O.S.','O.S.'):'')+(O.length?`<div class="tl">${ev}</div>`:empty('hist','Este carro ainda não tem serviço registrado.',`<button class="pr" onclick="checkin({placa:'${e(v.placa||'')}'})">+ Entrada do carro</button>`))}
V.veiculo=Vveic;


/* ---------- 2.50.0: Desfazer ao mudar a situação (Concluída e Entregue têm as próprias telas) ---------- */
{const _sm=G.stMuda;G.stMuda=function(id,v){const o=od(id);if(!o||o.status==v){closeM();return}if(['Concluída','Entregue'].includes(v)||typeof desfazivel!='function')return _sm(id,v);closeM();desfazivel(()=>_sm(id,v),'O.S. '+o.num+': '+v)}}
{const s2=document.createElement('style');s2.textContent=`
.kc.pk{display:flex;align-items:center;gap:11px;padding:9px 10px;margin:0 0 8px;border-left:4px solid var(--c);min-height:84px}
.pkf{flex:none;width:66px;height:66px;border-radius:10px;object-fit:cover;display:block;cursor:zoom-in;background:#000}
.pkf0{position:relative;margin:0;padding:0;border:1.5px dashed var(--ln);background:color-mix(in srgb,var(--ink) 5%,transparent);color:var(--mut);cursor:pointer;display:flex;align-items:center;justify-content:center}
.pkf0 svg{width:46px;height:30px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linejoin:round}.pkf0 i{position:absolute;right:-5px;bottom:-5px;width:24px;height:24px;border-radius:50%;background:var(--hi);color:#17181A;display:flex;align-items:center;justify-content:center}.pkf0 i svg{width:14px;height:14px;stroke-width:2.4}
.pkt{flex:1;min-width:0}.pk1{display:flex;align-items:center;gap:7px;min-width:0}.pk1 b{font-size:16px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk2{display:block;color:var(--mut);font-size:13px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk3{display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap}
.pkm{flex:none;width:26px;height:26px;min-height:0;margin:0;padding:0;border-radius:50%;border:0;background:color-mix(in srgb,var(--ac,#888) 24%,transparent);color:var(--ac,var(--ink));font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}
.pkm.z{background:transparent;border:1.5px dashed var(--ln);color:var(--mut);font-size:15px}
.pkd{font-size:12.5px;color:var(--mut);white-space:nowrap}.pkd.a{color:#D9A21B;font-weight:600}.pkd.r{color:#E06A4E;font-weight:600}.pkd.g{color:#3FA56C;font-weight:600}
.pka{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.pkv{font-size:13px;font-weight:700;color:#D9A21B;font-variant-numeric:tabular-nums;white-space:nowrap}.pkv.ok{color:#3FA56C}
.pkb{margin:0;padding:7px 12px;min-height:36px;font-size:14px;border-radius:9px;white-space:nowrap}
.plst .kc.pk{margin:0}
.pkh{display:flex;align-items:center;gap:8px;width:100%;margin:12px 0 8px;padding:2px 2px;background:none;border:0;color:var(--ink);font:600 15px/1.2 inherit;text-align:left;min-height:0}
.pkh span{flex:1}.pkh b{font-size:13px;color:var(--mut)}.pkh em{font-style:normal;color:var(--mut);font-size:12px;width:14px;text-align:center}.pkdot{width:9px;height:9px;border-radius:50%;background:var(--c);flex:none}
.pkh.fe{opacity:.8}
.pfl{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 0 8px}.pfl::-webkit-scrollbar{display:none}
.pfc{flex:none;margin:0;padding:5px 11px;min-height:32px;border-radius:99px;font-size:13.5px;font-weight:600;border:1px solid var(--ln);background:transparent;color:var(--mut)}.pfc b{color:var(--ink);margin-left:2px}
.pfc.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 20%,var(--sf));color:var(--ink)}
.pfq .pkcam{position:absolute;right:4px;top:50%;transform:translateY(-50%);margin:0;padding:0;width:40px;height:36px;min-height:0;border:0;background:transparent;color:var(--mut);display:flex;align-items:center;justify-content:center}.pfq .pkcam svg{position:static;transform:none;width:20px;height:20px}.pfq input{padding-right:46px}
.pkres{font-size:14px;color:var(--mut);font-weight:600;min-width:0}
.pvi button{padding:6px 9px}.pvi button span{display:none}
.pkhint{text-align:center;font-size:12px;color:var(--mut);margin:6px 0 10px}
.kbc .kc.pk{flex-wrap:wrap;min-height:0}.kbc .pkf{width:52px;height:52px}.kbc .pka{flex-direction:row;align-items:center;width:100%;justify-content:space-between}
.kc.drag{opacity:.45}.kbc.dz{outline:2px dashed var(--c);outline-offset:2px}
.pkpl #pkpr{margin-top:8px}.pkpl #pkpr .pr{margin:4px 0}
`;document.head.appendChild(s2)}

if(typeof render=='function'&&typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);
})(window);
