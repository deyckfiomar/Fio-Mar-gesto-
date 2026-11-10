/* Fio-Mar Gestor — backup (versão 2.9.1)
   Lembrete semanal no Painel, backup completo com fotos (.zip) e restauração do .zip ou do .json. */
(function (G) {
'use strict';
const $q=s=>document.querySelector(s);
const DIAS=7;
const tam=n=>n>1e6?(n/1e6).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB';
const md=(h,fecha)=>{$('#modal').innerHTML=`<div class="ov"${fecha?' onclick="if(event.target===this)closeM()"':''}><div class="md" role="dialog" aria-modal="true" aria-live="polite">${h}</div></div>`};

/* ---------- data do último backup: vale para todos os aparelhos ---------- */
const local=()=>{try{return localStorage.getItem('fm_bkp')||''}catch(x){return''}};
G.bkpData=bkpData=function(){const a=local(),b=(db.cfg&&db.cfg.bkp)||'';return a>b?a:b};
function marca(){try{localStorage.setItem('fm_bkp',today())}catch(x){}db.cfg=db.cfg||{};if(db.cfg.bkp!=today()){db.cfg.bkp=today();save()}}
const atraso=()=>{const d=bkpData();return d?Math.round((new Date(today()+'T12:00')-new Date(d+'T12:00'))/864e5):null};

/* ---------- lembrete em "O que fazer agora" ---------- */
G.bkpAviso=function(){if(!DONO()||typeof SEMDADOS!='undefined'&&SEMDADOS)return null;const n=atraso();if(n!=null&&n<DIAS)return null;
 return[0,n==null?'Fazer o primeiro backup':'Backup atrasado: último há '+n+' dias',n==null?'Os dados ficam só na nuvem. Guarde uma cópia no Google Drive.':'Último backup em '+D(bkpData())+'. O ideal é um por semana.',`<button class="sm pr" onclick="bkpFull()">Fazer backup</button>`]};

/* ---------- backup só dos dados (.json) ---------- */
const _backup=backup;G.backup=backup=function(){const r=_backup();marca();return r};

/* ---------- ZIP (sem compressão: fotos já são comprimidas) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const u8=s=>new TextEncoder().encode(s);
function zipMonta(arqs){const partes=[],cen=[];let off=0;const agora=new Date(),tm=(agora.getHours()<<11)|(agora.getMinutes()<<5)|(agora.getSeconds()>>1),dt=((agora.getFullYear()-1980)<<9)|((agora.getMonth()+1)<<5)|agora.getDate();
 for(const[nome,dados]of arqs){const n=u8(nome),c=crc32(dados),h=new DataView(new ArrayBuffer(30));
  [[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[8,0,2],[10,tm,2],[12,dt,2],[14,c,4],[18,dados.length,4],[22,dados.length,4],[26,n.length,2],[28,0,2]].forEach(([o,v,s])=>s==4?h.setUint32(o,v,true):h.setUint16(o,v,true));
  const z=new DataView(new ArrayBuffer(46));[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[10,0,2],[12,tm,2],[14,dt,2],[16,c,4],[20,dados.length,4],[24,dados.length,4],[28,n.length,2],[30,0,2],[32,0,2],[34,0,2],[36,0,2],[38,0,4],[42,off,4]].forEach(([o,v,s])=>s==4?z.setUint32(o,v,true):z.setUint16(o,v,true));
  partes.push(new Uint8Array(h.buffer),n,dados);cen.push(new Uint8Array(z.buffer),n);off+=30+n.length+dados.length}
 const tc=cen.reduce((a,x)=>a+x.length,0),f=new DataView(new ArrayBuffer(22));[[0,0x06054b50,4],[4,0,2],[6,0,2],[8,arqs.length,2],[10,arqs.length,2],[12,tc,4],[16,off,4],[20,0,2]].forEach(([o,v,s])=>s==4?f.setUint32(o,v,true):f.setUint16(o,v,true));
 return new Blob([...partes,...cen,new Uint8Array(f.buffer)],{type:'application/zip'})}
async function zipLe(buf){const v=new DataView(buf),b=new Uint8Array(buf);let e0=-1;for(let i=b.length-22;i>=Math.max(0,b.length-66000);i--)if(v.getUint32(i,true)==0x06054b50){e0=i;break}
 if(e0<0)throw new Error('não é um arquivo .zip válido');const n=v.getUint16(e0+10,true);let p=v.getUint32(e0+16,true);const out={},dec=new TextDecoder();
 for(let k=0;k<n;k++){if(v.getUint32(p,true)!=0x02014b50)throw new Error('arquivo .zip danificado');const met=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true),nome=dec.decode(b.subarray(p+46,p+46+nl));
  const ini=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true),raw=b.subarray(ini,ini+cs);
  if(!nome.endsWith('/')){if(met==0)out[nome]=raw;else if(met==8&&typeof DecompressionStream=='function')out[nome]=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());else if(met==8)throw new Error('este navegador não abre .zip comprimido. Use o arquivo gerado pelo app sem mexer nele')}
  p+=46+nl+xl+cl}return out}
const d2u=d=>{const s=atob(d.split(',')[1]||''),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a};
const u2d=(a,mime)=>{let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode.apply(null,a.subarray(i,i+32768));return'data:'+mime+';base64,'+btoa(s)};

/* ---------- backup completo com fotos ---------- */
let BK=null;
const refs=()=>[...new Set((JSON.stringify(db).match(/"sb:[^"]+"/g)||[]).map(x=>x.slice(4,-1)))];
function prog(t,f){const b=$q('#bkp');if(!b)return;b.querySelector('span').textContent=t;b.querySelector('i').style.width=Math.round(f*100)+'%'}
G.bkpFull=async function(){if(!DONO())return;if(typeof SEMDADOS!='undefined'&&SEMDADOS)return toast('Conecte na internet uma vez para carregar os dados antes do backup');
 const L=refs(),tk=BK=Date.now();
 md(`<h2 style="margin-top:0">Fazendo o backup completo</h2><div id="bkp" class="bkp"><span>Juntando os dados…</span><div><i></i></div></div><p class="muted" style="font-size:13px">Clientes, veículos, O.S., orçamentos, estoque, finanças, agenda e ${L.length?plural(L.length,'foto','fotos'):'configurações'}. Deixe o app aberto até terminar.</p><div class="bar" style="margin:12px 0 0"><span class="sp"></span><button type="button" onclick="bkpCancela()">Cancelar</button></div>`);
 const arq=[],falta=[];let i=0;
 for(const p of L){if(BK!=tk)return;prog(`Baixando fotos: ${i+1} de ${L.length}`,L.length?i/L.length*.9:0);
  const d=await fload(p);if(d)arq.push(['fotos/'+p,d2u(d)]);else falta.push(p);i++}
 if(BK!=tk)return;prog('Montando o arquivo…',.95);
 const pac={app:'Fio-Mar Gestor',versao:APP_VER,em:new Date().toISOString(),oficina:OF||'',fotos:arq.length,faltaram:falta,db};
 arq.unshift(['backup.json',u8(JSON.stringify(pac))]);
 const blob=zipMonta(arq),nome='fiomar-backup-completo-'+today()+'.zip',file=typeof File=='function'?new File([blob],nome,{type:'application/zip'}):null;
 BK={blob,nome,file};marca();
 const share=file&&navigator.canShare&&(()=>{try{return navigator.canShare({files:[file]})}catch(x){return false}})();
 md(`<h2 style="margin-top:0">Backup pronto</h2><p style="margin:0 0 6px"><b>${e(nome)}</b> · ${tam(blob.size)}</p><p class="muted" style="margin:0 0 10px;font-size:13px">Tem todos os dados e ${plural(arq.length-1,'foto','fotos')}.${falta.length?` <b style="color:${KA}">${plural(falta.length,'foto não baixou','fotos não baixaram')}</b> (sem internet?). Faça de novo com internet para incluir.`:''}</p>
 <p style="margin:0 0 12px;font-size:14px">${share?'Toque em <b>Enviar para o Drive</b> e escolha o Google Drive. Ou baixe e guarde no Drive depois.':'Baixe o arquivo e guarde uma cópia no Google Drive.'}</p>
 <div class="bar" style="margin:0"><button type="button" onclick="closeM()">Fechar</button><span class="sp"></span><button type="button" class="${share?'':'pr'}" onclick="bkpBaixa()">Baixar</button>${share?'<button type="button" class="pr" onclick="bkpEnvia()">Enviar para o Drive</button>':''}</div>`,1);render(1)};
G.bkpCancela=function(){BK=null;closeM()};
G.bkpBaixa=function(){if(!BK||!BK.blob)return;const u=URL.createObjectURL(BK.blob),a=document.createElement('a');a.href=u;a.download=BK.nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);toast('Salvo em Downloads: '+BK.nome)};
G.bkpEnvia=async function(){if(!BK||!BK.file)return;try{await navigator.share({files:[BK.file],title:BK.nome});toast('Backup enviado')}catch(x){if(x&&x.name!='AbortError')toast('Não consegui compartilhar. Use o botão Baixar.')}};

/* ---------- restaurar (.zip completo ou .json) ---------- */
G.restore=restore=function(){if(!DONO())return;const i=document.createElement('input');i.type='file';i.accept='.zip,application/zip,.json,application/json,.txt,text/plain';
 i.onchange=async()=>{const f=i.files&&i.files[0];if(!f)return;let j,fotos={};
  try{const buf=await f.arrayBuffer(),b=new Uint8Array(buf,0,Math.min(4,buf.byteLength));
   if(b[0]==0x50&&b[1]==0x4b){const z=await zipLe(buf);if(!z['backup.json'])throw new Error('o .zip não tem o backup do app');j=JSON.parse(new TextDecoder().decode(z['backup.json']));Object.keys(z).filter(k=>k.startsWith('fotos/')).forEach(k=>fotos[k.slice(6)]=z[k])}
   else j=JSON.parse(new TextDecoder().decode(buf))}
  catch(x){return toast('Arquivo de backup inválido'+(x&&x.message?': '+x.message:''))}
  const d=j&&j.db?j.db:j;if(!d||!Array.isArray(d.clients)||!Array.isArray(d.orders)||!Array.isArray(d.vehicles))return toast('Arquivo de backup inválido');
  const nf=Object.keys(fotos).length,info=j&&j.em?' de '+new Date(j.em).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'',outra=j&&j.oficina&&OF&&j.oficina!=OF;
  BK={rd:d,rf:fotos};
  md(`<h2 style="margin-top:0">Restaurar backup${e(info)}?</h2><p>O arquivo tem <b>${d.clients.length}</b> clientes, <b>${d.vehicles.length}</b> veículos, <b>${d.orders.length}</b> O.S.${nf?` e <b>${plural(nf,'foto','fotos')}</b>`:''}.</p>
  ${outra?`<p style="color:${KA}"><b>Atenção:</b> este backup é de outra oficina.</p>`:''}<p class="muted">Isto <b>substitui todos os dados atuais</b> da oficina, em todos os aparelhos. Antes de restaurar, vou baixar um backup dos dados de agora.</p>
  <div class="bar" style="margin:12px 0 0"><button type="button" onclick="closeM()">Cancelar</button><span class="sp"></span><button type="button" class="dg" id="rsok" onclick="bkpRestOk()">Restaurar</button></div>`)};i.click()};
G.bkpRestOk=async function(){if(!BK||!BK.rd)return;const{rd,rf}=BK;BK=null;backup();
 const L=Object.keys(rf);if(L.length){md(`<h2 style="margin-top:0">Restaurando</h2><div id="bkp" class="bkp"><span>Guardando as fotos…</span><div><i></i></div></div>`);let i=0;
  for(const p of L){const ext=(p.split('.').pop()||'').toLowerCase(),d=u2d(rf[p],ext=='png'?'image/png':ext=='webp'?'image/webp':'image/jpeg');FD[p]=d;delete FU[p];try{await IDB.set('f:'+p,d);await fqAdd(p)}catch(x){}prog(`Guardando as fotos: ${++i} de ${L.length}`,i/L.length)}}
 db=cleanDb(rd);save();closeM();render();if(L.length)fqRun();toast('Backup restaurado'+(L.length?' · '+plural(L.length,'foto','fotos')+' enviando para a nuvem':''))};

/* ---------- estilos ---------- */
const st=document.createElement('style');st.textContent=`.bkp{margin:6px 0 10px}.bkp span{display:block;font-weight:600;margin-bottom:8px}.bkp div{height:10px;border-radius:99px;background:var(--ln);overflow:hidden}.bkp i{display:block;height:100%;width:0;background:repeating-linear-gradient(-45deg,var(--hi) 0 8px,#d9a200 8px 16px);transition:width .2s}`;document.head.appendChild(st);

G.__zip={zipMonta,zipLe,crc32};
if(typeof render=='function'&&typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);
})(window);
