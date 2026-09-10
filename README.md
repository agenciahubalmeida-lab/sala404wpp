# SALA 404

## Painel privado e notificações no iPhone

O canal atual é **Web Push**, configurado com `NOTIFICATION_CHANNEL=push`. Nesse modo o envio não usa Telegram nem webhook, mesmo que as credenciais antigas existam. Sem aparelho inscrito, o aviso fica pendente na fila para nova tentativa.

Painel em `/painel`, protegido por senha no servidor. Sessão assinada de sete dias em cookie HttpOnly/SameSite Strict (Secure em produção), limite persistente de tentativas e APIs sem cache. O painel mostra até 50 cadastros recentes. O service worker não armazena dados privados offline. Sair encerra a sessão do navegador; **Desativar** remove as notificações daquele aparelho. Para revogar todas as sessões, troque `ADMIN_SESSION_SECRET`.

Novas variáveis, já geradas em `.env.local` e que devem ser copiadas para a hospedagem:

| Variável | Finalidade |
| --- | --- |
| `NOTIFICATION_CHANNEL` | `push` para avisos da própria SALA 404. |
| `ADMIN_PASSWORD` | Senha privada para entrar no painel. |
| `ADMIN_SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres. |
| `VAPID_PUBLIC_KEY` | Chave pública para inscrever aparelhos. |
| `VAPID_PRIVATE_KEY` | Chave privada de envio. Preserve o par entre deploys. |
| `VAPID_SUBJECT` | URL HTTPS ou contato mailto válido do responsável; inicialmente URL do repositório. |
| `CRON_SECRET` | Protege `/api/cron/deliveries`; configurar agendamento de reenvio na hospedagem. |

`supabase/push.sql` já foi aplicado no projeto `anpuysanboappfykiagv`: aparelhos e recibos por cadastro/aparelho têm RLS e acesso apenas pelo servidor. Recibos evitam reenvios após sucesso; se houver interrupção entre aceite do serviço push e gravação do recibo, uma repetição é possível. A tag do evento permite substituir o aviso anterior. Endpoints expirados (404/410) são removidos. Aceitação pelo serviço push não comprova que o aparelho exibiu ou leu a notificação.

Depois de publicar em HTTPS: abra `/painel` no Safari do iPhone (iOS 16.4+), use **Compartilhar → Adicionar à Tela de Início**, abra pelo ícone, entre com a senha e toque em **Ativar notificações → Permitir**. Use **Enviar teste** e confira na tela bloqueada. O push mostra somente que existe um novo cadastro; nomes e telefones ficam dentro do painel. Não há publicação na App Store.

Validação: build/TypeScript, testes de sessão e endpoints, navegador em 390×844, login/logout, manifest, ícones PNG, inscrição/remoção real no banco e proteção de APIs. `tests/panel.mjs` requer servidor com acesso ao Supabase, `TEST_BASE_URL` e ambiente privado. `tests/push-delivery.ts` requer `RUN_SUPABASE_TESTS=yes`: testa recibos e expiração contra o banco com transporte push simulado e remove os dados de teste; executar antes de inscrever aparelhos reais. A entrega real no iPhone só pode ser confirmada após publicação e inscrição do aparelho.

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

Supabase ativo configurado: `anpuysanboappfykiagv` (`https://anpuysanboappfykiagv.supabase.co`). O SQL foi aplicado e a API local foi testada contra o banco real: gravação, UTM, convite e deduplicação aprovados. A chave de servidor está somente em `.env.local`, ignorado pelo Git; precisa ser configurada também na hospedagem.

`tests/supabase.integration.sql` verifica RLS, permissões, unicidade de telefone, limite de tentativas e reserva da fila dentro de uma transação revertida. Execute com `npx supabase db query --linked --project-ref anpuysanboappfykiagv --file tests/supabase.integration.sql` após login oficial. A auditoria de segurança não apontou problemas na configuração inicial.

`tests/supabase-live.mjs` é um teste explícito contra o banco real: requer build existente, `.env.local` configurado e `RUN_SUPABASE_TESTS=yes`. Execute `node --env-file=.env.local tests/supabase-live.mjs`. Ele inicia um servidor local na porta 3020 com entregas externas desativadas, cria um cadastro fictício, testa duplicação e remove seus registros. Não executa automaticamente junto de `npm test`.

Pendente: credenciais na hospedagem, configuração do canal/destino de notificação, agendamento de reenvio, entrega real ao telefone e recebimento no Gerenciador de Eventos. Nenhum envio à Meta ou ao celular foi realizado no teste do Supabase.

## Revisão editorial do design

Fundo papel `#F4F1EA`, secundário `#EAE6DC` e detalhes vinho `#6B3035`. Apenas a monarquia mantém fundo preto. Header de 68 px no desktop e 60 px no mobile; marca do hero de 32/27 px, headline desktop de 58 px e leitura principal com até 740 px. Textos seguem sequência vertical; doodles funcionam como pequenas notas visuais.

O teste de navegador agora cobre 1440×900, 1366×768, 390×844, 393×852 e 430×932, verificando hero e CTA dentro da primeira dobra, ausência de overflow e dimensões da tipografia. Falha e sucesso do cadastro são simulados, sem gravações reais; os eventos do Pixel são inspecionados com o script externo interceptado localmente. `TEST_BASE_URL` permite selecionar a porta do servidor. Capturas da primeira dobra: `test-results/hero-1440.png` e equivalentes para as outras larguras. A revisão altera apresentação e testes; a lógica do quiz, endpoints, Supabase, validação e tracking permanece preservada.
