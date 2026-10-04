# Biblioteca da Família — MVP técnico

Aplicação de curadoria familiar de vídeos do YouTube. O responsável monta o catálogo; a criança pesquisa e assiste apenas o que foi previamente aprovado.

## Stack
- Next.js 16 + React 19
- Neon Postgres via `@neondatabase/serverless`
- Auth.js / NextAuth v5 com login Google e sessão JWT
- YouTube Data API v3
- YouTube Embedded Player em Privacy Enhanced Mode (`youtube-nocookie.com`)
- Vercel como destino de deploy

## Fluxo já implementado
1. Responsável entra com Google.
2. A aplicação cria uma família e um perfil infantil padrão no primeiro acesso.
3. Responsável cola uma URL do YouTube e revisa metadados.
4. Responsável define categoria/tags e aprova.
5. Vídeo é persistido no Neon e liberado apenas para aquele perfil.
6. Criança busca localmente dentro da biblioteca aprovada.
7. Busca sem resultado pode gerar um pedido ao responsável.
8. Página de reprodução valida no servidor se o vídeo está autorizado antes de abrir o iframe.

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
YOUTUBE_API_KEY=
```

Nenhuma dessas chaves deve receber prefixo `NEXT_PUBLIC_`.

## Banco
Com `DATABASE_URL` configurada:

```bash
npm run db:migrate
```

A migration cria `families`, `child_profiles`, `videos`, `profile_videos`, `content_requests` e `watch_history`.

## Desenvolvimento

```bash
npm install
npm run typecheck
npm run dev
```

Sem `DATABASE_URL`, a interface continua em modo demonstrativo usando o catálogo local. Sem `YOUTUBE_API_KEY`, a revisão de URL também usa fallback demonstrativo.

## Segurança do MVP
- O perfil infantil não é uma conta de autenticação separada.
- O identificador persistido da família é derivado da conta Google autenticada (`owner_subject`).
- O navegador nunca recebe `DATABASE_URL` nem `YOUTUBE_API_KEY`.
- Todas as escritas validam no servidor que o perfil pertence à família autenticada.
- A rota de reprodução confere autorização antes de gerar o player.
