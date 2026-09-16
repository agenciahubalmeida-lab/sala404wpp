"use client";
import { useEffect, useRef, useState } from "react";
import { questions, maskPhone } from "@/lib/questions";
import { attribution, cookie, marketingAllowed, track } from "@/lib/tracking";
import { StickFigure } from "./StickFigure";
declare global { interface Window { __founderHandoff?: string; } }
export function LeadQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email,setEmail]=useState('');
  const [known,setKnown]=useState<Record<string,string>>({});
  const [enabled,setEnabled]=useState(false);
  const [loading,setLoading]=useState(true);
  const [profileError,setProfileError]=useState(false);
  const keys=['profession','online_sales_experience','best_online_month','primary_interest'];
  const activeSteps=[0,1,2,3,4,5].filter(i=>i<4?!known[keys[i]]:i===4?!known.full_name:true);
  async function bridge(data:Record<string,unknown>){const response=await fetch('/api/founder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true});const result=await response.json();if(!response.ok)throw new Error(result.error);return result;}
  async function loadProfile(reset=false){setLoading(true);setProfileError(false);try{
    const hash=new URLSearchParams(location.hash.slice(1));const handoff=window.__founderHandoff || hash.get('founder');
    const data=await bridge({action:reset?'reset':handoff?'exchange':'session',handoff:reset?undefined:handoff,attribution:{...attribution(),landing_page:location.pathname,source:'sala404'}});
    if(handoff){delete window.__founderHandoff;hash.delete('founder');history.replaceState(null,'',location.pathname+location.search+(hash.size?'#'+hash.toString():''));}
    const p=data.profile || {};setEnabled(data.enabled);if(data.enabled)void bridge({action:'event',event_name:'sala404_lp_view'}).catch(()=>{});setKnown(p);setName(p.full_name || '');setEmail(p.email || '');setPhone(p.whatsapp?maskPhone(p.whatsapp.slice(2)):'');setAnswers(keys.map(key=>p[key] || ''));setStep([0,1,2,3,4,5].find(i=>i<4?!p[keys[i]]:i===4?!p.full_name:true) ?? 5);
  }catch{setProfileError(true);}finally{setLoading(false);}}
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
    void loadProfile();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (started.current) title.current?.focus();
  }, [step]);
  useEffect(()=>{if(enabled&&!loading&&!access)void bridge({action:'event',event_name:'sala404_quiz_step_'+(step+1)}).catch(()=>{});},[enabled,loading,step,access]);
  function choose(value: string, index: number) {
    if (selected !== null) return;
    if (!started.current) {
      track("quiz_started");
      if(enabled)void bridge({action:'event',event_name:'sala404_quiz_started'}).catch(()=>{});
      started.current = true;
    }
    setAnswers((old) => old.map((v, i) => (i === step ? value : v)));
    setSelected(index);
    track(`quiz_step_${step + 1}` as "quiz_step_1");
    timer.current = setTimeout(() => {
      setSelected(null);
      setStep(activeSteps[activeSteps.indexOf(step)+1] ?? 5);
      setError("");
    }, 190);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");if(!started.current){started.current=true;if(enabled)void bridge({action:'event',event_name:'sala404_quiz_started'}).catch(()=>{});}
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
          ...(enabled?{email}:{}),
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
  if(loading)return <p role="status">Preparando seu cadastro…</p>;
  if(profileError)return <div role="alert"><p>Não foi possível recuperar seu cadastro.</p><button className="button" onClick={()=>void loadProfile()}>TENTAR NOVAMENTE</button><button onClick={()=>void loadProfile(true)}>COMEÇAR NOVO CADASTRO</button></div>;
  return (
    <div className="quiz">
      <div className="quiz-top">
        <span>{activeSteps.indexOf(step)+1} DE {activeSteps.length}</span>
        {activeSteps.indexOf(step) > 0 ? (
          <button
            type="button"
            disabled={busy || selected !== null}
            onClick={() => {
              setStep(activeSteps[activeSteps.indexOf(step)-1]);
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
        aria-valuemax={activeSteps.length}
        aria-valuenow={activeSteps.indexOf(step)+1}
      >
        <div style={{ width: `${((activeSteps.indexOf(step)+1) / activeSteps.length) * 100}%` }} />
      </div>
      <div className="quiz-panel" key={step}>
        <h2 ref={title} tabIndex={-1}>
          {step < 4
            ? questions[step].title
            : step === 4
              ? "COMO VOCÊ SE CHAMA?"
              : known.whatsapp ? "VAMOS LIBERAR SEU CONVITE?" : "QUAL É O SEU WHATSAPP?"}
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
            {Object.keys(known).length>0&&<p className="micro">Já temos os dados que você informou. <button type="button" onClick={()=>void loadProfile(true)}>Não sou eu</button></p>}
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
                {!known.whatsapp&&<><label className="micro" htmlFor="lead-phone">
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
                <p className="micro">É por lá que a SALA 404 funciona.</p></>}
                {enabled&&!known.email&&<><label className="micro" htmlFor="lead-email">Seu melhor e-mail</label><input id="lead-email" className="quiz-input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></>}
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
