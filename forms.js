/* Fio-Mar Gestor — telas de preencher (versão 2.11.0)
   Melhora os campos de todos os formulários sem mexer em cada um:
   placa em desenho de placa Mercosul, R$ verde (venda) e vermelho (custo/despesa),
   telefone, CPF/CNPJ e CEP com máscara, km/min com unidade, quantidade com − e +,
   margem de lucro ao vivo e asterisco nos campos obrigatórios. */
(function (G) {
'use strict';
const ico=p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I={tel:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',doc:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17a4 4 0 0 1 7 0M15 9h3M15 13h3"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',km:'<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
 cod:'<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M8 8v8M11 8v8M14 8v8M17 8v8"/>'};
const dig=s=>String(s||'').replace(/\D/g,'');
const brl=n=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const lbl=inp=>{const l=inp.closest('label');if(!l)return'';let t='';l.childNodes.forEach(n=>{if(n.nodeType==3)t+=n.textContent});return t.trim()};
const tira=(inp,re)=>{const l=inp.closest('label');if(!l)return;l.childNodes.forEach(n=>{if(n.nodeType==3&&re.test(n.textContent))n.textContent=n.textContent.replace(re,'')})};
function wrap(inp,cls,html,depois){const w=document.createElement('span');w.className='fx '+cls;inp.parentNode.insertBefore(w,inp);if(html&&!depois)w.insertAdjacentHTML('beforeend',html);w.appendChild(inp);if(html&&depois)w.insertAdjacentHTML('beforeend',html);return w}

/* ---------- máscaras ---------- */
const mTel=v=>{const d=dig(v).slice(0,11);if(d.length<=2)return d?'('+d:'';if(d.length<=6)return`(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`};
const mDoc=v=>{const d=dig(v).slice(0,14);if(d.length<=11)return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/,'.$1-$2');
 return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2')};
const mCep=v=>{const d=dig(v).slice(0,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d};
function mascara(inp,fn){const ap=()=>{const p=inp.selectionStart,a=inp.value.length,nv=fn(inp.value);if(nv!==inp.value){inp.value=nv;try{const q=Math.max(0,p+(nv.length-a));inp.setSelectionRange(q,q)}catch(x){}}};
 inp.addEventListener('input',ap);if(inp.value&&dig(inp.value).length>=8)inp.value=fn(inp.value)}

/* ---------- campo a campo ---------- */
function melhora(inp,form){if(inp.dataset.fx)return;inp.dataset.fx=1;
 const n=(inp.name||inp.id||'').toLowerCase(),L=lbl(inp),tit=((form.querySelector('h2')||{}).textContent||'').toLowerCase(),ty=inp.type;
 if(inp.required){const l=inp.closest('label');if(l&&!l.querySelector('.freq'))l.firstChild&&l.insertBefore(Object.assign(document.createElement('b'),{className:'freq',textContent:' *',title:'Obrigatório'}),l.childNodes[1]||null)}
 if(ty=='checkbox'||ty=='radio'||ty=='file'||inp.tagName!='INPUT'||inp.closest('.fuel,.fx,.cb,.busca'))return;
 /* placa */
 if(n=='placa'||n=='cipl'||/^placa\b/i.test(L)){
  const w=wrap(inp,'fplaca','<span class="fpb"><i class="fpf"></i><b>BRASIL</b><i class="fpq"></i></span>');inp.setAttribute('maxlength','8');inp.setAttribute('autocapitalize','characters');inp.setAttribute('spellcheck','false');inp.setAttribute('autocomplete','off');
  if(!inp.placeholder)inp.placeholder='ABC1D23';inp.addEventListener('blur',()=>{inp.value=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'')});return}
 /* dinheiro */
 if(/\(R\$|^(valor|pre[çc]o|custo)\b/i.test(L)||['preco','custo','valor'].includes(n)){
  const custo=n=='custo'||/^custo/i.test(L)||/despesa|conta|compra/.test(tit);
  wrap(inp,custo?'fmoney fcusto':'fmoney fvenda','<span class="fcur">R$</span>');tira(inp,/\s*\(R\$\)\s*$/);if(!inp.placeholder)inp.placeholder='0,00';inp.setAttribute('inputmode','decimal');
  const fmt=()=>{if(!inp.hasAttribute('data-num'))return;const v=nBR(inp.value);if(inp.value.trim()&&isFinite(v))inp.value=brl(v)};fmt();inp.addEventListener('blur',fmt);inp.addEventListener('input',()=>margem(form));return}
 /* telefone */
 if(ty=='tel'||/^(tel|ctel|ftel|tel1|tel2|fone|celular)$/.test(n)||/telefone|whatsapp/i.test(L)){wrap(inp,'fpre',`<span class="fic">${ico(I.tel)}</span>`);inp.setAttribute('inputmode','tel');if(!inp.placeholder)inp.placeholder='(11) 98888-7777';mascara(inp,mTel);return}
 if(ty=='email'){wrap(inp,'fpre',`<span class="fic">${ico(I.mail)}</span>`);return}
 if(n=='doc'||n=='cnpj'||/^cpf|^cnpj/i.test(L)){wrap(inp,'fpre',`<span class="fic">${ico(I.doc)}</span>`);inp.setAttribute('inputmode','numeric');if(!inp.placeholder)inp.placeholder=n=='cnpj'?'00.000.000/0000-00':'000.000.000-00';mascara(inp,mDoc);return}
 if(n=='cep'){wrap(inp,'fpre',`<span class="fic">${ico(I.pin)}</span>`);inp.setAttribute('inputmode','numeric');inp.placeholder=inp.placeholder||'00000-000';mascara(inp,mCep);return}
 if(n=='km'||n=='cikm'||/^km\b|quilometragem/i.test(L)){wrap(inp,'fpre fsuf',`<span class="fic">${ico(I.km)}</span>`);inp.insertAdjacentHTML('afterend','<span class="fun">km</span>');inp.setAttribute('inputmode','numeric');return}
 if(n=='ano'){inp.setAttribute('inputmode','numeric');inp.setAttribute('maxlength','9');inp.placeholder=inp.placeholder||'Ex.: 2015';inp.closest('label').classList.add('fcurto');return}
 if(/^dura[çc][ãa]o/i.test(L)||n=='dur'||n=='min'&&/minutos/i.test(L)){wrap(inp,'fsuf','<span class="fun">min</span>',1);tira(inp,/\s*\(min\)\s*$/);return}
 if(n=='revmeses'){wrap(inp,'fsuf','<span class="fun">meses</span>',1);return}
 if(n=='parc'){wrap(inp,'fsuf','<span class="fun">vezes</span>',1);return}
 if(n=='cod'&&/c[óo]digo/i.test(L)){wrap(inp,'fpre',`<span class="fic">${ico(I.cod)}</span>`);return}
 /* quantidade / estoque: − e + */
 if(['q','qtd','min','ini'].includes(n)&&/quantidade|estoque|qtd/i.test(L)||n=='q'){
  const w=wrap(inp,'fstep','<button type="button" class="fsb" aria-label="Diminuir" data-d="-1">−</button>');w.insertAdjacentHTML('beforeend','<button type="button" class="fsb" aria-label="Aumentar" data-d="1">+</button>');inp.setAttribute('inputmode','decimal');
  w.querySelectorAll('.fsb').forEach(b=>b.onclick=()=>{const v=nBR(inp.value),x=Math.max(0,(isFinite(v)?v:0)+(+b.dataset.d));inp.value=String(+x.toFixed(3)).replace('.',',');inp.dispatchEvent(new Event('input',{bubbles:true}));margem(form)});
  inp.addEventListener('input',()=>margem(form));return}
}
/* margem de lucro ao vivo quando o formulário tem custo e venda */
function margem(form){const c=form.querySelector('[name=custo]'),v=form.querySelector('[name=preco],[name=v]');if(!c||!v)return;
 let b=form.querySelector('.fmar');if(!b){b=document.createElement('div');b.className='fmar';const l=v.closest('label');(l||v).after(b)}
 const cu=nBR(c.value),pv=nBR(v.value);if(!(cu>0)||!(pv>0)){b.innerHTML='<span class="muted">Preencha custo e venda para ver a margem.</span>';b.className='fmar';return}
 const lu=pv-cu,mg=lu/cu*100;b.className='fmar '+(lu<0?'neg':mg<20?'baixa':'ok');
 b.innerHTML=`${lu<0?'Prejuízo':'Lucro'} de <b>R$ ${brl(Math.abs(lu))}</b> por unidade · margem <b>${Math.round(mg)}%</b>${lu<0?' (venda abaixo do custo)':mg<20?' (margem baixa)':''}`}

function melhoraTudo(root){(root||document).querySelectorAll('#modal form, #modal .md').forEach(form=>{
 /* conserta título de seção que virou campo (ex.: "Dados fiscais (NF-e)") */
 form.querySelectorAll('input[name=h]').forEach(i=>{const l=i.closest('label');if(!l)return;const h=document.createElement('h3');h.className='fsec';h.textContent=lbl(i);l.replaceWith(h)});
 form.querySelectorAll('input,select,textarea').forEach(i=>melhora(i,form));margem(form)})}
let T=0;const ob=new MutationObserver(()=>{if(T)return;T=requestAnimationFrame(()=>{T=0;melhoraTudo()})});
const md=document.getElementById('modal');if(md)ob.observe(md,{childList:true,subtree:true});
G.fxMelhora=melhoraTudo;

const st=document.createElement('style');st.textContent=`
:root{--fv:#1E8A4C;--fc:#C2412A}
:root[data-theme="dark"]{--fv:#4CC38A;--fc:#F07A5F}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fv:#4CC38A;--fc:#F07A5F}}
#modal .md>h2{position:relative;padding-bottom:8px}#modal .md>h2::after{content:"";position:absolute;left:0;bottom:0;width:46px;height:4px;border-radius:2px;background:var(--hi)}
#modal label{font-weight:600}
#modal input,#modal select,#modal textarea{border-radius:9px;padding:10px 12px;font-size:16px;border-color:color-mix(in srgb,var(--ln) 70%,var(--mut))}
#modal input:focus,#modal select:focus,#modal textarea:focus{outline:none;border-color:var(--hi);box-shadow:0 0 0 3px color-mix(in srgb,var(--hi) 35%,transparent)}
.freq{color:var(--fc);font-weight:700}
.fsec{display:flex;align-items:center;gap:8px;margin:18px 0 10px!important;padding-top:12px;border-top:1px dashed var(--ln);font-size:15px;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
#modal h3{font-size:15px;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
.fx{position:relative;display:flex;align-items:stretch;margin-top:4px}.fx input{margin-top:0}
/* placa Mercosul */
.fplaca{max-width:300px;flex-direction:column;background:#fff;border:3px solid #17181A;border-radius:10px;overflow:hidden;box-shadow:0 2px 0 rgba(0,0,0,.15)}
.fplaca:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--hi) 55%,transparent)}
.fpb{display:flex;align-items:center;justify-content:center;gap:8px;height:20px;background:#0B3FA8;color:#fff;font:700 12px/1 Barlow,sans-serif;letter-spacing:.35em;padding-left:.35em}
.fpf{position:absolute;left:8px;top:4px;width:18px;height:12px;border-radius:2px;background:linear-gradient(135deg,#1F9A4A 0 100%);overflow:hidden}
.fpf::after{content:"";position:absolute;inset:2px 3px;background:#F5C400;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.fpq{position:absolute;right:8px;top:4px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#fff 0 2px,transparent 3px),#0B3FA8;border:1px solid #fff9}
.fplaca input,#modal .fplaca input{border:0!important;box-shadow:none!important;background:#fff!important;color:#111!important;border-radius:0;text-align:center;text-transform:uppercase;font:700 38px/1.1 "Barlow Condensed",Impact,sans-serif!important;letter-spacing:.14em;padding:6px 10px 4px!important;height:auto}
.fplaca input::placeholder{color:#C9CDD2;letter-spacing:.14em}
/* dinheiro */
.fmoney input{padding-left:58px!important;font-weight:700;font-size:18px!important}
.fcur{position:absolute;left:6px;top:6px;bottom:6px;display:flex;align-items:center;padding:0 9px;border-radius:7px;font:700 15px Barlow,sans-serif;color:#fff}
.fvenda .fcur{background:var(--fv)}.fvenda input{color:var(--fv);border-color:color-mix(in srgb,var(--fv) 45%,var(--ln))!important}
.fcusto .fcur{background:var(--fc)}.fcusto input{color:var(--fc);border-color:color-mix(in srgb,var(--fc) 45%,var(--ln))!important}
.fmar{margin:-4px 0 12px;padding:8px 11px;border-radius:9px;font-size:13.5px;background:color-mix(in srgb,var(--fv) 12%,var(--sf));color:var(--ink)}
.fmar.ok b{color:var(--fv)}.fmar.baixa{background:color-mix(in srgb,#C98200 14%,var(--sf))}.fmar.baixa b{color:#B07400}.fmar.neg{background:color-mix(in srgb,var(--fc) 14%,var(--sf))}.fmar.neg b{color:var(--fc)}
/* ícone à esquerda e unidade à direita */
.fpre input{padding-left:42px!important}.fic{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:20px;height:20px;color:var(--mut);pointer-events:none}
.fic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.fpre:focus-within .fic{color:var(--ink)}
.fsuf input{padding-right:64px!important}.fun{position:absolute;right:10px;top:50%;transform:translateY(-50%);font:600 14px Barlow,sans-serif;color:var(--mut);pointer-events:none}
.fcurto input{max-width:160px}
/* quantidade com − e + */
.fstep{max-width:220px}.fstep input{text-align:center;font-weight:700;font-size:18px!important;border-radius:0!important;border-left:0!important;border-right:0!important}
.fsb{flex:none;width:48px;margin:0;padding:0;font-size:22px;font-weight:700;border:1px solid color-mix(in srgb,var(--ln) 70%,var(--mut));background:var(--sf);color:var(--ink)}
.fsb:first-child{border-radius:9px 0 0 9px}.fsb:last-child{border-radius:0 9px 9px 0}.fsb:active{background:var(--hi);color:#17181A}
`;document.head.appendChild(st);
})(window);
