# Enviar o app para o GitHub

Esta ação é feita pela integração oficial de GitHub da Lovable — não é uma alteração de código, e eu não consigo executá-la por você. São 4 passos no editor.

## Passos

1. No chat, clique no botão **+** (canto inferior esquerdo do campo de mensagem) → **GitHub** → **Connect project**.
2. Autorize o **Lovable GitHub App** na conta `Oi-Lemes`.
3. Selecione a conta/organização `Oi-Lemes` e clique em **Create Repository**. A Lovable cria um repositório novo com todo o código do projeto.
4. Pronto: a partir daí o sync é bidirecional — o que você muda aqui vai para o GitHub, e o que você faz push no GitHub volta para cá.

## Sobre o repositório `Aplicativo-Imperio-dq`

A Lovable só cria repositório novo; ela não faz push para um repositório existente. Duas opções:

- **Opção A (mais simples):** depois que o repo novo for criado, renomeie-o no GitHub para `Aplicativo-Imperio-dq` (renomeando antes o repo atual para outro nome ou apagando-o, se não tiver nada importante).
- **Opção B:** clone o repo criado pela Lovable e faça push do conteúdo para `Aplicativo-Imperio-dq` manualmente:

```text
git clone <repo-criado-pela-lovable> app
cd app
git remote add antigo https://github.com/Oi-Lemes/Aplicativo-Imperio-dq.git
git push antigo main --force
```

Atenção: nesse caso o sync automático continua apontando para o repo criado pela Lovable, não para o `Aplicativo-Imperio-dq`.

## Observação de segurança

O `.env` do projeto contém apenas chaves públicas (URL e publishable key do backend), então pode ir para o repositório sem risco. Chaves privadas (tokens de webhook, tokens de admin) ficam nos secrets do backend e **não** são exportadas.
