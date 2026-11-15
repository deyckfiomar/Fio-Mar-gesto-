/* Fio-Mar Gestor — leitura de código de barras (versão 2.19.0)
   - Câmera do celular (Chrome do Android: BarcodeDetector), sem internet.
   - Leitor Bluetooth ou USB: funciona como teclado; o app percebe a digitação muito rápida terminada em Enter.
   - Onde funciona:
     - qualquer tela: bipar abre a peça (ou oferece cadastrar);
     - Estoque: botões "Ler código" e "Entrada por bipe";
     - Nova peça / Editar peça: campo Código de barras com botão de câmera;
     - Peça do estoque (orçamento e O.S.): bipar escolhe a peça;
     - Chegaram as peças (pedido): bipar mostra a linha daquela peça. */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const sheet=(tit,body)=>{$('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};
try{Object.assign(ICO,{barras:'<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/><path d="M2.5 3.5h3M2.5 3.5v3M21.5 3.5h-3M21.5 3.5v3M2.5 20.5h3M2.5 20.5v-3M21.5 20.5h-3M21.5 20.5v-3" opacity=".55"/>',luz:'<path d="M9 2h6l-1 7h3l-7 13 1-9H8z"/>'})}catch(x){}
const limpa=c=>String(c==null?'':c).replace(/\s+/g,'').trim();
const porCod=c=>{c=limpa(c);if(!c)return null;return PR().find(p=>limpa(p.ean)==c)||PR().find(p=>limpa(p.cod)&&limpa(p.cod).toLowerCase()==c.toLowerCase())||null};
G.prodPorCodigo=porCod;

/* ---------- som e vibração da leitura ---------- */
let AC=null;function bip(ok){try{navigator.vibrate&&navigator.vibrate(ok?60:[40,60,40])}catch(x){}
 try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=ok?1760:440;g.gain.value=.08;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+(ok?.09:.25))}catch(x){}}

/* ---------- câmera ---------- */
let CAM=null;
const FORM=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code','data_matrix'];
G.lerCodigo=async function(cb,op){op=op||{};camFecha();
 const ov=document.createElement('div');ov.className='bcov';ov.innerHTML=`<div class="bcbox"><video playsinline muted autoplay></video><div class="bcmira"><i></i></div>
  <div class="bctop"><b>${e(op.titulo||'Aponte para o código de barras')}</b><small>${op.continuo?'Leia uma peça depois da outra. Toque em Pronto no fim.':'Segure o celular a uns 15 cm do código.'}</small></div>
  <div class="bcmsg" hidden></div>
  <div class="bcbar"><button type="button" class="bcb" data-a="luz" hidden>${svgi('luz')} Lanterna</button><button type="button" class="bcb" data-a="dig">Digitar</button><button type="button" class="bcb pr" data-a="sair">${op.continuo?'Pronto':'Fechar'}</button></div></div>`;
 document.body.appendChild(ov);const vd=ov.querySelector('video'),msg=ov.querySelector('.bcmsg'),fala=t=>{msg.hidden=!t;msg.textContent=t||''};
 CAM={ov,stream:null,raf:0,vivo:true};const C=CAM;
 ov.addEventListener('click',ev=>{const b=ev.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a=='sair')return camFecha();
  if(a=='dig'){const c=prompt('Digite o código de barras (os números embaixo das barras):');if(c&&limpa(c)){if(!op.continuo)camFecha();cb(limpa(c))}return}
  if(a=='luz'){const t=C.stream&&C.stream.getVideoTracks()[0];if(!t)return;C.luz=!C.luz;t.applyConstraints({advanced:[{torch:C.luz}]}).catch(()=>{});b.classList.toggle('on',C.luz)}});
 if(!('BarcodeDetector' in window)){fala('Este navegador não lê código pela câmera. Use o Chrome do Android atualizado, um leitor Bluetooth, ou toque em Digitar.');return}
 let det;try{const ok=await BarcodeDetector.getSupportedFormats();det=new BarcodeDetector({formats:FORM.filter(f=>ok.includes(f))})}catch(x){det=new BarcodeDetector()}
 try{C.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
 catch(x){fala(x&&x.name=='NotAllowedError'?'O app não tem permissão para usar a câmera. Libere a câmera para este site nas configurações do Chrome, ou toque em Digitar.':'Não consegui abrir a câmera. Toque em Digitar para escrever o código.');return}
 if(!C.vivo){C.stream.getTracks().forEach(t=>t.stop());return}
 vd.srcObject=C.stream;try{await vd.play()}catch(x){}
 try{const t=C.stream.getVideoTracks()[0],cp=t.getCapabilities&&t.getCapabilities();if(cp&&cp.torch)ov.querySelector('[data-a=luz]').hidden=false}catch(x){}
 let ult='',ultT=0,ocup=false,tq=0;
 const loop=async ts=>{if(!C.vivo)return;C.raf=requestAnimationFrame(loop);if(ocup||ts-tq<140||vd.readyState<2)return;tq=ts;ocup=true;
  try{const r=await det.detect(vd);if(r&&r.length&&C.vivo){const c=limpa(r[0].rawValue),agora=Date.now();
   if(c&&(c!=ult||agora-ultT>1800)){ult=c;ultT=agora;bip(true);ov.classList.add('lido');setTimeout(()=>ov.classList.remove('lido'),350);
    if(op.continuo){const t=cb(c);fala(typeof t=='string'?t:'Lido: '+c)}else{camFecha();cb(c)}}}}catch(x){}ocup=false};
 C.raf=requestAnimationFrame(loop)};
function camFecha(){const C=CAM;if(!C)return;C.vivo=false;cancelAnimationFrame(C.raf);try{C.stream&&C.stream.getTracks().forEach(t=>t.stop())}catch(x){}C.ov.remove();CAM=null;if(G.ENT&&ENT.aberta)entDes()}
G.lerFecha=camFecha;
/* o botão voltar do celular fecha a câmera */
addEventListener('popstate',()=>{if(CAM)camFecha()},true);

/* ---------- o que fazer com o código lido ---------- */
G.scanAbre=function(c){const p=porCod(c);if(p){bip(true);toast(p.nome+' · '+qty(p.id)+' '+(p.un||'un')+' em estoque');return go('prod',p.id)}
 bip(false);scanNovo(c)};
function scanNovo(c){sheet('Código não cadastrado',`<p style="margin:0 0 6px">Nenhuma peça do estoque tem o código <b class="bccod">${e(c)}</b>.</p>
 <p class="muted" style="margin:0 0 12px;font-size:13.5px">Cadastre a peça uma vez; da próxima vez é só bipar.</p>
 <div class="bar" style="margin:0"><button type="button" class="pr" onclick="closeM();editProd(null,{ean:'${e(c)}'})">Cadastrar peça nova</button>${PR().length?`<button type="button" onclick="closeM();scanLiga('${e(c)}')">É uma peça já cadastrada</button>`:''}</div>`)}
G.scanNovo=scanNovo;
G.scanLiga=function(c){modal('Ligar o código a uma peça',[['pid','Qual peça tem o código '+c+'?','busca',PR().filter(p=>!limpa(p.ean)).map(p=>[p.id,p.nome,p.cod||'',`${qty(p.id)} ${p.un} em estoque`,(p.fotos||[])[0]||'']),1]],{},o=>{const p=prod(o.pid);if(!p.id)return;p.ean=c;save();toast('Código guardado em '+p.nome);go('prod',p.id)})};

/* Peça do estoque (e outros campos de busca de peça): escolhe a peça */
function comboPeca(w,c){const p=porCod(c);if(!p){bip(false);toast('Código '+c+' não está em nenhuma peça do estoque');return true}
 const o=CBR[w.dataset.k];if(!o||!o.items.some(i=>i.id==p.id))return false;
 const b=document.createElement('button');b.dataset.id=p.id;w.querySelector('.cbl').appendChild(b);cbPick(b);bip(true);
 const q=$q('#modal [name=q]');if(q){setTimeout(()=>{try{q.focus();q.select()}catch(x){}},60)}return true}
/* Chegaram as peças: mostra a linha da peça */
function recebe(c){const rows=[...document.querySelectorAll('#modal .pdrr')];if(!rows.length)return false;const p=porCod(c);
 const r=rows.find(r=>{const d=r.querySelector('[name=dest]');return p&&d&&d.value==p.id})||rows.find(r=>p&&nrm(r.querySelector('.pdrh b').innerText)==nrm(p.nome));
 if(!r){bip(false);toast(p?p.nome+' não está neste pedido':'Código '+c+' não está em nenhuma peça');return true}
 bip(true);r.scrollIntoView({block:'center',behavior:'smooth'});r.classList.add('bcflash');setTimeout(()=>r.classList.remove('bcflash'),1600);
 const q=r.querySelector('[name=q]');if(q){try{q.focus();q.select()}catch(x){}}return true}

function trata(c,el){c=limpa(c);if(!c)return;
 if(G.ENT&&ENT.aberta)return entSoma(c);
 if(el&&el.name=='ean'){el.value=c;el.dispatchEvent(new Event('input',{bubbles:true}));const o=porCod(c),ed=$q('#modal h2');bip(true);
  if(o&&!(ed&&/Editar peça/.test(ed.innerText)&&S.v=='prod'&&S.id==o.id))toast('Atenção: esse código já é da peça '+o.nome);return}
 const w=el&&el.closest&&el.closest('.cb');if(w&&comboPeca(w,c))return;
 if(recebe(c))return;
 const mo=$q('#modal .ov');
 if(mo){const cbs=[...document.querySelectorAll('#modal .cb')].find(x=>CBR[x.dataset.k]&&CBR[x.dataset.k].items.some(i=>prod(i.id).id));if(cbs&&comboPeca(cbs,c))return;
  if(el&&/INPUT|TEXTAREA/.test(el.tagName))return;return toast('Feche a janela aberta para bipar outra peça')}
 scanAbre(c)}
G.scanTrata=trata;

/* ---------- leitor Bluetooth / USB (age como teclado) ---------- */
let BUF='',T0=0,TL=0,INI=null,VAL0='';
document.addEventListener('keydown',ev=>{if(ev.ctrlKey||ev.altKey||ev.metaKey)return;const agora=performance.now(),k=typeof ev.key=='string'?ev.key:'';if(!k)return;
 if(k=='Enter'||k=='Tab'){const ok=BUF.length>=6&&(agora-TL)<120&&(TL-T0)/Math.max(1,BUF.length-1)<45;
  if(ok){ev.preventDefault();ev.stopPropagation();const c=BUF,el=document.activeElement;
   if(el&&INI===el&&el.name!='ean'&&!el.closest('.srch')&&'value' in el&&el.value.endsWith(c)){el.value=VAL0;el.dispatchEvent(new Event('input',{bubbles:true}))}
   BUF='';trata(c,el)}else BUF='';return}
 if(k.length!==1){return}
 if(!BUF||agora-TL>60){BUF='';T0=agora;INI=document.activeElement;VAL0=INI&&'value' in INI?String(INI.value||''):''}
 BUF+=k;TL=agora},true);

/* ---------- Entrada por bipe (receber várias peças de uma vez) ---------- */
G.ENT={aberta:false,L:[],nc:[]};
G.entAbre=function(){ENT.aberta=true;ENT.L=[];ENT.nc=[];entDes()};
function entSoma(c){const p=porCod(c);if(!p){if(!ENT.nc.includes(c))ENT.nc.push(c);bip(false);entDes();return 'Código '+c+' não cadastrado'}
 const x=ENT.L.find(x=>x.pid==p.id);if(x)x.q++;else ENT.L.unshift({pid:p.id,q:1});bip(true);entDes();return p.nome+' · '+(x?x.q:1)}
G.entSoma=entSoma;
G.entQ=(pid,d)=>{const x=ENT.L.find(x=>x.pid==pid);if(!x)return;x.q=Math.max(0,x.q+d);if(!x.q)ENT.L=ENT.L.filter(y=>y!==x);entDes()};
function entDes(){if(!ENT.aberta)return;if(CAM)return;const tot=ENT.L.reduce((a,x)=>a+x.q,0);
 const html=`<p class="muted" style="margin:-4px 0 10px;font-size:13.5px">Bipe cada peça que chegou com o leitor ou pela câmera. Cada bipe soma 1.</p>
 <div class="bar" style="margin:0 0 12px"><button type="button" class="pr" onclick="lerCodigo(entSoma,{continuo:1,titulo:'Entrada por bipe'})">${svgi('barras')} Ler pela câmera</button><button type="button" onclick="const c=prompt('Código de barras ou código da peça:');if(c)entSoma(c)">Digitar código</button></div>
 ${ENT.L.length?`<div class="bcent">${ENT.L.map(x=>{const p=prod(x.pid);return`<div class="bcer">${typeof pfThumb=='function'?pfThumb(p):''}<div class="bcen"><b>${e(p.nome)}</b><small>tem ${qty(p.id)} ${e(p.un||'un')} → fica ${qty(p.id)+x.q}</small></div><div class="bcq"><button type="button" class="sm" onclick="entQ('${p.id}',-1)">−</button><b>${x.q}</b><button type="button" class="sm" onclick="entQ('${p.id}',1)">+</button></div></div>`}).join('')}</div>`:'<div class="empty" style="margin:0 0 10px">'+svgi('barras')+'<p>Nenhuma peça bipada ainda.</p></div>'}
 ${ENT.nc.length?`<div class="bcnc"><b>Códigos sem cadastro</b>${ENT.nc.map(c=>`<div class="bcer"><span class="bccod">${e(c)}</span><button type="button" class="sm" onclick="ENT.aberta=false;closeM();editProd(null,{ean:'${e(c)}'})">Cadastrar</button></div>`).join('')}</div>`:''}
 <label style="margin-top:12px">Fornecedor / nota fiscal (opcional)<input id="bcobs" value="${e(ENT.obs||'')}" oninput="ENT.obs=this.value"></label>
 <div class="bar" style="margin:12px 0 0"><button type="button" class="pr" ${tot?'':'disabled'} onclick="entOk()">Dar entrada${tot?' em '+plural(tot,'peça','peças'):''}</button><button type="button" onclick="ENT.aberta=false;closeM()">Cancelar</button></div>`;
 const b=$q('#modal .bcentsh');if(b){b.innerHTML=html;return}
 sheet('Entrada por bipe',`<div class="bcentsh">${html}</div>`)}
G.entDes=entDes;
G.entOk=function(){const L=ENT.L.filter(x=>x.q>0);if(!L.length)return;const obs=String(ENT.obs||'').trim()||'Entrada por bipe';
 L.forEach(x=>MV().push({id:uid(),pid:x.pid,tipo:'E',q:x.q,data:today(),obs}));save();ENT.aberta=false;closeM();render();
 toast('Entrada registrada: '+plural(L.reduce((a,x)=>a+x.q,0),'peça','peças'))};
/* fechar a janela pelo X ou pelo voltar encerra a entrada */
const md=document.getElementById('modal');if(md)new MutationObserver(()=>{if(ENT.aberta&&!CAM&&!$q('#modal .bcentsh'))ENT.aberta=false}).observe(md,{childList:true});

/* ---------- botões nas telas ---------- */
const _Vstock=Vstock;
G.Vstock=Vstock=function(){let h=_Vstock();const bt=`<button class="sm" onclick="lerCodigo(scanAbre)">${svgi('barras')} Ler código</button><button class="sm" onclick="entAbre()">Entrada por bipe</button>`;
 const i=h.indexOf('<div class="srch">');if(i>=0)h=h.slice(0,i)+`<div class="bcsr">${bt}</div>`+h.slice(i);return h};
try{if(V&&V.stock)V.stock=Vstock}catch(x){}
const _editProd=editProd;
G.editProd=editProd=function(id,pre){_editProd(id,pre);const f=$q('#modal form'),i=f&&f.ean;if(!i)return;i.inputMode='numeric';i.placeholder='Bipe, leia pela câmera ou digite';
 const lb=i.closest('label');lb.classList.add('bclb');const b=document.createElement('button');b.type='button';b.className='sm bccam';b.innerHTML=svgi('barras')+' Ler';b.title='Ler o código de barras pela câmera';
 b.onclick=()=>lerCodigo(c=>{i.value=c;i.dispatchEvent(new Event('input',{bubbles:true}));const o=porCod(c);if(o&&o.id!=id)toast('Atenção: esse código já é da peça '+o.nome)},{titulo:'Código de barras da peça'});
 lb.appendChild(b)};
const _addStock=addStock;
G.addStock=addStock=function(w,os){_addStock(w,os);const cb=$q('#modal .cb');if(!cb)return;
 cb.insertAdjacentHTML('afterend',`<div class="bar" style="margin:-4px 0 12px"><button type="button" class="sm" id="bcadd">${svgi('barras')} Ler código de barras</button></div>`);
 $q('#bcadd').onclick=()=>lerCodigo(c=>comboPeca(cb,c),{titulo:'Código de barras da peça'})};

const st=document.createElement('style');st.textContent=`
.bcov{position:fixed;inset:0;z-index:9999;background:#000;display:flex}
.bcbox{position:relative;flex:1;overflow:hidden}
.bcov video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.bcmira{position:absolute;left:50%;top:44%;width:min(80vw,420px);height:min(34vw,170px);transform:translate(-50%,-50%);border-radius:14px;box-shadow:0 0 0 100vmax rgba(0,0,0,.45);outline:3px solid var(--hi,#F5B700);outline-offset:0}
.bcmira i{position:absolute;left:8px;right:8px;top:50%;height:2px;background:#ff3b30;box-shadow:0 0 10px #ff3b30;animation:bclin 1.6s ease-in-out infinite}
@keyframes bclin{0%,100%{transform:translateY(-38px)}50%{transform:translateY(38px)}}
.bcov.lido .bcmira{outline-color:#2E8B57;box-shadow:0 0 0 100vmax rgba(46,139,87,.35)}
.bctop{position:absolute;left:0;right:0;top:0;padding:calc(18px + env(safe-area-inset-top)) 18px 14px;color:#fff;text-align:center;background:linear-gradient(#000c,#0000)}
.bctop b{display:block;font:700 22px/1.2 "Barlow Condensed","Barlow",sans-serif}.bctop small{opacity:.8;font-size:13.5px}
.bcmsg{position:absolute;left:16px;right:16px;bottom:calc(96px + env(safe-area-inset-bottom));padding:10px 14px;border-radius:10px;background:rgba(20,20,22,.9);color:#fff;text-align:center;font-weight:600}
.bcbar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:10px;justify-content:center;padding:14px 14px calc(18px + env(safe-area-inset-bottom));background:linear-gradient(#0000,#000d)}
.bcb{margin:0;min-height:48px;padding:0 18px;border-radius:12px;font-weight:700;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.3)}
.bcb.pr{background:var(--hi,#F5B700);color:#111;border-color:transparent}.bcb.on{background:#fff;color:#111}
.bcb svg,.bcsr svg,.bccam svg,#bcadd svg,.bcentsh button svg{width:17px;height:17px;vertical-align:-3px;fill:none;stroke:currentColor;stroke-width:2}
.bcsr{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}.bcsr .sm{margin:0}
.bclb{position:relative}.bclb input{padding-right:84px}.bccam{position:absolute;right:6px;bottom:6px;margin:0}
.bccod{font-family:ui-monospace,monospace;letter-spacing:.06em;background:color-mix(in srgb,var(--hi) 14%,transparent);padding:1px 6px;border-radius:5px}
.bcent,.bcnc{display:grid;gap:6px;margin:0 0 6px}.bcnc{margin-top:12px}.bcnc>b{font-size:13px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.bcer{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--ln);border-radius:10px}
.bcen{flex:1;min-width:0}.bcen b{display:block;overflow-wrap:anywhere}.bcen small{color:var(--mut)}
.bcq{display:flex;align-items:center;gap:8px}.bcq .sm{margin:0;width:38px;padding:0}.bcq b{min-width:22px;text-align:center;font:700 20px/1 "Barlow Condensed",sans-serif}
.bcer .pdtl{width:40px;height:40px;flex:none}
.bcflash{animation:bcfl 1.6s}@keyframes bcfl{0%,60%{box-shadow:0 0 0 3px var(--hi)}100%{box-shadow:none}}
`;document.head.appendChild(st);
})(window);
