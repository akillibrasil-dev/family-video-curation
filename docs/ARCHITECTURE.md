# Arquitetura v0.2

```text
Responsável
   │
   ├── Auth.js + Google OAuth
   │          │
   │          └── sessão JWT / owner_subject
   │
   ├── cola URL ──> /api/youtube/metadata ──> YouTube Data API
   │
   └── aprova ────> /api/videos/approve
                         │
                         ▼
                   Neon Postgres
                         │
                         ▼
                  perfil infantil
                         │
                  busca local fechada
                         │
                         ▼
                 biblioteca aprovada
                         │
                         ▼
              youtube-nocookie.com
```

## Separação de superfícies
- `/responsavel`: única superfície com descoberta externa por URL.
- `/crianca`: recebe catálogo aprovado do backend e filtra esse array localmente.
- `/crianca/assistir/[youtubeId]`: confere autorização no banco antes do iframe.
- `/api/youtube/metadata`: chave do YouTube somente no servidor.

## Identidade e autorização
Auth.js mantém a sessão. No login Google, `providerAccountId` vira um `owner_subject` estável no formato `google:<id>`. O banco não depende de tabelas internas do provedor de autenticação.

Toda consulta privada cruza `families.owner_subject` com a sessão ativa. O perfil infantil é entidade de domínio, não conta Auth.js.

## Banco
Neon é usado como PostgreSQL serverless via `@neondatabase/serverless`. Não há acesso direto do browser ao banco. Autorização fica na camada server-side do Next.js.
