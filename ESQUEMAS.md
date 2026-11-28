# Módulo Esquemas Elétricos (Fio-Mar Gestor 2.54.0)

Esquemas elétricos dentro do próprio app da oficina: busca por carro, visualizador de PDF/imagem, pinagem de conectores, fusíveis e relés, legenda de cores dos fios, favoritos, anotações e uso sem internet.

Os esquemas são enviados pela própria oficina, para uso interno. **Nenhum esquema de fabricante vem no código.**

## Arquivos
| Arquivo | O que faz |
|---|---|
| `esq.js` | Entrada (sempre carregado, pequeno). Põe o item no menu, o ícone e o endereço `#esquemas`, e os botões "Ver esquemas" no veículo e na O.S. Carrega o resto só ao abrir o módulo. |
| `esquemas.js` | Telas `esq` (busca, cascata e lista) e `esqv` (visualizador), conectores e pinos, fusíveis e relés, cores, favoritos, anotações e offline. |
| `esquemas-adm.js` | Tela `esqadm` (cadastro, só o dono): carros, esquemas com arquivo, conectores, pinos, fusíveis, relés e sistemas. |
| `lib/pdfjs-4.10.38/` | pdf.js da Mozilla (Apache 2.0), guardado no app, sem CDN. Abre com `isEvalSupported: false`. |

## Banco (Supabase, migration `esquemas_eletricos`)
Só criações; nenhuma tabela existente foi alterada. O SQL fica no kit de testes (`sql/esquemas_eletricos.sql`).

- **Tabelas (todas com `oficina_id`):**
  - `esq_marcas`, `esq_modelos`, `esq_veiculos`;
  - `esq_sistemas` (`oficina_id` nulo = sistema padrão);
  - `esq_esquemas` (com `busca tsvector`), `esq_conectores`, `esq_pinos`, `esq_fusiveis`;
  - `esq_favoritos`, `esq_anotacoes`.
- **Chaves compostas `(id, oficina_id)`:** um filho nunca aponta para o pai de outra oficina. Apagar o pai apaga os filhos (`on delete cascade`).
- **Busca:** função `esq_buscar(of, q, lim)`.
  - Usa `unaccent` + `pg_trgm`, e é `security invoker` (o RLS vale).
  - Procura em marca, modelo, anos, motor, versão, sistema, título, descrição, etiquetas, conectores, pinos (função e cor) e fusíveis/relés.
  - Cada palavra precisa aparecer ou ser parecida (erro de digitação).
- **RLS:**
  - Catálogo: ler = membro da oficina (`fm_membro`); gravar = dono (`fm_dono`).
  - Sistemas padrão: só o admin da plataforma (`fm_admin`) muda.
  - Favoritos e anotações: só do próprio usuário (`user_id = auth.uid()`), e só dentro da oficina dele.
  - Anônimo: sem acesso.
- **Storage:** bucket privado `esquemas`.
  - Limite de 25 MB; só PDF, PNG, JPG e SVG.
  - Caminho `<oficina_id>/<id>-<marca>.<ext>`, mais a miniatura `...-min.jpg`.
  - Ver = membro (link assinado); enviar, trocar e apagar = dono.

## Como funciona no app
- **Tela inicial (2.57):**
  - busca e, para o dono, um botão só: **Gerenciar** (+ Adicionar esquema, Importar pacote, Cadastro);
  - cascata marca → modelo → ano → motor/versão. Se só sobra uma opção, ela é escolhida sozinha. Com o carro escolhido, a cascata recolhe e fica o cartão do carro, com "Trocar" e "baixar o carro inteiro";
  - **Recentes** (neste aparelho), Favoritos, Baixados e Carros. Os carros mostram a sigla da marca (só letras); os sem esquema vão para o fim, mais apagados;
  - a busca livre usa o servidor; sem internet, procura na cópia do aparelho.
- **Visualizador em modo foco (2.57):**
  - ocupa a tela toda: somem o topo e a barra de baixo do app;
  - barra fina em cima (voltar, título, favorito, ⋯) e embaixo (páginas, noite, tela cheia, **Pinos**). Um toque no desenho esconde as barras;
  - pinça, arrastar, toque duplo (aproxima no ponto), roda do mouse; zoom até 10×. Com zoom, só o pedaço que aparece é redesenhado nítido;
  - a próxima página do PDF já fica desenhada;
  - ⋯: brilho, zoom pelos botões, tela cheia, marcar ponto, anotação, baixar, anexar à O.S., editar (dono);
  - **gaveta** (embaixo em pé; do lado deitado) com Conectores, Anotações e Sobre. A alça aumenta ou diminui;
  - **pinos em tabela** (Pino | Cor | Função, com o valor embaixo; em tela larga, Valor numa coluna), com filtro quando há mais de 5 pinos ("12", "pino 12", "VD", "verde", "sonda");
  - aberto pela busca, a gaveta abre com os pinos que combinam destacados.
- **CSP do app:** imagens só de `blob:`/`data:`. Por isso o arquivo vem pelo link assinado (`connect-src *.supabase.co`) e é mostrado como `blob:`. SVG é mostrado sempre por `<img>`, para nenhum script de dentro do arquivo rodar.
- **Offline:**
  - "Baixar" guarda no IndexedDB o arquivo, a miniatura, os conectores, os pinos, os fusíveis do carro e as suas anotações;
  - o catálogo fica sempre guardado e aparece na hora (a internet atualiza logo depois);
  - os 3 últimos arquivos abertos ficam no aparelho (abrem na hora, até sem internet);
  - PDF sem miniatura: a da página 1 fica guardada no aparelho quando é aberto;
  - o service worker guarda o pdf.js num cache fixo (a versão está no nome da pasta).
- **Integração com a gestão:**
  - **Veículo do cliente:** botão "Ver esquemas". O carro do cliente fica ligado a um carro dos esquemas pelo campo `esqv`, no JSON. Quando ainda não está ligado, o app sugere os parecidos.
  - **O.S.:** "Ver esquemas elétricos" no ⋯. O esquema pode ser anexado à O.S. (`o.esqs`), e aparece no Resumo.
- **Apagar:** acontece na hora, com Desfazer (regra da 2.53). O arquivo só sai do servidor depois do tempo do Desfazer.

## Dados técnicos dos componentes (2.58)
- Tabela `esq_componentes` (migration `esquemas_componentes`, só cria): um componente por linha, ligado ao carro.
  - Campos: `nome`, `sigla`, `tabelas` (jsonb: `[{titulo, colunas, linhas}]`), `notas`, `folha` e `pacote`.
  - RLS igual ao dos fusíveis: a oficina lê e só o dono grava. Apagar o carro leva junto (cascade).
- **De onde vêm, ao importar o pacote:**
  1. `"componentes"` no dados.json, no fiomar.json ou num `componentes.json`:
     `[{"nome":"Sensor de pressão absoluta — MAP","sigla":"MAP","folha":13,"tabelas":[{"titulo":"","colunas":["Item","Valor"],"linhas":[["Pino 62","Sinal"]]}],"notas":["…"]}]`
  2. Sem isso, das folhas cujo título tem "Dados técnicos" ou "Componentes" (SVG):
     - título vermelho em negrito = componente;
     - textos brancos em negrito = colunas;
     - textos da mesma altura = uma linha;
     - itálico = observação;
     - o carimbo de baixo fica de fora.
     - "MAP — pressão × tensão" logo depois do "… — MAP" vira outra tabela do mesmo componente, até na folha seguinte.
  - A revisão nova troca só os componentes daquele pacote.
- **No app:**
  - aba **Componentes** no carro: cada componente fechado, com a sigla, e filtro;
  - no visualizador, a gaveta mostra **"Nesta folha"** (pela sigla no título da folha ou por palavra do nome) e **"Outros do carro"**;
  - folha sem pinos e com componentes: o botão vira **Dados** e a gaveta abre nos componentes;
  - a busca acha os componentes (ex.: "MAP marcha lenta") e abre o carro com o componente aberto e a linha destacada;
  - ficam no catálogo, então funcionam sem internet.

## Permissões (conferidas no banco e na tela)
| Ação | Dono | Mecânico | Outra oficina |
|---|---|---|---|
| Ver e buscar esquemas, pinos e fusíveis | ✔ | ✔ | ✘ |
| Favoritos e anotações (só os próprios) | ✔ | ✔ | ✘ |
| Cadastrar, mudar ou apagar catálogo e arquivos | ✔ | ✘ | ✘ |

## Testes
- `e2e-comp258.js` (kit): dados dos componentes, com pacotes fictícios (2.58).
- `e2e-esq257.js` (kit): modo foco, pinos em tabela, tela inicial e velocidade (2.57).
- `e2e-esq254.js` (kit): o módulo inteiro, com dados **fictícios** (`esq-seed.js` e `esq-teste/`, gerados por `gera_esq_teste.py`). Esses dados vão só para o Supabase falso dos testes, nunca para o banco real.
- `sql/teste_esquemas_rls.sql`: regras do banco com usuários de teste. Roda e desfaz tudo no fim.
