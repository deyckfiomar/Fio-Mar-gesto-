/* Fio-Mar Gestor — Diagnóstico (motores gasolina, etanol e flex)
   Aba "Diagnóstico" na O.S. e item "Diagnóstico" no menu.
   Informe códigos de falha e sintomas; a ferramenta mostra o caminho rápido dos casos
   já resolvidos na oficina, as causas prováveis e os testes com os equipamentos da oficina.
   O defeito encontrado vira um caso no histórico e preenche o laudo técnico da O.S.
   Funciona sem internet de IA: tudo é calculado aqui no aparelho. */
(function (G) {
'use strict';
const norm=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

/* ================= EQUIPAMENTOS ================= */
const EQ={scan:'Scanner',osc:'Osciloscópio',amp:'Alicate amperímetro',mcomb:'Manômetro de combustível',mcomp:'Manômetro de compressão',mult:'Multímetro',vis:'Inspeção / manual',caneta:'Caneta de polaridade',vac:'Vacuômetro',fum:'Máquina de fumaça',leak:'Teste de vazamento de cilindro',co2:'Teste de CO₂ (junta)',arref:'Bomba de teste do arrefecimento',ir:'Termômetro infravermelho',moleo:'Manômetro de óleo',est:'Estetoscópio'};
const EQ_DEFAULT=['scan','osc','mcomb','mcomp','mult','vis'];

/* ================= BIBLIOTECA DE TESTES ================= */
const T={
codes:['Ler códigos e freeze frame',['scan'],'Ler todos os módulos. Anotar códigos ativos e memorizados e o freeze frame (rotação, temperatura, carga, correções).','Sem códigos, ou códigos que expliquem o sintoma.'],
ft:['Correções de combustível (STFT + LTFT)',['scan'],'Motor quente. Anotar STFT e LTFT em marcha lenta e a 2.500 rpm estável. Use a calculadora de correção.','Soma entre −10% e +10%. Positivo = mistura pobre; negativo = rica.'],
misf:['Contador de falhas por cilindro',['scan'],'Ver o contador de falhas por cilindro em marcha lenta e rodando com carga.','Zero ou quase zero em todos os cilindros.'],
ect:['Temperatura do motor no scanner',['scan'],'Comparar a leitura do sensor de temperatura com a temperatura real, com motor frio e quente.','Frio: igual à temperatura ambiente. Quente: 85–105 °C.'],
rpmcrank:['RPM durante a partida',['scan'],'Ver a rotação no scanner enquanto dá partida.','Acima de ~150 rpm. Zero = sem sinal do sensor de rotação.'],
map:['Sensor MAP',['scan'],'Ler o MAP com chave ligada e motor desligado, depois em marcha lenta quente.','Desligado ≈ 100 kPa ao nível do mar (cai com a altitude). Marcha lenta 25–40 kPa.'],
maf:['Sensor MAF (g/s)',['scan'],'Ler g/s em marcha lenta quente e numa acelerada rápida.','Marcha lenta ≈ 1,5–2,5 g/s por litro de cilindrada; sobe junto com a rotação.'],
tps:['Varredura do TPS / pedal',['osc'],'Osciloscópio no sinal do TPS (ou nos dois sinais do pedal e da borboleta eletrônica). Abrir e fechar devagar.','Sinal liso, sem quedas. Fechado 0,3–0,9 V; aberto 4,0–4,8 V. Sinais duplos sobem juntos.'],
o2:['Sonda lambda pré-catalisador',['osc','scan'],'Motor quente a 2.500 rpm. Osciloscópio (ou gráfico do scanner) no sinal da sonda.','Oscila entre 0,1 e 0,9 V várias vezes por segundo, com subidas e descidas rápidas.'],
o2post:['Sonda pós-catalisador',['scan','osc'],'Comparar a sonda pré e a pós com motor quente.','Pós-cat estável entre 0,45 e 0,7 V enquanto a pré oscila.'],
idle:['Marcha lenta desejada x real',['scan'],'Comparar RPM desejada e real e a abertura do atuador de marcha lenta, ligando AC, faróis e esterçando.','Real acompanha a desejada; abertura do atuador dentro do normal.'],
vvt:['Comando variável desejado x real',['scan'],'Ler o ângulo desejado e o real do comando acelerando.','Real acompanha o desejado em poucos graus.'],
fan:['Acionar ventoinha',['scan'],'Acionar as velocidades pelo scanner e anotar a temperatura em que liga sozinha.','Liga pelo scanner e sozinha perto de 95–105 °C (varia).'],
pumpact:['Acionar bomba de combustível',['scan'],'Acionar pelo scanner ou ouvir ao ligar a chave (2–3 s).','Bomba funciona e desliga.'],
imob:['Imobilizador',['scan'],'Ver o status do imobilizador e os códigos de chave.','Chave reconhecida, sem bloqueio.'],
relearn:['Reaprendizado da borboleta',['scan'],'Depois de limpar, fazer o procedimento de reaprendizado da montadora.','Marcha lenta estável depois do procedimento.'],
coldstart:['Partida a frio (flex)',['scan'],'Ver no scanner o percentual de etanol aprendido e a temperatura. Testar a bomba e a válvula do tanquinho ou o aquecimento dos injetores.','Percentual coerente com o combustível do tanque. Sistema de partida a frio atuando abaixo de ~15–20 °C.'],
boost:['Pressão do turbo desejada x real',['scan'],'Ler a pressão de turbo desejada e a real em aceleração forte.','Real acompanha a desejada.'],
ckpcmp:['Sincronismo CKP x CMP',['osc'],'Dois canais: rotação (CKP) e fase (CMP) na partida ou marcha lenta. Comparar a falha da roda fônica com o pulso de fase.','Mesma relação do padrão do motor. Deslocado = ponto fora ou distribuição esticada.'],
relcomp:['Compressão relativa (corrente de partida)',['osc+amp'],'Alicate no cabo da bateria. Desabilitar a injeção e dar partida. Comparar a altura dos picos de corrente.','Picos com a mesma altura (variação até ~10%). Pico mais baixo = cilindro com menos compressão.'],
ign:['Forma de onda da ignição',['osc'],'Ponta no primário (ou captador no secundário) de cada bobina, em marcha lenta e acelerando.','Tempo de queima de ~1–2 ms, linha de queima estável e parecida entre os cilindros.'],
injwave:['Forma de onda do injetor',['osc'],'Ponta no fio de comando do injetor em marcha lenta. Comparar todos.','Pulso limpo e pico de desligamento parecido entre os injetores. Pico baixo ou ausente = bobina do injetor ruim.'],
pumpcur:['Corrente da bomba de combustível',['osc+amp'],'Alicate no fio da bomba com motor funcionando.','Ondulação regular. Corrente típica 4–8 A. Alta = bomba forçando; irregular = coletor da bomba gasto.'],
knock:['Sinal do sensor de detonação',['osc'],'Osciloscópio no sinal. Bater de leve no bloco perto do sensor.','Sinal aparece a cada batida. Torque de fixação correto.'],
ripple:['Ondulação do alternador',['osc'],'Osciloscópio em AC na bateria, motor a 2.000 rpm com carga ligada.','Ondulação uniforme e baixa (até ~0,5 V pico a pico). Irregular = diodo com defeito.'],
can:['Rede CAN',['osc','mult'],'Bateria desligada: resistência entre os pinos 6 e 14 do conector OBD. Chave ligada: CAN-H e CAN-L.','≈ 60 Ω. CAN-H 2,5–3,5 V e CAN-L 1,5–2,5 V, espelhados.'],
fpress:['Pressão de combustível',['mcomb'],'Manômetro na linha ou na válvula do rail. Medir com chave ligada e em marcha lenta.','Com regulador no retorno: 2,5–3,0 bar em marcha lenta. Sem retorno: 3,5–4,0 bar. Conferir especificação.'],
fhold:['Retenção de pressão',['mcomb'],'Desligar o motor e acompanhar o manômetro por 5 a 10 minutos.','Pressão se mantém, com queda lenta. Queda rápida = injetor pingando, regulador ou válvula de retenção da bomba.'],
faccel:['Pressão em aceleração',['mcomb'],'Manômetro visível; acelerar forte, ou rodar com o manômetro preso no para-brisa.','Pressão se mantém. Queda = bomba fraca ou filtro entupido.'],
fflow:['Vazão da bomba',['mcomb'],'Desviar a saída para uma proveta e acionar a bomba por tempo marcado.','Conferir a especificação. Referência comum: acima de ~1 L/min.'],
freg:['Regulador de pressão',['mcomb'],'Em sistemas com regulador ligado ao coletor: tirar a mangueira de vácuo do regulador em marcha lenta.','Pressão sobe cerca de 0,5 bar. Combustível na mangueira = diafragma furado.'],
compdry:['Compressão a seco',['mcomp'],'Motor quente, todas as velas fora, borboleta toda aberta, injeção desligada. 4 a 6 compressões por cilindro.','8,5–14 bar (120–200 psi), conforme o motor. Diferença máxima entre cilindros: 10%.'],
compwet:['Compressão molhada',['mcomp'],'No cilindro baixo, colocar uma colher de óleo e medir de novo.','Sobe bastante = anéis. Não muda = válvula ou junta.'],
leak:['Vazamento de cilindro',['leak'],'Cilindro no PMS de compressão, ar comprimido pelo furo da vela.','Até 10–15%. Ar no escape = válvula de escape; na admissão = válvula de admissão; no cárter = anéis; bolhas no radiador = junta ou cabeçote.'],
vacidle:['Vácuo em marcha lenta',['vac'],'Vacuômetro direto no coletor, motor quente.','17–21 inHg estável. Baixo e estável = ponto atrasado ou entrada de ar; ponteiro batendo = válvula.'],
vac2500:['Vácuo a 2.500 rpm (escape entupido)',['vac'],'Manter 2.500 rpm por um minuto.','Vácuo igual ou acima da marcha lenta. Caindo aos poucos = catalisador ou escapamento entupido.'],
smoke:['Teste de fumaça na admissão',['fum'],'Injetar fumaça no coletor com motor desligado.','Nenhuma saída de fumaça. Procurar em mangueiras, juntas, PCV e servo-freio.'],
co2:['Teste de CO₂ no arrefecimento',['co2'],'Reagente no gargalo do reservatório com motor quente.','Reagente não muda de cor. Mudou = gás de combustão no arrefecimento (junta ou cabeçote).'],
coolpress:['Teste de pressão do arrefecimento',['arref'],'Pressurizar o sistema na pressão da tampa (≈ 1,0–1,4 bar) e testar a tampa.','Pressão se mantém por 15 min. Tampa abre na pressão marcada.'],
irtemp:['Temperaturas com termômetro IR',['ir'],'Medir mangueira superior, inferior e várias partes do radiador enquanto o motor aquece.','Mangueira superior esquenta quando o termostato abre; radiador com temperatura uniforme.'],
oilpress:['Pressão de óleo',['moleo'],'Manômetro no lugar do interruptor de óleo. Medir quente em marcha lenta e a 3.000 rpm.','Marcha lenta quente ≥ 1 bar; 3.000 rpm 3–5 bar.'],
stetho:['Localizar ruído',['est','vis'],'Estetoscópio (ou chave de fenda longa) no cabeçote, bloco, alternador, bomba d’água e tensores, variando a rotação.','Origem isolada. Ruído que some ao retirar a correia = acessório.'],
bat:['Bateria: repouso, partida e carga',['mult'],'Medir em repouso (parado > 1 h), durante a partida e com motor ligado.','12,6 V em repouso; ≥ 9,6 V na partida; 13,8–14,7 V ligado.'],
drop:['Queda de tensão',['mult'],'Multímetro nas duas pontas do mesmo cabo, com o circuito funcionando.','Positivo da partida ≤ 0,5 V; massas ≤ 0,3 V; massa de sensor ≤ 0,1 V.'],
draw:['Corrente de fuga',['mult'],'Amperímetro em série no negativo, portas fechadas; esperar os módulos dormirem (5–30 min).','Abaixo de 50 mA. Acima: medir a queda de tensão sobre cada fusível para achar o circuito.'],
refgnd:['Referência 5 V e massa dos sensores',['mult'],'Medir a referência no conector com chave ligada e a massa contra o negativo da bateria.','Referência 4,9–5,1 V. Massa ≤ 0,1 V.'],
res:['Resistência do componente',['mult'],'Medir o componente desconectado e comparar com a especificação.','Ver aba Valores (injetor 12–16 Ω, bobina primário 0,4–2 Ω, sensor de temperatura etc.).'],
noid:['Pulso dos injetores na partida',['caneta','osc'],'Caneta de polaridade ou osciloscópio no conector do injetor durante a partida.','Pulso em todos os injetores.'],
spark:['Teste de faísca',['vis'],'Centelhador em cada bobina durante a partida. Nunca deixar a bobina disparar sem carga.','Faísca forte e azulada em todos os cilindros.'],
oilvis:['Inspeção do óleo',['vis'],'Nível, aparência e cheiro na vareta e na tampa de óleo.','Nível certo, sem borra, sem emulsão (“maionese”), sem cheiro forte de combustível, sem limalha.'],
coolvis:['Inspeção do arrefecimento',['vis'],'Nível no reservatório com motor frio e aparência do líquido.','Nível certo, sem óleo, sem bolhas com o motor funcionando.'],
belt:['Correias, tensores e polias',['vis'],'Ver desgaste, trincas e tensão; girar as polias à mão sem a correia.','Correia sem trincas, tensor firme, polias sem folga ou ruído.'],
plugs:['Inspeção das velas',['vis'],'Retirar e comparar cor e folga de todas.','Marrom-clara, folga certa. Preta = rico; oleada = óleo na câmara; branca = pobre ou superaquecida.'],
leaksvis:['Procurar vazamentos',['vis'],'Motor limpo; procurar óleo, água e combustível na tampa de válvulas, retentores, cárter, mangueiras e bomba d’água.','Sem vazamentos.'],
mounts:['Coxins do motor e do câmbio',['vis'],'Observar o motor acelerando em vazio e engatando.','Movimento pequeno, sem batida. Borracha sem trincas.'],
exhvis:['Escapamento',['vis'],'Procurar vazamentos (marcas pretas, ruído) e observar a cor da fumaça.','Sem vazamento antes das sondas. Sem fumaça com motor quente.'],
tbvis:['Corpo de borboleta',['vis'],'Retirar a mangueira e olhar a borboleta e o canal de marcha lenta.','Limpo. Carvão na borda da borboleta altera a marcha lenta.'],
airfilter:['Filtro de ar e dutos',['vis'],'Conferir o filtro e os dutos depois do MAF.','Filtro limpo; dutos sem trincas e bem presos.'],
blowby:['Blow-by e PCV',['vis'],'Motor quente em marcha lenta: soltar a tampa de óleo e observar. Conferir a válvula PCV.','Pouco vapor e leve vácuo. Muita fumaça pulsando = anéis ou pistão gastos.'],
timingmk:['Conferir ponto da distribuição',['vis'],'Girar o motor pela polia e conferir as marcas (ou ferramenta de travamento).','Marcas alinhadas. Correia ou corrente sem folga excessiva.'],
turnhand:['Girar o motor pela polia',['vis'],'Chave desligada; girar o virabrequim com catraca.','Gira livre, com resistência só da compressão. Travado = motor calçado ou com água no cilindro.'],
oilcons:['Controle de consumo de óleo',['vis'],'Completar o nível, marcar e medir de novo depois de 1.000 km.','Consumo dentro do que o manual aceita.'],
fuelq:['Qualidade do combustível',['vis'],'Coletar amostra. Teste de proveta para o teor de etanol na gasolina; ver água e sujeira.','Teor de etanol dentro do permitido pela ANP; sem água nem sedimentos.']
};
const TESTS={};Object.keys(T).forEach(k=>{const v=T[k];TESTS[k]={id:k,n:v[0],eq:v[1],como:v[2],esp:v[3]};});

/* ================= CÓDIGOS ================= */
const DCODES=[
['P0010','Solenoide do comando variável (VVT) — circuito, banco 1',2,'Falha elétrica no circuito da válvula solenoide do VVT.',['Solenoide VVT aberta ou em curto','Chicote ou conector','Driver da ECU'],['res','vvt','refgnd']],
['P0011','Comando de admissão avançado demais, banco 1',2,'O ângulo real do comando não acompanha o pedido pela ECU.',['Óleo sujo, baixo ou de viscosidade errada','Solenoide VVT travada ou tela filtrante entupida','Variador de fase com defeito','Distribuição esticada ou fora de ponto'],['oilvis','vvt','ckpcmp','timingmk']],
['P0016','Correlação virabrequim x comando, banco 1',3,'Sinais de rotação e fase fora da relação esperada. O ponto pode estar errado.',['Corrente esticada ou tensor gasto','Correia dentada pulou dente','Variador VVT travado','Roda fônica ou sensor danificados'],['ckpcmp','timingmk','vvt','oilvis']],
['P0087','Pressão do rail de combustível baixa',3,'A pressão no rail ficou abaixo da pedida.',['Filtro de combustível entupido','Bomba de combustível fraca','Bomba de alta pressão gasta (injeção direta)','Sensor de pressão do rail'],['fpress','faccel','fflow','pumpcur']],
['P0100','Sensor MAF — circuito',2,'Falha elétrica no circuito do medidor de massa de ar.',['Conector solto ou oxidado','Falta de alimentação ou massa','Sensor MAF queimado'],['refgnd','maf','airfilter']],
['P0101','Sensor MAF — faixa/desempenho',2,'A leitura do MAF não bate com o calculado por rotação, borboleta e MAP.',['MAF sujo','Entrada falsa de ar','Filtro de ar obstruído','Sensor MAF degradado'],['maf','airfilter','smoke','ft']],
['P0102','Sensor MAF — sinal baixo',2,'Sinal do MAF abaixo do mínimo.',['Falta de alimentação ou massa','Fio de sinal aberto','Sensor MAF queimado'],['refgnd','maf']],
['P0106','Sensor MAP — faixa/desempenho',2,'A pressão do coletor lida não condiz com a carga do motor.',['Mangueira do MAP rachada ou solta','Entrada falsa de ar','Ponto da distribuição fora','Sensor MAP descalibrado'],['map','vacidle','smoke','timingmk']],
['P0107','Sensor MAP — sinal baixo',2,'Sinal do MAP abaixo do limite.',['Falta da referência de 5 V','Sinal em curto com massa','Sensor MAP com defeito'],['refgnd','map']],
['P0108','Sensor MAP — sinal alto',2,'Sinal do MAP acima do limite.',['Massa do sensor aberta','Sinal em curto com 5 V','Mangueira do MAP rachada ou solta'],['refgnd','map']],
['P0113','Sensor de temperatura do ar — sinal alto',1,'Circuito aberto: o scanner mostra cerca de −40 °C.',['Conector solto','Fio aberto','Sensor de temperatura do ar aberto'],['res','refgnd']],
['P0117','Sensor de temperatura do motor — sinal baixo',2,'Sinal em curto com massa: o scanner mostra temperatura muito alta.',['Sensor de temperatura em curto','Fio de sinal encostando na massa','Água no conector'],['ect','res']],
['P0118','Sensor de temperatura do motor — sinal alto',2,'Circuito aberto: scanner mostra cerca de −40 °C. Ventoinha pode ficar ligada direto e a partida fica difícil.',['Conector solto ou oxidado','Fio aberto','Sensor de temperatura aberto'],['ect','res','refgnd']],
['P0121','Sensor TPS — faixa/desempenho',2,'O TPS não acompanha a rotação ou o MAP.',['Pista do TPS gasta','Corpo de borboleta sujo','Mau contato no conector'],['tps','tbvis','relearn']],
['P0122','Sensor TPS — sinal baixo',2,'Sinal do TPS abaixo do limite.',['Falta da referência de 5 V','Sinal em curto com massa','Sensor TPS aberto'],['refgnd','tps']],
['P0123','Sensor TPS — sinal alto',2,'Sinal do TPS acima do limite.',['Massa do sensor aberta','Sinal em curto com 5 V','Sensor TPS com defeito'],['refgnd','tps']],
['P0128','Temperatura do motor abaixo da regulagem',1,'O motor demora demais para chegar à temperatura de trabalho.',['Termostato travado aberto','Sensor de temperatura lendo errado','Ventoinha ligada direto'],['ect','irtemp','fan']],
['P0130','Sonda lambda B1S1 — circuito',2,'Falha no circuito da sonda antes do catalisador.',['Sonda lambda com defeito','Chicote derretido no escapamento','Conector oxidado'],['o2','exhvis','refgnd']],
['P0133','Sonda lambda B1S1 — resposta lenta',2,'A sonda demora para alternar entre rico e pobre.',['Sonda lambda envelhecida ou contaminada','Vazamento no escapamento','Mistura desequilibrada'],['o2','exhvis','ft']],
['P0134','Sonda lambda B1S1 — sem atividade',2,'Sinal parado em torno de 0,45 V.',['Sonda lambda com defeito','Aquecedor da sonda queimado','Fio de sinal aberto'],['o2','res']],
['P0135','Aquecedor da sonda B1S1 — circuito',1,'Falha no resistor de aquecimento da sonda dianteira.',['Aquecedor da sonda queimado','Fusível ou relé','Chicote aberto'],['res','refgnd']],
['P0136','Sonda pós-catalisador B1S2 — circuito',1,'Falha no circuito da sonda depois do catalisador.',['Sonda pós-catalisador com defeito','Chicote danificado','Conector oxidado'],['o2post','exhvis']],
['P0141','Aquecedor da sonda B1S2 — circuito',1,'Falha no aquecimento da sonda pós-catalisador.',['Aquecedor da sonda queimado','Fusível ou relé','Chicote aberto'],['res']],
['P0171','Mistura pobre, banco 1',2,'A ECU está adicionando combustível demais para compensar (correção total acima de ~+25%).',['Entrada falsa de ar','MAF sujo','Pressão de combustível baixa','Injetor entupido','Vazamento no escapamento'],['ft','fpress','faccel','fflow','injwave','maf','smoke','vacidle','exhvis']],
['P0172','Mistura rica, banco 1',2,'A ECU está tirando combustível para compensar (correção total abaixo de ~−25%).',['Pressão de combustível alta','Injetor pingando','Sensor de temperatura lendo frio','Filtro de ar obstruído','Purga do canister presa aberta'],['ft','fpress','fhold','freg','ect','o2','airfilter']],
['P0174','Mistura pobre, banco 2',2,'Igual ao P0171, no banco 2. P0171 + P0174 juntos indicam causa comum aos dois bancos.',['Entrada falsa de ar','MAF sujo','Pressão de combustível baixa','Injetor entupido'],['ft','fpress','maf','smoke']],
['P0175','Mistura rica, banco 2',2,'Igual ao P0172, no banco 2.',['Pressão de combustível alta','Injetor pingando','Sensor de temperatura lendo frio'],['ft','fpress','fhold','ect']],
['P0217','Superaquecimento do motor',3,'Temperatura acima do limite. Desligar o motor para não empenar o cabeçote.',['Nível baixo ou vazamento','Ventoinha não liga','Termostato travado fechado','Bomba d’água','Junta do cabeçote queimada'],['coolvis','leaksvis','fan','irtemp','coolpress','co2','oilvis']],
['P0230','Bomba de combustível — circuito primário',3,'Falha no circuito de comando do relé ou módulo da bomba.',['Relé da bomba','Fusível','Chicote aberto','Interruptor inercial acionado'],['pumpact','drop','fpress']],
['P0234','Sobrepressão do turbo',3,'Pressão de turbo acima do limite.',['Wastegate presa fechada','Atuador ou solenoide do turbo','Mangueira de controle invertida ou entupida'],['boost']],
['P0299','Turbo abaixo da pressão',2,'Pressão de turbo abaixo do pedido.',['Vazamento em mangueira ou intercooler','Wastegate presa aberta','Turbina gasta','Válvula de alívio vazando'],['boost','smoke']],
['P0300','Falha de combustão em vários cilindros',3,'Falhas em mais de um cilindro. Luz de injeção piscando = catalisador sendo danificado.',['Entrada falsa de ar','Pressão de combustível baixa','Velas e cabos gastos','Combustível adulterado','Compressão baixa','Ponto da distribuição fora'],['misf','ft','fpress','fuelq','plugs','ign','relcomp','compdry','smoke','timingmk']],
['P0320','Sinal de rotação do motor (ignição) — circuito',3,'A ECU não recebe o sinal de rotação/referência de ignição. O motor pode não pegar ou desligar rodando.',['Sensor de rotação com defeito','Roda fônica danificada','Chicote aberto ou em curto','Folga ou limalha no sensor'],['rpmcrank','res','ckpcmp','refgnd']],
['P0321','Sinal de rotação do motor (ignição) — faixa/desempenho',2,'O sinal de rotação/referência de ignição está irregular: pulsos faltando, extras ou com ruído. Pode causar falhas, trancos e o motor apagar.',['Sensor de rotação com defeito','Roda fônica danificada ou suja','Interferência no chicote (cabos de vela, massa ruim)','Folga ou limalha no sensor','Conector com mau contato'],['ckpcmp','rpmcrank','res','drop','ign']],
['P0322','Sinal de rotação do motor (ignição) — sem sinal',3,'Nenhum pulso de rotação/ignição chega à ECU. O motor gira e não pega.',['Sensor de rotação com defeito','Chicote aberto','Falta de alimentação do sensor','Roda fônica danificada'],['rpmcrank','refgnd','res','ckpcmp']],
['P0341','Sensor de fase (CMP) — faixa/desempenho',2,'Sinal de fase irregular ou fora de posição em relação à rotação.',['Ponto da distribuição fora','Sensor de fase com defeito','Roda de fase danificada','Interferência no chicote'],['ckpcmp','timingmk','refgnd']],
['P0115','Sensor de temperatura do motor — circuito',2,'Falha elétrica no circuito do sensor de temperatura do motor.',['Sensor de temperatura com defeito','Conector oxidado','Chicote aberto ou em curto'],['ect','res','refgnd']],
['P0116','Sensor de temperatura do motor — faixa/desempenho',2,'A temperatura lida não condiz com o tempo de funcionamento do motor.',['Sensor de temperatura lendo errado','Termostato travado aberto','Nível baixo de líquido de arrefecimento'],['ect','irtemp','coolvis']],
['P0125','Temperatura insuficiente para malha fechada',1,'O motor demora para chegar à temperatura de trabalho da sonda lambda.',['Termostato travado aberto','Sensor de temperatura lendo errado'],['ect','irtemp']],
['P0401','EGR — fluxo insuficiente',2,'A ECU não viu o efeito esperado ao abrir a válvula EGR.',['Válvula EGR carbonizada','Dutos da EGR entupidos','Solenoide de controle da EGR'],['map','vacidle','res']],
['P0500','Sensor de velocidade do veículo',2,'Sem sinal de velocidade ou sinal incoerente.',['Sensor de velocidade com defeito','Chicote','Módulo ABS (quando o sinal vem dele)'],['codes','refgnd','res']],
['P0700','Sistema da transmissão automática — falha registrada',2,'A ECU do motor avisa que o módulo do câmbio tem código registrado.',['Falha registrada no módulo do câmbio'],['codes']],
['P0325','Sensor de detonação — circuito',1,'Falha no circuito do sensor de detonação.',['Sensor de detonação solto','Chicote danificado','Sensor de detonação com defeito'],['knock','res']],
['P0327','Sensor de detonação — sinal baixo',1,'Sinal do sensor de detonação abaixo do esperado.',['Sensor de detonação solto','Fio em curto com massa','Sensor de detonação com defeito'],['knock']],
['P0335','Sensor de rotação (CKP) — circuito',3,'Sem sinal de rotação: o motor gira e não pega, ou apaga rodando.',['Sensor de rotação com defeito','Folga ou limalha no sensor','Roda fônica danificada','Chicote aberto'],['rpmcrank','res','ckpcmp']],
['P0336','Sensor de rotação (CKP) — faixa/desempenho',2,'Sinal de rotação com falhas ou ruído.',['Roda fônica danificada','Folga ou limalha no sensor','Interferência no chicote'],['ckpcmp']],
['P0340','Sensor de fase (CMP) — circuito',2,'Sem sinal de fase. O motor pode demorar para pegar.',['Sensor de fase com defeito','Falta de alimentação','Chicote aberto','Ponto da distribuição fora'],['refgnd','ckpcmp','timingmk']],
['P0420','Eficiência do catalisador baixa, banco 1',1,'A sonda pós-cat copia a dianteira: o catalisador não armazena oxigênio.',['Catalisador gasto','Vazamento no escapamento','Sonda pós-catalisador com defeito','Falhas de combustão anteriores'],['o2','o2post','exhvis','misf','vac2500']],
['P0430','Eficiência do catalisador baixa, banco 2',1,'Igual ao P0420, no banco 2.',['Catalisador gasto','Vazamento no escapamento','Sonda pós-catalisador com defeito'],['o2','o2post','exhvis']],
['P0442','EVAP — vazamento pequeno',1,'Vazamento pequeno no sistema de vapores de combustível.',['Tampa do tanque','Mangueira do canister trincada','Válvula de purga vazando'],['leaksvis','smoke']],
['P0443','Válvula de purga do canister — circuito',1,'Falha elétrica na válvula de purga.',['Válvula de purga com defeito','Chicote','Conector'],['res']],
['P0455','EVAP — vazamento grande',1,'Vazamento grande ou tampa ausente.',['Tampa do tanque','Mangueira desconectada','Canister trincado'],['leaksvis','smoke']],
['P0480','Relé da ventoinha — circuito',2,'Falha no circuito de comando do relé da ventoinha.',['Relé da ventoinha','Fusível','Chicote aberto'],['fan','drop']],
['P0505','Controle de marcha lenta — sistema',2,'A ECU não consegue controlar a marcha lenta.',['Corpo de borboleta sujo','Atuador de marcha lenta','Entrada falsa de ar'],['tbvis','idle','relearn','smoke']],
['P0506','Marcha lenta abaixo do esperado',1,'Rotação real abaixo da desejada.',['Corpo de borboleta sujo','Atuador de marcha lenta','Carga extra (alternador, AC)'],['idle','tbvis','relearn']],
['P0507','Marcha lenta acima do esperado',1,'Rotação real acima da desejada.',['Entrada falsa de ar','Borboleta sem reaprendizado'],['idle','smoke','relearn']],
['P0520','Pressão de óleo — circuito do sensor',2,'Falha no circuito de pressão de óleo. Confirme a pressão real antes de tudo.',['Interruptor de óleo com defeito','Chicote','Pressão de óleo realmente baixa'],['oilvis','oilpress','refgnd']],
['P0562','Tensão do sistema baixa',2,'Tensão de alimentação da ECU abaixo do mínimo.',['Alternador não carregando','Bateria no fim da vida','Terminal oxidado','Massa da ECU'],['bat','drop','ripple']],
['P0563','Tensão do sistema alta',2,'Tensão acima do máximo.',['Regulador do alternador','Massa do regulador'],['bat','drop']],
['P0606','Processador da ECU',3,'Falha interna detectada pela ECU.',['ECU com defeito','Alimentação ou massa instáveis','Software'],['bat','drop','refgnd']],
['P0641','Referência de 5 V "A" — circuito',3,'Referência de 5 V fora da faixa. Costuma gerar vários códigos de sensor juntos.',['Sensor em curto puxando a referência','Chicote em curto','ECU'],['refgnd']],
['P2096','Correção pós-catalisador — pobre, banco 1',2,'A sonda traseira indica mistura pobre persistente.',['Vazamento no escapamento','Sonda lambda descalibrada','Entrada falsa de ar'],['exhvis','o2','o2post','ft']],
['P2097','Correção pós-catalisador — rico, banco 1',2,'A sonda traseira indica mistura rica persistente.',['Sonda lambda descalibrada','Injetor pingando','Catalisador gasto'],['o2','o2post','fhold']],
['P2101','Motor da borboleta eletrônica — desempenho',3,'A borboleta não chega à posição pedida. Pode entrar em modo de emergência.',['Corpo de borboleta sujo','Motor da borboleta gasto','Chicote ou conector'],['tbvis','tps','relearn']],
['P2135','Sensores da borboleta A/B — correlação',3,'Os dois sinais de posição da borboleta não concordam.',['Pista do sensor gasta','Conector','Chicote'],['tps','refgnd']],
['P2138','Sensores do pedal D/E — correlação',3,'Os dois sinais do pedal não concordam.',['Pedal com pista gasta','Conector','Chicote'],['tps','refgnd']],
['P2187','Sistema pobre em marcha lenta, banco 1',2,'Pobre só em marcha lenta: típico de entrada falsa de ar.',['Mangueira de vácuo rachada','PCV / respiro do cárter','Junta do coletor de admissão','Servo-freio vazando'],['ft','smoke','vacidle','blowby']],
['P2188','Sistema rico em marcha lenta, banco 1',2,'Mistura rica em marcha lenta.',['Injetor pingando','Purga do canister presa aberta','Pressão de combustível alta'],['ft','fhold','fpress','freg']],
['U0100','Perda de comunicação com a ECU do motor',3,'Um módulo não recebe mensagens da ECU do motor na rede CAN.',['ECU sem alimentação ou massa','Rede CAN aberta ou em curto','Conector da ECU oxidado'],['can','bat','drop']],
['U0101','Perda de comunicação com o módulo do câmbio',2,'Sem mensagens do módulo do câmbio automático.',['Alimentação do módulo','Rede CAN','Conector'],['can','drop']],
['U0121','Perda de comunicação com o ABS',2,'Sem mensagens do ABS na rede.',['Fusível do ABS','Conector do módulo','Rede CAN'],['can','drop']],
['U0140','Perda de comunicação com o módulo da carroceria',2,'Sem mensagens do BCM na rede.',['Alimentação do BCM','Rede CAN','Umidade no módulo'],['can','drop']]
];
const DB={};DCODES.forEach(r=>DB[r[0]]={c:r[0],t:r[1],s:r[2],m:r[3],ca:r[4],tests:r[5]});
function pattern(c){
  if(/^P02(0[1-9]|1[0-2])$/.test(c)){const n=parseInt(c.slice(3),10);return {c,t:`Injetor do cilindro ${n} — circuito`,s:2,m:`Falha elétrica no circuito do injetor do cilindro ${n}.`,ca:[`Injetor do cilindro ${n} com defeito`,'Chicote ou conector','Driver da ECU'],tests:['res','injwave','noid']};}
  let m=/^P03(0[1-9]|1[0-2])$/.exec(c);
  if(m){const n=parseInt(m[1],10);return {c,t:`Falha de combustão no cilindro ${n}`,s:3,m:`Falhas no cilindro ${n}. Troque bobina e vela de posição com outro cilindro: se a falha muda de cilindro, a peça é a culpada.`,ca:[`Vela do cilindro ${n}`,`Bobina do cilindro ${n}`,`Injetor do cilindro ${n}`,`Compressão baixa no cilindro ${n}`],tests:['misf','plugs','ign','injwave','relcomp','compdry','compwet','leak']};}
  m=/^P03(5[1-9]|6[0-2])$/.exec(c);
  if(m){const n=parseInt(c.slice(3),10)-50;const L='ABCDEFGHIJKL'[n-1];return {c,t:`Bobina de ignição ${L} — circuito`,s:2,m:`Falha no circuito da bobina ${L} (cilindro ${n} na maioria dos motores).`,ca:[`Bobina do cilindro ${n}`,'Chicote ou conector','Driver da ECU'],tests:['ign','res','drop','misf']};}
  return null;
}
const lookupBase=c=>DB[c]||pattern(c)||autoCode(c);

const SUB={'0':'Combustível, ar e emissões','1':'Medição de ar e combustível','2':'Injetores','3':'Ignição e falhas de combustão','4':'Emissões auxiliares','5':'Velocidade e marcha lenta','6':'ECU e saídas','7':'Transmissão','8':'Transmissão','9':'Transmissão'};
const SYS={P:'Motor e transmissão',B:'Carroceria',C:'Chassi',U:'Rede de comunicação'};
const ctype=c=>{const d=c[1];if(c[0]==='P')return d==='1'||d==='3'?'Específico do fabricante':'Genérico (SAE)';return d==='0'?'Genérico (SAE)':'Específico do fabricante';};
const SEV={1:'Baixa',2:'Média',3:'Alta'};
/* aceita "po171", "0171", "p 0171" */
function parseCode(raw){
  let s=String(raw||'').toUpperCase().replace(/[\s.\-]/g,'');
  if(!s)return {ok:false,empty:true};
  if(/^[0-9O]{4}$/.test(s))s='P'+s;
  if(/^[PBCU][0-9A-FO]{4}$/.test(s))s=s[0]+s.slice(1).replace(/O/g,'0');
  if(/^[PBCU][0-3][0-9A-F]{3}$/.test(s))return {ok:true,code:s};
  return {ok:false,raw:s};
}


/* ================= BASE AMPLIADA (pesquisa automática, sem internet de IA) =================
   codigos-extra.json: ~5.900 códigos genéricos SAE (P0, P2, P3 e U0), título em português e original em inglês.
   Fonte dos títulos: OBDex (CC0, github.com/foerbsnavi/OBDex), traduzidos por regras.
   As causas e os testes são montados pelo componente e pelo tipo de falha. */
let XB=null,XBload=null;
function carregaXB(){if(XB||XBload)return XBload;XBload=fetch('codigos-extra.json').then(r=>r.ok?r.json():null).then(j=>{XB=j||{};if(typeof render=='function'&&S&&['order','diag'].includes(S.v)&&!document.querySelector('#modal .ov'))render(1)}).catch(()=>{XBload=null});return XBload}
setTimeout(carregaXB,1500);
const CK_EL=['Chicote ou conector (fio rompido, em curto ou com mau contato)'],CK_ECU='Estágio de saída (driver) da ECU';
/* componente: [nome, causas de falha elétrica, testes elétricos, causas de funcionamento, testes de funcionamento] */
const XC={
o2:['sonda lambda',['Sonda lambda com defeito','Chicote ou conector da sonda (encostando no escape)','Referência ou massa da sonda'],['o2','res','refgnd','drop'],['Sonda lambda envelhecida ou contaminada (óleo, silicone, aditivo)','Entrada de ar falsa ou furo no escape antes da sonda','Mistura fora do normal (injetor, pressão de combustível, MAF/MAP)','Falha de combustão'],['o2','ft','exhvis','smoke','fpress']],
o2aq:['aquecimento da sonda lambda',['Resistência de aquecimento da sonda queimada','Fusível ou relé da alimentação da sonda','Chicote ou conector da sonda',CK_ECU],['res','drop','o2'],['Aquecimento da sonda fraco','Sonda lambda com defeito'],['res','o2']],
cat:['catalisador',['Sensor de temperatura do catalisador','Chicote ou conector'],['res','refgnd'],['Catalisador gasto ou contaminado','Sonda pós-catalisador com defeito','Furo no escape perto das sondas','Falha de combustão ou motor queimando óleo, que estragam o catalisador'],['o2post','o2','exhvis','misf','vac2500']],
misf:['combustão',[],[],['Vela de ignição gasta ou com folga errada','Bobina ou cabo de vela com defeito','Injetor entupido ou com defeito','Entrada de ar falsa','Compressão baixa (válvula, anel, junta)','Combustível de má qualidade'],['misf','plugs','ign','spark','injwave','smoke','relcomp','compdry','fuelq']],
trim:['mistura ar/combustível',[],[],['Entrada de ar falsa (mangueiras, junta do coletor, servo-freio)','Pressão de combustível baixa (bomba, filtro, regulador)','Injetor entupido ou vazando','Sensor MAF/MAP lendo errado','Sonda lambda com defeito','Combustível adulterado ou % de etanol mal aprendido'],['ft','smoke','fpress','maf','map','o2','injwave','fuelq']],
maf:['sensor de fluxo de ar (MAF)',['Sensor MAF com defeito','Chicote ou conector do MAF','Alimentação 12 V ou massa do MAF'],['maf','refgnd','drop'],['MAF sujo ou contaminado','Entrada de ar falsa depois do MAF','Filtro de ar entupido ou duto rasgado'],['maf','airfilter','smoke','ft']],
map:['sensor de pressão do coletor (MAP)',['Sensor MAP com defeito','Chicote ou conector do MAP','Referência 5 V ou massa'],['map','refgnd'],['Mangueira do MAP solta, furada ou entupida','Entrada de ar falsa','Sensor MAP descalibrado','Vácuo baixo por problema mecânico (ponto, válvula)'],['map','vacidle','smoke','timingmk']],
baro:['sensor de pressão barométrica',['Sensor com defeito','Chicote ou conector','Referência 5 V ou massa'],['refgnd','map'],['Sensor descalibrado','Sensor MAP (quando o barométrico é o próprio MAP)'],['map']],
iat:['sensor de temperatura do ar de admissão',['Sensor de temperatura do ar com defeito','Chicote ou conector','Referência 5 V ou massa'],['res','refgnd'],['Sensor descalibrado','Sensor fora do lugar ou com sujeira'],['res']],
ect:['sensor de temperatura do motor',['Sensor de temperatura com defeito','Chicote ou conector','Referência 5 V ou massa'],['ect','res','refgnd'],['Sensor descalibrado','Válvula termostática travada aberta','Nível baixo de líquido / ar no sistema'],['ect','irtemp','coolvis']],
arref:['sistema de arrefecimento',['Sensor ou atuador do arrefecimento','Chicote ou conector',CK_ECU],['res','drop'],['Válvula termostática travada (aberta ou fechada)','Nível baixo, vazamento ou ar no sistema','Bomba d\'água com defeito','Radiador entupido','Junta do cabeçote (gases no arrefecimento)'],['coolvis','ect','irtemp','fan','coolpress','co2']],
fan:['ventoinha do radiador',['Motor da ventoinha','Relé ou fusível da ventoinha','Chicote ou conector',CK_ECU],['fan','res','drop'],['Motor da ventoinha travando ou fraco','Relé com defeito'],['fan','drop']],
flex:['sistema flex / combustível alternativo',['Sensor com defeito','Chicote ou conector'],['res','refgnd'],['Percentual de etanol mal aprendido (abastecimento recente)','Sistema de partida a frio','Combustível adulterado'],['coldstart','fuelq','ft']],
pcomb:['pressão de combustível',['Sensor de pressão de combustível','Válvula/regulador de volume (injeção direta)','Chicote ou conector','Referência 5 V ou massa'],['refgnd','res','fpress'],['Bomba de combustível fraca','Filtro de combustível entupido','Regulador de pressão com defeito','Bomba de alta pressão (injeção direta) gasta','Vazamento na linha'],['fpress','fhold','faccel','fflow','freg','pumpcur']],
bomba:['bomba de combustível',['Relé ou fusível da bomba','Chicote ou conector da bomba','Bomba com defeito'],['pumpact','drop','pumpcur'],['Bomba fraca ou com coletor gasto','Filtro entupido'],['fpress','fflow','pumpcur']],
inj:['injetor',['Injetor com bobina aberta ou em curto','Chicote ou conector do injetor',CK_ECU],['res','injwave','noid'],['Injetor entupido ou gotejando','Pressão de combustível fora','Combustível sujo'],['injwave','misf','ft','fpress']],
nivel:['nível de combustível',['Boia do tanque com defeito','Chicote ou conector'],['res'],['Boia travando'],['res']],
tcomb:['sensor de temperatura do combustível',['Sensor com defeito','Chicote ou conector'],['res','refgnd'],['Sensor descalibrado'],['res']],
tac:['corpo de borboleta eletrônico',['Motor do corpo de borboleta','Chicote ou conector','Relé/alimentação do corpo de borboleta',CK_ECU],['tps','res','drop','refgnd'],['Corpo de borboleta sujo (carbonizado)','Mola ou engrenagem do corpo de borboleta gasta','Aprendizado da borboleta não feito'],['tbvis','tps','relearn']],
tps:['sensor de posição da borboleta / pedal',['Sensor de posição com pista gasta','Chicote ou conector','Referência 5 V ou massa'],['tps','refgnd'],['Sinais duplos do pedal/borboleta não batem','Corpo de borboleta sujo','Aprendizado não feito'],['tps','tbvis','relearn']],
idle:['marcha lenta',['Atuador de marcha lenta','Chicote ou conector',CK_ECU],['res','idle'],['Corpo de borboleta sujo','Entrada de ar falsa','Atuador de marcha lenta travando','Aprendizado da borboleta não feito','Carga elétrica ou do ar-condicionado'],['idle','tbvis','smoke','relearn']],
ckp:['sensor de rotação (CKP)',['Sensor de rotação com defeito','Chicote ou conector','Folga ou sujeira no sensor'],['rpmcrank','res','ckpcmp'],['Roda fônica danificada ou solta','Sensor com folga','Interferência elétrica'],['rpmcrank','ckpcmp','res']],
cmp:['sensor de fase (CMP)',['Sensor de fase com defeito','Chicote ou conector','Referência ou massa'],['ckpcmp','res','refgnd'],['Ponto da distribuição fora','Roda de fase danificada'],['ckpcmp','timingmk']],
sinc:['sincronismo rotação x fase',[],[],['Correia ou corrente esticada / pulou dente','Variador de fase travado','Roda fônica ou de fase deslocada','Sensor CKP ou CMP com defeito'],['ckpcmp','timingmk','vvt']],
vvt:['comando variável (VVT)',['Solenoide do VVT aberta ou em curto','Chicote ou conector',CK_ECU],['res','vvt','drop'],['Óleo sujo, baixo ou de viscosidade errada','Solenoide VVT travada ou tela filtrante entupida','Variador de fase gasto','Distribuição esticada ou fora de ponto'],['oilvis','vvt','ckpcmp','timingmk']],
knock:['sensor de detonação',['Sensor de detonação com defeito','Chicote ou conector'],['knock','res'],['Torque de fixação errado','Combustível ruim (detonação real)','Ruído mecânico do motor'],['knock','fuelq','stetho']],
ign:['ignição',['Bobina de ignição com defeito','Chicote ou conector da bobina',CK_ECU],['ign','res','drop','spark'],['Vela gasta ou com folga errada','Bobina fraca','Cabo de vela'],['ign','plugs','spark','misf']],
evap:['sistema de canister (EVAP)',['Válvula de purga ou de respiro com defeito','Chicote ou conector',CK_ECU],['res','drop'],['Tampa do tanque mal fechada ou com vedação ruim','Mangueira do canister furada ou solta','Válvula de purga travada aberta ou fechada','Canister saturado'],['smoke','res','leaksvis']],
egr:['válvula EGR',['Válvula EGR com defeito','Chicote ou conector','Referência ou massa do sensor da EGR'],['res','refgnd'],['EGR carbonizada (travada aberta ou fechada)','Dutos da EGR entupidos','Mangueira de vácuo da EGR'],['vacidle','smoke','res']],
sai:['ar secundário',['Bomba ou válvula do ar secundário','Relé ou fusível','Chicote ou conector'],['res','drop'],['Válvula de retenção com defeito','Mangueira solta ou furada'],['smoke','o2']],
pcv:['ventilação do cárter (PCV)',['Aquecedor da PCV','Chicote ou conector'],['res'],['Válvula PCV travada','Mangueira do respiro rachada ou solta','Blow-by alto (desgaste do motor)'],['blowby','smoke']],
turbo:['turbo',['Válvula de controle do turbo','Sensor de pressão do turbo','Chicote ou conector'],['boost','res','refgnd'],['Vazamento de pressão (mangueira, intercooler)','Wastegate travada','Turbo gasto','Válvula de alívio com defeito'],['boost','smoke','leaksvis']],
coletor:['coletor de admissão variável',['Atuador ou solenoide do coletor','Chicote ou conector'],['res','drop'],['Borboletas internas do coletor travadas ou quebradas','Vácuo do atuador'],['smoke','vacidle']],
poleo:['pressão do óleo',['Sensor/interruptor de pressão do óleo','Chicote ou conector'],['res','oilpress'],['Nível de óleo baixo','Bomba de óleo gasta ou pescador entupido','Desgaste de bronzinas','Óleo errado ou diluído'],['oilpress','oilvis']],
toleo:['temperatura do óleo',['Sensor de temperatura do óleo','Chicote ou conector'],['res','refgnd'],['Sensor descalibrado','Superaquecimento do motor'],['res','irtemp']],
nvoleo:['nível do óleo',['Sensor de nível do óleo','Chicote ou conector'],['res'],['Nível de óleo baixo','Consumo de óleo'],['oilvis','oilcons']],
carga:['sistema de carga',['Alternador / regulador de tensão','Cabo de carga ou massa','Fusível'],['bat','ripple','drop'],['Bateria fraca','Correia patinando','Alternador fraco'],['bat','ripple','belt','drop']],
partida:['partida',['Relé ou motor de partida','Chicote ou massa','Interruptor da embreagem / posição P-N'],['bat','drop'],['Bateria fraca','Motor de partida gasto'],['bat','drop']],
ecu:['módulo de controle (ECU)',['Alimentação ou massa da ECU','Referência 5 V em curto por algum sensor','Relé principal'],['drop','refgnd','bat'],['ECU com defeito interno','Programação/calibração corrompida','Tensão da bateria instável'],['bat','drop','can']],
rede:['rede de comunicação',['Fusível ou alimentação do módulo','Massa do módulo','Rede CAN (fio rompido, em curto, umidade)','Conector do módulo'],['can','drop','bat'],['Módulo com defeito','Bateria fraca na partida'],['can','bat']],
vss:['sensor de velocidade',['Sensor de velocidade com defeito','Chicote ou conector'],['res','refgnd'],['Sensor sujo ou com folga','Anel de leitura danificado'],['res']],
freio:['interruptor do freio',['Interruptor do pedal de freio','Chicote ou conector'],['res','drop'],['Interruptor desregulado'],['res']],
embr:['interruptor da embreagem',['Interruptor do pedal da embreagem','Chicote ou conector'],['res'],['Interruptor desregulado'],['res']],
ac:['ar-condicionado',['Sensor ou embreagem do compressor','Relé ou fusível','Chicote ou conector'],['res','drop'],['Carga de gás baixa ou alta','Compressor com defeito'],['res']],
cambio:['câmbio',['Solenoide ou sensor do câmbio','Chicote ou conector do câmbio','Módulo do câmbio'],['res','drop','can'],['Nível ou fluido do câmbio','Desgaste interno','Aprendizado do câmbio'],['codes']],
mec:['parte mecânica do motor',[],[],['Compressão baixa (válvula, anel, junta)','Injetor desequilibrado','Falha de ignição'],['relcomp','compdry','compwet','leak','misf']],
imob:['imobilizador',['Antena do imobilizador','Chicote ou conector'],['imob','drop'],['Chave não codificada','Transponder da chave'],['imob']],
emiss:['controle de emissões',CK_EL.concat(['Componente do sistema',CK_ECU]),['res','drop'],['Componente do sistema de emissões'],['codes','smoke']],
geral:['componente indicado',CK_EL.concat(['Componente com defeito',CK_ECU]),['res','drop','refgnd'],['Componente com defeito','Problema mecânico ligado ao componente'],['codes']],
};
const XFAB={'0':'combustível, ar e emissões','1':'medição de ar e combustível','2':'injeção','3':'ignição e falhas de combustão','4':'emissões auxiliares','5':'velocidade e marcha lenta','6':'ECU e saídas','7':'câmbio','8':'câmbio','9':'câmbio'};
const XFC={'0':'geral','1':'trim','2':'inj','3':'ign','4':'emiss','5':'idle','6':'ecu','7':'cambio','8':'cambio','9':'cambio'};
function montaX(c,t,en,comp,f,s,fab){const k=XC[comp]||XC.geral,el=f=='el',com=f=='com';
 let ca=com?XC.rede[1]:el?k[1]:k[3],tests=com?XC.rede[2]:el?k[2]:k[4];if(!ca.length){ca=k[3];tests=k[4]}
 if(el&&!ca.some(x=>/chicote/i.test(x)))ca=ca.concat(CK_EL);
 const m=com?'A ECU deixou de receber (ou recebe errado) as mensagens desse módulo pela rede. Comece pela alimentação, massa e conector do módulo.':
  el?`Problema elétrico no circuito (${k[0]}): sinal fora dos limites, circuito aberto ou em curto. Meça o chicote antes de trocar a peça.`:
  `Funcionamento fora do esperado (${k[0]}): a ECU comparou o que pediu com o que mediu e não bateu. Confira no scanner e faça os testes na ordem.`;
 return{c,t,s,m:(fab?'Código específico do fabricante: a descrição varia por montadora. Confirme no manual ou num scanner da marca. ':'')+m,ca:[...new Set(ca)],tests:[...new Set(['codes',...tests])],auto:fab?'fab':'base',en:en||''}}
function autoCode(c){if(!c||DB[c])return null;
 const x=XB&&XB[c];if(x)return montaX(c,x[0],x[1],x[2],x[3],x[4]);
 if(!/^[PBCU][0-3][0-9A-F]{3}$/.test(c))return null;
 const d=c[2],fab=ctype(c)!='Genérico (SAE)';
 if(c[0]=='P'){const comp=XFC[d]||'geral';return montaX(c,(fab?'Código do fabricante':'Código genérico')+' — '+(XFAB[d]||'motor'),'',comp,'func',2,fab)}
 if(c[0]=='U')return montaX(c,(fab?'Código do fabricante':'Código genérico')+' — rede de comunicação entre módulos','','rede','com',2,fab);
 return montaX(c,(fab?'Código do fabricante':'Código genérico')+' — '+SYS[c[0]].toLowerCase(),'','geral','func',2,fab)}


/* ================= FOTO DO SCANNER (leitura de texto no próprio celular) =================
   Usa Tesseract.js (grátis, roda no aparelho). Na primeira vez baixa o leitor (~10 MB) e depois fica guardado. */
const OCR_JS='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let ocrW=null,ocrP=null;
function ocrScript(){return window.Tesseract?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=OCR_JS;s.onload=ok;s.onerror=()=>no(new Error('sem internet para baixar o leitor'));document.head.appendChild(s)})}
function ocrWorker(log){if(ocrW)return Promise.resolve(ocrW);if(ocrP)return ocrP;
 ocrP=ocrScript().then(()=>Tesseract.createWorker(['por','eng'],1,{logger:m=>log&&log(m)})).then(w=>{ocrW=w;return w}).catch(e=>{ocrP=null;throw e});return ocrP}
/* prepara a foto: reduz, cinza, inverte tela escura e estica o contraste */
function ocrPrep(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const k=Math.min(1,2000/Math.max(im.width,im.height)),w=Math.round(im.width*k),h=Math.round(im.height*k),cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const x=cv.getContext('2d');x.drawImage(im,0,0,w,h);URL.revokeObjectURL(u);const d=x.getImageData(0,0,w,h),p=d.data;let sum=0;const g=new Uint8ClampedArray(w*h);
  for(let i=0,j=0;i<p.length;i+=4,j++){const v=(p[i]*299+p[i+1]*587+p[i+2]*114)/1000;g[j]=v;sum+=v}
  const inv=sum/(w*h)<110,hs=new Array(256).fill(0);for(let j=0;j<g.length;j++){if(inv)g[j]=255-g[j];hs[g[j]]++}
  let lo=0,hi=255,acc=0;const cut=g.length*.02;while(lo<255&&(acc+=hs[lo])<cut)lo++;acc=0;while(hi>0&&(acc+=hs[hi])<cut)hi--;const sc=hi>lo?255/(hi-lo):1;
  for(let i=0,j=0;i<p.length;i+=4,j++){const v=Math.max(0,Math.min(255,(g[j]-lo)*sc));p[i]=p[i+1]=p[i+2]=v}x.putImageData(d,0,0);ok(cv)};
 im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('não consegui abrir a imagem'))};im.src=u})}
/* acha códigos e descrições no texto lido */
const OCR_ST=/\b(ativo|ativa|ativos|pendente|permanente|hist[oó]rico|memorizad[oa]|intermitente|confirmad[oa]|armazenad[oa]|presente|passado|current|stored|pending|permanent|history|historic|confirmed|active|status|estado|mil\s*on|mil\s*off)\b[:\s]*/gi;
const OCR_RX=/(^|[^A-Za-z0-9])([PBCUpbcu])\s?([0-3OoIl|])\s?([0-9A-Fa-fOoIl|Ss])\s?([0-9A-Fa-fOoIl|Ss])\s?([0-9A-Fa-fOoIl|Ss])(?![A-Za-z0-9])/g;
const ocrFix=(ch,pos)=>{ch=ch.toUpperCase();if(ch=='O')return'0';if(ch=='I'||ch=='L'||ch=='|')return'1';if(ch=='S')return'5';return ch};
function lerScanner(txt){const L=String(txt||'').replace(/\r/g,'').split('\n').map(x=>x.replace(/[ \t]+/g,' ').trim());const out=[],seen=new Set();
 const limpa=s=>String(s||'').replace(OCR_ST,' ').replace(/^[\s\-–—:;.,|>»*•·]+|[\s\-–—:;,|<«*•·]+$/g,'').replace(/\s{2,}/g,' ').trim();
 L.forEach((ln,i)=>{const hits=[...ln.matchAll(OCR_RX)];hits.forEach((m,k)=>{const code=m[2].toUpperCase()+[m[3],m[4],m[5],m[6]].map((c,j)=>ocrFix(c,j+1)).join('');
   const raw=m[3]+m[4]+m[5]+m[6],dig=(raw.match(/[0-9]/g)||[]).length,conv=(raw.match(/[OoIl|Ss]/g)||[]).length;
   if(!(dig>=2||(dig>=1&&!conv)))return;
   if(!/^[PBCU][0-3][0-9A-F]{3}$/.test(code)||seen.has(code))return;seen.add(code);
   const ini=m.index+m[0].length,fim=k+1<hits.length?hits[k+1].index:ln.length;let desc=limpa(ln.slice(ini,fim));
   if(desc.replace(/[^A-Za-zÀ-ú]/g,'').length<6){const nx=[];for(let j=i+1;j<L.length&&j<=i+2;j++){if(!L[j]||OCR_RX.test(L[j])){OCR_RX.lastIndex=0;break}OCR_RX.lastIndex=0;nx.push(L[j])}desc=limpa((desc+' '+nx.join(' ')).trim())}
   out.push({code,desc:desc.replace(/[^A-Za-zÀ-ú0-9()]+$/,'').slice(0,160)})})});
 return out}
/* as duas descrições falam da mesma coisa? */
const OCR_SW=new Set('de do da dos das o a os as e em no na nos nas com para por um uma ou the of and to in on with for at circuito circuit sistema system sinal signal'.split(' '));
function ocrToks(s){return new Set(norm(String(s||'')).replace(/[^a-z0-9 ]/g,' ').split(' ').filter(w=>w.length>2&&!OCR_SW.has(w)))}
function parecido(a,b){const A=ocrToks(a),B=ocrToks(b);if(!A.size||!B.size)return false;let n=0;A.forEach(w=>{if(B.has(w))n++});return n/Math.min(A.size,B.size)>=.5}

/* ================= SINTOMAS ================= */
const SG=[['Partida',['gira-nao-pega','partida-frio','partida-quente','nao-gira']],['Funcionamento',['marcha-lenta','morre','falha-aceleracao','perda-potencia','vibracao','detonacao','consumo']],['Temperatura e óleo',['superaquecimento','agua-oleo','consumo-oleo','pressao-oleo','vazamento-oleo']],['Ruído e fumaça',['ruido-motor','fumaca-preta','fumaca-branca']],['Elétrica',['bateria','luz-injecao']]];
const SY=[
['gira-nao-pega','Gira mas não pega',['nao pega','nao liga','nao funciona','nao da partida','gira mas','nao pegou'],['codes','rpmcrank','imob','pumpact','fpress','noid','spark','ckpcmp','timingmk','relcomp','compdry','ect','fuelq'],['Sensor de rotação com defeito','Imobilizador bloqueando','Bomba de combustível ou relé','Sem pulso nos injetores','Sem faísca','Correia dentada rompida ou pulada','Sensor de temperatura lendo errado','Combustível adulterado']],
['partida-frio','Partida difícil a frio (flex)',['frio','manha','etanol','alcool','tanquinho','partida dificil','demora pra pegar','demora para pegar','demora pegar'],['codes','coldstart','ect','fhold','bat','plugs','spark','fuelq'],['Sistema de partida a frio','Sensor de temperatura lendo errado','Retenção de pressão baixa','Bateria no fim da vida','Velas e cabos gastos','Adaptação de etanol errada']],
['partida-quente','Partida difícil a quente',['quente','depois de rodar','motor quente'],['codes','fhold','freg','ect','rpmcrank','ckpcmp'],['Retenção de pressão baixa','Injetor pingando','Sensor de temperatura lendo errado','Sensor de rotação com defeito']],
['nao-gira','Motor de partida não gira',['nao gira','clique','motor de arranque','arranque','tec tec','nao da sinal'],['bat','drop','turnhand'],['Bateria descarregada','Terminal oxidado','Motor de partida com defeito','Relé ou comutador de ignição','Inibidor de partida','Motor travado']],
['marcha-lenta','Marcha lenta irregular',['marcha lenta','oscila','oscilando','tremendo','irregular','lenta','sobe e desce'],['codes','misf','ft','tbvis','idle','relearn','smoke','vacidle','plugs','ign','relcomp','mounts'],['Corpo de borboleta sujo','Entrada falsa de ar','Velas e cabos gastos','Atuador de marcha lenta','Compressão desigual','Coxim quebrado']],
['morre','Motor morre em marcha lenta',['morre','apaga','desliga sozinho','cai a rotacao','morrendo'],['codes','tbvis','idle','relearn','ft','smoke','fhold','ckpcmp'],['Corpo de borboleta sujo','Entrada falsa de ar','Sensor de rotação com defeito','Retenção de pressão baixa','Atuador de marcha lenta']],
['falha-aceleracao','Falha ao acelerar',['falha','falhando','engasga','engasgo','tranco','buraco','pipoca','acelerar'],['codes','misf','plugs','ign','faccel','fpress','tps','maf','o2','fuelq','injwave'],['Bobina de ignição','Velas e cabos gastos','Bomba de combustível fraca','Filtro de combustível entupido','Pista do TPS gasta','MAF sujo','Injetor entupido','Combustível adulterado']],
['perda-potencia','Perda de potência',['fraco','sem forca','potencia','nao desenvolve','pesado','nao sobe giro','nao passa'],['codes','ft','faccel','fflow','airfilter','maf','tps','vvt','timingmk','ckpcmp','vac2500','exhvis','relcomp','compdry'],['Filtro de ar obstruído','Bomba de combustível fraca','Catalisador entupido','Ponto da distribuição fora','Compressão baixa','Comando variável travado']],
['consumo','Consumo alto de combustível',['consumo','gastando','gasta muito','beberrao','media baixa'],['codes','ft','ect','o2','fhold','freg','plugs','fuelq'],['Sensor de temperatura lendo frio','Termostato travado aberto','Sonda lambda lenta','Injetor pingando','Pressão de combustível alta']],
['detonacao','Batida de pino',['batida de pino','detonacao','pino','grilando'],['codes','fuelq','ect','ft','plugs','knock','compdry'],['Combustível adulterado','Entrada falsa de ar','Superaquecimento','Carvão na câmara de combustão','Sensor de detonação solto','Velas de grau térmico errado']],
['superaquecimento','Superaquecendo',['esquenta','esquentando','superaquec','ferve','fervendo','temperatura alta','ventoinha','aquecendo'],['coolvis','leaksvis','fan','ect','irtemp','coolpress','co2','oilvis'],['Nível baixo ou vazamento','Ventoinha não liga','Termostato travado fechado','Bomba d’água','Radiador obstruído','Junta do cabeçote queimada']],
['agua-oleo','Perde água / água no óleo',['agua no oleo','oleo na agua','maionese','perde agua','some agua','junta','cabecote','baixa agua'],['coolvis','oilvis','leaksvis','coolpress','co2','plugs','leak','compdry','exhvis'],['Junta do cabeçote queimada','Cabeçote trincado ou empenado','Trocador de calor do óleo','Bomba d’água']],
['consumo-oleo','Consumo de óleo / fumaça azul',['consumo de oleo','queima oleo','queimando oleo','fumaca azul','baixa oleo','gasta oleo'],['oilcons','leaksvis','blowby','plugs','compdry','compwet','leak'],['Retentores de válvula','Anéis gastos','PCV / respiro do cárter','Vazamento externo de óleo']],
['pressao-oleo','Luz de óleo acende',['luz do oleo','luz de oleo','pressao de oleo','oleo acende','sem pressao'],['oilvis','oilpress','refgnd','stetho'],['Nível de óleo baixo','Óleo de viscosidade errada','Interruptor de óleo com defeito','Bomba de óleo gasta','Pescador entupido','Bronzinas gastas']],
['ruido-motor','Ruído ou batida no motor',['barulho','ruido','batida','estalo','tucho','biela','chiado','assobio','grilo','bate'],['oilvis','stetho','belt','oilpress','timingmk','mounts','relcomp','compdry'],['Tucho hidráulico','Corrente ou tensor da distribuição','Bronzinas gastas','Rolamento de acessório','Correia patinando','Vazamento no escapamento']],
['vibracao','Vibração',['vibra','vibracao','treme','trepida'],['misf','mounts','relcomp','plugs','ign','compdry'],['Falha de combustão','Coxim quebrado','Compressão desigual','Polia do virabrequim danificada']],
['fumaca-preta','Fumaça preta',['fumaca preta','preta','cheiro de combustivel','cheiro de gasolina','afogado'],['ft','fpress','fhold','freg','airfilter','ect','o2'],['Pressão de combustível alta','Injetor pingando','Filtro de ar obstruído','Sensor de temperatura lendo frio','Sonda lambda com defeito']],
['fumaca-branca','Fumaça branca densa',['fumaca branca','branca','vapor'],['coolvis','co2','coolpress','leak','compdry'],['Junta do cabeçote queimada','Cabeçote trincado ou empenado']],
['vazamento-oleo','Vazamento de óleo',['vazamento','vazando','vaza oleo','pingando','pinga'],['leaksvis','blowby','oilvis'],['Junta da tampa de válvulas','Retentor do virabrequim ou comando','Junta do cárter','PCV / respiro do cárter']],
['bateria','Bateria descarregando',['bateria','descarrega','arriando','arria','sem carga','alternador'],['bat','ripple','draw','drop'],['Bateria no fim da vida','Alternador não carregando','Consumo com o carro parado','Terminal oxidado']],
['luz-injecao','Luz de injeção acesa',['luz de injecao','luz acesa','injecao acesa','check','luz do motor','luz da injecao'],['codes','ft','misf'],[]]
];
const SYM={};SY.forEach(s=>SYM[s[0]]={id:s[0],t:s[1],k:s[2],tests:s[3],ca:s[4]});
function matchSym(text){
  const n=norm(text).trim();if(n.length<3)return [];
  const words=n.split(/\s+/).filter(w=>w.length>3);
  return SY.map(s=>{let sc=0;const tt=norm(s[1]);
    if(tt.includes(n))sc+=5;
    s[2].forEach(k=>{if(n.includes(k))sc+=4+k.length/10;});
    words.forEach(w=>{if(tt.includes(w))sc+=1;s[2].forEach(k=>{if(k.includes(w))sc+=.5;});});
    return [sc,s[0]];}).filter(x=>x[0]>=1).sort((a,b)=>b[0]-a[0]).slice(0,4).map(x=>SYM[x[1]]);
}
const SISTEMAS=['Admissão e vácuo','Combustível','Ignição','Sensores e chicote','Mecânica do motor','Distribuição','Arrefecimento','Lubrificação','Elétrica e carga','Escapamento e emissões','Outro'];


const VALS=[
['Bateria e carga',[['Bateria em repouso — 100%','Parado > 1 h','12,6–12,7 V'],['Bateria em repouso — 50%','Parado > 1 h','≈ 12,2 V'],['Bateria descarregada','Parado > 1 h','≤ 11,9 V'],['Tensão na partida','Medida na bateria','≥ 9,6 V'],['Tensão de carga','Motor ligado, sem carga','13,8–14,7 V'],['Alternador inteligente','Controlado pela ECU','12,5–15,0 V'],['Corrente de fuga','Módulos dormindo','< 50 mA'],['Queda de tensão — positivo da partida','Na partida','≤ 0,5 V'],['Queda de tensão — massa','Na partida','≤ 0,3 V'],['Referência de sensores','Chave ligada','4,9–5,1 V'],['Massa de sensor x negativo da bateria','Motor ligado','≤ 0,1 V']]],
['Sensores',[['MAP','Desligado, nível do mar','≈ 100 kPa / ≈ 4,5 V'],['MAP','Marcha lenta, quente','25–40 kPa / 1,0–1,5 V'],['TPS','Borboleta fechada','0,3–0,9 V'],['TPS','Aberta total','4,0–4,8 V'],['MAF','Marcha lenta, quente','≈ 1,5–2,5 g/s por litro'],['Sonda lambda pré-cat','2.500 rpm, quente','oscila 0,1–0,9 V'],['Sonda pós-cat','Catalisador bom','estável 0,45–0,7 V'],['Sensor de temperatura (NTC)','20 °C','≈ 2–3 kΩ'],['Sensor de temperatura (NTC)','90 °C','≈ 200–300 Ω'],['CKP indutivo','Resistência','≈ 200–1.500 Ω'],['CKP / CMP Hall','Sinal','quadrado 0–5 V ou 0–12 V'],['Rede CAN','Pinos 6–14, bateria desligada','≈ 60 Ω']]],
['Ignição e injeção',[['Injetor alta impedância','Resistência','12–16 Ω'],['Injetor baixa impedância','Resistência','2–5 Ω'],['Bobina — primário','Resistência','0,4–2 Ω'],['Bobina — secundário','Resistência','5–15 kΩ'],['Tempo de queima da faísca','Marcha lenta','≈ 1–2 ms'],['Aquecedor da sonda lambda','Resistência','2–15 Ω'],['Solenoide VVT','Resistência','6–12 Ω'],['Válvula de purga do canister','Resistência','20–40 Ω'],['Corrente da bomba de combustível','Motor ligado','≈ 4–8 A']]],
['Combustível',[['Pressão — com regulador no retorno','Marcha lenta','2,5–3,0 bar'],['Pressão — sem retorno','Marcha lenta','3,5–4,0 bar'],['Pressão — injeção direta (alta)','Marcha lenta / carga','50–200 bar (até 350)'],['Regulador com vácuo','Tirar a mangueira','sobe ≈ 0,5 bar'],['Retenção de pressão','5–10 min desligado','queda lenta'],['Correção total (STFT + LTFT)','Motor quente','±10%']]],
['Mecânica do motor',[['Compressão','Quente, borboleta aberta','8,5–14 bar (120–200 psi)'],['Diferença de compressão entre cilindros','Máximo','≤ 10%'],['Vazamento de cilindro','PMS de compressão','≤ 10–15%'],['Vácuo do coletor','Marcha lenta, quente','17–21 inHg'],['Pressão de óleo','Marcha lenta, quente','≥ 1 bar'],['Pressão de óleo','3.000 rpm, quente','3–5 bar'],['Abertura do termostato','Início','≈ 82–92 °C'],['Temperatura de trabalho','Motor aquecido','85–105 °C'],['Pressão da tampa do radiador','Abertura','≈ 1,0–1,4 bar']]],
['Ar-condicionado (R134a / R1234yf)',[['Pressão de baixa','≈ 27 °C ambiente, 1.500 rpm','25–45 psi'],['Pressão de alta','≈ 27 °C ambiente, 1.500 rpm','150–250 psi'],['Saída central','Recirculação, máximo','4–8 °C']]]
];


/* ================= ESTADO E DADOS DO GESTOR =================
   Tudo fica no registro da equipe (wab_data), junto com clientes e O.S.:
   - o.dg            diagnóstico de cada O.S. (códigos, sintomas, testes, defeito)
   - db.dcasos       casos resolvidos (o "caminho rápido" dos próximos carros)
   - db.dcodes       descrições de códigos cadastradas pela oficina
   - db.dgcfg.eq     equipamentos que a oficina tem */
const dkey=s=>norm(s).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const esc=x=>e(x);
const UI={step:{},code:'',sym:'',tf:'todos',cq:'',casoQ:'',vq:''};
function dgOf(o){const d=o.dg=o.dg&&typeof o.dg=='object'?o.dg:{};['cod','sin','ext'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});if(!d.t||typeof d.t!='object'||Array.isArray(d.t))d.t={};return d}
const casos=()=>Array.isArray(db.dcasos)?db.dcasos:(db.dcasos=[]);
const codes=()=>Array.isArray(db.dcodes)?db.dcodes:(db.dcodes=[]);
const eqSet=()=>new Set(db.dgcfg&&Array.isArray(db.dgcfg.eq)?db.dgcfg.eq:EQ_DEFAULT);
const vOf=o=>{const v=vh(o.veh)||{};return{modelo:v.modelo||'',motor:v.motor||'',ano:v.ano||'',placa:v.placa||'',km:v.km||''}};
const res=(d,t)=>d.t[t]&&d.t[t].r||'';
const started=o=>{const d=o.dg;return !!(d&&((d.cod||[]).length||(d.sin||[]).length||Object.values(d.t||{}).some(x=>x&&x.r)))};
const hasEq=(t,av)=>t.eq.some(alt=>alt.split('+').every(x=>av.has(x)));
const eqLabel=(t,av)=>t.eq.map(alt=>`<span class="dg-eq${alt.split('+').every(x=>av.has(x))?'':' miss'}">${alt.split('+').map(x=>EQ[x]).join(' + ')}</span>`).join('');

/* descrições da oficina: do mesmo modelo > gerais > base */
function customFor(c,v){const mk=v&&v.modelo?dkey(v.modelo):'';let gen=null,mod=null,any=null;
 codes().forEach(x=>{if(x.code!==c)return;any=any||x;if(x.modelo){if(mk&&dkey(x.modelo)===mk)mod=x}else gen=x});return mod||gen||(v===undefined?any:null)}
function lookupV(c,v){const x=customFor(c,v),b=lookupBase(c);
 if(x)return{c,t:x.t||(b?b.t:''),s:x.s||(b?b.s:2),m:x.m||'',ca:(x.ca&&x.ca.length)?x.ca:(b?b.ca:[]),tests:(x.tests&&x.tests.length)?x.tests:(b?b.tests:['codes']),custom:x};return b}

/* casos parecidos, causas e testes */
function matchCases(o){const d=dgOf(o),v=vOf(o);if(!d.cod.length&&!d.sin.length)return[];const G=new Map();
 casos().forEach(c=>{if(c.os&&c.os===o.id||c.conf=='falhou')return;const sc=(c.cod||[]).filter(x=>d.cod.includes(x)),ss=(c.sin||[]).filter(x=>d.sin.includes(x));if(!sc.length&&!ss.length)return;
  let sco=sc.length*3+ss.length*2+(c.conf=='ok'?2:0);const cv=c.veh||{};if(cv.modelo&&v.modelo&&dkey(cv.modelo)===dkey(v.modelo))sco+=1;if(cv.motor&&v.motor&&dkey(cv.motor)===dkey(v.motor))sco+=1;
  const k=dkey(c.def);if(!k)return;const g=G.get(k)||{def:c.def,sis:c.sis,casos:[],score:0,codes:new Set(),syms:new Set(),testes:new Map(),sols:new Set()};
  g.casos.push(c);g.score+=sco;if(c.conf=='ok')g.ok=(g.ok||0)+1;sc.forEach(x=>g.codes.add(x));ss.forEach(x=>g.syms.add(x));if(c.tc)g.testes.set(c.tc,(g.testes.get(c.tc)||0)+1);if(c.sol)g.sols.add(c.sol);G.set(k,g)});
 return[...G.values()].sort((a,b)=>b.score-a.score||b.casos.length-a.casos.length)}
function causesFor(o,M){const d=dgOf(o),v=vOf(o),m=new Map();const add=(t,w,src)=>{const k=dkey(t);if(!k)return;const x=m.get(k)||{t,w:0,src:[],hist:0};x.w+=w;if(src&&!x.src.includes(src))x.src.push(src);m.set(k,x)};
 d.cod.forEach(c=>{const r=lookupV(c,v);if(r)r.ca.forEach((x,i)=>add(x,3-i*.3,c))});d.sin.forEach(s=>{const y=SYM[s];if(y)y.ca.forEach((x,i)=>add(x,2-i*.2,y.t))});
 M.forEach(g=>{const k=dkey(g.def);const x=m.get(k)||{t:g.def,w:0,src:[],hist:0};x.w+=4+g.casos.length*3;x.hist=g.casos.length;m.set(k,x)});return[...m.values()].sort((a,b)=>b.w-a.w)}
function suggestions(o,M){const d=dgOf(o),v=vOf(o),m=new Map();const add=(t,f)=>{if(!TESTS[t])return;if(!m.has(t))m.set(t,{from:[],hist:0,ord:m.size});const x=m.get(t);if(f&&!x.from.includes(f))x.from.push(f)};
 (M||[]).forEach(g=>g.testes.forEach((n,t)=>{add(t,null);if(m.get(t))m.get(t).hist+=n}));
 d.cod.forEach(c=>{const r=lookupV(c,v);(r?r.tests:['codes']).forEach(t=>add(t,c))});d.sin.forEach(s=>{const y=SYM[s];if(y)y.tests.forEach(t=>add(t,y.t))});
 d.ext.forEach(t=>add(t,'Adicionado por você'));Object.entries(d.t).forEach(([t,r])=>{if(r&&(r.r||r.v||r.o))add(t,null)});return m}

/* ================= MENSAGENS ================= */
function msg({title,intro,items,okLabel,focus,alt,altLabel,warn}){
 DG._alt=alt||null;DG._focus=focus||'';
 $('#modal').innerHTML=`<div class="ov"><div class="md dg-msg${warn?' warn':''}" role="dialog" aria-modal="true"><h2 style="margin-top:0">${esc(title)}</h2>${intro?`<p>${esc(intro)}</p>`:''}${items&&items.length?`<ul>${items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}<div class="bar" style="margin:12px 0 0"><span class="sp"></span>${alt?`<button type="button" onclick="DG.msgAlt()">${esc(altLabel||'Continuar mesmo assim')}</button>`:''}<button type="button" class="pr" onclick="DG.msgOk()">${esc(okLabel||'Entendi')}</button></div></div></div>`;
 setTimeout(()=>{const b=$('#modal .pr');if(b)b.focus()},20)}

/* ================= ABA "DIAGNÓSTICO" DA O.S. ================= */
const STEPS=[['sin','Sintomas e códigos'],['diag','Testes e causas'],['def','Defeito encontrado']];
const curStep=o=>{const d=dgOf(o);return UI.step[o.id]||(d.fim?'def':(d.cod.length||d.sin.length)?'diag':'sin')};
function DGtab(o){const d=dgOf(o),st=UI.step[o.id]=curStep(o),done={sin:!!(d.cod.length||d.sin.length),diag:Object.values(d.t).some(x=>x&&x.r),def:!!d.fim};
 const nav=`<div class="dg-steps" role="tablist" aria-label="Etapas do diagnóstico">${STEPS.map(([k,l],i)=>`<button type="button" role="tab" aria-selected="${st==k}" class="dg-stp${st==k?' on':done[k]?' ok':''}" onclick="DG.step('${k}')"><b>${done[k]&&st!=k?'✓':i+1}</b><span>${l}</span></button>`).join('')}</div>`;
 return nav+(st=='diag'?stepDiag(o):st=='def'?stepDef(o):stepSin(o))}
function codePrev(o){const p=parseCode(UI.code);
 if(p.empty)return`<span class="muted">Formato: letra + 4 números. Pode digitar só os números (0171) ou com letra O (PO171).</span>`;
 if(!p.ok)return p.raw.length<5?`<span class="muted">Continue digitando… (${esc(p.raw)})</span>`:`<span class="dg-err">“${esc(p.raw)}” não é um código válido. Exemplo: P0171</span>`;
 const r=lookupV(p.code,o?vOf(o):undefined);return`<b>${p.code}</b> <span>${r?esc(r.t):'Ainda sem descrição. Ao adicionar, você poderá cadastrar a descrição.'}</span> <span class="muted">· toque em Adicionar</span>`}
function symSug(o){const q=UI.sym;if(!q||norm(q).trim().length<3)return'';const d=dgOf(o);const m=matchSym(q).filter(s=>!d.sin.includes(s.id));
 if(!m.length)return`<p class="muted" style="margin:6px 0">Nenhum sintoma parecido. Tente outras palavras ou escolha na lista abaixo.</p>`;
 return m.map(s=>`<button type="button" class="dg-sug" onclick="DG.addSym('${s.id}')"><b>+ ${esc(s.t)}</b><small>Toque para adicionar · ${s.tests.length} testes</small></button>`).join('')}
function stepSin(o){const d=dgOf(o),v=vOf(o),L=lOf(o);
 const fromQ=o.problema?matchSym(o.problema).filter(s=>!d.sin.includes(s.id)).slice(0,3):[];
 const lc=lCods(L.cod).map(x=>parseCode(x)).filter(p=>p.ok&&!d.cod.includes(p.code)).map(p=>p.code);
 return`${o.problema?`<div class="fbar">${svgi('osres')}<span><b>Relato:</b> ${esc(o.problema)}</span></div>`:''}
 <div class="card"><div class="dg-h"><b>Códigos de falha</b><small class="muted">lidos no scanner</small></div>
  ${lc.length?`<div class="dg-sugrow">Códigos no laudo: ${lc.map(c=>`<button type="button" class="sm" onclick="DG.addCode('${c}')">+ ${c}</button>`).join('')}</div>`:''}
  <div class="dg-row"><input id="dgcode" class="dg-code" placeholder="P0171" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Código de falha" value="${esc(UI.code)}" oninput="DG.cin(this.value)" onkeydown="if(event.key=='Enter'){event.preventDefault();DG.addCode()}"><button type="button" class="pr" onclick="DG.addCode()">Adicionar</button></div>
  <div class="dg-prev" id="dgprev">${codePrev(o)}</div>
  ${fotoBtns()}
  ${d.cod.map(c=>codeCard(o,c)).join('')}
 </div>
 ${ffHTML(o)}
 <div class="card"><div class="dg-h"><b>Sintomas</b><small class="muted">o que o carro apresenta</small></div>
  ${fromQ.length?`<small class="muted">Encontrados no relato</small><div class="dg-sugs">${fromQ.map(s=>`<button type="button" class="dg-sug" onclick="DG.addSym('${s.id}')"><b>+ ${esc(s.t)}</b><small>Toque para adicionar</small></button>`).join('')}</div>`:''}
  <input id="dgsym" placeholder="Descreva: barulho no motor, esquentando…" autocomplete="off" aria-label="Descrever sintoma" value="${esc(UI.sym)}" oninput="DG.sin(this.value)" onkeydown="if(event.key=='Enter'){event.preventDefault();const b=document.querySelector('#dgsug .dg-sug');if(b)b.click()}">
  <div id="dgsug" class="dg-sugs">${symSug(o)}</div>
  ${SG.map(g=>`<small class="muted dg-gl">${g[0]}</small><div class="dg-chips">${g[1].map(id=>`<button type="button" class="dg-chip" aria-pressed="${d.sin.includes(id)}" onclick="DG.tsym('${id}')">${esc(SYM[id].t)}</button>`).join('')}</div>`).join('')}
 </div>
 <div class="dg-next"><span class="muted" id="dgab">${abMsg(o)}</span><button type="button" class="pr" onclick="DG.step('diag')">Ver diagnóstico →</button></div>`}
function codeCard(o,c){const v=vOf(o),r=lookupV(c,v);const tag=r&&r.custom?`<span class="mb" style="--c:${KB}">${r.custom.modelo?'Oficina · '+esc(r.custom.modelo):'Descrição da oficina'}</span>`:r&&r.auto?mb(r.auto=='fab'?'Sugestão automática':'Base ampliada',r.auto=='fab'?KA:KB):'';const en=r&&!r.custom&&r.en?`<small class="muted" style="display:block">SAE: ${esc(r.en)}</small>`:'';
 return`<div class="dg-cc"><span class="dg-ro">${esc(c)}</span><span class="dg-cct"><b>${esc(r&&r.t?r.t:'Sem descrição cadastrada')}</b>${en}${r?mb('Gravidade '+(SEV[r.s]||'Média'),r.s==3?KR:r.s==2?KA:KG):''} ${tag}</span>
  <span class="dg-cca">${r?`<button type="button" class="sm" onclick="DG.editCode('${c}')">Editar</button>`:`<button type="button" class="sm pr" onclick="DG.editCode('${c}')">+ Descrição</button>`}<button type="button" class="sm" aria-label="Remover ${esc(c)}" onclick="DG.rmCode('${c}')">×</button></span></div>`}
function abMsg(o){const d=dgOf(o),p=parseCode(UI.code),pc=p.ok&&!d.cod.includes(p.code),ps=UI.sym&&matchSym(UI.sym).some(x=>!d.sin.includes(x.id));
 const a=[];if(d.cod.length)a.push(plural(d.cod.length,'código','códigos'));if(d.sin.length)a.push(plural(d.sin.length,'sintoma','sintomas'));
 if(pc||ps)a.push((pc&&ps?'código e sintoma digitados':pc?'código digitado':'sintoma digitado')+' entram ao avançar');return a.length?a.join(' · '):'Digite um código ou escolha um sintoma'}
function stepDiag(o){const d=dgOf(o),av=eqSet(),M=matchCases(o),sug=suggestions(o,M),C=causesFor(o,M);
 if(!d.cod.length&&!d.sin.length)return empty('oslaudo','Informe os códigos de falha ou os sintomas para montar o diagnóstico.',`<button class="pr" onclick="DG.step('sin')">Informar sintomas e códigos</button>`);
 const ids=[...sug.keys()].sort((a,b)=>{const A=sug.get(a),B=sug.get(b);return(B.hist-A.hist)||(A.ord-B.ord)});
 const can=ids.filter(t=>hasEq(TESTS[t],av)||res(d,t)),cannot=ids.filter(t=>!can.includes(t)),reg=can.filter(t=>res(d,t)).length,fal=ids.filter(t=>res(d,t)=='falha');
 const shown=can.filter(t=>UI.tf=='pend'?!res(d,t):UI.tf=='falha'?res(d,t)=='falha':true),mx=C.length?C[0].w:1;
 return`<div class="dg-sum">${d.cod.map(c=>`<span class="dg-ro sm">${esc(c)}</span>`).join('')}${d.sin.map(s=>SYM[s]?`<span class="dg-tg">${esc(SYM[s].t)}</span>`:'').join('')}<button type="button" class="sm" onclick="DG.step('sin')">alterar</button></div>
 ${M.length?`<div class="card dg-fast"><div class="dg-h"><b>Caminho rápido · casos já resolvidos na oficina</b></div><p class="muted" style="margin:0 0 8px">Carros que chegaram com os mesmos códigos ou sintomas e o defeito que foi encontrado.</p>
  ${M.slice(0,4).map(g=>{const last=g.casos[g.casos.length-1],ts=[...g.testes.entries()].sort((a,b)=>b[1]-a[1]).map(([t])=>TESTS[t]?TESTS[t].n:t);
   return`<div class="dg-case"><div class="dg-ct"><b>${esc(g.def)}</b><span class="dg-n">${plural(g.casos.length,'caso','casos')}${g.ok?' · '+g.ok+' confirmado'+(g.ok>1?'s':''):''}</span></div>
   <small>Em comum: ${[...g.codes].map(esc).join(', ')}${g.codes.size&&g.syms.size?' · ':''}${[...g.syms].map(s=>SYM[s]?esc(SYM[s].t):'').join(', ')}</small>
   ${ts.length?`<small><b>Confirmado com:</b> ${ts.map(esc).join(', ')}</small>`:''}${g.sols.size?`<small><b>Solução:</b> ${[...g.sols].slice(0,2).map(esc).join(' / ')}</small>`:''}
   <small>Último: ${esc([last.veh&&last.veh.modelo,last.veh&&last.veh.motor].filter(Boolean).join(' '))} · ${D(last.data)}</small>
   <div><button type="button" class="sm pr" onclick="DG.pick(${esc(JSON.stringify(g.def))},${esc(JSON.stringify(g.sis||''))})">É este o defeito</button></div></div>`}).join('')}</div>`:''}
 <div class="card"><div class="dg-h"><b>Causas prováveis</b><small class="muted">da mais para a menos provável</small></div>
  <ol class="dg-causes">${C.slice(0,8).map(c=>`<li class="${c.hist?'hist':''}"><span><b>${esc(c.t)}</b><small>${c.hist?`Encontrado em ${plural(c.hist,'caso','casos')} da oficina${c.src.length?' · ':''}`:''}${c.src.map(esc).join(' · ')}</small><i style="--w:${Math.round(c.w/mx*100)}%"></i></span><button type="button" class="sm" onclick="DG.pick(${esc(JSON.stringify(c.t))},'')">Este é o defeito</button></li>`).join('')}</ol></div>
 <div class="card"><div class="dg-h"><b>Testes</b><small class="muted">${reg} de ${can.length} feitos${fal.length?` · <span style="color:${KR}">${fal.length} fora do esperado</span>`:''}</small></div>
  <div class="dg-bar"><i style="width:${can.length?reg/can.length*100:0}%"></i></div>
  ${seg([['todos','Todos'],['pend','Pendentes'],['falha','Fora do esperado']],UI.tf,'_dgtf').replace(/setF\('_dgtf',/g,'DG.tfil(')}
  ${shown.map(t=>tcard(o,t,sug.get(t),av)).join('')||'<p class="muted">Nenhum teste neste filtro.</p>'}
  ${cannot.length?`<details class="dg-miss"><summary>${plural(cannot.length,'teste pede','testes pedem')} equipamento que a oficina não marcou</summary>${cannot.map(t=>tcard(o,t,sug.get(t),av)).join('')}</details>`:''}
  <label>Fazer outro teste</label>${tBusca('add','Digite: compressão, bobina, fumaça, injetor…')}
 </div>
 <div class="dg-next"><span class="muted">${plural(Object.values(d.t).filter(x=>x&&x.r).length,'teste registrado','testes registrados')}</span><button type="button" class="pr" onclick="DG.step('def')">Achei o defeito →</button></div>`}
function tcard(o,tid,info,av){const t=TESTS[tid],d=dgOf(o),r=d.t[tid]||{},man=d.ext.includes(tid),from=info?info.from:[];
 return`<div class="dg-tc${r.r?' r-'+r.r:''}"><div class="dg-th"><b>${esc(t.n)}</b><span class="dg-eqs">${info&&info.hist?`<span class="dg-hb">Confirmou defeito em ${plural(info.hist,'caso','casos')}</span>`:''}${eqLabel(t,av)}</span></div>
  ${from.length?`<small class="muted">Indicado por: ${from.map(esc).join(' · ')}</small>`:''}
  <details><summary>Como fazer e valor esperado</summary><p>${esc(t.como)}</p><p><b>Esperado:</b> ${esc(t.esp)}</p></details>
  <div class="dg-seg" role="group" aria-label="Resultado">${[['ok','OK'],['falha','Fora'],['inc','Inconclusivo']].map(([k,l])=>`<button type="button" data-r="${k}" aria-pressed="${r.r==k}" onclick="DG.res('${tid}','${k}')">${l}</button>`).join('')}</div>
  <div class="dg-tin"><input placeholder="Valor medido" value="${esc(r.v)}" onchange="DG.tval('${tid}','v',this.value)" aria-label="Valor medido"><input placeholder="Observação" value="${esc(r.o)}" onchange="DG.tval('${tid}','o',this.value)" aria-label="Observação"></div>
  ${tfotos(o,tid)}
  ${man?`<button type="button" class="sm" onclick="DG.rmTest('${tid}')">Remover teste</button>`:''}</div>`}
/* busca de teste: digita e aparece */
const RLB={ok:'OK',falha:'Fora',inc:'Inconclusivo'};
function tbAcha(q,excl){const W=norm(q).replace(/[^a-z0-9 ]/g,' ').split(' ').filter(Boolean);if(!W.length)return[];
 return Object.values(TESTS).filter(t=>!(excl&&excl.has(t.id))).map(t=>{const nm=norm(t.n),tx=nm+' '+norm(t.eq.map(a=>a.split('+').map(x=>EQ[x]||x).join(' ')).join(' '))+' '+norm(t.como||'');
  if(!W.every(w=>tx.includes(w)))return null;return[t,W.reduce((a,w)=>a+(nm.includes(w)?(nm.startsWith(w)?3:2):0),0)]}).filter(Boolean).sort((a,b)=>b[1]-a[1]||a[0].n.localeCompare(b[0].n)).slice(0,8).map(x=>x[0])}
function tbRes(k){const el=document.getElementById('dgtbr-'+k);if(!el)return;const o=cur(),d=o?dgOf(o):{t:{}},q=UI['tb'+k]||'';
 const excl=k=='add'&&o?new Set([...suggestions(o,matchCases(o)).keys(),...(d.ext||[])]):null,L=tbAcha(q,excl);
 el.innerHTML=!q.trim()?'':L.length?L.map(t=>{const r=d.t&&d.t[t.id];return`<button type="button" class="dg-tbi" onclick="DG.tbPick('${k}','${t.id}')"><b>${esc(t.n)}</b>${r&&r.r?mb(RLB[r.r],r.r=='falha'?KR:r.r=='ok'?KG:KA):''}<small>${esc(t.esp||'')}</small></button>`}).join(''):`<p class="muted" style="margin:6px 0">Nenhum teste com “${esc(q)}”.${k=='tc'?' Escreva como foi no campo abaixo.':''}</p>`}
function tBusca(k,ph){return`<input id="dgtb-${k}" type="search" autocomplete="off" placeholder="${ph}" value="${esc(UI['tb'+k]||'')}" oninput="DG.tbF('${k}',this.value)"><div id="dgtbr-${k}" class="dg-tbr"></div>`}
function stepDef(o){const d=dgOf(o),C=causesFor(o,matchCases(o)).slice(0,6),done=Object.entries(d.t).filter(([,r])=>r&&r.r).sort((a,b)=>(a[1].r=='falha'?0:1)-(b[1].r=='falha'?0:1));
 const prev=[...new Set(casos().map(c=>c.def).filter(Boolean))];
 return`${d.fim?`<div class="card dg-ok"><b>✓ Salvo no histórico de casos${d.laudo?' e no laudo':''}</b><p class="muted" style="margin:4px 0 0">Quando outro carro chegar com ${esc(d.cod.join(', ')||'os mesmos sintomas')}, este defeito aparece no Caminho rápido.</p></div>`:''}
 ${confHTML(o)}${proxHTML(o)}
 <div class="card"><div class="dg-h"><b>Qual foi o defeito?</b></div>
  ${C.length?`<small class="muted">Toque para preencher</small><div class="dg-chips" style="margin-bottom:10px">${C.map(c=>`<button type="button" class="dg-chip" aria-pressed="${dkey(d.def)==dkey(c.t)}" onclick="DG.pick(${esc(JSON.stringify(c.t))},'',1)">${esc(c.t)}</button>`).join('')}</div>`:''}
  <label>Defeito encontrado<input id="dgdef" list="dgdl" value="${esc(d.def)}" placeholder="Ex.: Mangueira do respiro (PCV) rachada" onchange="DG.set('def',this.value)"></label><datalist id="dgdl">${prev.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
  <div class="g2"><label>Sistema<select id="dgsis" onchange="DG.set('sis',this.value)"><option value="">Escolha…</option>${SISTEMAS.map(s=>`<option ${d.sis==s?'selected':''}>${s}</option>`).join('')}</select></label>
</div>
  <div class="dg-tcx"><b class="dg-lb">Teste que confirmou</b>${d.tc&&TESTS[d.tc]?`<div class="dg-tcsel"><span><b>${esc(TESTS[d.tc].n)}</b>${d.t[d.tc]&&d.t[d.tc].r?' '+mb(RLB[d.t[d.tc].r],d.t[d.tc].r=='falha'?KR:d.t[d.tc].r=='ok'?KG:KA):''}</span><button type="button" class="sm" onclick="DG.set('tc','');render()">Trocar</button></div>`
   :`${done.length?`<small class="muted">Testes que você fez</small><div class="dg-chips" style="margin:4px 0 8px">${done.map(([t,r])=>TESTS[t]?`<button type="button" class="dg-chip" onclick="DG.tbPick('tc','${t}')">${esc(TESTS[t].n)} · ${RLB[r.r]}</button>`:'').join('')}</div>`:''}${tBusca('tc','Ou digite para procurar o teste…')}`}
  <label>Como foi o teste<textarea id="dgtcd" onchange="DG.set('tcd',this.value)" placeholder="Ex.: Correção em +24% na lenta; com o teste de fumaça apareceu vazamento na mangueira do servo-freio">${esc(d.tcd||'')}</textarea></label></div>
  <label>Solução / peças trocadas<textarea id="dgsol" onchange="DG.set('sol',this.value)" placeholder="Ex.: Troca da mangueira do respiro e reaprendizado da marcha lenta">${esc(d.sol)}</textarea></label>
  <label>Observações para o próximo mecânico<textarea onchange="DG.set('obs',this.value)" placeholder="Ex.: A mangueira rachada fica embaixo do coletor, só aparece com teste de fumaça">${esc(d.obs)}</textarea></label>
 </div>
 <div class="dg-next"><span class="muted">Salva no histórico da oficina e preenche o laudo da O.S.</span><button type="button" class="pr" onclick="DG.saveCase()">${d.fim?'Atualizar caso e laudo':'Salvar caso e preencher laudo'}</button></div>`}

/* status no botão da aba */
function dgInfo(o){const d=o.dg;if(!d||!started(o))return['Não iniciado','var(--mut)'];if(d.fim)return d.conf&&d.conf.r=='ok'?['Reparo confirmado',KG]:['Defeito achado',KG];
 const n=Object.values(d.t||{}).filter(x=>x&&x.r).length,f=Object.values(d.t||{}).filter(x=>x&&x.r=='falha').length;return[n?plural(n,'teste','testes'):'Em andamento',f?KR:KA]}

/* ================= AÇÕES ================= */
const cur=()=>(S.v=='order'||(S.v=='diag'&&S.id))?od(S.id):null;
const commit=o=>{if(o&&o.dg&&started(o)){cobra(o);if(!o.dg.tm&&!o.dg.fim)o.dg.tm={ms:0,on:Date.now()}}save();if(typeof osTabsRefresh=='function')osTabsRefresh()};
function commitDrafts(o){const d=dgOf(o);let n=0;const p=parseCode(UI.code);
 if(p.ok){if(!d.cod.includes(p.code)){d.cod.push(p.code);n++}UI.code=''}
 const s=UI.sym?matchSym(UI.sym).filter(x=>!d.sin.includes(x.id))[0]:null;if(s){d.sin.push(s.id);n++;UI.sym=''}if(n)commit(o);return n}

/* ================= MELHORIAS 2.7.0 ================= */
/* 2) cobrança do diagnóstico */
const taxa=()=>db.dgcfg&&db.dgcfg.taxa||null;
function cobra(o){const tx=taxa(),d=dgOf(o);if(d.fee||!tx||!(+tx.v>0)||['Concluída','Entregue'].includes(o.status))return;o.items=o.items||[];
 if(o.items.some(i=>i.dgfee||/diagn/.test(norm(i.d)))){d.fee='ja';return}
 o.items.push({iid:uid(),t:'Serviço',d:tx.d||'Diagnóstico',q:1,v:+tx.v,dgfee:1});d.fee=1;setTimeout(()=>toast('Cobrança do diagnóstico lançada na O.S. '+o.num+': '+R(+tx.v)),400)}
/* 9) cronômetro */
const tmMs=d=>d&&d.tm?(+d.tm.ms||0)+(d.tm.on?Date.now()-d.tm.on:0):0;
const tmTxt=ms=>{const m=Math.round(ms/60000);return m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min'};
function tmPara(d){if(d.tm&&d.tm.on){d.tm.ms=(+d.tm.ms||0)+Date.now()-d.tm.on;d.tm.on=null}}
setInterval(()=>{const el=document.getElementById('dgtm');if(!el)return;const o=cur();if(o&&o.dg)el.textContent=tmTxt(tmMs(o.dg))},20000);
/* 5) retorno: o mesmo carro voltou com o mesmo problema */
const vidCaso=c=>c.vid||(c.os&&od(c.os)&&od(c.os).veh)||'';
function retornos(o){const d=dgOf(o);if(!o.veh||(!d.cod.length&&!d.sin.length))return[];const lim=new Date(Date.now()-30*864e5).toISOString().slice(0,10),ign=d.retIgn||[];
 return casos().filter(c=>c.os!==o.id&&vidCaso(c)==o.veh&&String(c.data||'')>=lim&&c.conf!='falhou'&&!ign.includes(c.id)&&((c.cod||[]).some(x=>d.cod.includes(x))||(c.sin||[]).some(x=>d.sin.includes(x))))}
function retornoHTML(o){return retornos(o).map(c=>`<div class="card dg-ret"><b>⚠ Este carro voltou</b><p style="margin:4px 0">Em ${D(c.data)}${c.num?' (O.S. '+esc(c.num)+')':''} ele teve <b>${esc(c.def)}</b> com ${esc([...(c.cod||[]),...(c.sin||[]).map(s=>SYM[s]?SYM[s].t:s)].join(', '))}${c.sol?'. Solução: '+esc(c.sol):''}.</p><p class="muted" style="margin:0 0 8px">Se é o mesmo problema, o reparo não resolveu e esse caso deixa de ser sugerido no caminho rápido.</p>
 <div class="bar" style="margin:0"><button type="button" class="pr" onclick="DG.retorno('${esc(c.id)}',1)">Não resolveu</button><button type="button" onclick="DG.retorno('${esc(c.id)}',0)">É outro problema</button></div></div>`).join('')}
/* 6) histórico do carro */
function histHTML(o){if(!o.veh)return'';const L=db.orders.filter(x=>x.veh==o.veh&&x.id!=o.id).sort((a,b)=>String(b.aberta||'').localeCompare(String(a.aberta||''))||String(b.num).localeCompare(String(a.num)));if(!L.length)return'';
 return`<details class="card dg-hist"><summary><b>Histórico deste carro</b> <span class="muted">${plural(L.length,'O.S. anterior','O.S. anteriores')}</span></summary>${L.slice(0,8).map(x=>{const its=(x.items||[]).map(i=>i.d||i.t).filter(Boolean),dg=x.dg&&x.dg.def;
  return`<button type="button" class="dg-hi" onclick="go('order','${x.id}')"><span><b>O.S. ${esc(x.num)}</b> · ${D(x.aberta)} · ${esc(x.status)}</span><b>${R(oTot(x))}</b>${dg?`<small>Diagnóstico: ${esc(dg)}${x.dg.conf=='ok'?' ✓':''}</small>`:''}${its.length?`<small>${esc(its.slice(0,4).join(', '))}${its.length>4?'…':''}</small>`:''}</button>`}).join('')}${L.length>8?`<small class="muted">E mais ${L.length-8} na lista de O.S.</small>`:''}</details>`}
/* 7) fotos dos testes (vão para as fotos da O.S. e para o PDF) */
function tfotos(o,tid){const L=(o.fotos||[]).map((f,i)=>[f,i]).filter(([f])=>f.tid==tid);
 return`<div class="dg-tf">${L.map(([f,i])=>`<figure><img ${fimg(f.src)} alt="Foto do teste" onclick="verFoto(this.src)"><button type="button" aria-label="Remover foto" onclick="DG.tfotoRm(${i})">×</button></figure>`).join('')}<label class="dg-tfb">${svgi('cam')}<span>${L.length?'Mais foto':'Foto'}</span><input type="file" accept="image/*" capture="environment" hidden onchange="DG.tfoto('${tid}',this)"></label></div>`}
/* 8) dados do momento da falha (freeze frame) */
const FF=[['rpm','Rotação','rpm'],['temp','Temp. do motor','°C'],['carga','Carga','%'],['vel','Velocidade','km/h'],['map','MAP','kPa'],['stft','STFT','%'],['ltft','LTFT','%'],['tens','Bateria','V']];
const ffTxt=ff=>FF.filter(([k])=>ff&&ff[k]!=null&&String(ff[k]).trim()!=='').map(([k,l,u])=>`${l} ${ff[k]}${u?' '+u:''}`).join(' · ');
function ffHTML(o){const d=dgOf(o),ff=d.ff||{},t=ffTxt(ff);
 return`<details class="card dg-ff"${t?'':''}><summary><b>Dados do momento da falha</b> <span class="muted">${t?esc(t):'freeze frame (opcional)'}</span></summary>
 <p class="muted" style="margin:6px 0 8px">Copie do scanner ou tire a foto da tela do freeze frame: os valores são lidos junto com os códigos.</p>
 <div class="dg-ffg">${FF.map(([k,l,u])=>`<label>${l}${u?' ('+u+')':''}<input inputmode="decimal" value="${esc(ff[k]==null?'':ff[k])}" onchange="DG.ffSet('${k}',this.value)"></label>`).join('')}</div></details>`}
function lerFF(txt){const t=norm(String(txt||'')).replace(/,/g,'.').replace(/\b(?:b|banco|bank)\s?[12]\b/g,' '),o={},n='[^0-9+\\-\\n]{0,24}?';
 const P=[['rpm','(?:rpm|rotacao(?: do motor)?|engine (?:speed|rpm))'+n+'(\\d{3,4})(?![\\d.])'],['temp','(?:temp\\w*\\.? ?(?:do |da )?(?:motor|liquido|arref\\w*|agua)|coolant temp\\w*|ect)'+n+'(-?\\d{1,3}(?:\\.\\d)?)'],
  ['carga','(?:carga(?: calculada| do motor)?|(?:calculated |engine )?load)'+n+'(\\d{1,3}(?:\\.\\d)?)'],['vel','(?:velocidade(?: do veiculo)?|vehicle speed|vss)'+n+'(\\d{1,3})(?![\\d.])'],
  ['map','(?:map|press\\w* (?:absoluta )?(?:do )?coletor|intake manifold\\w*(?: pressure)?)'+n+'(\\d{2,3}(?:\\.\\d)?)'],['stft','(?:stft|short term(?: fuel trim)?|correcao (?:de combustivel )?(?:de )?curto prazo|ft curto)'+n+'([+\\-]?\\d{1,2}(?:\\.\\d{1,2})?)'],
  ['ltft','(?:ltft|long term(?: fuel trim)?|correcao (?:de combustivel )?(?:de )?longo prazo|ft longo)'+n+'([+\\-]?\\d{1,2}(?:\\.\\d{1,2})?)'],['tens','(?:tensao(?: da bateria| do modulo)?|bateria|battery|control module voltage|voltage)'+n+'(\\d{1,2}\\.\\d{1,2})']];
 P.forEach(([k,rx])=>{const m=t.match(new RegExp(rx));if(m)o[k]=m[1].replace('.',',')});return o}
/* 3) relatório para o cliente */
function relTxt(o){const d=dgOf(o),c=cl(o.cli),v=vh(o.veh),vv=vOf(o),q=db.quotes.find(x=>x.os==o.id&&x.dg);
 const cods=d.cod.map(x=>{const r=lookupV(x,vv);return'• '+x+(r&&r.t?' — '+r.t:'')}).join('\n');
 return`Olá, ${c.nome||''}! Tudo bem?\n\nSegue o diagnóstico do seu ${vlabel(v)}${o.num?' (O.S. '+o.num+')':''}:\n`+
  (cods?`\n*Códigos de falha*\n${cods}\n`:'')+(d.sin.length?`\n*O que o carro apresentava*\n${d.sin.map(s=>'• '+(SYM[s]?SYM[s].t:s)).join('\n')}\n`:'')+
  (d.def?`\n*O que encontramos*\n${d.def}\n`:'')+(d.tc&&TESTS[d.tc]||d.tcd?`\n*Como confirmamos*\n${d.tc&&TESTS[d.tc]?TESTS[d.tc].n:''}${d.tc&&TESTS[d.tc]&&d.tcd?': ':''}${d.tcd||''}\n`:'')+
  (d.sol?`\n*O que recomendamos*\n${d.sol}\n`:'')+(q?`\nOrçamento Nº ${q.n}: ${R(sum(q.items,q.desc))}\n`:'')+`\nQualquer dúvida, estou à disposição.\n\n${typeof empNome=='function'?empNome():''}`}
/* 10) confirmação do reparo */
function confHTML(o){const d=dgOf(o);if(!d.fim)return'';
 if(d.conf&&d.conf.r=='ok')return`<div class="card dg-ok"><b>✓ Reparo confirmado em ${D(d.conf.data)}</b><p class="muted" style="margin:4px 0 0">Este caso conta como resolvido no caminho rápido.</p></div>`;
 return`<div class="card dg-conf"><b>Falta confirmar o reparo</b><p class="muted" style="margin:4px 0 8px">Depois do conserto: apague os códigos, rode o carro e veja se a falha voltou. Só os casos confirmados ganham destaque no caminho rápido.</p>
 <div class="bar" style="margin:0"><button type="button" class="pr" onclick="DG.conf('ok')">Resolvido ✓</button><button type="button" onclick="DG.conf('falhou')">Não resolveu</button></div></div>`}
function proxHTML(o){const d=dgOf(o);if(!d.fim)return'';const q=db.quotes.find(x=>x.os==o.id&&x.dg);
 return`<div class="card"><b>Próximos passos</b><div class="dg-prox">
  <button type="button" class="${q?'':'pr'}" onclick="DG.orc()">${q?'Abrir o orçamento Nº '+esc(q.n):'Gerar orçamento'}</button>
  <button type="button" class="wa" onclick="DG.rel()">Enviar ao cliente (WhatsApp)</button></div></div>`}
/* 4) voz dentro do diagnóstico */
const VL={pe:'P',p:'P',be:'B',b:'B',ce:'C',c:'C',u:'U',a:'A',de:'D',d:'D',e:'E',efe:'F',f:'F'},VD={zero:'0',um:'1',uma:'1',dois:'2',duas:'2',tres:'3',quatro:'4',cinco:'5',seis:'6',meia:'6',sete:'7',oito:'8',nove:'9'};
function vozCodes(frase){const W=String(frase).split(/\s+/),out=new Set();let seq=[];
 const flush=()=>{const s=seq.join('');seq=[];(s.match(/[PBCU][0-3][0-9A-F]{3}/g)||[]).forEach(x=>out.add(x))};
 W.forEach(w=>{const k=norm(w).replace(/[^a-z0-9]/g,'');if(!k)return;if(/^[pbcu]?\d{1,5}$/.test(k)){seq.push(k.toUpperCase());return}if(k in VD){seq.push(VD[k]);return}if(k in VL){seq.push(VL[k]);return}flush()});flush();
 const n=norm(frase),m=n.match(/\bcodigos?\s+((?:\d\s*){4})\b/);if(m&&!out.size)out.add('P'+m[1].replace(/\s/g,''));return[...out]}
function vozDG(frase){const o=cur();if(!o||S.v!='diag')return null;const n=norm(frase),d=dgOf(o),rest=re=>{const m=String(frase).match(re);return m?m[m.length-1].trim().replace(/^[:,\-\s]+/,''):''};let m;
 if((m=rest(/\bcomo foi(?: o teste)?\s*[:,]?\s*(.+)$/i))){d.tcd=m;commit(o);render();return{msg:'Anotado em “Como foi o teste”'}}
 if(/^(?:o )?defeito\b/.test(n)&&(m=rest(/^(?:o\s+)?defeito(?:\s+(?:foi|é|e|encontrado|achado)(?=[\s:,]))?\s*[:,]?\s*(.+)$/i))){d.def=m;commit(o);UI.step[o.id]='def';render();return{msg:'Defeito: '+m}}
 if(/^(?:a )?(?:solucao|troquei|trocado|foi trocad)/.test(n)&&(m=rest(/^(?:a\s+)?(?:solu[cç][aã]o(?:\s+(?:foi|é|e)(?=[\s:,]))?|troquei|trocado|foi trocad[oa])\s*[:,]?\s*(.+)$/i))){d.sol=m;commit(o);render();return{msg:'Solução anotada'}}
 const rr=/\b(deu ok|ok|bom|normal|dentro)\b/.test(n)?'ok':/\b(fora|falha|falhou|ruim|alterad\w*|errad\w*)\b/.test(n)?'falha':/\b(inconclusiv\w*|nao deu pra saber|duvida)\b/.test(n)?'inc':'';
 if(/^teste\b/.test(n)&&rr){const q=n.replace(/^teste\s+(?:de\s+|do\s+|da\s+)?/,'').replace(/\b(deu ok|ok|bom|normal|dentro|fora|falha|falhou|ruim|alterad\w*|errad\w*|inconclusiv\w*|deu|esta|ficou|resultado)\b.*$/,'').trim();const t=q&&tbAcha(q)[0];
  if(t){const r=d.t[t.id]=d.t[t.id]&&typeof d.t[t.id]=='object'?d.t[t.id]:{};r.r=rr;r.at=Date.now();const vm=n.match(/(?:valor|deu|marcou|mediu)\s+([+\-]?\d+(?:[.,]\d+)?\s*\S*)/);if(vm)r.v=vm[1];if(rr=='falha'&&!d.tc)d.tc=t.id;if(!d.ext.includes(t.id)&&!suggestions(o,matchCases(o)).has(t.id))d.ext.push(t.id);commit(o);UI.step[o.id]='diag';render();return{msg:t.n+': '+RLB[rr]}}}
 const cs=vozCodes(frase);if(cs.length&&(/\b(codigo|codigos|falha|scanner)\b/.test(n)||/^[pbcu]/.test(n)||/^(pe|be|ce|u)\b/.test(n))){cs.forEach(c=>{if(!d.cod.includes(c))d.cod.push(c)});commit(o);UI.step[o.id]='sin';render();return{msg:(cs.length==1?'Código ':'Códigos ')+cs.join(', ')+' adicionado'+(cs.length>1?'s':'')}}
 if(/\b(sintoma|sintomas|apresenta|esta com|ta com)\b/.test(n)){const q=n.replace(/^.*?\b(sintomas?|apresenta|esta com|ta com)\b\s*(?:de\s+|e\s+)?/,''),L=matchSym(q).filter(s=>!d.sin.includes(s.id)).slice(0,1);
  if(L.length){d.sin.push(L[0].id);commit(o);UI.step[o.id]='sin';render();return{msg:'Sintoma: '+L[0].t}}return{msg:'Não achei esse sintoma. Toque nele na lista.'}}
 if(/\b(proxima etapa|ver diagnostico|testes e causas)\b/.test(n)){DG.step('diag');return{msg:'Testes e causas'}}
 if(/\b(salvar caso|salva o caso|terminar diagnostico)\b/.test(n)){DG.step('def');return{msg:'Confira e toque em Salvar caso'}}
 return null}

const DG={
 step(k,force){const o=cur();if(!o)return;const st=curStep(o);
  if(st=='sin'&&k!='sin'){const dr=String(UI.code||'').trim(),p=parseCode(dr),d=dgOf(o);
   if(dr&&!p.ok&&!force)return msg({title:'Código de falha inválido',intro:`“${dr}” não é um código válido e não foi adicionado.`,items:['O código tem uma letra e 4 números. Exemplo: P0171','Pode digitar só os números (0171) que a letra P entra sozinha'],okLabel:'Corrigir o código',focus:'dgcode',warn:1,
    alt:(d.cod.length||d.sin.length||(UI.sym&&matchSym(UI.sym).length))?()=>{UI.code='';DG.step(k,1)}:null,altLabel:'Ignorar e continuar'});
   const n=commitDrafts(o);
   if(!d.cod.length&&!d.sin.length){const ts=String(UI.sym||'').trim();return msg({title:'Falta informar o problema',intro:'Para montar o diagnóstico, informe pelo menos um destes:',items:['Código de falha lido no scanner (ex.: P0171)','Ou um sintoma: toque em um dos botões da lista de sintomas'].concat(ts?[`O sintoma digitado “${ts}” não foi reconhecido. Escolha um na lista.`]:[]),okLabel:'Preencher',focus:'dgcode',warn:1})}
   if(n)toast(n==1?'O que estava digitado foi adicionado':n+' itens digitados foram adicionados')}
  UI.step[o.id]=k;render();const t=$('.dg-steps');if(t){const nv=$('#nav'),y=t.getBoundingClientRect().top+scrollY-(nv?nv.offsetHeight:0)-8;if(scrollY>y)scrollTo({top:y})}},
 cin(v){UI.code=v;const o=cur(),p=$('#dgprev');if(p)p.innerHTML=codePrev(o);const a=$('#dgab');if(a&&o)a.textContent=abMsg(o)},
 sin(v){UI.sym=v;const o=cur(),b=$('#dgsug');if(b&&o)b.innerHTML=symSug(o);const a=$('#dgab');if(a&&o)a.textContent=abMsg(o)},
 addCode(c){const o=cur();if(!o)return;carregaXB();const d=dgOf(o);const list=c?[c]:String(UI.code||'').split(/[\s,;]+/).filter(Boolean);
  const ok=[],bad=[];list.forEach(x=>{const p=parseCode(x);if(p.ok)ok.push(p.code);else if(!p.empty)bad.push(p.raw)});
  if(!ok.length&&!bad.length){const n=$('#dgcode');if(n)n.focus();return}
  if(bad.length&&!ok.length)return msg({title:'Código de falha inválido',intro:`“${bad.join(' ')}” não é um código válido.`,items:['O código tem uma letra e 4 números. Exemplo: P0171'],okLabel:'Corrigir',focus:'dgcode',warn:1});
  const added=ok.filter(x=>!d.cod.includes(x));added.forEach(x=>d.cod.push(x));if(!c)UI.code=bad.join(' ');if(added.length)commit(o);
  const unk=added.find(x=>!lookupV(x,vOf(o)));render();
  if(unk){DG.editCode(unk);toast(unk+' ainda não tem descrição: cadastre agora');return}
  const fab=added.find(x=>{const r=lookupV(x,vOf(o));return r&&r.auto=='fab'});
  if(fab){toast(fab+' é de fabricante: preenchi uma sugestão pelo tipo do código. Toque em Editar para ajustar');return}
  const n=$('#dgcode');if(n&&!c)n.focus();if(added.length)toast(added.length==1?'Código '+added[0]+' adicionado':added.length+' códigos adicionados');else if(ok.length)toast('Esse código já foi adicionado')},
 rmCode(c){const o=cur();if(!o)return;const d=dgOf(o);d.cod=d.cod.filter(x=>x!=c);commit(o);render()},
 addSym(id){const o=cur();if(!o)return;const d=dgOf(o);if(!d.sin.includes(id))d.sin.push(id);UI.sym='';commit(o);render();toast('Sintoma adicionado: '+SYM[id].t)},
 tsym(id){const o=cur();if(!o)return;const d=dgOf(o);d.sin.includes(id)?d.sin=d.sin.filter(x=>x!=id):d.sin.push(id);commit(o);render()},
 tfil(k){UI.tf=k;render()},
 res(t,k){const o=cur();if(!o)return;const d=dgOf(o),r=d.t[t]=d.t[t]&&typeof d.t[t]=='object'?d.t[t]:{};if(r.r==k){r.r=null;r.at=null}else{r.r=k;r.at=Date.now()}if(k=='falha'&&r.r&&!d.tc)d.tc=t;commit(o);render()},
 tval(t,f,v){const o=cur();if(!o)return;const d=dgOf(o),r=d.t[t]=d.t[t]&&typeof d.t[t]=='object'?d.t[t]:{};r[f]=v;commit(o)},
 tbF(k,v){UI['tb'+k]=v;tbRes(k)},
 tbPick(k,t){UI['tb'+k]='';if(k=='add')return DG.addTest(t);DG.set('tc',t);render();const el=document.getElementById('dgtcd');if(el&&!el.value)el.focus()},
 addTest(t){const o=cur();if(!o||!t)return;const d=dgOf(o);if(!d.ext.includes(t))d.ext.push(t);UI.tf='todos';commit(o);render();toast('Teste adicionado à lista')},
 rmTest(t){const o=cur();if(!o)return;const d=dgOf(o);d.ext=d.ext.filter(x=>x!=t);d.t[t]=null;commit(o);render()},
 pick(def,sis,stay){const o=cur();if(!o)return;const d=dgOf(o);d.def=def;if(sis)d.sis=sis;commit(o);if(stay)render();else DG.step('def')},
 set(k,v){const o=cur();if(!o)return;dgOf(o)[k]=v;commit(o)},
 saveCase(force){const o=cur();if(!o)return;const d=dgOf(o);
  ['dgdef','dgsis','dgtcd','dgsol'].forEach(id=>{const el=document.getElementById(id);if(el){const k={dgdef:'def',dgsis:'sis',dgtcd:'tcd',dgsol:'sol'}[id];d[k]=el.value}});
  if(!String(d.def||'').trim())return msg({title:'Falta o defeito encontrado',intro:'Escreva qual foi o defeito, ou toque em uma das causas logo acima para preencher.',okLabel:'Preencher',focus:'dgdef',warn:1});
  if(!force){const op=[];if(!d.sis)op.push('Sistema');if(!d.tc)op.push('Teste que confirmou');if(!String(d.sol||'').trim())op.push('Solução / peças trocadas');
   if(op.length)return msg({title:'Faltam alguns campos',intro:'Estes campos ajudam no Caminho rápido dos próximos carros:',items:op,okLabel:'Preencher',focus:!d.sis?'dgsis':!d.tc?'dgtb-tc':'dgsol',alt:()=>DG.saveCase(1),altLabel:'Salvar assim mesmo'})}
  tmPara(d);const v=vOf(o),id=d.caso||uid(),C=casos(),i=C.findIndex(x=>x.id==id),old=i>=0?C[i]:null;
  const c={id,os:o.id,num:o.num,data:today(),cod:[...d.cod],sin:[...d.sin],def:d.def.trim(),sis:d.sis||'',tc:d.tc||'',tcd:String(d.tcd||'').trim(),sol:String(d.sol||'').trim(),obs:String(d.obs||'').trim(),vid:o.veh||'',min:Math.round(tmMs(d)/60000)||0,ff:d.ff&&ffTxt(d.ff)?{...d.ff}:undefined,conf:old&&old.conf||null,veh:{modelo:v.modelo,motor:v.motor,ano:v.ano},km:v.km||''};
  if(i>=0)C[i]=c;else C.push(c);const novo=!d.caso;d.caso=id;d.fim=true;
  const n=fillLaudo(o);d.laudo=1;commit(o);render();scrollTo(0,0);
  toast((novo?'Caso salvo no histórico':'Caso atualizado')+(n?' · laudo preenchido ('+plural(n,'campo','campos')+')':''))},
 msgOk(){const f=DG._focus;closeM(1);if(f){const el=document.getElementById(f);if(el){el.scrollIntoView({block:'center'});el.focus({preventScroll:true})}}},
 msgAlt(){const a=DG._alt;closeM(1);if(a)a()},
 /* cadastro da descrição de um código */
 editCode(c){const o=cur(),v=o?vOf(o):{},r=lookupV(c,o?v:undefined);
  DG._ed={code:c,existing:r&&r.custom?r.custom.id:null,tests:r?[...r.tests]:[]};
  const q='https://www.google.com/search?q='+encodeURIComponent([c,'código de falha',v.modelo,v.motor].filter(Boolean).join(' '));
  $('#modal').innerHTML=`<div class="ov"><form class="md dg-ed" onsubmit="event.preventDefault();DG.saveCode()"><h2 style="margin-top:0">Descrição do ${esc(c)}</h2>
  <p class="muted" style="margin:0 0 10px">Fica salva para a próxima vez que o código aparecer.</p>
  <a class="btn" href="${q}" target="_blank" rel="noopener" style="text-decoration:none;margin-bottom:12px">Pesquisar ${esc(c)} no Google ↗</a>
  <label>Descrição do código<input id="dgct" value="${esc(r?r.t:'')}" placeholder="Ex.: Sinal de rotação — faixa/desempenho"></label>
  <label>O que significa (opcional)<textarea id="dgcm">${esc(r?r.m:'')}</textarea></label>
  <div class="g2"><label>Gravidade<select id="dgcs">${[1,2,3].map(n=>`<option value="${n}" ${(r?r.s:2)==n?'selected':''}>${SEV[n]}</option>`).join('')}</select></label>
  <label>Vale para<select id="dgce"><option value="todos">Todos os veículos</option>${v.modelo?`<option value="modelo" ${r&&r.custom&&r.custom.modelo?'selected':''}>Só ${esc(v.modelo)}</option>`:''}</select></label></div>
  <label>Causas prováveis (uma por linha, da mais provável)<textarea id="dgcc" style="min-height:96px">${esc(r?r.ca.join('\n'):'')}</textarea></label>
  <small class="muted">Testes sugeridos para este código</small><div class="dg-pick">${Object.values(TESTS).map(t=>`<label><input type="checkbox" value="${t.id}" ${DG._ed.tests.includes(t.id)?'checked':''} onchange="DG.edT(this)">${esc(t.n)}</label>`).join('')}</div>
  <div class="bar" style="margin:12px 0 0">${DG._ed.existing?`<button type="button" class="dg" onclick="confirmDel(this,()=>DG.delCode('${DG._ed.existing}'))">Apagar</button>`:''}<span class="sp"></span><button type="button" onclick="closeM(1)">Cancelar</button><button class="pr">Salvar</button></div></form></div>`;
  setTimeout(()=>{const x=$('#dgct');if(x)x.focus()},30)},
 edT(cb){const t=DG._ed.tests.filter(x=>x!=cb.value);if(cb.checked)t.push(cb.value);DG._ed.tests=t},
 saveCode(){const ed=DG._ed,o=cur(),v=o?vOf(o):{};const t=$('#dgct').value.trim();
  if(!t){const x=$('#dgct');x.style.borderColor=KR;x.focus();return toast('Escreva a descrição do código')}
  const modelo=$('#dgce').value=='modelo'&&v.modelo?v.modelo:'',id=ed.code+(modelo?'--'+dkey(modelo).replace(/ /g,'-').slice(0,60):''),L=codes();
  if(ed.existing&&ed.existing!=id){const j=L.findIndex(x=>x.id==ed.existing);if(j>=0)L.splice(j,1)}
  const rec={id,code:ed.code,modelo,t,m:$('#dgcm').value.trim(),s:+$('#dgcs').value||2,ca:$('#dgcc').value.split('\n').map(x=>x.trim()).filter(Boolean),tests:[...ed.tests],at:today()};
  const j=L.findIndex(x=>x.id==id);if(j>=0)L[j]=rec;else L.push(rec);save();closeM(1);render();toast(modelo?'Descrição salva para '+modelo:'Descrição salva para todos os veículos')},
 delCode(id){const L=codes(),j=L.findIndex(x=>x.id==id);if(j>=0)L.splice(j,1);save();closeM(1);render();toast('Descrição apagada')},
 /* página do menu */
 tab(k){S.f.dt=k;render();scrollTo(0,0)},
 novo(){if(!db.vehicles.length){DG.next='diag';return newOS()}
  modal('Diagnosticar qual carro?',[['veh','Veículo','busca',db.vehicles.map(v=>[v.id,vlabel(v),(cl(v.cli).nome||'')+' '+(v.cor||''),cl(v.cli).nome]),0]],{},f=>{if(!f.veh){DG.next='diag';return newOS()}DG.escolhe(f.veh)},'<p class="muted" style="margin:0">Carro que ainda não está cadastrado? Deixe em branco e toque em Salvar.</p>')},
 escolhe(vid){const v=vh(vid),ab=db.orders.filter(o=>o.veh==vid&&['Aberta','Em andamento','Aguardando peças'].includes(o.status)).sort((a,b)=>String(b.aberta||'').localeCompare(String(a.aberta||''))||String(b.num).localeCompare(String(a.num)));
  if(!ab.length){DG.next='diag';return newOS({cli:v.cli,veh:vid})}
  $('#modal').innerHTML=`<div class="ov"><div class="md" role="dialog" aria-modal="true"><h2 style="margin-top:0">${esc(vlabel(v))} já tem O.S. aberta</h2><p class="muted" style="margin:0 0 10px">Use a O.S. que já existe para não ficar com duas do mesmo carro.</p>
   ${ab.map(o=>{const n=(o.items||[]).length;return`<button type="button" class="${o===ab[0]?'pr':''}" style="width:100%;text-align:left;margin:0 0 8px;display:block" onclick="closeM(1);DG.open('${o.id}')"><b>Usar a O.S. ${esc(o.num)}</b><small style="display:block;opacity:.85">${esc(o.status)} · entrada ${D(o.aberta)} · ${n?plural(n,'item','itens'):'sem itens'}${started(o)?' · já tem diagnóstico':''}</small></button>`}).join('')}
   <div class="bar" style="margin:6px 0 0"><button type="button" onclick="closeM(1)">Cancelar</button><span class="sp"></span><button type="button" onclick="closeM(1);DG.next='diag';newOS({cli:'${v.cli}',veh:'${vid}'})">Abrir O.S. nova</button></div></div></div>`},
 open(id){go('diag',id)},
 delCaso(id){const C=casos(),j=C.findIndex(x=>x.id==id);if(j>=0)C.splice(j,1);db.orders.forEach(o=>{if(o.dg&&o.dg.caso==id){o.dg.caso=null;o.dg.fim=false}});save();render();toast('Caso excluído')},
 cq(v){carregaXB();UI.cq=v;const b=$('#dgcqo');if(b)b.innerHTML=consulta()},
 casoQ(v){UI.casoQ=v;const b=$('#dgcasos');if(b)b.innerHTML=casosList()},
 vq(v){UI.vq=v;const b=$('#dgvals');if(b)b.innerHTML=valsHTML()},
 eq(k,on){const s=eqSet();on?s.add(k):s.delete(k);db.dgcfg=Object.assign({},db.dgcfg||{},{eq:[...s]});save()},
 calc(){calcAll()},
 taxa(){if(!DONO())return;const v=nBR(($('#dgtxv')||{}).value||'0'),d=(($('#dgtxd')||{}).value||'').trim()||'Diagnóstico';if(!isFinite(v)||v<0)return toast('Valor inválido');db.dgcfg=Object.assign({},db.dgcfg||{},{taxa:{v:Math.round(v*100)/100,d}});save();render();toast(v>0?'Cobrança do diagnóstico: '+R(v):'Cobrança do diagnóstico desligada')},
 tmTog(){const o=cur();if(!o)return;const d=dgOf(o);d.tm=d.tm||{ms:0,on:null};if(d.tm.on)tmPara(d);else d.tm.on=Date.now();commit(o);render()},
 tmEdit(){const o=cur();if(!o||!o.dg||!o.dg.tm)return;const d=o.dg;modal('Tempo de diagnóstico',[['min','Minutos','text',0,1]],{min:String(Math.round(tmMs(d)/60000))},f=>{const m=Math.max(0,Math.round(nBR(f.min)||0));d.tm.ms=m*60000;if(d.tm.on)d.tm.on=Date.now();commit(o);render();toast('Tempo ajustado: '+tmTxt(m*60000))},'<p class="muted" style="margin:0">Corrija se o cronômetro ficou ligado sem querer.</p>')},
 retorno(id,nao){const o=cur();if(!o)return;const d=dgOf(o),c=casos().find(x=>x.id==id);if(!c)return;
  if(nao){c.conf='falhou';c.confEm=today();c.retornoOS=o.num;const oo=c.os&&od(c.os);if(oo&&oo.dg)oo.dg.conf={r:'falhou',data:today()};toast('Caso marcado como “não resolveu”')}else{d.retIgn=[...(d.retIgn||[]),id];toast('Ok, é outro problema')}commit(o);render()},
 tfoto(tid,inp){const f=inp.files&&inp.files[0];inp.value='';const o=cur();if(!f||!o)return;o.fotos=o.fotos||[];
  picRef(f,ref=>{const r=dgOf(o).t[tid]||{};o.fotos.push({id:uid(),t:'Teste: '+(TESTS[tid]?TESTS[tid].n:tid),src:ref,obs:r.v||'',tid});commit(o);render();toast('Foto guardada no teste e nas fotos da O.S.')})},
 tfotoRm(i){const o=cur();if(!o||!o.fotos||!o.fotos[i])return;o.fotos.splice(i,1);commit(o);render()},
 ffSet(k,v){const o=cur();if(!o)return;const d=dgOf(o);d.ff=Object.assign({},d.ff||{},{[k]:String(v).trim()});commit(o);const sm=document.querySelector('.dg-ff summary .muted');if(sm)sm.textContent=ffTxt(d.ff)||'freeze frame (opcional)'},
 orc(){const o=cur();if(!o)return;const d=dgOf(o),ex=db.quotes.find(x=>x.os==o.id&&x.dg);if(ex)return editQuote(ex.id);
  const fee=(o.items||[]).filter(i=>i.dgfee).map(i=>JSON.parse(JSON.stringify(i)));
  const prev=casos().filter(c=>c.os!==o.id&&dkey(c.def)===dkey(d.def)&&c.conf!='falhou').reverse().map(c=>od(c.os)).find(x=>x&&(x.items||[]).some(i=>!i.dgfee&&!/diagn/.test(norm(i.d))));
  const base=prev?prev.items.filter(i=>!i.dgfee&&!/diagn/.test(norm(i.d))).map(i=>{const c=JSON.parse(JSON.stringify(i));c.iid=uid();delete c.baixa;return c}):[{iid:uid(),t:'Serviço',d:d.sol||('Reparo: '+d.def),q:1,v:0}];
  const q={id:uid(),n:db.qseq,cli:o.cli,veh:o.veh,items:[...fee,...base],desc:0,prazo:'',obs:'Diagnóstico: '+d.def+(d.tcd?'\nComo confirmamos: '+d.tcd:''),status:'Rascunho',os:o.id,dg:o.id};
  db.qseq++;db.quotes.push(q);save();editQuote(q.id);toast(prev?'Orçamento montado com os itens da O.S. '+prev.num+' (mesmo defeito). Confira os valores.':'Orçamento criado. Coloque os valores das peças e do serviço.')},
 rel(){const o=cur();if(!o)return;const c=cl(o.cli);wa(c.tel,relTxt(o))},
 relOS(id){const o=od(id);if(!o||!o.id)return;wa(cl(o.cli).tel,relTxt(o))},
 conf(r){const o=cur();if(!o)return;const d=dgOf(o),c=d.caso&&casos().find(x=>x.id==d.caso);
  if(r=='ok'){d.conf={r:'ok',data:today()};if(c){c.conf='ok';c.confEm=today()}commit(o);render();return toast('Reparo confirmado. Este caso ganha destaque no caminho rápido.')}
  if(c){c.conf='falhou';c.confEm=today()}d.fim=false;d.conf=null;d.caso=null;d.laudo=0;if(d.tm&&!d.tm.on)d.tm.on=Date.now();UI.step[o.id]='diag';commit(o);render();scrollTo(0,0);toast('Caso marcado como “não resolveu”. Continue o diagnóstico.')},
 voz(frase){try{return vozDG(frase)}catch(x){console.warn('voz',x);return null}}
};

/* preenche o laudo técnico com o diagnóstico (só os campos vazios; códigos e testes são somados) */
function fillLaudo(o){const d=dgOf(o),L=lOf(o);let n=0;
 const cods=[...new Set([...lCods(L.cod),...d.cod])].join(', ');if(cods&&cods!=String(L.cod||'')){L.cod=cods;n++}
 const lines=Object.entries(d.t).filter(([t,r])=>r&&r.r&&TESTS[t]).map(([t,r])=>`${TESTS[t].n}: ${{ok:'dentro do esperado',falha:'fora do esperado',inc:'inconclusivo'}[r.r]}${r.v?' ('+r.v+')':''}${r.o?' — '+r.o:''}`);
 if(lines.length){const cur0=String(L.testes||'').trim(),add=lines.filter(x=>!cur0.includes(x));if(add.length){L.testes=(cur0?cur0+'\n':'')+add.join('\n');n++}}
 const eqs=[...new Set(Object.entries(d.t).filter(([t,r])=>r&&r.r&&TESTS[t]).flatMap(([t])=>{const av=eqSet(),alt=TESTS[t].eq.find(a=>a.split('+').every(x=>av.has(x)))||TESTS[t].eq[0];return alt.split('+').map(x=>EQ[x])}))].filter(x=>x!=EQ.vis);
 if(eqs.length&&!String(L.equip||'').trim()){L.equip=eqs.join(', ');n++}
 if(d.ff&&ffTxt(d.ff)){const ln='Momento da falha (freeze frame): '+ffTxt(d.ff),c0=String(L.testes||'').trim();if(!c0.includes(ln)){L.testes=(c0?c0+'\n':'')+ln;n++}}
 if(d.tcd){const ln='Teste que confirmou'+(d.tc&&TESTS[d.tc]?' ('+TESTS[d.tc].n+')':'')+': '+String(d.tcd).trim(),c0=String(L.testes||'').trim();if(!c0.includes(String(d.tcd).trim())){L.testes=(c0?c0+'\n':'')+ln;n++}}
 if(d.def&&!String(L.diag||'').trim()){L.diag=d.def;n++}
 if(d.sis&&!String(L.causa||'').trim()){L.causa=(d.obs?d.obs:'Sistema: '+d.sis);n++}
 if(d.sol&&!String(L.sol||'').trim()){L.sol=d.sol;n++}
 return n}

/* ================= PÁGINA "DIAGNÓSTICO" NO MENU ================= */
const DCOL='#C0392B';

/* ================= FOTO DO SCANNER: telas e ações ================= */
function fotoBtns(){return`<div class="dg-foto"><button type="button" onclick="document.getElementById('dgcam').click()">${svgi('cam')} Câmera</button><button type="button" onclick="document.getElementById('dggal').click()">${svgi('img')} Galeria</button><small class="muted">Foto da tela do scanner: leio os códigos e as descrições</small>
 <input id="dgcam" type="file" accept="image/*" capture="environment" hidden onchange="DG.foto(this)"><input id="dggal" type="file" accept="image/*" hidden onchange="DG.foto(this)"></div>`}
function fotoProg(msg,pct){const b=$('#dgocrp');if(!b)return;b.querySelector('span').textContent=msg;const i=b.querySelector('i');if(i)i.style.width=Math.round((pct||0)*100)+'%'}
function fotoRev(){const F=DG._foto,o=cur(),v=o?vOf(o):{};
 const rows=F.itens.map((x,i)=>{const r=lookupV(x.code,v),baseT=r&&r.auto!='fab'?r.t:'',enB=r?(r.en||(XB&&XB[x.code]?XB[x.code][1]:'')):'',dif=x.desc&&baseT&&!parecido(x.desc,baseT)&&!(enB&&parecido(x.desc,enB)),igual=x.desc&&baseT&&!dif;
  x.dif=dif;x.base=baseT;if(x.esc==null)x.esc=dif?'':(x.desc&&!baseT?'scan':'base');
  return`<div class="dg-ocr${x.on?'':' off'}"><label class="dg-ocrh"><input type="checkbox" ${x.on?'checked':''} onchange="DG.fotoSet(${i},'on',this.checked)"><input class="dg-code sm" value="${esc(x.code)}" aria-label="Código" onchange="DG.fotoSet(${i},'code',this.value)">${dif?mb('Descrições diferentes',KA):igual?mb('Confere com a base',KG):!baseT&&x.desc?mb('Nova: vem do scanner',KB):''}</label>
  ${dif?`<p class="dg-ocrq"><b>O scanner e a base dizem coisas diferentes. Qual manter?</b></p>
   <label class="dg-opt${x.esc=='scan'?' on':''}"><input type="radio" name="dgo${i}" ${x.esc=='scan'?'checked':''} onchange="DG.fotoSet(${i},'esc','scan')"><span><small>Do scanner</small><textarea rows="2" oninput="DG.fotoSet(${i},'desc',this.value,1)">${esc(x.desc)}</textarea></span></label>
   <label class="dg-opt${x.esc=='base'?' on':''}"><input type="radio" name="dgo${i}" ${x.esc=='base'?'checked':''} onchange="DG.fotoSet(${i},'esc','base')"><span><small>Da base${r&&r.custom?' (da oficina)':''}</small><b>${esc(baseT)}</b></span></label>`
  :x.desc&&!baseT?`<label class="dg-opt on"><span><small>Descrição lida no scanner (pode corrigir)</small><textarea rows="2" oninput="DG.fotoSet(${i},'desc',this.value,1)">${esc(x.desc)}</textarea></span></label>${r?`<small class="muted">A base só tinha a sugestão genérica: “${esc(r.t)}”.</small>`:''}`
  :`<p class="muted" style="margin:6px 0 0">${esc(baseT||(r?r.t:'Sem descrição'))}</p>`}</div>`}).join('');
 const n=F.itens.filter(x=>x.on).length,falta=F.itens.some(x=>x.on&&x.dif&&!x.esc),ffk=Object.keys(F.ff||{});
 const ffb=ffk.length?`<div class="dg-ocr${F.ffOn?'':' off'}"><label class="dg-ocrh"><input type="checkbox" ${F.ffOn?'checked':''} onchange="DG._foto.ffOn=this.checked;fotoRev()"><b>Dados do momento da falha</b></label><p style="margin:6px 0 0">${esc(ffTxt(F.ff))}</p></div>`:'';
 $('#modal').innerHTML=`<div class="ov"><div class="md dg-ocrm" role="dialog" aria-modal="true"><h2 style="margin-top:0">${F.itens.length?plural(F.itens.length,'código encontrado','códigos encontrados'):'Dados do freeze frame encontrados'}</h2>
  <p class="muted" style="margin:0 0 10px">Confira o que li na foto. Desmarque o que estiver errado ou corrija o código.</p>${rows}${ffb}
  <details style="margin-top:10px"><summary class="muted">Ver o texto lido na foto</summary><pre class="dg-ocrt">${esc(F.txt)}</pre></details>
  <div class="bar" style="margin:12px 0 0"><button type="button" onclick="closeM(1)">Cancelar</button><span class="sp"></span><button type="button" class="pr" ${(n||F.ffOn)&&!falta?'':'disabled'} onclick="DG.fotoOk()">${falta?'Escolha qual descrição manter':n?'Adicionar '+plural(n,'código','códigos'):'Preencher os dados'}</button></div></div></div>`}
Object.assign(DG,{
 async foto(inp){const f=inp.files&&inp.files[0];inp.value='';if(!f)return;const o=cur();if(!o)return;carregaXB();
  $('#modal').innerHTML=`<div class="ov"><div class="md" role="dialog" aria-modal="true" aria-live="polite"><h2 style="margin-top:0">Lendo a foto do scanner</h2><div id="dgocrp" class="dg-ocrp"><span>Preparando a imagem…</span><div><i></i></div></div><p class="muted">Na primeira vez o leitor é baixado (cerca de 10 MB). Depois funciona mais rápido e sem internet.</p><div class="bar" style="margin:12px 0 0"><span class="sp"></span><button type="button" onclick="DG._foto=null;closeM(1)">Cancelar</button></div></div></div>`;
  const tk=DG._fotoTk=Date.now();
  try{const cv=await ocrPrep(f);fotoProg(ocrW?'Lendo o texto…':'Baixando o leitor…',.05);
   const w=await ocrWorker(m=>{if(DG._fotoTk!=tk)return;if(m.status=='recognizing text')fotoProg('Lendo o texto…',m.progress);else if(/load|init/i.test(m.status))fotoProg('Baixando o leitor…',(m.progress||0)*.9)});
   const r=await w.recognize(cv);if(DG._fotoTk!=tk||!$('#dgocrp'))return;const txt=r.data.text||'';
   await (XBload||Promise.resolve());const it=lerScanner(txt).map(x=>({...x,on:!dgOf(o).cod.includes(x.code),esc:null})),ff=lerFF(txt);
   if(!it.length&&!Object.keys(ff).length){$('#modal').innerHTML=`<div class="ov"><div class="md"><h2 style="margin-top:0">Não achei códigos na foto</h2><ul><li>Fotografe de frente, sem reflexo, com a tela inteira aparecendo.</li><li>Se a lista for longa, tire uma foto de cada parte.</li><li>Ou digite o código no campo.</li></ul>${txt.trim()?`<details><summary class="muted">Ver o texto lido</summary><pre class="dg-ocrt">${esc(txt)}</pre></details>`:''}<div class="bar" style="margin:12px 0 0"><span class="sp"></span><button type="button" class="pr" onclick="closeM(1)">Entendi</button></div></div></div>`;return}
   DG._foto={itens:it,txt,ff,ffOn:Object.keys(ff).length>0};fotoRev()}
  catch(e){$('#modal').innerHTML=`<div class="ov"><div class="md"><h2 style="margin-top:0">Não consegui ler a foto</h2><p>${esc(e&&e.message||String(e))}. Confira a internet na primeira vez (para baixar o leitor) ou digite o código.</p><div class="bar"><span class="sp"></span><button type="button" class="pr" onclick="closeM(1)">Entendi</button></div></div></div>`}},
 fotoSet(i,k,val,quiet){const x=DG._foto&&DG._foto.itens[i];if(!x)return;
  if(k=='code'){const p=parseCode(val);if(!p.ok)return toast('Código inválido: '+val);x.code=p.code;x.esc=null}else x[k]=val;
  if(k=='desc'){x.esc='scan';if(quiet){const rb=document.querySelector('input[name="dgo'+i+'"]');if(rb)rb.checked=true;document.querySelectorAll('#modal .dg-opt').forEach(l=>{const q=l.querySelector('input[type=radio]');if(q&&q.name=='dgo'+i)l.classList.toggle('on',q.checked)});
   const F=DG._foto,n=F.itens.filter(y=>y.on).length,falta=F.itens.some(y=>y.on&&y.dif&&!y.esc),bt=$('#modal .bar .pr');if(bt){bt.disabled=!(n&&!falta);bt.textContent=falta?'Escolha qual descrição manter':'Adicionar '+plural(n,'código','códigos')}return}}
  fotoRev()},
 fotoOk(){const F=DG._foto,o=cur();if(!F||!o)return;if(F.itens.some(y=>y.on&&y.dif&&!y.esc))return toast('Escolha qual descrição manter');const d=dgOf(o),v=vOf(o),L=codes();let n=0,s=0;
  F.itens.filter(x=>x.on).forEach(x=>{if(!d.cod.includes(x.code)){d.cod.push(x.code);n++}
   if(x.esc=='scan'&&x.desc.trim()){const r=lookupV(x.code,v),fab=ctype(x.code)!='Genérico (SAE)',modelo=fab&&v.modelo?v.modelo:'',id=x.code+(modelo?'--'+dkey(modelo).replace(/ /g,'-').slice(0,60):'');
    const old=L.find(y=>y.id==id),rec={...(old||{}),id,code:x.code,modelo,t:x.desc.trim(),m:(old&&old.m)||(r?r.m:''),s:(old&&old.s)||(r?r.s:2),ca:(old&&old.ca&&old.ca.length)?old.ca:(r?r.ca:[]),tests:(old&&old.tests&&old.tests.length)?old.tests:(r?r.tests:['codes']),at:today(),fonte:'scanner'};
    const j=L.findIndex(y=>y.id==id);if(j>=0)L[j]=rec;else L.push(rec);s++}});
  const ffOk=F.ffOn&&Object.keys(F.ff||{}).length;if(ffOk)d.ff=Object.assign({},d.ff||{},F.ff);
  DG._foto=null;commit(o);closeM(1);render();toast((ffOk?'Freeze frame preenchido · ':'')+(n?plural(n,'código adicionado','códigos adicionados'):'Nenhum código novo')+(s?' · '+plural(s,'descrição do scanner salva','descrições do scanner salvas'):''))},
});

/* ================= O.S.: SÓ O REGISTRO (o trabalho é feito no menu Diagnóstico) ================= */
function DGrec(o){const d=o.dg,v=vOf(o);
 if(!d||!started(o))return`<div class="card dg-rec">${empty('diag','Nenhum diagnóstico registrado nesta O.S.')}<button class="pr" style="width:100%" onclick="DG.open('${o.id}')">Fazer o diagnóstico</button></div>`;
 const[s,col]=dgInfo(o),feitos=Object.entries(d.t||{}).filter(([k,x])=>x&&x.r&&TESTS[k]);
 const R={ok:['OK',KG],falha:['Fora do esperado',KR],inc:['Inconclusivo',KA]};
 return`<div class="card dg-rec"><div class="dg-h"><b>Registro do diagnóstico</b>${mb(s,col)}</div>
  ${d.cod.length?`<small class="muted">Códigos de falha</small>${d.cod.map(c=>{const r=lookupV(c,v);return`<div class="dg-cc"><span class="dg-ro">${esc(c)}</span><span class="dg-cct"><b>${esc(r?r.t:'Sem descrição')}</b></span><span></span></div>`}).join('')}`:''}
  ${d.sin.length?`<small class="muted">Sintomas</small><div class="dg-chips" style="margin:4px 0 8px">${d.sin.map(x=>SYM[x]?mb(esc(SYM[x].t)):'').join(' ')}</div>`:''}
  ${feitos.length?`<small class="muted">Testes feitos</small><ul class="dg-recl">${feitos.map(([k,x])=>`<li>${mb(R[x.r]?R[x.r][0]:x.r,R[x.r]?R[x.r][1]:KA)} ${esc(TESTS[k].n)}${x.v?' — <b>'+esc(x.v)+'</b>':''}</li>`).join('')}</ul>`:''}
  ${d.fim?`<div class="dg-recf"><small class="muted">Defeito encontrado</small><b>${esc(d.def||'')}</b>${d.sis?mb(esc(d.sis),KB):''}${d.tc&&TESTS[d.tc]?`<div><small class="muted">Confirmado com:</small> ${esc(TESTS[d.tc].n)}</div>`:''}${d.tcd?`<div><small class="muted">Como foi o teste:</small> ${esc(d.tcd)}</div>`:''}${d.sol?`<div><small class="muted">Solução:</small> ${esc(d.sol)}</div>`:''}</div>`:''}
  ${d.ff&&ffTxt(d.ff)?`<small class="muted">Momento da falha</small><p style="margin:0">${esc(ffTxt(d.ff))}</p>`:''}
  ${d.tm?`<small class="muted">Tempo de diagnóstico</small><p style="margin:0">${tmTxt(tmMs(d))}</p>`:''}
  ${d.fim?`<p style="margin:8px 0 0">${d.conf&&d.conf.r=='ok'?'<b style="color:'+KG+'">✓ Reparo confirmado em '+D(d.conf.data)+'</b>':'<span class="muted">Reparo ainda não confirmado</span>'}</p><button style="width:100%;margin-top:10px" class="wa" onclick="DG.relOS('${o.id}')">Enviar diagnóstico ao cliente</button>`:''}
  <button style="width:100%;margin-top:10px" class="${d.fim?'':'pr'}" onclick="DG.open('${o.id}')">${d.fim?'Ver no Diagnóstico':'Continuar o diagnóstico'}</button></div>`}
/* página de trabalho dentro do menu Diagnóstico */
function Vtrab(o){const v=vh(o.veh),c=cl(o.cli),[s,col]=dgInfo(o);
 return`<div class="dg-top"><button type="button" class="sm" onclick="go('diag')">← Diagnósticos</button><span class="sp"></span><button type="button" class="sm" onclick="go('order','${o.id}','diag')">Abrir O.S. ${esc(o.num)}</button></div>
 <div class="card dg-car"><div><b style="font-size:18px">${esc(vlabel(v))}</b><small class="muted" style="display:block">${esc(c.nome||'Sem cliente')} · O.S. ${esc(o.num)}${v.km?' · '+esc(v.km)+' km':''}</small></div>${mb(s,col)}</div>
 ${o.dg&&o.dg.tm?`<div class="dg-tmr"><span>⏱ Tempo de diagnóstico: <b id="dgtm" onclick="DG.tmEdit()">${tmTxt(tmMs(o.dg))}</b></span><span class="sp"></span>${o.dg.fim?'':`<button type="button" class="sm" onclick="DG.tmTog()">${o.dg.tm.on?'Pausar':'Continuar'}</button>`}</div>`:''}
 ${retornoHTML(o)}${histHTML(o)}`+DGtab(o)}

function Vdiag(){if(S.id){const o0=od(S.id);if(o0)return Vtrab(o0)}
 const k=S.f.dt||'and',O=db.orders.filter(started),and=O.filter(o=>!o.dg.fim);
 const T=[['and','Em andamento'],['casos','Casos resolvidos'],['cons','Consulta'],['cod','Códigos'],['val','Valores'],['calc','Calculadoras'],['eq','Equipamentos']];
 let b='';
 if(k=='and'){const conc=O.filter(o=>o.dg.fim).slice(-10).reverse();
  b=(DONO()&&!taxa()?`<div class="fbar">${svgi('alert')}<span>Defina o valor da <b>cobrança do diagnóstico</b> para ela entrar sozinha na O.S.</span><button class="sm" onclick="DG.tab('eq')">Definir</button></div>`:'')+sech('Em andamento',and.length?plural(and.length,'carro','carros'):'')+(and.slice().reverse().map(dgCard).join('')||empty('diag','Nenhum diagnóstico em andamento. Toque em “+ Diagnosticar” para começar.'))+
   (O.filter(o=>o.dg.fim&&!(o.dg.conf&&o.dg.conf.r=='ok')).length?sech('Confirmar o reparo',plural(O.filter(o=>o.dg.fim&&!(o.dg.conf&&o.dg.conf.r=='ok')).length,'carro','carros'))+O.filter(o=>o.dg.fim&&!(o.dg.conf&&o.dg.conf.r=='ok')).slice(-10).reverse().map(dgCard).join(''):'')+
   (conc.filter(o=>o.dg.conf&&o.dg.conf.r=='ok').length?sech('Concluídos recentemente','')+conc.filter(o=>o.dg.conf&&o.dg.conf.r=='ok').map(dgCard).join(''):'')+
   `<div class="card dg-how"><b>Como funciona</b><ol><li>Toque em <b>+ Diagnosticar</b> (ou num carro em andamento).</li><li>Informe os <b>códigos de falha</b>: digite ou tire uma <b>foto da tela do scanner</b>. Depois os <b>sintomas</b>.</li><li>Veja o <b>caminho rápido</b> dos casos parecidos, as causas prováveis e faça os testes marcando o resultado.</li><li>Achou o defeito? Salve: ele entra nos <b>Casos resolvidos</b> e preenche o <b>Laudo</b> da O.S. Na O.S. fica só o registro.</li></ol></div>`}
 if(k=='casos')b=srchIn('Buscar código, sintoma, defeito ou modelo',UI.casoQ,'DG.casoQ(this.value)')+topCodes()+`<div id="dgcasos">${casosList()}</div>`;
 if(k=='cons')b=srchIn('Código (P0301) ou sintoma (falha ao acelerar)',UI.cq,'DG.cq(this.value)')+`<div class="dg-chips" style="margin:8px 0 12px">${['P0171','P0300','P0335','falha ao acelerar','barulho no motor','esquentando','partida a frio'].map(x=>`<button type="button" class="dg-chip" onclick="document.getElementById('dgcqi').value='${x}';DG.cq('${x}')">${x}</button>`).join('')}</div><div id="dgcqo">${consulta()}</div>`;
 if(k=='cod'){const L=codes().slice().sort((a,b)=>String(a.code).localeCompare(b.code));
  b=`<p class="muted">Descrições de códigos cadastradas pela oficina. Elas são criadas quando você edita a descrição de um código ou escolhe a descrição do scanner na foto.</p>`+(L.map(x=>lcard({c:KB,n:`<span class="dg-ro sm">${esc(x.code)}</span>`,pill:mb(x.modelo?'Só '+esc(x.modelo):'Todos os veículos',KB),t:esc(x.t),m:esc((x.ca||[]).slice(0,3).join(' · ')),f:`<span class="sp"></span><button class="sm dg" onclick="confirmDel(this,()=>{const L=db.dcodes,j=L.findIndex(y=>y.id=='${esc(x.id)}');if(j>=0)L.splice(j,1);save();render()})">Apagar</button>`})).join('')||empty('notas','Nenhum código descrito pela oficina ainda.'))}
 if(k=='val')b=srchIn('Filtrar: bateria, MAP, compressão, óleo…',UI.vq,'DG.vq(this.value)')+`<p class="muted" style="margin:8px 0">Valores típicos para motores gasolina, etanol e flex. Confirme sempre no manual da montadora.</p><div id="dgvals">${valsHTML()}</div>`;
 if(k=='calc'){b=calcHTML();setTimeout(calcAll,0)}
 if(k=='eq'){const s=eqSet(),tx=taxa()||{};b=`<div class="card"><b>Cobrança do diagnóstico</b><p class="muted" style="margin:4px 0 10px">Entra sozinha na O.S. quando o diagnóstico começa (uma vez por O.S.). Deixe 0 para não cobrar.</p>${DONO()?`<div class="g2"><label>Valor (R$)<input id="dgtxv" inputmode="decimal" value="${tx.v!=null?esc(String(tx.v).replace('.',',')):''}" placeholder="150,00"></label><label>Descrição na O.S.<input id="dgtxd" value="${esc(tx.d||'Diagnóstico com scanner')}"></label></div><button class="pr" onclick="DG.taxa()">Salvar</button>`:`<p><b>${tx.v>0?R(tx.v)+' · '+esc(tx.d||''):'Não definida'}</b> <span class="muted">(só o dono altera)</span></p>`}</div>`+`<div class="card"><b>Equipamentos da oficina</b><p class="muted" style="margin:4px 0 10px">Os testes que usam equipamento não marcado vão para o fim da lista no diagnóstico.</p><div class="dg-eqlist">${Object.keys(EQ).map(x=>`<label><input type="checkbox" ${s.has(x)?'checked':''} onchange="DG.eq('${x}',this.checked)">${EQ[x]}</label>`).join('')}</div></div>`}
 return head({ico:'diag',kick:'Motores gasolina, etanol e flex',title:'Diagnóstico',c:DCOL,right:`<button class="pr hb" onclick="DG.novo()">+ Diagnosticar</button>`})+
  `<div class="seg" role="group">${T.map(([x,t])=>`<button type="button" class="${k==x?'on':''}" aria-pressed="${k==x}" onclick="DG.tab('${x}')">${t}</button>`).join('')}</div>`+b}
const srchIn=(ph,v,fn)=>`<div class="srch">${svgi('search')}<input ${fn.includes('cq')?'id="dgcqi"':''} type="search" placeholder="${ph}" value="${esc(v)}" oninput="${fn}"></div>`;
function dgCard(o){const d=o.dg,v=vh(o.veh),c=cl(o.cli),[s,col]=dgInfo(o);
 return lcard({c:d.fim?KG:KA,n:'O.S. '+esc(o.num),pill:mb(s,col),t:esc(vlabel(v)),m:`${esc(c.nome||'Sem cliente')}${d.def?' · Defeito: '+esc(d.def):''}`,f:(d.cod||[]).map(x=>`<span class="dg-ro sm">${esc(x)}</span>`).join('')+(d.sin||[]).map(x=>SYM[x]?mb(esc(SYM[x].t)):'').join(''),on:`DG.open('${o.id}')`})}
function topCodes(){const m=new Map();casos().forEach(c=>(c.cod||[]).forEach(x=>m.set(x,(m.get(x)||0)+1)));const t=[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
 return t.length?`<div class="dg-chips" style="margin:8px 0 10px">${t.map(([c,n])=>`<button type="button" class="dg-chip" onclick="document.querySelector('.srch input').value='${c}';DG.casoQ('${c}')">${c} · ${n}</button>`).join('')}</div>`:''}
function casoHTML(c){const v=c.veh||{},o=c.os?od(c.os):null;
 return lcard({c:KG,n:c.num?'O.S. '+esc(c.num):'',pill:c.sis?mb(esc(c.sis),KB):'',v:'',t:esc(c.def),m:esc([v.modelo,v.ano,v.motor].filter(Boolean).join(' · '))+(c.km?' · '+esc(c.km)+' km':'')+' · '+D(c.data)+
  (c.conf=='ok'?' · <b style="color:'+KG+'">✓ reparo confirmado</b>':c.conf=='falhou'?' · <b style="color:'+KR+'">não resolveu</b>':' · não confirmado')+(c.min?' · ⏱ '+tmTxt(c.min*60000):'')+(c.ff&&ffTxt(c.ff)?`<br><b>Freeze frame:</b> ${esc(ffTxt(c.ff))}`:'')+
  (c.tc&&TESTS[c.tc]?`<br><b>Confirmado com:</b> ${esc(TESTS[c.tc].n)}`:'')+(c.tcd?`<br><b>Como foi:</b> ${esc(c.tcd)}`:'')+(c.sol?`<br><b>Solução:</b> ${esc(c.sol)}`:'')+(c.obs?`<br><b>Obs.:</b> ${esc(c.obs)}`:''),
  f:(c.cod||[]).map(x=>`<span class="dg-ro sm">${esc(x)}</span>`).join('')+(c.sin||[]).map(x=>SYM[x]?mb(esc(SYM[x].t)):'').join('')+`<span class="sp"></span>${o?`<button class="sm" onclick="DG.open('${o.id}')">Abrir O.S.</button>`:''}<button class="sm dg" onclick="confirmDel(this,()=>DG.delCaso('${esc(c.id)}'))">Excluir</button>`})}
function casosList(){const all=casos().slice().reverse(),q=norm(UI.casoQ).trim();
 const L=q?all.filter(c=>norm([c.def,c.sis,c.sol,c.obs,(c.cod||[]).join(' '),(c.sin||[]).map(s=>SYM[s]?SYM[s].t:'').join(' '),c.veh&&c.veh.modelo,c.veh&&c.veh.motor].join(' ')).includes(q)):all;
 if(!all.length)return empty('diag','Nenhum caso resolvido ainda. Termine um diagnóstico na aba Diagnóstico da O.S. e toque em “Salvar caso”. Os próximos carros com o mesmo problema vão mostrar o caminho rápido.');
 return L.map(casoHTML).join('')||'<p class="muted">Nenhum caso encontrado.</p>'}
function testList(ids){const av=eqSet();return ids.map(t=>{const x=TESTS[t];return`<div class="dg-tc"><div class="dg-th"><b>${esc(x.n)}</b><span class="dg-eqs">${eqLabel(x,av)}</span></div><p>${esc(x.como)}</p><p><b>Esperado:</b> ${esc(x.esp)}</p></div>`}).join('')}
function casesBox(f){const cs=casos().filter(f);return cs.length?`<div class="card dg-fast"><b>Na sua oficina · ${plural(cs.length,'caso resolvido','casos resolvidos')}</b>${cs.slice(-4).reverse().map(casoHTML).join('')}</div>`:''}
function consulta(){const raw=String(UI.cq||'').trim();if(!raw)return'';const p=parseCode(raw);
 if(p.ok&&raw.replace(/\s/g,'').length<=6){const v=p.code,r=lookupV(v,undefined);
  if(!r)return casesBox(c=>(c.cod||[]).includes(v))+`<div class="card"><div class="dg-cc"><span class="dg-ro">${v}</span><span class="dg-cct"><b>Código ainda sem descrição</b><small class="muted">${SYS[v[0]]} · ${ctype(v)}</small></span></div><p class="muted">Para cadastrar a descrição, adicione o código num diagnóstico e toque em “+ Descrição”.</p><a class="btn" style="text-decoration:none" href="https://www.google.com/search?q=${encodeURIComponent(v+' código de falha')}" target="_blank" rel="noopener">Pesquisar no Google ↗</a></div>`;
  return casesBox(c=>(c.cod||[]).includes(v))+`<div class="card"><div class="dg-cc"><span class="dg-ro">${r.c}</span><span class="dg-cct"><b>${esc(r.t)}</b>${!r.custom&&r.en?`<small class="muted" style="display:block">SAE: ${esc(r.en)}</small>`:''}${mb('Gravidade '+SEV[r.s],r.s==3?KR:r.s==2?KA:KG)} ${r.custom?mb('Descrição da oficina',KB):r.auto?mb(r.auto=='fab'?'Sugestão automática':'Base ampliada',r.auto=='fab'?KA:KB):''}</span></div>${r.m?`<p>${esc(r.m)}</p>`:''}<b>Causas prováveis</b><ol>${r.ca.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><b>Testes, nesta ordem</b>${testList(r.tests)}</div>`}
 const ss=matchSym(raw);let h=ss.length?casesBox(c=>(c.sin||[]).includes(ss[0].id)):'';
 h+=ss.map((s,i)=>`<div class="card"><b style="font-size:18px">${esc(s.t)}</b>${s.ca.length?`<p style="margin:6px 0 2px"><b>Causas prováveis</b></p><ol>${s.ca.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}${i==0?`<b>Testes, nesta ordem</b>${testList(s.tests)}`:`<details><summary>Ver ${s.tests.length} testes</summary>${testList(s.tests)}</details>`}</div>`).join('');
 return h||`<p class="muted">Nada encontrado para “${esc(raw)}”. Tente o código completo (P0301) ou outras palavras.</p>`}
function valsHTML(){const n=norm(UI.vq).trim();const h=VALS.map(g=>{const rows=g[1].filter(r=>!n||norm(r.join(' ')+' '+g[0]).includes(n));if(!rows.length)return'';
 return`<div class="card"><b>${g[0]}</b><div style="overflow-x:auto"><table><tr><th>Item</th><th>Condição</th><th class="n">Valor típico</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td class="muted">${r[1]}</td><td class="n dg-v">${r[2]}</td></tr>`).join('')}</table></div></div>`}).join('');return h||'<p class="muted">Nenhum valor encontrado.</p>'}

/* ================= CALCULADORAS ================= */
const num=v=>{if(v==null)return NaN;v=String(v).trim().replace(',','.');return v===''?NaN:Number(v)};
const fmt=(n,d=1)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const gv=id=>{const x=document.getElementById(id);return x?x.value:''};
function box(cls,big,lines){return`<div class="dg-out ${cls}"><b>${big}</b>${lines.map(l=>`<p>${l}</p>`).join('')}</div>`}
function calcHTML(){const inp=(id,l,v,ph)=>`<label>${l}<input id="${id}" inputmode="decimal" value="${v||''}" placeholder="${ph||''}" oninput="DG.calc()"></label>`;
 return`<p class="muted">Os campos vêm com um exemplo. Troque pelos valores medidos no carro.</p><div class="dg-tools">
 <div class="card"><b>Correção de combustível</b><div class="g2">${inp('dgs1','STFT banco 1 (%)','6')}${inp('dgl1','LTFT banco 1 (%)','14')}${inp('dgs2','STFT banco 2 (%)','','opcional')}${inp('dgl2','LTFT banco 2 (%)','','opcional')}</div>
  <label>Comportamento a 2.500 rpm<select id="dgw" onchange="DG.calc()"><option value="ml">Correção melhora (fica perto de 0)</option><option value="alta">Correção piora (aumenta)</option><option value="igual">Fica parecida</option><option value="nd">Não medi</option></select></label><div id="dgft"></div></div>
 <div class="card"><b>Teste de compressão</b><div class="g2"><label>Cilindros<select id="dgnc" onchange="DG.calc()">${[3,4,5,6,8].map(n=>`<option ${n==4?'selected':''}>${n}</option>`).join('')}</select></label><label>Unidade<select id="dgcu" onchange="DG.calc()"><option value="psi">psi</option><option value="bar">bar</option></select></label></div>
  <div class="g2" id="dgcyl">${[165,160,158,128,'','','',''].map((v,i)=>`<label class="dgcy" ${i>=4?'hidden':''}>Cilindro ${i+1}<input id="dgcy${i}" inputmode="decimal" value="${v}" oninput="DG.calc()"></label>`).join('')}</div><div id="dgcp"></div></div>
 <div class="card"><b>Bateria e carga</b><div class="g2">${inp('dgbr','Repouso (V)','12,32')}${inp('dgbp','Na partida (V)','10,1')}${inp('dgbc','Motor ligado (V)','14,2')}</div><div id="dgbt"></div></div>
 <div class="card"><b>Queda de tensão</b><label>Circuito medido (sob carga)<select id="dgdc" onchange="DG.calc()"><option value="0.5">Positivo do motor de partida (máx. 0,5 V)</option><option value="0.3">Massa motor/carroceria na partida (máx. 0,3 V)</option><option value="0.3">Saída do alternador até a bateria (máx. 0,3 V)</option><option value="0.3">Alimentação de carga: ventoinha, bomba (máx. 0,3 V)</option><option value="0.1">Massa de sensor ou ECU (máx. 0,1 V)</option></select></label>${inp('dgdv','Queda medida (V)','0,72')}<div id="dgdr"></div></div></div>`}
function calcAll(){if(!document.getElementById('dgft'))return;
 {const s1=num(gv('dgs1')),l1=num(gv('dgl1')),s2=num(gv('dgs2')),l2=num(gv('dgl2')),w=gv('dgw');let h;
  if(isNaN(s1)||isNaN(l1))h=box('','—',['Preencha STFT e LTFT do banco 1.']);else{const t1=s1+l1,h2=!isNaN(s2)&&!isNaN(l2),t2=h2?s2+l2:null,wo=h2&&Math.abs(t2)>Math.abs(t1)?t2:t1,a=Math.abs(wo),lean=wo>0,L=[];
   L.push(a<=10?'Dentro do normal (±10%).':a<=25?`Mistura ${lean?'pobre':'rica'}: a ECU está compensando. Investigar.`:`Mistura ${lean?'pobre':'rica'} fora do limite: provável código ${lean?'P0171/P0174':'P0172/P0175'}.`);
   if(a>10){if(lean){if(w=='ml')L.push('Melhora em rotação: forte indício de <b>entrada falsa de ar</b>.');else if(w=='alta')L.push('Piora em rotação: suspeite de <b>falta de combustível</b> (bomba, filtro, regulador) ou MAF lendo pouco.');else if(w=='igual')L.push('Igual em toda faixa: verifique <b>MAF</b>, pressão de combustível e vazamento no escapamento antes da sonda.')}else L.push('Verifique pressão alta, injetor pingando, purga do canister aberta e sensor de temperatura.');
    if(h2){const df=Math.abs(t1-t2);L.push(df<=8?'Bancos parecidos: causa comum aos dois (MAF, combustível, admissão).':`Diferença de ${fmt(df,0)} pontos entre bancos: procure no banco com maior correção.`)}}
   h=box(a<=10?'ok':a<=25?'warn':'bad',`B1 ${t1>0?'+':''}${fmt(t1,0)}%${h2?` · B2 ${t2>0?'+':''}${fmt(t2,0)}%`:''}`,L)}$('#dgft').innerHTML=h}
 {const n=+gv('dgnc'),u=gv('dgcu'),d0=u=='bar'?1:0;document.querySelectorAll('.dgcy').forEach((l,i)=>l.hidden=i>=n);const vals=[];for(let i=0;i<n;i++)vals.push(num(gv('dgcy'+i)));const ok=vals.filter(v=>!isNaN(v)&&v>0);let h;
  if(ok.length<2)h=box('','—',['Preencha pelo menos dois cilindros.']);else{const mx=Math.max(...ok),mn=Math.min(...ok),vp=(mx-mn)/mx*100,st=vals.map(v=>isNaN(v)||v<=0?null:v/mx*100<75?'bad':v/mx*100<90?'warn':'ok'),low=st.map((s,i)=>s&&s!='ok'?i:-1).filter(i=>i>=0),col={ok:KG,warn:KA,bad:KR};
   const bars='<div class="dg-cyl">'+vals.map((v,i)=>st[i]?`<div><span>C${i+1}</span><i style="--w:${v/mx*100}%;--c:${col[st[i]]}"></i><span>${fmt(v,d0)}</span></div>`:'').join('')+'</div>';
   const L=[`Variação entre maior e menor: <b>${fmt(vp,1)}%</b> (aceitável até 10%).`];if(low.length){L.push(`Compressão baixa: ${low.map(i=>'C'+(i+1)).join(', ')}.`);if(low.some((v,k)=>k>0&&v-low[k-1]==1))L.push('Dois cilindros vizinhos baixos: suspeite de <b>junta do cabeçote</b> entre eles.');L.push('Faça o teste molhado: se subir bastante, <b>anéis</b>; se não mudar, <b>válvula</b> ou junta.')}
   h=bars+box(low.some(i=>st[i]=='bad')?'bad':(vp>10||low.length)?'warn':'ok',`${fmt(vp,1)}% de variação`,L)}$('#dgcp').innerHTML=h}
 {const soc=v=>{const t=[[11.89,0],[12.06,25],[12.24,50],[12.45,75],[12.65,100]];if(v<=t[0][0])return 0;if(v>=t[4][0])return 100;for(let i=1;i<t.length;i++)if(v<=t[i][0]){const[a,pa]=t[i-1],[b,pb]=t[i];return pa+(v-a)/(b-a)*(pb-pa)}return 100};
  const r=num(gv('dgbr')),p=num(gv('dgbp')),c=num(gv('dgbc'));let h='';
  if(!isNaN(r)){const s=soc(r);h+=box(s>=75?'ok':s>=50?'warn':'bad',`${fmt(s,0)}% de carga`,[`Repouso ${fmt(r,2)} V. ${s>=75?'Carga adequada.':s>=50?'Carga baixa: recarregue antes de testar.':'Descarregada: recarregue e teste sob carga.'}`])}
  if(!isNaN(p))h+=box(p>=9.6?'ok':'bad',`${fmt(p,1)} V na partida`,[p>=9.6?'Bateria e cabos aguentam a partida.':'Abaixo de 9,6 V: bateria fraca, cabo com resistência ou motor de partida consumindo demais.']);
  if(!isNaN(c))h+=box(c<13.2||c>15?'bad':c<13.8||c>14.7?'warn':'ok',`${fmt(c,1)} V com motor ligado`,[c<13.2?'Não está carregando: alternador, correia ou cabos.':c>15?'Sobrecarga: regulador do alternador com defeito.':c<13.8||c>14.7?'Fora da faixa comum. Normal se o alternador for controlado pela ECU.':'Sistema de carga dentro da faixa.']);$('#dgbt').innerHTML=h}
 {const lim=num(gv('dgdc')),v=num(gv('dgdv'));$('#dgdr').innerHTML=isNaN(v)?box('','—',['Informe a queda medida.']):box(v<=lim?'ok':v<=lim*1.5?'warn':'bad',`${fmt(v,2)} V`,[v<=lim?`Dentro do limite de ${fmt(lim,1)} V.`:`Acima do limite de ${fmt(lim,1)} V. Procure terminal oxidado, cabo fino ou conexão frouxa. Meça por trechos.`])}}

/* ================= ESTILO ================= */
const css=`
.dg-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}
.dg-stp{display:flex;align-items:center;gap:8px;text-align:left;padding:9px 10px;border:1px solid var(--ln);border-top:4px solid var(--ln);border-radius:10px;background:var(--sf);color:var(--mut);margin:0;min-width:0}
.dg-stp b{font:600 15px "Barlow Condensed",sans-serif;flex:none}.dg-stp span{font-size:13px;line-height:1.2}
.dg-stp.ok{border-top-color:#2E8B57;color:var(--ink)}.dg-stp.on{border-top-color:var(--hi);color:var(--ink);background:color-mix(in srgb,var(--hi) 12%,var(--sf))}.dg-stp.on span{font-weight:700}
.dg-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:10px}.dg-h b{font:600 19px "Barlow Condensed",sans-serif}
.dg-row{display:flex;gap:8px;align-items:stretch}.dg-row input{margin:0;flex:1;min-width:0}.dg-row button{margin:0}
.dg-code{font:700 20px ui-monospace,Menlo,monospace!important;letter-spacing:.08em;text-transform:uppercase}
.dg-prev{margin:8px 0 10px;padding:8px 11px;border:1px dashed var(--ln);border-radius:8px;font-size:14px}.dg-prev b{font-family:ui-monospace,Menlo,monospace}
.dg-err{color:#B4472E;font-weight:600}
.dg-ro{font:700 15px ui-monospace,Menlo,monospace;padding:5px 9px;border-radius:5px;background:#17181A;color:#F5B700;white-space:nowrap;letter-spacing:.04em}.dg-ro.sm{font-size:12.5px;padding:2px 7px}
.dg-cc{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 10px;border:1px solid var(--ln);border-radius:8px;background:var(--bg);margin-bottom:6px}
.dg-cct b{display:block;line-height:1.25;margin-bottom:3px}.dg-cca{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.dg-cca button{margin:0}
.dg-sugrow{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--mut);margin-bottom:8px}.dg-sugrow button{margin:0}
.dg-sugs{display:grid;gap:6px;margin:6px 0 4px}
.dg-sug{text-align:left;border:1px solid var(--hi);background:color-mix(in srgb,var(--hi) 12%,var(--sf));border-radius:8px;padding:9px 12px;margin:0}.dg-sug small{display:block;color:var(--mut);font-weight:500}
.dg-gl{display:block;margin:12px 0 5px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:600}
.dg-chips{display:flex;gap:6px;flex-wrap:wrap}
.dg-chip{border:1px solid var(--ln);background:var(--sf);border-radius:99px;padding:7px 12px;margin:0;font-weight:500;font-size:14px}
.dg-chip[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}.dg-chip[aria-pressed="true"]::before{content:"✓ "}
.dg-next{position:sticky;bottom:calc(8px + env(safe-area-inset-bottom,0px));margin-right:72px!important;z-index:5;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:var(--sf);border:1px solid var(--ln);border-radius:12px;padding:10px 12px;margin:12px 0 4px;box-shadow:0 6px 22px rgba(0,0,0,.18)}
.dg-next span{flex:1 1 160px;font-size:13px}.dg-next button{margin:0;padding:10px 16px}
.dg-sum{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px}.dg-sum button{margin:0}
.dg-tg{font-size:13px;padding:3px 9px;border-radius:99px;border:1px solid var(--ln);background:var(--sf)}
.dg-fast{border:2px solid var(--hi);background:color-mix(in srgb,var(--hi) 9%,var(--sf))}
.dg-case{display:grid;gap:4px;background:var(--sf);border:1px solid var(--ln);border-radius:8px;padding:10px 12px;margin-top:8px}.dg-case small{color:var(--mut);font-size:13px}.dg-case button{margin:4px 0 0}
.dg-ct{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.dg-ct b{font-size:16px}
.dg-n{font:600 12px Barlow,sans-serif;padding:2px 8px;border-radius:99px;background:var(--ink);color:var(--bg);white-space:nowrap}
.dg-causes{list-style:none;margin:0;padding:0;display:grid;gap:6px;counter-reset:c}
.dg-causes li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--ln);border-radius:8px;background:var(--bg);counter-increment:c}
.dg-causes li::before{content:counter(c);font:600 15px "Barlow Condensed",sans-serif;color:var(--mut);width:1.2em;text-align:right}
.dg-causes li.hist{border-color:var(--hi);background:color-mix(in srgb,var(--hi) 10%,var(--sf))}
.dg-causes small{display:block;color:var(--mut);font-size:12px}.dg-causes i{display:block;height:4px;max-width:200px;border-radius:2px;margin-top:4px;background:linear-gradient(90deg,var(--hi) var(--w),var(--ln) var(--w))}.dg-causes button{margin:0}
.dg-bar{height:6px;border-radius:3px;background:var(--ln);overflow:hidden;margin:0 0 12px}.dg-bar i{display:block;height:100%;background:#2E8B57}
.dg-tc{border:1px solid var(--ln);border-left:5px solid var(--ln);border-radius:10px;padding:11px 12px;margin-bottom:8px;background:var(--bg);display:grid;gap:7px}
.dg-tc.r-ok{border-left-color:#2E8B57}.dg-tc.r-falha{border-left-color:#B4472E;background:color-mix(in srgb,#B4472E 9%,var(--sf))}.dg-tc.r-inc{border-left-color:#C98200}
.dg-tc p{margin:4px 0;font-size:14px}.dg-tc details summary{cursor:pointer;color:var(--ac);font-weight:600;font-size:14px}.dg-tc input{margin:0}.dg-tc>button{justify-self:start;margin:0}
.dg-th{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:flex-start}
.dg-eqs{display:flex;gap:4px;flex-wrap:wrap}.dg-eq{font-size:11.5px;font-weight:600;padding:2px 6px;border-radius:4px;border:1px solid var(--ln);background:var(--sf);color:var(--mut);white-space:nowrap}.dg-eq.miss{border-style:dashed;opacity:.7}
.dg-hb{font-size:11.5px;font-weight:700;padding:2px 7px;border-radius:4px;background:var(--hi);color:#17181A;white-space:nowrap}
.dg-seg{display:grid;grid-template-columns:repeat(3,auto);width:fit-content;max-width:100%;border:1px solid var(--ln);border-radius:8px;overflow:hidden}
.dg-seg button{border:0;border-right:1px solid var(--ln);border-radius:0;margin:0;background:var(--sf);padding:8px 14px}.dg-seg button:last-child{border-right:0}
.dg-seg button[aria-pressed="true"][data-r="ok"]{background:#2E8B57;color:#fff}.dg-seg button[aria-pressed="true"][data-r="falha"]{background:#B4472E;color:#fff}.dg-seg button[aria-pressed="true"][data-r="inc"]{background:#C98200;color:#fff}
.dg-tin{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px}
.dg-miss summary{cursor:pointer;color:var(--ac);font-weight:600;margin:6px 0 8px}
.dg-ok{border:2px solid #2E8B57;background:color-mix(in srgb,#2E8B57 10%,var(--sf))}
.dg-msg{border-top:6px solid var(--hi)}.dg-msg.warn{border-top-color:#B4472E}.dg-msg ul{margin:0;padding-left:1.2em;display:grid;gap:6px}
.dg-ed{max-width:560px}.dg-pick{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:2px;max-height:240px;overflow:auto;border:1px solid var(--ln);border-radius:8px;padding:4px;background:var(--bg);margin-top:4px}
.dg-pick label{display:flex;gap:8px;align-items:flex-start;margin:0;padding:5px 6px;color:var(--ink);font-size:13.5px}.dg-pick input,.dg-eqlist input{width:auto;margin:2px 0 0;accent-color:#2E8B57}
.dg-eqlist{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px}.dg-eqlist label{display:flex;gap:10px;align-items:center;margin:0;padding:9px 12px;border:1px solid var(--ln);border-radius:8px;background:var(--bg);color:var(--ink);font-size:14px}
.dg-how ol{margin:6px 0 0;padding-left:1.2em;display:grid;gap:4px}
.dg-v{font-family:ui-monospace,Menlo,monospace;font-size:13px;white-space:nowrap}
.dg-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dg-tools .card{margin:0}.dg-tools .card>b{display:block;font:600 19px "Barlow Condensed",sans-serif;margin-bottom:8px}
.dg-out{border-radius:8px;padding:10px 12px;margin-top:6px;background:var(--bg);border:1px solid var(--ln)}.dg-out b{font:700 19px ui-monospace,Menlo,monospace}.dg-out p{margin:4px 0 0;font-size:14px}
.dg-out.ok{background:color-mix(in srgb,#2E8B57 12%,var(--sf));border-color:transparent}.dg-out.ok>b{color:#2E8B57}
.dg-out.warn{background:color-mix(in srgb,#C98200 13%,var(--sf));border-color:transparent}.dg-out.warn>b{color:#C98200}
.dg-out.bad{background:color-mix(in srgb,#B4472E 12%,var(--sf));border-color:transparent}.dg-out.bad>b{color:#B4472E}
.dg-cyl{display:grid;gap:5px;margin-top:6px}.dg-cyl div{display:grid;grid-template-columns:30px 1fr 48px;gap:8px;align-items:center;font:500 13px ui-monospace,Menlo,monospace}.dg-cyl i{height:12px;border-radius:2px;background:linear-gradient(90deg,var(--c) var(--w),var(--ln) var(--w))}.dg-cyl span:last-child{text-align:right}
@media (max-width:760px){.dg-stp{flex-direction:column;align-items:flex-start;gap:2px}.dg-stp span{font-size:12px}.dg-tin{grid-template-columns:1fr}.dg-tools{grid-template-columns:1fr}.dg-causes li{grid-template-columns:auto minmax(0,1fr)}.dg-causes li button{grid-column:2;justify-self:start}}

.dg-foto{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 10px}.dg-foto button{display:inline-flex;gap:6px;align-items:center}.dg-foto button svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round}.dg-foto small{flex-basis:100%}
.dg-ocr{border:1px solid var(--ln);border-radius:10px;padding:10px;margin:8px 0}.dg-ocr.off{opacity:.55}.dg-ocrh{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0}.dg-ocrh input[type=checkbox]{width:22px;height:22px}
.dg-ocrh .dg-code.sm{width:96px;font-size:16px;padding:6px 8px;margin:0}.dg-ocrq{margin:8px 0 4px}
.dg-opt{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--ln);border-radius:8px;padding:8px;margin:6px 0;cursor:pointer}.dg-opt.on{border-color:${KB};box-shadow:0 0 0 1px ${KB} inset}
.dg-opt input[type=radio]{margin-top:4px;width:20px;height:20px}.dg-opt span{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.dg-opt textarea{width:100%;margin:0;min-height:52px}
.dg-ocrp span{display:block;margin-bottom:8px}.dg-ocrp div{height:8px;border-radius:4px;background:var(--ln);overflow:hidden}.dg-ocrp i{display:block;height:100%;width:3%;background:${KB};transition:width .3s}
.dg-ocrm .bar{position:sticky;bottom:-16px;background:inherit;padding:10px 0 4px;margin-bottom:-4px!important;border-top:1px solid var(--ln)}
.dg-ocrt{white-space:pre-wrap;font-size:12px;max-height:180px;overflow:auto;background:var(--bg);padding:8px;border-radius:6px}
.dg-top{display:flex;gap:8px;align-items:center;margin:0 0 10px}.dg-car{display:flex;justify-content:space-between;gap:10px;align-items:center}
.dg-rec small.muted{display:block;margin:8px 0 4px}.dg-recl{list-style:none;padding:0;margin:0}.dg-recl li{padding:4px 0}.dg-recf{border-top:1px solid var(--ln);margin-top:8px;padding-top:4px}.dg-recf b{display:block;font-size:17px}

.dg-tbr{display:flex;flex-direction:column;gap:6px;margin:6px 0 4px}.dg-tbi{display:block;text-align:left;width:100%;padding:9px 10px}.dg-tbi b{margin-right:6px}.dg-tbi small{display:block;color:var(--mut);font-weight:400;margin-top:2px}
.dg-tcx{margin-top:12px}.dg-lb{display:block;margin-bottom:6px}.dg-tcsel{display:flex;justify-content:space-between;gap:8px;align-items:center;border:1px solid var(--ln);border-radius:8px;padding:8px 10px;margin-bottom:8px}

.dg-ret{border-color:#C98200;border-left:5px solid #C98200}.dg-conf{border-left:5px solid #C98200}
.dg-tmr{display:flex;align-items:center;gap:8px;margin:0 0 10px;padding:8px 12px;border:1px solid var(--ln);border-radius:10px}.dg-tmr #dgtm{cursor:pointer;text-decoration:underline dotted}
.dg-hist summary,.dg-ff summary{cursor:pointer;list-style:revert}.dg-hi{display:grid;grid-template-columns:1fr auto;gap:2px 8px;width:100%;text-align:left;margin:8px 0 0;padding:9px 10px}.dg-hi small{grid-column:1/-1;color:var(--mut);font-weight:400}
.dg-ffg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 10px}.dg-ffg label{margin:0 0 8px}
.dg-tf{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.dg-tf figure{position:relative;margin:0;width:64px;height:64px}.dg-tf img{width:64px;height:64px;object-fit:cover;border-radius:8px;cursor:zoom-in}
.dg-tf figure button{position:absolute;top:-8px;right:-8px;width:26px;height:26px;min-height:0;padding:0;border-radius:50%;line-height:1}
.dg-tfb{display:inline-flex;align-items:center;gap:6px;border:1px dashed var(--ln);border-radius:8px;padding:8px 12px;cursor:pointer;margin:0;font-weight:600}.dg-tfb svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}
.dg-prox{display:flex;flex-direction:column;gap:8px;margin-top:8px}.dg-prox button{width:100%}
`;
const st=document.createElement('style');st.id='dg-css';st.textContent=css;document.head.appendChild(st);

/* ================= LIGAÇÃO COM O GESTOR ================= */
DG.ui=UI;G.DG=DG;G.DGtab=DGtab;G.DGrec=DGrec;G.dgInfo=dgInfo;G.Vdiag=Vdiag;
/* "+ Diagnosticar": depois de criar a O.S., abre direto na aba Diagnóstico */
if(typeof go=='function'){const _go=go;go=function(v,id,tab,f){if(v=='order'&&DG.next){DG.next=null;return _go('diag',id)}return _go(v,id,tab,f)}}
/* ao trocar de O.S., limpa o que estava digitado */
let _last=null;const _rs=setInterval(()=>{if(S&&(S.v=='order'||S.v=='diag')&&S.id&&S.id!==_last){_last=S.id;UI.code='';UI.sym='';UI.tf='todos'}},400);
})(window);
