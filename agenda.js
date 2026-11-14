/* Fio-Mar Gestor — Agenda mais prática (versão 2.18.0)
   - Cartão: nome do cliente em destaque; carro com a placa desenhada embaixo.
   - Faixa com os próximos 14 dias (quantos horários em cada) e "Horários livres" do dia, para agendar com um toque.
   - Formulário: atalhos de dia (Hoje, Amanhã...), de hora (só as livres) e de serviço; Duração e Situação em "Mais opções". */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
try{if(!ICO.car)ICO.car='<path d="M5 16.5h14M3.5 13l2-5.2A2 2 0 0 1 7.4 6.5h9.2a2 2 0 0 1 1.9 1.3l2 5.2v4.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-10v1a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="13.5" r=".6"/><circle cx="16.5" cy="13.5" r=".6"/>'}catch(x){}
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)};
const SEM=['dom','seg','ter','qua','qui','sex','sáb'];
const H0=8,H1=17; /* horários sugeridos: 08:00 até 17:00 */
const agoraMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const ativos=d=>AG().filter(a=>a.data==d&&a.status!='Cancelado');
const ocupado=(d,h,dur,ign)=>ativos(d).some(x=>x.id!=ign&&mins(x.hora)<mins(h)+(dur||60)&&mins(h)<mins(x.hora)+(+x.dur||60));
function livres(d,dur,ign){const L=[];for(let h=H0;h<=H1;h++){const hh=pad(h)+':00';if(d==today()&&h*60<=agoraMin())continue;if(!ocupado(d,hh,dur,ign))L.push(hh)}return L}
const ini=n=>String(n||'?').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';

/* ---------- cartão do agendamento ---------- */
G.agRow=agRow=function(a){const c=cl(a.cli),v=a.veh?vh(a.veh):null,os=a.os&&od(a.os),cor=SC[a.status]||KM,mod=v?(v.modelo||'Veículo'):'',plc=v&&v.placa?`<span class="plc">${e(v.placa)}</span>`:'';
 return lcard({c:cor,dim:a.status=='Cancelado',n:`<span class="lch">${e(a.hora)}</span>${a.dur?' · '+e(a.dur)+' min':''}`,pill:pill(a.status),
  t:`<span class="agcli"><span class="agav" style="--c:${cor}">${e(ini(c.nome))}</span><span class="agnm">${e(c.nome||'Sem cliente')}</span></span>`,
  m:`<span class="agveh">${v?`${svgi('car')}<span>${e(mod)}</span>${plc||`<span class="mb" style="--c:${KA}">Sem placa</span>`}`:`<span class="mb" style="--c:${KA}">Sem veículo</span>`}</span><span class="agsv">${e(a.svc||'Serviço não informado')}${a.aviso?' · aviso enviado '+D(a.aviso):''}</span>`,
  f:`${!a.veh&&a.status!='Cancelado'?`<button class="sm" onclick="event.stopPropagation();editAg('${a.id}')">+ Veículo</button>`:''}<button class="sm wa" onclick="event.stopPropagation();waAg('${a.id}')">Avisar</button>${a.status=='Agendado'?`<button class="sm" onclick="event.stopPropagation();setAg('${a.id}','Confirmado')">Confirmar</button>`:''}${a.status!='Cancelado'?`<button class="sm ${os?'':'pr'}" onclick="event.stopPropagation();agOS('${a.id}')">${os?'Abrir O.S. '+e(os.num):'Gerar O.S.'}</button>`:''}`,on:`editAg('${a.id}')`})};

/* ---------- faixa de dias e horários livres ---------- */
G.agStrip=function(sel){const t=today();let h='';for(let i=0;i<14;i++){const d=addD(t,i),n=ativos(d).length,dt=new Date(d+'T12:00');
  h+=`<button type="button" class="agd${d==sel?' on':''}${n?' tem':''}" onclick="agDia('${d}')" aria-pressed="${d==sel}"><small>${i==0?'hoje':i==1?'amanhã':SEM[dt.getDay()]}</small><b>${dt.getDate()}</b><i>${n?plural(n,'horário','horários'):'livre'}</i></button>`}
 return`<div class="agds" role="group" aria-label="Escolher o dia">${h}</div>`};
G.agDia=function(d){S.f.agd=S.f.agd==d?'':d;render()};
G.agLivres=function(d){const L=livres(d,60);if(d<today())return'';
 return`<div class="card agfree"><div class="agfh"><b>${L.length?'Horários livres':'Dia cheio'}</b><small>${L.length?'toque para agendar':'nenhum horário livre entre 08:00 e 17:00'}</small></div>${L.length?`<div class="agfl">${L.map(h=>`<button type="button" class="sm agh" onclick="editAg(null,{data:'${d}',hora:'${h}'})">+ ${h}</button>`).join('')}</div>`:''}</div>`};
/* trocar de aba (Hoje, Próximos, Anteriores) limpa o dia escolhido */
const _setF=setF;G.setF=setF=function(k,v){if(k=='ag')S.f.agd='';return _setF(k,v)};

/* ---------- formulário de agendar com atalhos ---------- */
const _editAg=editAg;
G.editAg=editAg=function(id,pre){_editAg(id,pre);const f=$q('#modal form');if(!f||!f.data||!f.hora)return;
 const lab=n=>f[n]&&f[n].closest('label');
 /* dia */
 const dl=lab('data');dl.insertAdjacentHTML('afterend','<div class="agq" id="agqd"></div>');
 const t=today(),dias=[];for(let i=0;i<7;i++)dias.push(addD(t,i));
 const desD=()=>{$q('#agqd').innerHTML=dias.map((d,i)=>{const dt=new Date(d+'T12:00');return`<button type="button" class="agc${f.data.value==d?' on':''}" data-d="${d}">${i==0?'Hoje':i==1?'Amanhã':SEM[dt.getDay()]+' '+dt.getDate()}</button>`}).join('')};
 /* hora: só as livres no dia escolhido */
 const hl=lab('hora');hl.insertAdjacentHTML('afterend','<div class="agq" id="agqh"></div>');
 const dur=()=>+(f.dur&&nBR(f.dur.value))||(SV().find(s=>s.nome==(f.svc&&f.svc.value))||{}).dur||60;
 const desH=()=>{const L=livres(f.data.value,dur(),id),cur=f.hora.value;$q('#agqh').innerHTML=L.length?`<small class="agql">Livres:</small>`+L.map(h=>`<button type="button" class="agc${cur==h?' on':''}" data-h="${h}">${h}</button>`).join(''):`<small class="agql">${f.data.value<t?'Dia que já passou':'Sem horário livre entre 08:00 e 17:00 neste dia'}</small>`};
 $q('#agqd').onclick=ev=>{const b=ev.target.closest('[data-d]');if(!b)return;f.data.value=b.dataset.d;f.data.dispatchEvent(new Event('change',{bubbles:true}));desD();
  const L=livres(f.data.value,dur(),id);if(!id&&L.length&&!L.includes(f.hora.value))f.hora.value=L[0];desH()};
 $q('#agqh').onclick=ev=>{const b=ev.target.closest('[data-h]');if(!b)return;f.hora.value=b.dataset.h;f.hora.dispatchEvent(new Event('change',{bubbles:true}));desH()};
 f.data.addEventListener('change',()=>{desD();desH()});f.hora.addEventListener('change',desH);if(f.svc)f.svc.addEventListener('change',desH);
 /* agendamento novo: se a hora sugerida já está ocupada, pega a primeira livre */
 if(!id&&!(pre&&pre.hora)){const L=livres(f.data.value,60,id);if(L.length&&!L.includes(f.hora.value))f.hora.value=L[0]}
 desD();desH();
 /* serviço: atalhos com os serviços cadastrados */
 if(f.svc&&f.svc.tagName=='SELECT'&&SV().length){const sl=lab('svc');sl.insertAdjacentHTML('afterend','<div class="agq" id="agqs"></div>');
  const desS=()=>{$q('#agqs').innerHTML=SV().slice(0,8).map(s=>`<button type="button" class="agc${f.svc.value==s.nome?' on':''}" data-s="${e(s.nome)}">${e(s.nome)}</button>`).join('')};
  $q('#agqs').onclick=ev=>{const b=ev.target.closest('[data-s]');if(!b)return;f.svc.value=f.svc.value==b.dataset.s?'':b.dataset.s;f.svc.dispatchEvent(new Event('change',{bubbles:true}));desS()};
  f.svc.addEventListener('change',desS);desS()}
 /* data e hora lado a lado */
 const g=document.createElement('div');g.className='agdh';dl.before(g);g.append(dl,$q('#agqd'),hl,$q('#agqh'));
 /* duração e situação: menos usados, ficam em "Mais opções" (no agendamento novo) */
 if(!id){const dd=document.createElement('details');dd.className='agmais';dd.innerHTML='<summary>Mais opções: duração e situação</summary>';const L=[lab('dur'),lab('status')].filter(Boolean);if(L.length){L[0].before(dd);L.forEach(x=>dd.append(x))}}
 /* ordem do formulário: cliente, veículo, serviço, dia e hora, observações */
 const sv=lab('svc'),q=$q('#agqs');if(sv){g.before(sv);if(q)g.before(q)}
};

const st=document.createElement('style');st.textContent=`
.agcli{display:flex;align-items:center;gap:10px;min-width:0}
.agav{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font:700 15px/1 "Barlow Condensed",sans-serif;letter-spacing:.04em;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);border:1.5px solid color-mix(in srgb,var(--c) 55%,transparent)}
.agnm{font:700 23px/1.1 "Barlow Condensed","Barlow",sans-serif;color:var(--ink);overflow-wrap:anywhere}
.lc .lct:has(.agcli){margin-top:8px}
.agveh{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:6px 0 2px 46px;color:var(--ink);font-size:14.5px;font-weight:500}
.agveh svg{width:17px;height:17px;fill:none;stroke:var(--mut);stroke-width:2;flex:none}
.agsv{display:block;margin-left:46px}
.agds{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 10px;margin:0 0 6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}.agds::-webkit-scrollbar{display:none}
.agd{flex:none;scroll-snap-align:start;width:64px;margin:0;padding:8px 4px;border-radius:12px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:1px}
.agd small{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
.agd b{font:700 24px/1.05 "Barlow Condensed",sans-serif}
.agd i{font-style:normal;font-size:10.5px;color:var(--mut);white-space:nowrap}
.agd.tem i{color:var(--hi);font-weight:600}
.agd.on{border-color:var(--hi);background:color-mix(in srgb,var(--hi) 16%,var(--sf));box-shadow:inset 0 -3px 0 var(--hi)}
.agfree{padding:12px 14px}.agfh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:8px}.agfh small{color:var(--mut)}
.agfl{display:flex;flex-wrap:wrap;gap:6px}.agh{margin:0;border-style:dashed;font-variant-numeric:tabular-nums}
.agq{display:flex;flex-wrap:wrap;gap:6px;margin:-4px 0 12px}
.agql{align-self:center;color:var(--mut);font-size:12.5px;margin-right:2px}
.agc{margin:0;padding:6px 11px;min-height:36px;border-radius:99px;font-size:14px;font-weight:600;border:1px solid var(--ln);background:transparent;color:var(--ink);font-variant-numeric:tabular-nums}
.agc.on{background:var(--hi);border-color:var(--hi);color:#1a1a1a}
.agdh{border:1px solid var(--ln);border-radius:12px;padding:10px 12px 2px;margin:4px 0 12px;background:color-mix(in srgb,var(--hi) 5%,transparent)}
.agmais{margin:4px 0 12px;border-top:1px solid var(--ln);padding-top:6px}.agmais summary{cursor:pointer;color:var(--mut);font-weight:600;padding:8px 0}
`;document.head.appendChild(st);
})(window);
