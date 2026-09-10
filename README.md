# SALA 404

Landing page editorial em Next.js + TypeScript. Dez seções, SVGs próprios, quiz acessível de seis etapas, cadastro no Supabase, Meta Pixel/CAPI e aviso no celular. O cadastro não confirma participação efetiva no grupo.

## Rodar

Node.js 20.9+ (recomendado 24). Execute `npm install`, copie `.env.example` para `.env.local`, preencha as variáveis e execute `npm run dev`. No PowerShell com scripts bloqueados, use `npm.cmd`. Acesse http://localhost:3000. Verificações: `npm test`, `npm run typecheck`, `npm run build`.

## Arquivos principais

- `components/Landing.tsx`: copy e dez seções.
- `app/globals.css`: identidade e responsividade.
- `components/StickFigure.tsx`: ilustrações SVG reutilizáveis.
- `components/LeadQuiz.tsx` e `lib/questions.ts`: perguntas, máscara, navegação e tela final.
- `app/api/leads/route.ts`: validação, cadastro e liberação do convite.
- `lib/validation.ts`: regras compartilhadas de validação no servidor.
- `lib/tracking.ts` e `components/Tracking.tsx`: eventos, atribuição e escolha de cookies.
- `lib/delivery.ts`: Meta CAPI e notificação com nova tentativa.
- `supabase/schema.sql`: tabela protegida, índice único de WhatsApp, fila e limite de tentativas.
- `app/privacidade/page.tsx` e `app/termos/page.tsx`: páginas informativas.

## Configuração

Defina tudo em `.env.local` no desenvolvimento e nas Environment Variables do projeto Vercel em produção. Nunca envie esse arquivo ao GitHub.

| Variável | Uso |
| --- | --- |
| `WHATSAPP_COMMUNITY_URL` | Único local do link de convite `https://chat.whatsapp.com/...`; fica no servidor e só é devolvido após cadastro salvo. |
| `SUPABASE_URL` | URL do projeto ativo escolhido. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa do servidor. Nunca usar prefixo NEXT_PUBLIC. |
| `NEXT_PUBLIC_META_PIXEL_ID` | `1054167871010631`, ID público informado. |
| `META_CAPI_ACCESS_TOKEN` | Token privado fornecido pelo titular; configurar no ambiente, nunca no código. |
| `META_API_VERSION` | Versão Graph API (padrão v23.0). |
| `META_TEST_EVENT_CODE` | Opcional para Eventos de teste; remover ao encerrar teste. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Bot e conversa de destino para aviso no celular. |
| `NOTIFICATION_WEBHOOK_URL` | Alternativa HTTPS: automação n8n/Make ou serviço que envie o aviso ao celular. |
| `NOTIFICATION_WEBHOOK_SECRET` | Bearer compartilhado com a automação, quando exigido. |
| `CRON_SECRET` | Segredo forte para proteger o reenvio da fila. |

No SQL Editor do **projeto Supabase escolhido**, execute `supabase/schema.sql`. Tabelas têm RLS e acesso revogado a anon/authenticated; apenas o servidor opera sobre elas. Não há leitura pública de cadastros. WhatsApp tem unicidade; repetir o cadastro não sobrescreve dados, não gera outro Lead e não dispara novo aviso. Limite persistente: 8 tentativas por IP em 10 minutos. Em produção o proxy deve controlar `x-forwarded-for`.

## Aviso no celular

Escolha Telegram ou webhook. Telegram: crie um bot pelo BotFather, abra a conversa e envie `/start`; configure token e chat ID. Webhook: configure uma automação HTTPS que aceite o JSON enviado e encaminhe ao seu telefone pelo provedor escolhido. O payload inclui `event_id`, nome, telefone, perfil, interesse e mensagem. Para WhatsApp via API é necessário um provedor/conta Business e, conforme a modalidade, template aprovado; o token do Pixel não configura sozinho essa entrega. Se ambos forem configurados, Telegram tem prioridade.

O aviso informa **cadastro salvo e convite liberado**. Nenhuma integração de confirmação de entrada no grupo foi incluída. `whatsapp_click` mede só clique.

## Pixel e CAPI

Medição é ativada quando o visitante aceita cookies opcionais. A recusa não bloqueia o formulário. Eventos: PageView (`view_page`), `click_enter`, `quiz_started`, `quiz_step_1` até `quiz_step_4`, Lead (`lead_submitted`) e `whatsapp_click`. O evento Lead usa o mesmo UUID em `eventID` no navegador e `event_id` no servidor para deduplicação. Nome/telefone enviados à Meta passam por SHA-256; IP, user agent, fbp/fbc são usados quando disponíveis. UTMs e referência são capturados ao abrir a página e salvos com as respostas. Nunca envie dados pessoais em parâmetros de URL.

## Publicar na Vercel

1. Importe `agenciahubalmeida-lab/sala404wpp` e mantenha o preset Next.js.
2. Configure as variáveis acima, execute o SQL no Supabase e publique.
3. Cadastre um agendamento **a cada minuto** que chame `GET https://SEU-DOMINIO/api/cron/deliveries` com `Authorization: Bearer CRON_SECRET`. Pode ser Vercel Cron em plano compatível ou outro scheduler. Não há agendamento ativado automaticamente nem contratação de plano.
4. O envio imediato usa `after()`; o agendamento recupera falhas, com backoff e lock de cinco minutos. Inspecione `delivery_error`, `attempts`, `meta_sent`, `notification_sent`. Configure alertas operacionais para falhas persistentes. Notificações são pelo menos uma vez: um timeout após recebimento pode repetir o aviso; no webhook, deduplique por `event_id`.
5. Faça um cadastro autorizado de teste. Confirme uma linha no banco, evento Lead nos Eventos de teste da Meta, aviso recebido e convite correto. Remova `META_TEST_EVENT_CODE` ao concluir. A aceitação da API não garante atribuição de campanha; verifique o Gerenciador de Eventos.

Sem Supabase ou convite configurado, o formulário retorna erro legível e mantém as respostas; ele nunca finge ter salvo. Sem credenciais de notificação ou Meta, os cadastros ficam na fila com erro para nova tentativa. As integrações reais dependem das contas e variáveis do titular e precisam de validação em produção.

Referências: [Supabase — segurança da API](https://supabase.com/docs/guides/api/securing-your-api), [Meta — deduplicação](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/), [Next.js — instalação](https://nextjs.org/docs/app/getting-started/installation).

## Validação desta entrega

Build de produção, TypeScript e três testes unitários aprovados. `tests/browser.mjs` verifica 390×844, 393×852, 430×932 e 1440×1000 sem overflow horizontal, seis etapas, máscara, UTMs, preservação dos campos após erro real da API sem configuração e tela final com resposta **simulada localmente**. Nenhum cadastro ou aviso real é criado por esse teste. Para executar: inicie a aplicação e rode `node tests/browser.mjs` com Chromium instalado pelo Playwright ou `TEST_CHROME_PATH` apontando para o executável. Capturas ficam em `test-results/` (ignoradas pelo Git).

Pendente de validação externa: execução do SQL em Supabase ativo, persistência real, entrega ao telefone, recebimento no Gerenciador de Eventos e deploy Vercel. O projeto Supabase disponível na sessão estava inativo e não foi alterado.
