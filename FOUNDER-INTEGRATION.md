# Integração com o Diário de um Fundador

Configure no servidor:

```dotenv
FOUNDER_API_URL=https://dominio-publico-do-diario
FOUNDER_BRIDGE_SECRET=mesmo-segredo-aleatorio-do-diario
```

Publique o Diário antes de ativar essas variáveis na SALA. Sem elas, o quiz usa o cadastro anterior. No ambiente local, o Diário está na porta 3107 e a SALA na 3106.

`app/layout.tsx` retira o token `#founder` da URL antes dos componentes de analytics. O quiz troca esse token por meio de `/api/founder`; a rota usa a credencial privada e guarda a sessão em cookie HttpOnly. Só campos informados pela sessão são recebidos. O quiz pula respostas conhecidas e pede e-mail quando a integração está ativa. A confirmação e o consentimento continuam obrigatórios.

`/api/leads` valida os dados, grava o perfil central e preserva `sala404_leads` como projeção para o painel e as entregas existentes. O evento central fornece o ID usado por Pixel e CAPI. Repetições usam o mesmo ID. O clique no WhatsApp é registrado separadamente e não confirma participação no grupo.

A credencial nunca pode receber prefixo `NEXT_PUBLIC_`. Respostas de perfil usam `no-store`. O token de transferência expira em cinco minutos e é consumido uma vez. Uma falha na integração configurada impede a confirmação e permite tentar de novo; os campos continuam no formulário.

Validação: `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`. No projeto do Diário, `scripts/check-funnel.mjs` testa o percurso entre os dois servidores e intercepta o cadastro final para não disparar entregas reais.

A política de privacidade foi atualizada para descrever o perfil compartilhado entre Diário e SALA. A integração e o banco estão implementados; esta etapa não publicou alterações no domínio público.
