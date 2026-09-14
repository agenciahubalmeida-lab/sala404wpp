"use client";
import { useEffect, useRef, useState } from "react";
import { preparePush, withTimeout } from "@/lib/push-browser";
import { LeadDetails, type AdminLead } from "@/components/LeadDetails";
import "./panel.css";
export default function Panel() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [auth, setAuth] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [leads, setLeads] = useState<AdminLead[]>([]),
    [key, setKey] = useState(""),
    [sub, setSub] = useState<PushSubscription | null>(null),
    [supported, setSupported] = useState(false),
    [installed, setInstalled] = useState(false);
  async function refresh(cursor?: string) {
    const r = await fetch(
      "/api/admin/leads" +
        (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""),
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    if (r.status === 401) {
      setAuth(false);
      setLeads([]);
      throw Error("Entre novamente para continuar.");
    }
    if (!r.ok) throw Error("Não foi possível atualizar os cadastros.");
    const d = await r.json();
    setLeads((previous) =>
      cursor
        ? [
            ...previous,
            ...d.leads.filter(
              (lead: AdminLead) =>
                !previous.some((item) => item.id === lead.id),
            ),
          ]
        : d.leads,
    );
    setNextCursor(d.nextCursor || null);
    setKey(d.publicKey);
  }
  useEffect(() => {
    setInstalled(
      matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    setSupported(
      "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
    );
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then(async (d) => {
        setAuth(d.authenticated);
        if (d.authenticated) await refresh();
      })
      .catch(() => setMessage("Sem conexão. Tente atualizar a página."))
      .finally(() => setLoading(false));
    if ("serviceWorker" in navigator)
      preparePush()
        .then((r) => {
          registrationRef.current = r;
          return withTimeout(
            r.pushManager.getSubscription(),
            10000,
            "Não foi possível verificar os avisos. Atualize o aplicativo.",
          );
        })
        .then(setSub)
        .catch(() =>
          setMessage(
            "Não foi possível preparar as notificações. Atualize a página.",
          ),
        )
        .finally(() => setPreparing(false));
    else setPreparing(false);
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Algo deu errado. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function pushAction(action: string, subscription: PushSubscription) {
    const r = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, subscription: subscription.toJSON() }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      if (r.status === 401) {
        setAuth(false);
        setLeads([]);
      }
      throw Error(
        "Não foi possível concluir. Confira a conexão e entre novamente, se necessário.",
      );
    }
  }
  async function enable() {
    if (!supported)
      throw Error(
        "No iPhone, adicione este painel à Tela de Início e abra pelo ícone (iOS 16.4 ou posterior).",
      );
    if (!key)
      throw Error("As notificações ainda não foram configuradas no servidor.");
    const registration = registrationRef.current;
    if (!registration?.active)
      throw Error(
        "Os avisos ainda não estão prontos. Toque em Atualizar aplicativo e tente novamente.",
      );
    setMessage("Aguardando sua permissão no iPhone…");
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await withTimeout(
            Notification.requestPermission(),
            30000,
            "O iPhone não respondeu à permissão. Confira os Ajustes de notificações e tente novamente.",
          );
    if (permission !== "granted")
      throw Error("Permita notificações nos Ajustes do iPhone para continuar.");
    const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    setMessage("Conectando este aparelho aos avisos…");
    const subscription =
      sub ||
      (await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }),
        20000,
        "O iPhone demorou para conectar os avisos. Verifique sua conexão e tente novamente.",
      ));
    setMessage("Salvando a ativação…");
    await pushAction("subscribe", subscription);
    setSub(subscription);
    setMessage("Notificações ativadas neste aparelho. Envie um teste abaixo.");
  }
  return (
    <main className="panel">
      <header>
        <a href="/" className="wordmark">
          SALA 404
        </a>
        <span>ACESSO PRIVADO</span>
      </header>
      <p className="kicker">BASTIDORES / CADASTROS</p>
      <h1>
        Sua sala.
        <br />
        No seu bolso.
      </h1>
      {loading ? (
        <p role="status">Abrindo o painel…</p>
      ) : !auth ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const r = await fetch("/api/admin/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              });
              const d = await r.json();
              if (!r.ok) throw Error(d.error);
              setPassword("");
              setAuth(true);
              await refresh();
            });
          }}
        >
          <label htmlFor="admin-password">Senha do painel</label>
          <input
            id="admin-password"
            className="quiz-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="button" disabled={busy}>
            ENTRAR →
          </button>
          <p className="micro">
            Acesso exclusivo do administrador da SALA 404.
          </p>
        </form>
      ) : (
        <>
          <section>
            <h2>Avisos no iPhone</h2>
            {!installed && (
              <p>
                Abra no Safari, toque em Compartilhar e escolha{" "}
                <strong>Adicionar à Tela de Início</strong>. Depois abra pelo
                ícone SALA 404 e ative as notificações.
              </p>
            )}
            <p>
              Os avisos aparecem como notificações do aplicativo. Os dados dos
              cadastros ficam somente neste painel.
            </p>
            <div className="panel-actions">
              <button
                className="button"
                disabled={busy || preparing}
                onClick={() => void run(enable)}
              >
                {busy
                  ? "ATIVANDO…"
                  : preparing
                    ? "PREPARANDO AVISOS…"
                    : sub
                      ? "RECONECTAR AVISOS"
                      : "ATIVAR NOTIFICAÇÕES"}
              </button>
              {sub && (
                <>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await pushAction("test", sub);
                        setMessage(
                          "Teste aceito pelo serviço de push. Confira as notificações do iPhone.",
                        );
                      })
                    }
                  >
                    Enviar teste
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await pushAction("remove", sub);
                        await sub.unsubscribe();
                        setSub(null);
                        setMessage("Notificações desativadas neste aparelho.");
                      })
                    }
                  >
                    Desativar
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ marginTop: 16 }}
            >
              Atualizar aplicativo
            </button>
            {message && (
              <p className="panel-message" role="status">
                {message}
              </p>
            )}
          </section>
          <section>
            <div className="panel-row">
              <h2>Últimos cadastros</h2>
              <button disabled={busy} onClick={() => void run(refresh)}>
                Atualizar
              </button>
            </div>
            <p className="micro">
              Cadastros do mais recente ao mais antigo, em grupos de 50. Use
              Carregar mais para consultar os anteriores. Cadastro e convite
              liberado não confirmam entrada no grupo.
            </p>
            {leads.length === 0 ? (
              <p>Nenhum cadastro por enquanto.</p>
            ) : (
              leads.map((lead) => <LeadDetails key={lead.id} lead={lead} />)
            )}
            {leads.length > 0 && (
              <p className="micro" role="status">
                {leads.length} cadastros exibidos.
                {!nextCursor && " Todos os cadastros foram carregados."}
              </p>
            )}
            {nextCursor && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    setLoadingMore(true);
                    try {
                      await refresh(nextCursor);
                    } finally {
                      setLoadingMore(false);
                    }
                  })
                }
              >
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            )}
          </section>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = await fetch("/api/admin/session", {
                  method: "DELETE",
                });
                if (!r.ok) throw Error("Não foi possível sair.");
                setAuth(false);
                setLeads([]);
                setMessage(
                  "Você saiu do painel. Para parar os avisos, use Desativar antes de sair.",
                );
              })
            }
          >
            Sair do painel
          </button>
        </>
      )}
      {message && !auth && (
        <p className="panel-message" role="status">
          {message}
        </p>
      )}
      <footer>Luis Fernando · Hub Almeida · versão 4</footer>
    </main>
  );
}
