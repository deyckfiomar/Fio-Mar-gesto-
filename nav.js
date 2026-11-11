/* Fio-Mar Gestor — botão "voltar" do celular e última tela (versão 2.12.2)
   - Voltar fecha a janela aberta (perguntando se havia algo digitado) e depois volta para a tela anterior.
   - Só sai do app quando já está no Painel.
   - Ao abrir o app de novo, ele volta para a última tela usada (até 24 horas). */
(function (G) {
'use strict';
const K='fm_tela',MAXH=24;
const snap=()=>({v:S.v,id:S.id||null,tab:S.tab||'resumo',f:S.f||{},q:S.v=='quote'&&S.q?S.q.id:null});
const igual=(a,b)=>a&&b&&a.v==b.v&&a.id==b.id&&a.tab==b.tab&&JSON.stringify(a.f||{})==JSON.stringify(b.f||{});
let POP=false,IGN=0,ABERTO=false,SUJO=false,PRONTO=false;
const st=()=>history.state&&history.state.fm?history.state:null;
function guarda(){try{localStorage.setItem(K,JSON.stringify({...snap(),em:Date.now()}))}catch(x){}}

/* cada troca de tela vira um passo no histórico do celular */
const _go=go;G.go=go=function(...a){const antes=snap(),y=scrollY;const r=_go(...a);
 if(!POP&&PRONTO&&SES&&!igual(antes,snap())){try{history.replaceState({fm:1,s:antes,y},'');history.pushState({fm:1,s:snap(),y:0},'')}catch(x){}}
 guarda();return r};
/* troca de aba dentro da tela (ex.: abas da O.S.) atualiza o passo atual, sem criar outro */
const _render=render;G.render=render=function(k){const r=_render(k);if(PRONTO&&SES&&!POP){const s=st();if(s&&s.s&&!igual(s.s,snap())&&s.s.v==S.v&&s.s.id==S.id){try{history.replaceState({...s,s:snap()},'')}catch(x){}}guarda()}return r};

/* janelas (formulários, folhas): abrir cria um passo; voltar fecha */
const md=document.getElementById('modal');
function verifica(){const ab=!!(md&&md.querySelector('.ov'));if(ab==ABERTO)return;ABERTO=ab;
 if(ab){SUJO=false;if(SES&&PRONTO&&!(st()&&st().modal)){try{history.pushState({fm:1,modal:1,s:snap(),y:scrollY},'')}catch(x){}}}
 else if(st()&&st().modal&&!POP){IGN++;history.back()}}
if(md){new MutationObserver(()=>requestAnimationFrame(verifica)).observe(md,{childList:true,subtree:true});
 md.addEventListener('input',()=>{SUJO=true},true);md.addEventListener('change',e=>{if(e.target&&e.target.type!='file')SUJO=true},true)}

addEventListener('popstate',ev=>{if(IGN>0){IGN--;return}
 if(!SES)return;
 if(ABERTO){/* fecha a janela; se tinha algo digitado, confirma antes */
  if(SUJO&&!confirm('Sair sem salvar o que você digitou?')){try{history.pushState({fm:1,modal:1,s:snap(),y:scrollY},'')}catch(x){}return}
  POP=true;try{closeM()}finally{POP=false}ABERTO=!!md.querySelector('.ov');if(ABERTO){try{history.pushState({fm:1,modal:1,s:snap(),y:scrollY},'')}catch(x){}}return}
 const s=ev.state&&ev.state.fm&&ev.state.s;
 if(s){POP=true;try{if(s.v=='quote'){const q=db.quotes.find(x=>x.id==s.q);if(q)S.q=q;else if(!S.q||S.q.id!=s.q){_go('quotes');return}}_go(s.v,s.id,s.tab,s.f);seguro()}finally{POP=false}guarda();const y=ev.state.y||0;if(y)requestAnimationFrame(()=>scrollTo(0,y));return}
 /* saiu do começo do histórico: se não estiver no Painel, vai para o Painel em vez de fechar o app */
 if(S.v!='dash'){POP=true;try{_go('dash')}finally{POP=false}try{history.pushState({fm:1,s:snap(),y:0},'')}catch(x){}guarda()}});

/* chamado quando o app abre já logado: volta para a última tela e monta o histórico Painel → tela */
G.navRestaura=function(){let t=null;try{t=JSON.parse(localStorage.getItem(K)||'null')}catch(x){}
 if(t&&t.v&&V[t.v]&&Date.now()-(t.em||0)<MAXH*36e5&&!['dash'].includes(t.v)){if(t.id&&t.v=='order'&&!od(t.id))t=null;if(t){S.v=t.v;S.id=t.id||null;S.tab=t.tab||'resumo';S.f=t.f||{};if(t.v=='quote'){const q=db.quotes.find(x=>x.id==t.q);if(q)S.q=q;else S.v='quotes'}}}
 seguro();
 try{history.replaceState({fm:1,s:{v:'dash',id:null,tab:'resumo',f:{}},y:0},'');if(S.v!='dash')history.pushState({fm:1,s:snap(),y:0},'')}catch(x){}PRONTO=true};
/* se a tela guardada não abre (registro apagado), cai no Painel em vez de ficar em branco */
function seguro(){try{const h=V[S.v]&&V[S.v]();if(typeof h!='string')throw 0}catch(x){S.v='dash';S.id=null}}
G.navLogin=function(){try{history.replaceState({fm:1,s:snap(),y:0},'')}catch(x){}PRONTO=true;guarda()};
if(typeof SES!='undefined'&&SES&&!PRONTO){navRestaura();render()}
})(window);
