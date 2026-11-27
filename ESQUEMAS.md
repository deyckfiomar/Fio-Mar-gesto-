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
- **Busca:** em cascata marca → modelo → ano → motor/versão. Se só sobra uma opção, ela é escolhida sozinha. A busca livre usa o servidor; sem internet, procura na cópia do aparelho.
- **Visualizador:**
  - pinça, arrastar, toque duplo e roda do mouse;
  - páginas do PDF, que é redesenhado com mais nitidez quando o zoom aumenta;
  - modo noite (inverte as cores), brilho e tela cheia (tenta deitar a tela);
  - na paisagem, ocupa a tela.
- **CSP do app:** imagens só de `blob:`/`data:`. Por isso o arquivo vem pelo link assinado (`connect-src *.supabase.co`) e é mostrado como `blob:`. SVG é mostrado sempre por `<img>`, para nenhum script de dentro do arquivo rodar.
- **Offline:**
  - "Baixar" guarda no IndexedDB o arquivo, a miniatura, os conectores, os pinos, os fusíveis do carro e as suas anotações;
  - o catálogo fica sempre guardado;
  - o service worker guarda o pdf.js num cache fixo (a versão está no nome da pasta).
- **Integração com a gestão:**
  - **Veículo do cliente:** botão "Ver esquemas". O carro do cliente fica ligado a um carro dos esquemas pelo campo `esqv`, no JSON. Quando ainda não está ligado, o app sugere os parecidos.
  - **O.S.:** "Ver esquemas elétricos" no ⋯. O esquema pode ser anexado à O.S. (`o.esqs`), e aparece no Resumo.
- **Apagar:** acontece na hora, com Desfazer (regra da 2.53). O arquivo só sai do servidor depois do tempo do Desfazer.

## Permissões (conferidas no banco e na tela)
| Ação | Dono | Mecânico | Outra oficina |
|---|---|---|---|
| Ver e buscar esquemas, pinos e fusíveis | ✔ | ✔ | ✘ |
| Favoritos e anotações (só os próprios) | ✔ | ✔ | ✘ |
| Cadastrar, mudar ou apagar catálogo e arquivos | ✔ | ✘ | ✘ |

## Testes
- `e2e-esq254.js` (kit): o módulo inteiro, com dados **fictícios** (`esq-seed.js` e `esq-teste/`, gerados por `gera_esq_teste.py`). Esses dados vão só para o Supabase falso dos testes, nunca para o banco real.
- `sql/teste_esquemas_rls.sql`: regras do banco com usuários de teste. Roda e desfaz tudo no fim.
