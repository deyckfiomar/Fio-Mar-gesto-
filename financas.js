/* Fio-Mar Gestor — Finanças: lucro por dia (versão 2.15.0)
   Mostra, para cada dia, quanto a oficina faturou, o lucro bruto, as despesas e o lucro líquido.
   - O.S. conta no dia em que foi concluída.
   - Despesa avulsa conta no dia dela; despesa de todo mês é dividida pelos dias do mês (custo fixo por dia).
   - Recebido conta no dia do pagamento. */
(function (G) {
'use strict';
const dim=m=>new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
const ocDia=o=>String(o.conc||(o.pags.length?o.pags[o.pags.length-1].data:o.aberta)||'').slice(0,10);
const addD=(d,n)=>{const t=new Date(d+'T12:00');t.setDate(t.getDate()+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
const fixoDia=m=>despMes(m).filter(x=>x.rec=='1').reduce((a,x)=>a+(+x.valor||0),0)/dim(m);
const cOS=o=>o.items.reduce((a,i)=>a+(+i.q||0)*cItem(i),0);

/* todos os dias de um mês, já somados */
function mesDias(m){const n=dim(m),fx=fixoDia(m),L=[];
 for(let i=1;i<=n;i++)L.push({d:m+'-'+String(i).padStart(2,'0'),os:[],fat:0,custo:0,av:0,avL:[],fx,rec:0,pg:[]});
 const at=d=>{d=String(d||'');return d.slice(0,7)==m?L[+d.slice(8,10)-1]:null};
 db.orders.forEach(o=>{if(done(o)){const x=at(ocDia(o));if(x){x.os.push(o);x.fat+=oTot(o);x.custo+=cOS(o)}}
  (o.pags||[]).forEach(p=>{const x=at(p.data);if(x){x.rec+=+p.valor||0;x.pg.push({o,p})}})});
 DP().forEach(d=>{if(d.rec!='1'){const x=at(d.data);if(x){x.av+=+d.valor||0;x.avL.push(d)}}});
 L.forEach(x=>{x.bruto=x.fat-x.custo;x.dsp=x.av+x.fx;x.liq=x.bruto-x.dsp;x.mov=x.os.length||x.avL.length||x.pg.length});return L}
G.finDiaDados=d=>mesDias(d.slice(0,7))[+d.slice(8,10)-1];
G.finHoje=()=>{const x=finDiaDados(today());return x?x.liq:0};

const MET=[['liq','Lucro líquido','Líquido'],['bruto','Lucro bruto','Bruto'],['fat','Faturamento','Faturou'],['rec','Recebido','Recebido']];
function grafico(L,sel,met,hoje){const W=360,H=176,pl=34,pr=4,pt=10,pb=22,pw=W-pl-pr,ph=H-pt-pb,V=L.filter(x=>x.d<=hoje),vals=V.map(x=>x[met]);
 let mx=Math.max(...vals,0),mn=Math.min(...vals,0);if(mx==mn)mx=mn+1;const st=niceStep((mx-mn)/3);mx=Math.ceil(mx/st-1e-9)*st;mn=Math.floor(mn/st+1e-9)*st;
 const Y=v=>pt+ph*(1-(v-mn)/(mx-mn)),gw=pw/L.length,bw=Math.max(3,gw-2.5);let g='';
 for(let v=mn;v<=mx+1e-9;v+=st)g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" style="stroke:var(--ln)" stroke-width="${Math.abs(v)<1e-9?1.5:.6}"/><text class="cht" x="${pl-4}" y="${(Y(v)+3.5).toFixed(1)}" text-anchor="end">${K(v)}</text>`;
 L.forEach((x,i)=>{const x0=pl+gw*i,cx=x0+gw/2,dia=+x.d.slice(8,10),fut=x.d>hoje;
  if(x.d==sel)g+=`<rect x="${x0.toFixed(1)}" y="${pt-4}" width="${gw.toFixed(1)}" height="${ph+8}" rx="3" style="fill:var(--hi);opacity:.22"/>`;
  if(!fut){const v=x[met],y0=Y(0),y1=Y(v),cor=met=='rec'?'#17A2B8':met=='fat'?'#2F6FB0':v<0?'#B4472E':met=='bruto'?'#F5B700':'#2E8B57';
   g+=`<rect x="${(cx-bw/2).toFixed(1)}" y="${Math.min(y0,y1).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(v?1.5:0,Math.abs(y1-y0)).toFixed(1)}" rx="1.5" fill="${cor}" ${x.mov?'':'opacity=".45"'}/>`}
  if(dia==1||dia%5==0)g+=`<text class="cht" x="${cx.toFixed(1)}" y="${H-7}" text-anchor="middle" ${x.d==sel?'style="font-weight:700;fill:var(--ink)"':''}>${dia}</text>`;
  if(!fut)g+=`<rect x="${x0.toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}" fill="transparent" style="cursor:pointer" onclick="setF('fd','${x.d}')"><title>${D(x.d)}: ${R(x[met])}</title></rect>`});
 return svg(W,H,g,MET.find(x=>x[0]==met)[1]+' por dia')}

G.finDia=function(){const hoje=today();let d=S.f.fd||hoje;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d>hoje)d=hoje;
 const m=d.slice(0,7),L=mesDias(m),x=L[+d.slice(8,10)-1],met=MET.some(k=>k[0]==S.f.fm)?S.f.fm:'liq',
  V=L.filter(y=>y.d<=hoje),T=k=>V.reduce((a,y)=>a+y[k],0),trab=V.filter(y=>y.os.length),neg=V.filter(y=>y.liq<0&&y.mov).length,
  best=trab.slice().sort((a,b)=>b.liq-a.liq)[0],liqM=T('liq'),
  nome=d==hoje?'Hoje':d==addD(hoje,-1)?'Ontem':'',dt=new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}),
  kpi=(l,v,sub,c)=>`<div class="kpi" style="--c:${c}"><span>${l}</span><div class="num">${v}</div>${sub?`<small class="muted">${sub}</small>`:''}</div>`,
  mg=x.fat?Math.round(x.bruto/x.fat*100):0;
 return`<div class="card fdia">
 <div class="fdh"><button type="button" class="fdn" aria-label="Dia anterior" onclick="setF('fd','${addD(d,-1)}')">‹</button>
  <label class="fdt"><b>${nome?nome+' · ':''}${e(dt)}</b><small>Lucro por dia · toque para escolher a data</small><input type="date" data-cru="1" value="${d}" max="${hoje}" onchange="if(this.value)setF('fd',this.value)"></label>
  <button type="button" class="fdn" aria-label="Dia seguinte" ${d>=hoje?'disabled':''} onclick="setF('fd','${addD(d,1)}')">›</button></div>
 <div class="fdl" style="--c:${x.liq>=0?'#2E8B57':'#B4472E'}"><span>${x.liq>=0?'Lucro líquido do dia':'Prejuízo do dia'}</span><b>${R(x.liq)}</b>
  <small>${x.os.length?`${plural(x.os.length,'O.S. concluída','O.S. concluídas')} · faturou ${R(x.fat)}`:'Nenhuma O.S. concluída neste dia'}${x.fx>0?` · custo fixo do dia ${R(x.fx)}`:''}</small></div>
 <div class="kpis fdk">${kpi('Faturou',R(x.fat),x.os.length?'ticket '+R(x.fat/x.os.length):'',`#2F6FB0`)}${kpi('Lucro bruto',R(x.bruto),x.fat?'margem '+mg+'%':'faturou − custo das peças','#F5B700')}
  ${kpi('Despesas',R(x.dsp),x.dsp?`do dia ${R(x.av)} · fixas ${R(x.fx)}`:'nenhuma','#B4472E')}${kpi('Recebido',R(x.rec),x.pg.length?plural(x.pg.length,'pagamento','pagamentos'):'nenhum pagamento','#17A2B8')}</div>
 <div class="seg fds" role="group">${MET.map(([k,,t])=>`<button type="button" class="${met==k?'on':''}" aria-pressed="${met==k}" onclick="setF('fm','${k}')">${t}</button>`).join('')}</div>
 ${grafico(L,d,met,hoje)}
 <p class="fdr"><b>${ML(m)}${m==hoje.slice(0,7)?' até hoje':''}:</b> lucro líquido <b style="color:${liqM>=0?'#2E8B57':'#B4472E'}">${R(liqM)}</b> · faturou ${R(T('fat'))} · recebeu ${R(T('rec'))}.<br>
  ${trab.length?`${plural(trab.length,'dia','dias')} com O.S. concluída, média de <b>${R(trab.reduce((a,y)=>a+y.liq,0)/trab.length)}</b> por dia${best?` · melhor dia ${D(best.d).slice(0,5)} (${R(best.liq)})`:''}${neg?` · ${plural(neg,'dia','dias')} no prejuízo`:''}.`:'Nenhuma O.S. concluída neste mês ainda.'}
  ${x.fx>0?`<br>Custo fixo: <b>${R(x.fx)} por dia</b>. É o lucro bruto que a oficina precisa fazer por dia para empatar.`:'<br><span class="muted">Cadastre as despesas de todo mês (aluguel, energia, salários) para ver o custo fixo por dia.</span>'}</p>
 <details class="fdd" ${S.f.fdx?'open':''} ontoggle="S.f.fdx=this.open?1:0"><summary>Detalhes do dia ${D(d).slice(0,5)}</summary>
  ${x.os.length?'<h3>O.S. concluídas</h3>'+x.os.map(rowOS).join(''):''}
  ${x.pg.length?'<h3>Pagamentos recebidos</h3>'+x.pg.map(({o,p})=>`<div class="row" onclick="go('order','${o.id}','pag')"><div>O.S. ${e(o.num)} · ${e(cl(o.cli).nome||'')}<small>${e(p.forma||'')}${p.forma=='Parcelado'?' em '+p.parc+'x':''}</small></div><div class="r"><b>${R(p.valor)}</b></div></div>`).join(''):''}
  ${x.avL.length?'<h3>Despesas do dia</h3>'+x.avL.map(rowDesp).join(''):''}
  ${x.mov?'':'<p class="muted" style="margin:8px 0">Sem movimento neste dia.</p>'}
  <div class="bar" style="margin:10px 0 0"><button type="button" class="sm" onclick="editDesp(null,{data:'${d}'})">+ Despesa neste dia</button></div></details>
 <details class="fdd" ${S.f.fdl?'open':''} ontoggle="S.f.fdl=this.open?1:0"><summary>Dia a dia de ${ML(m)}</summary>
  <div class="fdtb"><div class="fdtr fdth"><span>Dia</span><span>O.S.</span><span>Faturou</span><span>Lucro líq.</span></div>
  ${V.slice().reverse().filter(y=>y.mov).map(y=>`<button type="button" class="fdtr ${y.d==d?'on':''}" onclick="setF('fd','${y.d}')"><span>${D(y.d).slice(0,5)} <i>${new Date(y.d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</i></span><span>${y.os.length||'–'}</span><span>${R(y.fat)}</span><span style="color:${y.liq>=0?'#2E8B57':'#B4472E'};font-weight:700">${R(y.liq)}</span></button>`).join('')||'<p class="muted" style="margin:8px 0">Nenhum dia com movimento.</p>'}</div>
  <small class="muted">Só aparecem os dias com O.S. concluída, pagamento ou despesa.</small></details></div>`};

const st=document.createElement('style');st.textContent=`
.fdia{border-top:4px solid #2E8B57}
.fdh{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.fdn{flex:none;width:44px;height:44px;margin:0;padding:0;font-size:24px;line-height:1;border-radius:10px}
.fdn:disabled{opacity:.3}
.fdt{position:relative;flex:1;min-width:0;margin:0;text-align:center;cursor:pointer}
.fdt b{display:block;font-size:16px;color:var(--ink)}.fdt b::first-letter{text-transform:uppercase}
.fdt small{display:block;color:var(--mut);font-weight:400;font-size:12px}
.fdt input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:pointer}
.fdl{border-radius:10px;padding:10px 14px;margin-bottom:10px;background:color-mix(in srgb,var(--c) 14%,transparent);border-left:5px solid var(--c)}
.fdl span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)}
.fdl b{display:block;font:700 30px/1.15 'Barlow Condensed','Barlow',sans-serif;color:var(--c)}
.fdl small{display:block;color:var(--mut);font-size:13px}
.fdk{grid-template-columns:1fr 1fr!important}
@media (min-width:761px){.fdk{grid-template-columns:repeat(4,1fr)!important}}
.fdk .kpi .num{font-size:20px}
.fds{margin:0 0 8px}
.fdr{margin:8px 0 4px;font-size:13.5px;line-height:1.5;color:var(--mut)}.fdr b{color:var(--ink)}
.fdd{border-top:1px solid var(--ln);margin-top:8px;padding-top:8px}
.fdd summary{cursor:pointer;font-weight:600;padding:6px 0}
.fdd h3{font-size:13px;margin:10px 0 6px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.fdtb{display:grid;gap:2px;margin:6px 0}
.fdtr{display:grid;grid-template-columns:1.3fr .5fr 1fr 1fr;gap:6px;align-items:center;width:100%;margin:0;padding:8px 6px;border:0;border-radius:6px;background:transparent;color:var(--ink);font-size:13.5px;text-align:right;font-weight:400}
.fdtr span:first-child{text-align:left}.fdtr i{font-style:normal;color:var(--mut);font-size:12px}
.fdth{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);padding:2px 6px}
button.fdtr:nth-child(even){background:color-mix(in srgb,var(--ln) 35%,transparent)}
button.fdtr.on{box-shadow:inset 3px 0 0 var(--hi);background:color-mix(in srgb,var(--hi) 14%,transparent)}
`;document.head.appendChild(st);
if(typeof SES!='undefined'&&SES&&typeof render=='function'&&S.v=='fin')render();
})(window);
