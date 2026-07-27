# Blueprint do App — para replicar em outros nichos (versão em branco)

Cole o bloco abaixo em outro chat do Lovable como prompt inicial. Ele descreve toda a arquitetura, sem os dados/nicho de quadrinhos, para você adaptar a qualquer área (filmes, cursos, receitas, música, etc.).

---

## PROMPT PARA O NOVO CHAT

Quero criar um app web (PWA) do tipo "biblioteca/catálogo com área de membros paga", com o mesmo esqueleto técnico deste blueprint. Substitua "ITENS" pelo nicho que eu escolher depois (ex.: filmes, cursos, receitas).

### Stack
- **Front:** Vite + React 18 + TypeScript + Tailwind CSS v3 + shadcn/ui (Radix) + React Router v7 + TanStack Query + React Hook Form + Zod + Sonner (toasts) + Lucide icons + next-themes.
- **PWA:** service worker próprio em `public/sw.js` com versão manual, registrado em `src/main.tsx` (desregistrar SW antigos ao subir versão nova).
- **Backend:** Lovable Cloud (Supabase gerenciado) — Postgres + Auth + Storage + Edge Functions (Deno).
- **Storage externo de conteúdo:** Google Drive (via connector Lovable) — usado como CDN de arquivos grandes, acessado por edge function proxy.
- **Testes:** Vitest + Testing Library + jsdom.

### Estrutura de pastas
```
src/
  pages/         Index, Login, NotFound, AdminCovers, Unsubscribe
  components/    UI de alto nível (Grid, Reader, Search, ProtectedRoute, PwaInstall)
    ui/          shadcn primitives
  hooks/         useAuth, use-mobile, use-toast
  lib/           regras de negócio puras (search, dedupe, popularity, drive, ...)
  integrations/supabase/  client + types (auto-gerados, não editar)
  test/          specs Vitest
supabase/
  functions/     edge functions Deno
  migrations/    SQL versionado
public/
  sw.js          service worker
  data/          JSONs estáticos (árvore de conteúdo, cache)
```

### Autenticação e controle de acesso
- Supabase Auth com **email/senha + Google OAuth** (usar `lovable.auth.signInWithOAuth` do módulo `@/integrations/lovable`).
- Sem cadastro aberto: acesso liberado só para emails que constam na tabela `access_grants` com `status = 'active'`.
- Concessão feita automaticamente por **webhook de compra Yampi** (`supabase/functions/yampi-webhook`) validado por `YAMPI_WEBHOOK_TOKEN`.
- Função Postgres SECURITY DEFINER `check_access_status(email)` consultada no login.
- Roles em tabela separada `user_roles` + enum `app_role` + função `has_role(uuid, app_role)` (nunca guardar role em profiles).
- `ProtectedRoute` bloqueia rotas privadas; hook `useAuth` centraliza sessão.

### Modelo de dados (tabelas públicas)
- `access_grants` — email, status (enum `active|revoked|pending`), source, order_id, product_name, amount, granted_at, revoked_at.
- `user_roles` — user_id, role (`admin|user`).
- `item_cover_index` — cache do path da capa/thumb no bucket para cada item externo (renomear "comic" → nicho).
- `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails` — infra de email transacional com fila pgmq.

Regras obrigatórias em toda tabela pública:
1. `CREATE TABLE public.x(...)`
2. `GRANT SELECT/INSERT/UPDATE/DELETE ... TO authenticated;` + `GRANT ALL ... TO service_role;`
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
4. `CREATE POLICY ...` usando `has_role(auth.uid(), 'admin')` para escrita administrativa.

### Sistema de emails transacionais
Fila baseada em **pgmq** + cron `pg_cron` + edge functions:
- `enqueue_email(queue, payload)` — insere na fila e dispara wake.
- Trigger `email_queue_wake` agenda cron a cada 5s + faz POST HTTP direto para processar imediatamente.
- `email_queue_dispatch` — chamado pelo cron; desativa cron quando fila vazia (advisory lock evita race).
- Edge functions: `process-email-queue`, `send-transactional-email`, `auth-email-hook`, `preview-transactional-email`, `handle-email-suppression`, `handle-email-unsubscribe`.
- Página `/unsubscribe` com token único.
- Suppressed list respeitada antes de enviar.

### Catálogo (parte específica do nicho — genérica no template)
- Fonte da verdade: **JSON estático** em `public/data/tree.json` gerado a partir de uma pasta root do Google Drive. Estrutura: `{ id, name, children: [...], files: [...] }`.
- Cache versionado via constante `DATA_TREE_VERSION` em `src/lib/drive.ts`; ao mudar versão, `main.tsx` limpa Cache Storage.
- Edge function `drive-list` lista pastas via connector Google Drive; `drive-proxy` faz streaming de download (com `content-disposition: attachment`) para contornar CORS/iframe.
- Edge function `cover-generate` + `upload-cover` extraem capa do arquivo (PDF/CBZ/CBR) e salvam em bucket público `item-covers`; index em `item_cover_index` evita reprocessar.
- Libs puras: `search.ts` (busca fuzzy), `content-dedupe.ts` (remove duplicatas por título), `popularity.ts` (ordenação), `series-group.ts` (agrupa volumes), `read-status.ts` (localStorage), `recency.ts`.

### UI principal
- `pages/Index.tsx` — home com grid de pastas/itens, busca global, marquee de capas, filtros por "publisher"/categoria (renomear conforme nicho).
- `components/FolderGrid.tsx` — navegação hierárquica.
- Leitores embutidos: `PdfReader.tsx` (pdfjs-dist), `ComicArchiveReader.tsx` (libarchive.js para CBR/CBZ), `ComicReader.tsx` (wrapper). Substituir pelos leitores que fizerem sentido no nicho (player de vídeo, leitor de texto, etc.).
- `GlobalSearch.tsx` com cmdk.
- `PwaInstall.tsx` — banner de instalação PWA.
- `AdminCovers.tsx` protegido por role `admin` + token secreto `ADMIN_COVER_TOKEN`.

### Design system
- Tokens semânticos em `src/index.css` (HSL) + `tailwind.config.ts`; **nunca** usar `text-white`, `bg-black`, cores hex direto em componentes — sempre `bg-background`, `text-foreground`, `text-primary`, etc.
- Tema escuro por padrão via `next-themes`.
- Escolher fonte + paleta próprias para cada novo nicho (evitar Inter/Poppins genéricos).

### Secrets necessários
- `LOVABLE_API_KEY` (auto), `SUPABASE_*` (auto).
- `YAMPI_WEBHOOK_TOKEN` — validar webhook de compra.
- `ADMIN_COVER_TOKEN` — proteger endpoints de admin.
- `GOOGLE_DRIVE_API_KEY` — via connector (não editável manualmente).
- `TELEGRAM_API_KEY` — opcional, via connector.
- `FIRECRAWL_API_KEY` — opcional, via connector (scraping de metadados).

### Integrações externas
- **Yampi** (checkout) → webhook cria/renova/revoga access_grant.
- **Google Drive** (connector Lovable, gateway-backed) → catálogo + downloads via proxy.
- **Firecrawl** (opcional) → enriquecer metadados dos itens.
- **Telegram** (opcional) → notificações/bot de suporte.

### Rotas
```
/            Home (protegida)
/login       Email+senha + Google
/unsubscribe Página pública de descadastro de emails
/admin/*     Protegidas por role admin
/*           NotFound
```

### O que quero que você (Lovable) faça agora
1. Crie o esqueleto acima **em branco**, sem dados do nicho.
2. Configure Lovable Cloud, tabelas base (`access_grants`, `user_roles`, `app_role`, `has_role`, infra de email), RLS + GRANTs, auth email+Google.
3. Deixe `public/data/tree.json` vazio (`{ "id": "root", "name": "", "children": [], "files": [] }`) e o Drive folder ID como constante configurável em `src/lib/root-source.ts`.
4. Não implemente ainda leitores específicos — deixe placeholders. Vou dizer o nicho depois e pediremos leitor/player adequado.
5. Design system: peça pra mim paleta + tipografia antes de codar UI final.

---

## Como usar
1. Copie tudo entre `## PROMPT PARA O NOVO CHAT` e o final.
2. Cole num chat novo do Lovable.
3. No fim, diga o nicho ("é um catálogo de filmes independentes", etc.) e eu adapto.

Depois que você aprovar este plano eu não vou executar nada aqui — ele é só o documento pra você levar pro outro chat.
