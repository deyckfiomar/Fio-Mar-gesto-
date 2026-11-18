/* Fio-Mar Gestor: leitor de placa v3 (2.28.1)
   1. Acha a placa na foto: procura 7 caracteres do mesmo tamanho, enfileirados (aceita foto torta).
   2. Binarização local (aguenta reflexo e sombra) + separa caracteres grudados.
   3. Lê caractere por caractere, sabendo o que pode em cada posição (letra ou número).
   4. Descobre o tipo: faixa azul = Mercosul; espaço do hífen = antiga.
   5. Votação entre leituras (caractere a caractere, linha inteira e banco de caracteres do app).
   6. Já posiciona a caixa de corte em cima da placa e deixa o leitor carregado antes da foto. */
(function(G){
const LET='ABCDEFGHIJKLMNOPQRSTUVWXYZ',DIG='0123456789';
const okFmt=(p,ty)=>ty=='m'?/^[A-Z]{3}\d[A-Z]\d{2}$/.test(p):/^[A-Z]{3}\d{4}$/.test(p);
const permite=(j,ty)=>j==4&&ty=='?'?LET+DIG:(j<3||(j==4&&ty=='m'))?LET:DIG;

/* ---------- imagem → cinza (com faixa azul apagada) ---------- */
function cinza(src,alvoW){const k=Math.min(3,alvoW/src.width),W=Math.max(8,Math.round(src.width*k)),H=Math.max(8,Math.round(src.height*k)),c=document.createElement('canvas');c.width=W;c.height=H;
 const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingQuality='high';x.drawImage(src,0,0,W,H);const d=x.getImageData(0,0,W,H).data,n=W*H,g=new Uint8Array(n),az=new Uint8Array(n);
 for(let q=0,p=0;q<n;q++,p+=4){const r=d[p],gg=d[p+1],b=d[p+2];g[q]=(r*77+gg*150+b*29)>>8;const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
  if(mx==b&&mx>50&&(mx-mn)>mx*.3){const h=60*(4+(r-gg)/(mx-mn));if(h>192&&h<258)az[q]=1}}
 return{g,az,W,H,k,cv:c}}
/* limiar local (Sauvola) com imagens integrais */
function sauvola(I,kk,win){const{g,W,H}=I,n=W*H,S=new Float64Array((W+1)*(H+1)),Q=new Float64Array((W+1)*(H+1));
 for(let y=0;y<H;y++){let s=0,q=0;for(let x=0;x<W;x++){const v=g[y*W+x];s+=v;q+=v*v;const i=(y+1)*(W+1)+x+1;S[i]=S[i-W-1]+s;Q[i]=Q[i-W-1]+q}}
 const r=Math.max(7,win>>1),o=new Uint8Array(n);
 for(let y=0;y<H;y++){const y0=Math.max(0,y-r),y1=Math.min(H,y+r+1);for(let x=0;x<W;x++){const x0=Math.max(0,x-r),x1=Math.min(W,x+r+1),a=(y1-y0)*(x1-x0),
  i1=y1*(W+1)+x1,i2=y0*(W+1)+x1,i3=y1*(W+1)+x0,i4=y0*(W+1)+x0,s=S[i1]-S[i2]-S[i3]+S[i4],q=Q[i1]-Q[i2]-Q[i3]+Q[i4],m=s/a,sd=Math.sqrt(Math.max(0,q/a-m*m)),v=g[y*W+x];
  o[y*W+x]=(v<m*(1+kk*(sd/128-1))&&m-v>10&&sd>9)?1:0}}
 return o}
function otsu(I){const h=new Uint32Array(256),{g}=I;for(const v of g)h[v]++;let sum=0;for(let t=0;t<256;t++)sum+=t*h[t];let wb=0,sb=0,best=-1,th=128;const n=g.length;
 for(let t=0;t<256;t++){wb+=h[t];if(!wb)continue;const wf=n-wb;if(!wf)break;sb+=t*h[t];const mb=sb/wb,mf=(sum-sb)/wf,sc=wb*wf*(mb-mf)*(mb-mf);if(sc>best){best=sc;th=t}}
 const o=new Uint8Array(n);for(let i=0;i<n;i++)o[i]=g[i]<th?1:0;return o}
/* componentes conectados */
function comps(B,W,H){const lab=new Int32Array(W*H),cs=[],st=new Int32Array(W*H);let id=0;
 for(let p=0;p<W*H;p++){if(!B[p]||lab[p])continue;id++;let sp=0,x0=W,y0=H,x1=0,y1=0,a=0;lab[p]=id;st[sp++]=p;
  while(sp){const q=st[--sp],qx=q%W,qy=(q/W)|0;a++;if(qx<x0)x0=qx;if(qx>x1)x1=qx;if(qy<y0)y0=qy;if(qy>y1)y1=qy;
   for(let dy=-1;dy<=1;dy++){const ny=qy+dy;if(ny<0||ny>=H)continue;for(let dx=-1;dx<=1;dx++){const nx=qx+dx;if(nx<0||nx>=W)continue;const nq=ny*W+nx;if(B[nq]&&!lab[nq]){lab[nq]=id;st[sp++]=nq}}}}
  const w=x1-x0+1,h=y1-y0+1;cs.push({id,x:x0,y:y0,w,h,a,cx:x0+w/2,cy:y0+h/2})}
 return{lab,cs}}
/* procura a fileira de caracteres da placa */
function fileira(cs,W,H){const C=cs.filter(c=>c.h>=Math.max(9,H*.035)&&c.h<=H*.96&&c.w>=2&&c.w<=c.h*1.25&&c.w>=c.h*.07&&c.a/(c.w*c.h)>.1&&c.a/(c.w*c.h)<.95).sort((a,b)=>a.x-b.x);
 let best=null;const usados=new Set();
 for(let i=0;i<C.length;i++){if(usados.has(i))continue;const ch=[i];
  for(;;){const L=ch.map(k=>C[k]),hr=L.map(c=>c.h).sort((a,b)=>a-b)[L.length>>1],u=L[L.length-1];let sl=0;
   if(L.length>=2){const f=L[0];sl=(u.cy-f.cy)/Math.max(1,u.cx-f.cx)}
   let nx=-1,ng=1e9;for(let j=ch[ch.length-1]+1;j<C.length;j++){const c=C[j],gap=c.x-(u.x+u.w);if(gap>hr*1.25)break;if(gap<-hr*.12)continue;
    if(c.h<hr*.73||c.h>hr*1.42)continue;if(Math.abs(c.cy-(u.cy+sl*(c.cx-u.cx)))>hr*.3)continue;if(gap<ng){ng=gap;nx=j}}
   if(nx<0)break;ch.push(nx)}
  ch.forEach(k=>usados.add(k));if(ch.length<5)continue;
  let L=ch.map(k=>C[k]);/* melhor janela de até 7; tira barra (borda da placa) da ponta */
  const bar=c=>c.w<c.h*.17&&c.a/(c.w*c.h)>.72;while(L.length>7&&(bar(L[0])||bar(L[L.length-1]))){if(bar(L[0]))L.shift();else L.pop()}
  for(let s=0;s+Math.min(7,L.length)<=L.length;s++){const J=L.slice(s,s+Math.min(7,L.length)),hs=J.map(c=>c.h),hm=hs.reduce((a,b)=>a+b,0)/hs.length,hv=Math.sqrt(hs.reduce((a,b)=>a+(b-hm)*(b-hm),0)/hs.length)/hm;
   const gs=J.slice(1).map((c,k)=>c.cx-J[k].cx),gm=gs.reduce((a,b)=>a+b,0)/gs.length,gv=Math.sqrt(gs.reduce((a,b)=>a+(b-gm)*(b-gm),0)/gs.length)/hm;
   const barra=c=>c.w<c.h*.17&&c.a/(c.w*c.h)>.72,pen=(barra(J[0])?.9:0)+(barra(J[J.length-1])?.9:0);
   const sc=(J.length==7?3:J.length==6?1.6:0.6)-hv*3-gv*1.2+Math.min(1,hm/(H*.25))*.8-pen;if(!best||sc>best.sc)best={sc,J,hm}}}
 return best}
/* separa caracteres grudados até ter 7 */
function separa(J,lab,B,W){let P=J.map(c=>({c,x0:c.x,x1:c.x+c.w-1}));const wl=()=>{const ws=P.map(p=>p.x1-p.x0+1).filter((w,i)=>w>P[i].c.h*.32).sort((a,b)=>a-b);return ws.length?ws[ws.length>>1]:P[0].c.h*.55};
 let guard=0;while(P.length<7&&guard++<3){const mw=wl();let k=-1,mx=0;P.forEach((p,i)=>{const w=p.x1-p.x0+1;if(w>mw*1.35&&w>mx){mx=w;k=i}});if(k<0)break;
  const p=P[k],w=p.x1-p.x0+1,parts=Math.max(2,Math.min(7-P.length+1,Math.round(w/mw))),cut=[];
  for(let s=1;s<parts;s++){const alvo=p.x0+Math.round(w*s/parts),r=Math.round(w/parts*.3);let bx=alvo,bv=1e9;for(let x=alvo-r;x<=alvo+r;x++){let v=0;for(let y=p.c.y;y<p.c.y+p.c.h;y++)if(lab[y*W+x]==p.c.id)v++;if(v<bv){bv=v;bx=x}}cut.push(bx)}
  const nv=[];let a=p.x0;cut.concat([p.x1+1]).forEach(b=>{nv.push({c:p.c,x0:a,x1:b-1});a=b});P.splice(k,1,...nv)}
 return P}
function glifo(p,lab,W,ang){const c=p.c,w=p.x1-p.x0+1;let y0=c.y+c.h,y1=c.y;for(let y=c.y;y<c.y+c.h;y++)for(let x=p.x0;x<=p.x1;x++)if(lab[y*W+x]==c.id){if(y<y0)y0=y;if(y>y1)y1=y}
 if(y1<y0){y0=c.y;y1=c.y+c.h-1}const h=y1-y0+1,m=document.createElement('canvas');m.width=w;m.height=h;const x=m.getContext('2d'),im=x.createImageData(w,h);
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const z=(yy*w+xx)*4,on=lab[(y0+yy)*W+p.x0+xx]==c.id?0:255;im.data[z]=im.data[z+1]=im.data[z+2]=on;im.data[z+3]=255}x.putImageData(im,0,0);
 if(Math.abs(ang)<.035)return m;/* endireita */const R=document.createElement('canvas'),cs=Math.abs(Math.cos(ang)),sn=Math.abs(Math.sin(ang));R.width=Math.ceil(w*cs+h*sn);R.height=Math.ceil(h*cs+w*sn);
 const r=R.getContext('2d');r.fillStyle='#fff';r.fillRect(0,0,R.width,R.height);r.translate(R.width/2,R.height/2);r.rotate(-ang);r.drawImage(m,-w/2,-h/2);
 /* corta de novo no conteúdo */const d=r.getImageData(0,0,R.width,R.height).data;let a0=R.width,a1=0,b0=R.height,b1=0;for(let yy=0;yy<R.height;yy++)for(let xx=0;xx<R.width;xx++)if(d[(yy*R.width+xx)*4]<128){if(xx<a0)a0=xx;if(xx>a1)a1=xx;if(yy<b0)b0=yy;if(yy>b1)b1=yy}
 if(a1<a0)return m;const o=document.createElement('canvas');o.width=a1-a0+1;o.height=b1-b0+1;o.getContext('2d').drawImage(R,a0,b0,o.width,o.height,0,0,o.width,o.height);return o}
function tipoDe(I,J,hm,pad){/* faixa azul acima dos caracteres = Mercosul; espaço maior entre o 3º e o 4º = antiga */
 const xa=Math.max(0,Math.round(J[0].x)),xb=Math.min(I.W-1,Math.round(J[J.length-1].x+J[J.length-1].w)),ya=Math.max(0,Math.round(Math.min(...J.map(c=>c.y))-hm*.46)),yb=Math.max(0,Math.round(Math.min(...J.map(c=>c.y))-hm*.12));
 let az=0,tt=0;for(let y=ya;y<yb;y++)for(let x=xa;x<=xb;x++){tt++;if(I.az[y*I.W+x])az++}
 if(tt&&az/tt>.12)return'm';
 if(J.length==7){const gs=J.slice(1).map((c,k)=>c.x-(J[k].x+J[k].w)),o=gs.filter((g,k)=>k!=2).sort((a,b)=>a-b),med=o[o.length>>1];if(gs[2]>Math.max(med*1.7,hm*.2))return'a'}
 /* sem faixa azul: provavelmente antiga, mas confirma pela leitura da 5ª posição */
 return tt&&az/tt<.02?'?':pad}
/* acha a placa e devolve os glifos */
G.plAcha=function(src,pad,alvoW){const I=cinza(src,alvoW||900);let melhor=null;
 for(const [modo,kk] of [['s',.22],['s',.34],['o',0],['s',.12]]){const B=modo=='o'?otsu(I):sauvola(I,kk,Math.round(Math.min(I.W,I.H)/6));
  for(let i=0;i<B.length;i++)if(I.az[i])B[i]=0;const{lab,cs}=comps(B,I.W,I.H),f=fileira(cs,I.W,I.H);if(!f)continue;
  if(!melhor||f.sc>melhor.f.sc)melhor={f,lab,B};if(f.J.length==7&&f.sc>2.4)break}
 if(!melhor)return null;
 /* 2ª passada: só a faixa das letras (corta a borda da placa que encosta nas letras) */
 {const J0=melhor.f.J,n0=J0.length,mx=J0.reduce((a,c)=>a+c.cx,0)/n0,my=J0.reduce((a,c)=>a+c.cy,0)/n0,sxx=J0.reduce((a,c)=>a+(c.cx-mx)**2,0)||1,sl=J0.reduce((a,c)=>a+(c.cx-mx)*(c.cy-my),0)/sxx,hm=melhor.f.hm,B2=new Uint8Array(melhor.B.length);
  for(let y=0;y<I.H;y++)for(let x=0;x<I.W;x++){const i=y*I.W+x;if(melhor.B[i]&&Math.abs(y-(my+sl*(x-mx)))<=hm*.78)B2[i]=1}
  const r2=comps(B2,I.W,I.H),f2=fileira(r2.cs,I.W,I.H);if(f2&&(f2.J.length>n0||(f2.J.length==n0&&f2.sc>=melhor.f.sc-.2)))melhor={f:f2,lab:r2.lab,B:B2}}
 const{f,lab}=melhor;let J=f.J;
 /* barra fina na ponta e afastada das letras = borda da placa */
 {const isB=c=>c.w<f.hm*.2,gp=J.slice(1).map((c,k)=>c.x-(J[k].x+J[k].w)),mid=gp.slice(1,-1).sort((a,b)=>a-b),mg=mid.length?mid[mid.length>>1]:0,lim=Math.max(mg*2.2,f.hm*.22);
  if(J.length>=6&&isB(J[J.length-1])&&gp[gp.length-1]>lim)J=J.slice(0,-1);if(J.length>=6&&isB(J[0])&&gp[0]>lim)J=J.slice(1)}
 let P=separa(J,lab,null,I.W);
 /* sobrou barra fina na ponta (borda da placa)? tira */
 const fina=p=>(p.x1-p.x0+1)<f.hm*.2;while(P.length>7&&(fina(P[0])||fina(P[P.length-1]))){if(fina(P[0]))P.shift();else P.pop()}
 if(P.length==7&&fina(P[0])&&!fina(P[6])&&J.length==7){/* barra no começo e 6 letras: tenta separar a mais larga de novo */const Q=separa(J.slice(1),lab,null,I.W);if(Q.length==7)P=Q}
 if(P.length<6)return{box:caixa(J,f.hm,I),ok:0,k:I.k};
 const n=P.length,ang=Math.atan2((J[J.length-1].cy-J[0].cy),Math.max(1,J[J.length-1].cx-J[0].cx));const ty=tipoDe(I,J,f.hm,pad);
 const gl=P.slice(0,7).map(p=>glifo(p,lab,I.W,ang));return{gl,ty,n,box:caixa(J,f.hm,I),ok:P.length==7,k:I.k,ang}};
function caixa(J,hm,I){const x0=Math.min(...J.map(c=>c.x)),x1=Math.max(...J.map(c=>c.x+c.w)),y0=Math.min(...J.map(c=>c.y)),y1=Math.max(...J.map(c=>c.y+c.h));
 return{x:Math.max(0,x0-hm*.55)/I.k,y:Math.max(0,y0-hm*.75)/I.k,w:Math.min(I.W,x1-x0+hm*1.1)/I.k,h:Math.min(I.H,y1-y0+hm*1.25)/I.k}}

/* ---------- Tesseract: carrega antes e reaproveita ---------- */
let WK=null,WKT=0;
G.plSolta=()=>{WK=null};
G.plAquece=function(){if(navigator.onLine===false||typeof loadTess!='function')return Promise.reject(new Error('off'));clearTimeout(WKT);WKT=setTimeout(()=>{if(WK)WK.then(w=>w.terminate()).catch(()=>{});WK=null},180000);
 if(!WK)WK=loadTess().then(()=>Tesseract.createWorker('eng')).catch(x=>{WK=null;throw x});return WK};
function compoe(gl,hh,gp){const gap=Math.round(hh*gp),ws=gl.map(m=>Math.max(1,Math.round(m.width*hh/m.height))),W=ws.reduce((a,b)=>a+b,0)+gap*(gl.length-1)+48,o=document.createElement('canvas');o.width=W;o.height=hh+48;
 const x=o.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,o.height);x.imageSmoothingQuality='high';let px=24;gl.forEach((m,i)=>{x.drawImage(m,px,24,ws[i],hh);px+=ws[i]+gap});return o}
const umGlifo=(m,hh,pad)=>{const w=Math.max(1,Math.round(m.width*hh/m.height)),o=document.createElement('canvas');o.width=w+2*pad;o.height=hh+2*pad;const x=o.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,o.width,o.height);x.imageSmoothingQuality='high';x.drawImage(m,pad,pad,w,hh);return o};
/* testado com 273 caracteres: psm 13 (linha crua) acerta 95%; a votação de 3 jeitos, 97% */
const JEITOS=[[64,20,'13'],[40,10,'13'],[40,16,'8']];
function mapeia(t,ty){if(typeof plPN=='function'){const p=plPN(t,ty);if(p)return p}return null}

async function le(u,pad,prog){const img=await plImg(u),A=plAcha(img,pad,1000);if(!A||!A.gl||A.gl.length<7)return{err:A?'poucos':'nada'};
 const ty=A.ty,gl=A.gl,V=Array.from({length:7},()=>({})),vota=(j,c,w)=>{if(c&&permite(j,ty).includes(c))V[j][c]=(V[j][c]||0)+w};let w=null,pc='',ln=[];
 try{w=await plAquece()}catch(x){w=null}
 if(w){for(let j=0;j<7;j++){prog&&prog(j);const rs=[];
   for(let k=0;k<JEITOS.length;k++){if(k==2&&rs[0]&&rs[0]==rs[1])break;const[hh,pd,psm]=JEITOS[k];await w.setParameters({tessedit_pageseg_mode:psm,tessedit_char_whitelist:permite(j,ty)});
    const r=await w.recognize(umGlifo(gl[j],hh,pd)),c=String(r.data.text||'').toUpperCase().replace(/[^A-Z0-9]/g,'')[0]||'';rs.push(c);vota(j,c,1.4)}
   const cc={};rs.forEach(c=>{if(c)cc[c]=(cc[c]||0)+1});const top=Object.keys(cc).sort((a,b)=>cc[b]-cc[a])[0];pc+=top||'?'}
  await w.setParameters({tessedit_char_whitelist:LET+DIG});
  for(const[gp,psm]of[[.3,'7'],[.15,'7'],[.3,'8']]){await w.setParameters({tessedit_pageseg_mode:psm});const r=await w.recognize(compoe(gl,70,gp)),t=String(r.data.text||'').toUpperCase().replace(/[^A-Z0-9]/g,''),p=mapeia(t,ty);if(p){ln.push(p);[...p].forEach((c,j)=>vota(j,c,1))}}}
 /* banco de caracteres do app (aprende com as placas confirmadas) */
 let tpl=0;const tyT=ty=='?'?'a':ty;if(typeof plMatch=='function')gl.forEach((m,j)=>{const r=plMatch(m,tyT,permite(j,ty));if(r&&r.sim>=.86&&r.gap>=.03){vota(j,r.c,w?1.5:3);tpl++}else if(!w&&r&&r.sim>=.78)vota(j,r.c,1)});
 /* sem faixa azul e sem hífen claro: decide a 5ª posição puxando para número (placa antiga) */
 if(ty=='?'){const v=V[4],sl=Object.entries(v).filter(([c])=>/[A-Z]/.test(c)).reduce((a,b)=>a+b[1],0),sd=Object.entries(v).filter(([c])=>/\d/.test(c)).reduce((a,b)=>a+b[1],0),L2D={Z:'2',G:'6',S:'5',B:'8',O:'0',Q:'0',D:'0',I:'1',L:'1',T:'7',A:'4',J:'1'};
  if(sd>=sl*.55||!sl){const nv={};Object.entries(v).forEach(([c,w])=>{const d=/\d/.test(c)?c:L2D[c];if(d)nv[d]=(nv[d]||0)+w});V[4]=nv}else{const nv={};Object.entries(v).forEach(([c,w])=>{if(/[A-Z]/.test(c))nv[c]=w});V[4]=nv}}
 let best='',conf=1;for(let j=0;j<7;j++){const e=Object.entries(V[j]).sort((a,b)=>b[1]-a[1]);if(!e.length){best+='?';conf=0;continue}const tot=e.reduce((a,b)=>a+b[1],0);best+=e[0][0];conf=Math.min(conf,e[0][1]/tot)}
 if(best.includes('?'))return{err:'ilegivel',parcial:best,ty,gl,semOcr:!w};
 const tyF=ty=='?'?(/[A-Z]/.test(best[4])?'m':'a'):ty;
 const alts=[best,pc.replace(/\?/g,''),...ln].filter((x,i,a)=>x&&x.length==7&&okFmt(x,tyF)&&a.indexOf(x)==i).slice(0,4);
 const sure=!!w&&A.ok&&conf>=.7&&pc==best&&ln.filter(x=>x==best).length>=1;
 return{best,alts,sure,ty:tyF,gl,semOcr:!w,tpl}}

/* substitui o leitor antigo (o corte continua igual) */
const _antigo=typeof plLer=='function'?plLer:null;
G.plLer=plLer=async function(u,ty){const pal=$('#pal');if(pal)pal.innerHTML='';pst('Procurando a placa na foto...');
 try{const r=await le(u,ty||PLT,j=>pst('Lendo a placa... '+(j+1)+'/7'));if(!document.body.contains($('#pst')))return;
  if(r.err){if(r.err!='ilegivel'&&_antigo&&navigator.onLine!==false){return _antigo(u,ty)}
   if(r.semOcr)return pst('Sem internet para o leitor de placa (na 1ª vez ele precisa baixar). Digite a placa ou tente de novo com internet.');
   return pst(r.err=='ilegivel'?'Li só parte da placa ('+r.parcial.replace(/\?/g,'_')+'). Tire outra foto mais de perto, de frente, ou digite.':'Não achei a placa na foto. Tire mais de perto, de frente e sem reflexo, ou digite.')}
  if(r.ty&&r.ty!=PLT&&typeof plSet=='function')plSet(r.ty);
  PLG={ty:r.ty,gl:r.gl,read:r.best};
  if(NAENT||$('#modal .pci')){const el=$('#cipl');if(el){el.value=r.best;el.dispatchEvent(new Event('input',{bubbles:true}))}if(typeof ciAch=='function')ciAch();
   const pal=$('#pal');if(pal)pal.innerHTML=r.sure?'':'<span class="muted" style="font-size:13px">Outras leituras:</span>'+r.alts.filter(a=>a!=r.best).map(a=>`<button type="button" class="sm" onclick="plNaEnt('${a}')">${a}</button>`).join('');
   pst(r.sure?'✓ Placa lida: '+r.best:'Leitura provável: '+r.best+'. Confira os caracteres.');return}
  plShow(r.best,r.alts,r.sure);
  if(r.semOcr)pst('Sem internet para o leitor completo: leitura provável '+r.best+'. Confira antes de salvar.')
 }catch(x){pst('Falha na leitura da foto. Tente outra imagem ou digite a placa.')}};

/* foto da placa na Entrada do carro: corta, volta para a Entrada (sem perder o que foi preenchido) e lê ali */
let NAENT=0;
G.ciScan=function(f){if(!f||typeof cropImg!='function')return;const ci=typeof ciEstado=='function'?ciEstado():null,vals={};
 document.querySelectorAll('#modal .pci input,#modal .pci textarea,#modal .pci select').forEach(el=>{const k=el.id||el.name;if(k&&el.type!='file'&&el.type!='radio'&&el.type!='checkbox')vals[k]=el.value});
 cropImg(f,{max:1400,src:2400,plate:1,extra:1,title:'Corte só a placa',hint:'Arraste os cantos até a caixa ficar só em volta dos caracteres da placa.',ok:'Ler placa'},(u,rd,ty)=>{
  checkin(ci?{...ci}:{});Object.entries(vals).forEach(([k,v])=>{const el=document.getElementById(k)||document.querySelector(`#modal .pci [name="${k}"]`);if(el&&v&&!el.value)el.value=v});
  const pl=$('#cipl'),lb=pl&&pl.closest('label');if(lb&&!$('#pst'))lb.insertAdjacentHTML('afterend','<small id="pst" class="muted" style="display:block;margin:-6px 0 6px"></small><div id="pal" class="bar" style="margin:0 0 8px"></div>');
  NAENT=1;plLer(u,ty||PLT).finally(()=>{NAENT=0})})};
G.plNaEnt=function(a){const el=$('#cipl');if(!el)return;el.value=a;el.dispatchEvent(new Event('input',{bubbles:true}));if(typeof ciAch=='function')ciAch();pst('Placa: '+a);const pal=$('#pal');if(pal)pal.innerHTML=''};
/* caixa de corte já em cima da placa */
if(typeof cropOpen=='function'){const _co=cropOpen;G.cropOpen=cropOpen=function(){const r=_co.apply(this,arguments);try{const C=CR;if(C&&C.opt&&C.opt.plate){const cv=$('#crc'),A=plAcha(C.src,PLT,1000);
  if(A&&A.box&&cv){const k=cv.width/C.src.width,b=A.box;C.b={x:Math.max(0,b.x*k),y:Math.max(0,b.y*k),w:Math.min(cv.width-b.x*k,b.w*k),h:Math.min(cv.height-b.y*k,b.h*k)};
   if(A.ty){const rd=document.querySelector(`#modal input[name=plt][value="${A.ty}"]`);if(rd){rd.checked=true;plSet(A.ty)}}
   const h=document.querySelector('#modal .md p.muted');if(h)h.textContent='Achei a placa e marquei. Se a caixa não estiver certa, arraste os cantos. Depois toque em Ler placa.';cropDraw()}}}catch(x){}return r}}
/* deixa o leitor carregando ao abrir a entrada do carro ou o cadastro do veículo */
/* Entrada do carro: lugar para o aviso da busca de dados pela placa (APIBrasil) */
if(typeof checkin=='function'){const _c=checkin;G.checkin=checkin=function(){const r=_c.apply(this,arguments);try{const pl=$('#cipl'),lb=pl&&pl.closest('label');if(lb&&!$('#pst'))lb.insertAdjacentHTML('afterend','<small id="pst" class="muted" style="display:block;margin:-6px 0 6px"></small><div id="pal" class="bar" style="margin:0 0 8px"></div>')}catch(x){}return r}}
['checkin','editVeh'].forEach(n=>{if(typeof window[n]=='function'){const o=window[n];G[n]=window[n]=function(){const r=o.apply(this,arguments);try{plAquece().catch(()=>{})}catch(x){}return r}}});
})(window);
