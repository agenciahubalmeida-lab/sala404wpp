import { questions, maskPhone } from "@/lib/questions";
export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  profession: string;
  internet_sales: string | null;
  best_month: string | null;
  reason: string;
  created_at: string;
};
export function LeadDetails({ lead }: { lead: AdminLead }) {
  const phone =
    lead.phone.startsWith("55") && lead.phone.length === 13
      ? `+55 ${maskPhone(lead.phone.slice(2))}`
      : `+${lead.phone}`;
  const answers = [
    lead.profession,
    lead.internet_sales,
    lead.best_month,
    lead.reason,
    lead.name,
    phone,
  ];
  const titles = [
    ...questions.map((q) => q.title),
    "COMO VOCÊ SE CHAMA?",
    "QUAL É O SEU WHATSAPP?",
  ];
  return (
    <article className="lead-card">
      <time dateTime={lead.created_at}>
        {new Date(lead.created_at).toLocaleString("pt-BR")}
      </time>
      <details className="lead-details">
        <summary>
          <h3>{lead.name}</h3>
          <span className="lead-open-label">
            Ver respostas <span aria-hidden="true">＋</span>
          </span>
        </summary>
        <div className="lead-sheet">
          <p className="micro">Ficha do cadastro · 6 perguntas</p>
          <dl>
            {titles.map((title, index) => (
              <div className="lead-answer" key={title}>
                <dt>
                  <span className="number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {title}
                </dt>
                <dd>{answers[index] || "Não informado"}</dd>
              </div>
            ))}
          </dl>
          <p className="micro">
            Cadastro salvo em{" "}
            {new Date(lead.created_at).toLocaleString("pt-BR")}. A entrada no
            grupo não é confirmada por este cadastro.
          </p>
        </div>
      </details>
      <p className="lead-preview">
        {lead.profession}
        <br />
        {lead.reason}
      </p>
      <a
        href={`https://wa.me/${lead.phone}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {phone} ↗
      </a>
    </article>
  );
}
