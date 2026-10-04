# PRD — Biblioteca familiar de vídeos (MVP)

## Problema
Plataformas de vídeo entregam conteúdo por mecanismos algorítmicos de descoberta. Para uma criança, o responsável pode querer controlar não apenas limites de tempo, mas principalmente o universo de conteúdo disponível.

## Tese
Usar o YouTube como infraestrutura de vídeo e metadados, enquanto a aplicação controla a biblioteca, a descoberta e a autorização.

## Princípio
**A criança pode procurar livremente dentro do universo que a família previamente construiu.**

## Escopo MVP
1. Login do responsável via Google/Auth.js.
2. Um ou mais perfis infantis — a v0.2 cria um padrão automaticamente.
3. Inclusão de vídeo por URL do YouTube no painel do responsável.
4. Consulta de metadados via YouTube Data API.
5. Aprovação individual de vídeo para um perfil.
6. Categorias e tags.
7. Biblioteca infantil fechada.
8. Busca infantil somente na biblioteca aprovada.
9. Pedido de conteúdo quando a busca não encontra resultados.
10. Player incorporado em Privacy Enhanced Mode (`youtube-nocookie.com`).
11. Estrutura para histórico de reprodução.

## Fora do MVP
- Busca pública do YouTube no modo infantil.
- Feed, tendências ou Shorts.
- Recomendação algorítmica própria.
- Aprovação automática por IA.
- Download/rehost de vídeos.
- Bloqueio garantido de anúncios do YouTube.
- Smart TV nativa.

## Risco residual aceito
Publicidade continua sendo controlada pelo ecossistema do YouTube. O MVP declara isso de forma transparente e não promete experiência sem anúncios.
