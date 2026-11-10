/* Fio-Mar Gestor — avisos de agendamento no celular (versão 2.9.2)
   Só o dono. O servidor (função agenda-aviso no Supabase) confere a agenda a cada minuto
   e manda a notificação 30 minutos antes de cada horário, mesmo com o app fechado. */
(function (G) {
'use strict';
const VAPID='BGCspp4ZvsUYxHgmqTyBQZSorVD0OuQcC1JQoobxhVMx3IfqvTVz69NSu3CVwb5MqH6ZTEifGiICt3WYqLlTZAc';
const sheet=(tit,body)=>{$('#modal').innerHTML=`<div class="ov psh-ov" onclick="if(event.target===this)closeM()"><div class="md psh" role="dialog" aria-modal="true" aria-label="${e(tit)}"><div class="psh-h"><h2>${tit}</h2><button type="button" class="ib" aria-label="Fechar" onclick="closeM()">×</button></div>${body}</div></div>`};
const suporta=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const b64u=s=>{const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),a=new Uint8Array(r.length);for(let i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a};
const ab64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const aparelho=()=>{const u=navigator.userAgent,m=u.match(/Android[^;)]*;\s*([^;)]+?)(?:\sBuild|\))/);return(m?m[1]:/iPhone|iPad/.test(u)?'iPhone':/Windows/.test(u)?'Computador Windows':/Mac/.test(u)?'Mac':'Aparelho').slice(0,60)};
let AV='?',SINC=false;
ICO.sino='<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>';
ICO.sinox='<path d="M8.7 3A6 6 0 0 1 18 8c0 2.7.4 4.6.9 6"/><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M2 2l20 20"/>';

async function reg(){const r=await Promise.race([navigator.serviceWorker.ready,new Promise(ok=>setTimeout(()=>ok(null),6000))]);if(!r)throw new Error('o app ainda está carregando. Tente de novo em alguns segundos');return r}
async function estado(){if(!suporta())return'nao';if(Notification.permission=='denied')return'neg';try{const r=await Promise.race([navigator.serviceWorker.ready,new Promise(ok=>setTimeout(()=>ok(null),3000))]);if(!r)return'off';return(await r.pushManager.getSubscription())?'on':'off'}catch(x){return'off'}}
async function guarda(s){const j=s.toJSON(),k=j.keys||{};
 const{error}=await SB.from('push_subs').upsert({endpoint:j.endpoint,oficina_id:OF,email:String(SES.user.email||'').toLowerCase(),p256dh:k.p256dh||ab64(s.getKey('p256dh')),auth:k.auth||ab64(s.getKey('auth')),aparelho:aparelho()},{onConflict:'endpoint'});if(error)throw new Error(error.message)}
async function atualiza(){const n=await estado();if(n!=AV){AV=n;if(S.v=='agenda'&&!$('#modal .ov'))render(1)}}

G.avLiga=async function(){if(!DONO())return;const b=$('#modal .pr');if(b){b.disabled=true;b.textContent='Ligando…'}
 try{if(!suporta())throw new Error('este navegador não aceita avisos');
  const p=await Notification.requestPermission();if(p!='granted'){AV=p=='denied'?'neg':'off';return avAbre()}
  const r=await reg();let s=await r.pushManager.getSubscription();if(!s)s=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID)});
  await guarda(s);AV='on';render(1);avAbre();await avTeste(1)}
 catch(x){toast('Não consegui ligar os avisos: '+(x&&x.message||x));if(b){b.disabled=false;b.textContent='Ligar os avisos'}}};
G.avDesliga=async function(){try{const r=await reg(),s=await r.pushManager.getSubscription();if(s){await SB.from('push_subs').delete().eq('endpoint',s.endpoint);await s.unsubscribe()}AV='off';closeM();render(1);toast('Avisos desligados neste aparelho')}catch(x){toast('Não consegui desligar: '+(x&&x.message||x))}};
G.avTeste=async function(quieto){try{const{data,error}=await SB.functions.invoke('agenda-aviso',{body:{teste:true}});if(error)throw error;
  toast(data&&data.enviados?'Aviso de teste enviado. Deve chegar em alguns segundos.':'Nenhum aparelho recebeu o teste. Desligue e ligue os avisos de novo.')}
 catch(x){if(!quieto)toast('Não consegui mandar o teste (sem internet?)')}};
G.avAbre=async function(){if(!DONO())return;const ant=AV;AV=await estado();if(ant!=AV)render(1);
 const txt='<p style="margin:0 0 10px">O celular avisa <b>30 minutos antes</b> de cada agendamento, com o carro, o cliente e o serviço. Funciona mesmo com o app fechado.</p>';
 if(AV=='nao')return sheet('Avisos no celular',txt+`<p class="muted">Este navegador não aceita avisos. No Android, abra o app pelo <b>Chrome</b> ou pelo ícone instalado na tela inicial.</p>`);
 if(AV=='neg')return sheet('Avisos no celular',txt+`<p><b style="color:${KR}">As notificações estão bloqueadas para o app.</b> Para liberar:</p><ol style="margin:0 0 10px;padding-left:20px"><li>Abra as <b>Configurações</b> do Android.</li><li>Vá em <b>Apps</b>, escolha <b>Fio-Mar</b> (ou o Chrome) e toque em <b>Notificações</b>.</li><li>Ative e volte aqui.</li></ol><div class="bar" style="margin:0"><span class="sp"></span><button type="button" class="pr" onclick="avAbre()">Já liberei</button></div>`);
 if(AV=='on')return sheet('Avisos no celular',`<p style="margin:0 0 10px"><span class="p" style="--c:${KG}">${svgi('sino')} Ligados neste aparelho</span></p>`+txt+`<p class="muted" style="font-size:13px">Vale só para este aparelho. Para avisar também em outro celular, ligue lá também.</p><div class="bar" style="margin:12px 0 0"><button type="button" onclick="avDesliga()">Desligar</button><span class="sp"></span><button type="button" class="pr" onclick="avTeste()">Mandar um teste</button></div>`);
 sheet('Avisos no celular',txt+`<p class="muted" style="font-size:13px">O celular vai pedir permissão para mostrar notificações: toque em <b>Permitir</b>.</p><div class="bar" style="margin:12px 0 0"><button type="button" onclick="closeM()">Agora não</button><span class="sp"></span><button type="button" class="pr" onclick="avLiga()">Ligar os avisos</button></div>`)};

/* botão na Agenda (só o dono) */
const _ag=V.agenda;V.agenda=function(){const h=_ag();if(!DONO())return h;if(AV=='?')atualiza();
 const on=AV=='on',bt=`<button class="sm${on?'':' pr'}" onclick="avAbre()">${svgi(on?'sino':AV=='neg'?'sinox':'sino')} ${on?'Avisos ligados':'Ligar avisos no celular'}</button>`;
 return h.replace(`<button class="sm" onclick="go('agsvc')">`,bt+`<button class="sm" onclick="go('agsvc')">`)};

/* toque na notificação: abre o agendamento */
function abreAg(id){if(!id)return;const a=AG().find(x=>x.id==id);go('agenda',0,0,{ag:a&&a.data<today()?'ant':a&&a.data==today()?'hoje':'prox'});if(a)setTimeout(()=>{try{editAg(id)}catch(x){}},50)}
let AGP=null;try{const q=new URLSearchParams(location.search);AGP=q.get('ag');if(AGP)history.replaceState(null,'',location.pathname+location.hash)}catch(x){}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',ev=>{const d=ev.data||{};if(d.ag){if(SES&&OF)abreAg(d.ag);else AGP=d.ag}});

/* ao entrar: abre o agendamento pendente e confirma a inscrição deste aparelho */
const _render=render;G.render=render=function(k){_render(k);if(!SES||!OF||typeof SEMOF!='undefined'&&SEMOF)return;
 if(AGP&&db.appts){const id=AGP;AGP=null;setTimeout(()=>abreAg(id),0)}
 if(!SINC&&DONO()&&suporta()&&Notification.permission=='granted'){SINC=true;reg().then(r=>r.pushManager.getSubscription()).then(s=>s&&guarda(s)).catch(()=>{SINC=false})}};

const st=document.createElement('style');st.textContent='.osh3 .sm svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px}.psh .p svg{width:14px;height:14px}';document.head.appendChild(st);
if(typeof SES!='undefined'&&SES)setTimeout(()=>{try{render()}catch(x){}},0);
})(window);
