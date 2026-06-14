## Objetivo
Extrair, de uma vez só, a primeira página de cada arquivo CBR/CBZ/PDF dentro das pastas **Marvel** e **DC**, salvar essas capas no bucket `comic-covers` do backend, e fazer o app usar essas capas direto — parando de depender da thumbnail do Google Drive (que falha em arquivos grandes).

Mangás, manhwas e outras editoras continuam funcionando como hoje (sem mexer).

## O que será feito

1. **Edge function `extract-marvel-dc-covers`** (rodada manualmente quando você quiser atualizar):
   - Lê `public/data/drive_tree.json`.
   - Acha as pastas raiz "Marvel" e "DC" (case-insensitive).
   - Para cada arquivo CBR/CBZ dentro delas:
     - Baixa via `drive-proxy`.
     - Extrai a 1ª imagem com `libarchive` (rodando no Deno).
     - Redimensiona pra ~600px de largura, JPEG q=0.82.
     - Faz upload em `comic-covers/{fileId}.jpg` (público).
   - Pula arquivos já presentes no bucket (idempotente — pode rodar de novo a qualquer hora pra capturar novos uploads).
   - Retorna um JSON com `{processed, skipped, failed}`.

2. **Tabela `comic_cover_index`** (pequena, só pra controle):
   - `file_id` (pk), `bucket_path`, `extracted_at`, `status`.
   - RLS: leitura pública (`anon`), escrita só pelo `service_role`.
   - Frontend lê isso uma vez no boot e monta um mapa `fileId → URL pública`.

3. **Frontend — `src/lib/drive.ts` e `src/components/FolderGrid.tsx`**:
   - Nova função `getBucketCover(fileId)` retornando a URL pública do bucket (se existir no índice).
   - Ordem de prioridade nova para capas em HQ Marvel/DC:
     1. Capa do bucket (`comic-covers`) ← **nova fonte estável**
     2. Thumb do Drive (fallback)
     3. Extração on-demand (fallback final, como hoje)
   - Para pastas Marvel/DC, usa a capa do primeiro arquivo dentro como capa da pasta (usando o mesmo índice).

4. **Botão admin "Atualizar capas Marvel/DC"** (visível só pra você):
   - Chama a edge function e mostra progresso/resultado.
   - Fica em algum canto discreto da Home ou Admin.

## Resultado esperado

- Primeira rodada: leva alguns minutos (depende de quantos CBRs tem em Marvel/DC).
- Depois disso: capas aparecem instantâneas, sem depender do Drive.
- Quando você subir novos HQs Marvel/DC, é só clicar no botão de novo — só os novos serão processados.
- Mangás/Manhwas: zero mudança.

## Detalhes técnicos

- Bucket `comic-covers` já existe e é público — só vamos usar.
- `libarchive` em Deno: usa `npm:libarchive.js` com o worker bundle servido inline.
- Concorrência limitada a 3 downloads simultâneos pra não estourar memória do edge runtime.
- Timeout total da função: 60s por batch; cliente chama em loop até `processed === 0` pra cobrir acervos grandes.
- Migration cria a tabela com os GRANTs corretos (`SELECT` pra `anon`, `ALL` pra `service_role`).

Posso seguir?
