"use client";
import { useEffect, useRef, useState } from "react";
import { questions, maskPhone } from "@/lib/questions";
import { attribution, cookie, marketingAllowed, track } from "@/lib/tracking";
import { StickFigure } from "./StickFigure";
export function LeadQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [access, setAccess] = useState("");
  const started = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const source = useRef<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    source.current = attribution();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (started.current) title.current?.focus();
  }, [step]);
  function choose(value: string, index: number) {
    if (selected !== null) return;
    if (!started.current) {
      track("quiz_started");
      started.current = true;
    }
    setAnswers((old) => old.map((v, i) => (i === step ? value : v)));
    setSelected(index);
    track(`quiz_step_${step + 1}` as "quiz_step_1");
    timer.current = setTimeout(() => {
      setSelected(null);
      setStep((s) => s + 1);
      setError("");
    }, 190);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (step === 4) {
      if (name.trim().split(/\s+/).length < 2) {
        setError("Me diga seu nome e sobrenome.");
        return;
      }
      setStep(5);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          name,
          phone,
          consent,
          marketing_consent: marketingAllowed(),
          attribution: source.current,
          fbp: cookie("_fbp"),
          fbc: cookie("_fbc"),
          website: new FormData(e.currentTarget).get("website") || "",
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Não foi possível salvar. Tente novamente.",
        );
      if (data.isNew) track("lead_submitted", data.eventId);
      setAccess(data.whatsappUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha de conexão. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (access)
    return (
      <div className="final-access" role="status">
        <StickFigure />
        <h2>PORTA LIBERADA.</h2>
        <p>
          Você entendeu as regras.
          <br />
          Agora é simples:
        </p>
        <p>
          <strong>
            EU FAÇO.
            <br />
            VOCÊ OBSERVA.
            <br />O QUE FOR ÚTIL, VOCÊ TESTA.
          </strong>
        </p>
        <h3>BEM-VINDO À SALA 404.</h3>
        <a
          className="button"
          href={access}
          onClick={() => track("whatsapp_click")}
          rel="noopener noreferrer"
        >
          ENTRAR NO WHATSAPP <span>↗</span>
        </a>
      </div>
    );
  return (
    <div className="quiz">
      <div className="quiz-top">
        <span>{step + 1} DE 6</span>
        {step > 0 ? (
          <button
            type="button"
            disabled={busy || selected !== null}
            onClick={() => {
              setStep((s) => s - 1);
              setError("");
            }}
          >
            ← VOLTAR
          </button>
        ) : (
          <span>LEVA CERCA DE 1 MINUTO</span>
        )}
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Progresso do cadastro"
        aria-valuemin={0}
        aria-valuemax={6}
        aria-valuenow={step + 1}
      >
        <div style={{ width: `${((step + 1) / 6) * 100}%` }} />
      </div>
      <div className="quiz-panel" key={step}>
        <h2 ref={title} tabIndex={-1}>
          {step < 4
            ? questions[step].title
            : step === 4
              ? "COMO VOCÊ SE CHAMA?"
              : "QUAL É O SEU WHATSAPP?"}
        </h2>
        {step < 4 ? (
          <div className="quiz-options">
            {questions[step].options.map((option, i) => (
              <button
                className={`quiz-option ${selected === i || answers[step] === option ? "selected" : ""}`}
                key={option}
                onClick={() => choose(option, i)}
                aria-pressed={answers[step] === option}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={submit}>
            {step === 4 ? (
              <>
                <label className="micro" htmlFor="lead-name">
                  Nome e sobrenome
                </label>
                <input
                  className="quiz-input"
                  id="lead-name"
                  autoComplete="name"
                  placeholder="Seu nome e sobrenome"
                  required
                  minLength={3}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="micro">
                  Pelo menos deixa eu saber quem entrou na minha sala.
                </p>
              </>
            ) : (
              <>
                <label className="micro" htmlFor="lead-phone">
                  WhatsApp com DDD
                </label>
                <input
                  className="quiz-input"
                  id="lead-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(11) 99999-9999"
                  required
                  minLength={15}
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                />
                <p className="micro">É por lá que a SALA 404 funciona.</p>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                  />
                  <span>
                    Ao continuar, você concorda em receber conteúdos, mensagens
                    e eventuais ofertas relacionadas à SALA 404. Você pode sair
                    quando quiser.{" "}
                    <a href="/privacidade">Política de Privacidade</a> e{" "}
                    <a href="/termos">Termos</a>.
                  </span>
                </label>
                <div className="honeypot" aria-hidden="true">
                  <label>
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
              </>
            )}
            <button type="submit" className="button" disabled={busy}>
              {busy
                ? "SALVANDO SEU CADASTRO…"
                : step === 4
                  ? "CONTINUAR"
                  : "QUERO ENTRAR NA SALA 404"}
              <span>↗</span>
            </button>
          </form>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
