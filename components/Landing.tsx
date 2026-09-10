import { StickFigure } from "./StickFigure";
import { LeadQuiz } from "./LeadQuiz";
import { Tracking } from "./Tracking";
const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="kicker">{children}</p>
);
const Entry = ({
  children = "QUERO ENTRAR",
  target = "entrar",
}: {
  children?: React.ReactNode;
  target?: string;
}) => (
  <a className="button" href={`#${target}`} data-track="click_enter">
    {children}
    <span aria-hidden="true">↗</span>
  </a>
);
export function Landing() {
  return (
    <>
      <Tracking />
      <header className="header wrap">
        <a href="#" className="wordmark" aria-label="SALA 404, início">
          SALA <span>404</span>
          <i />
        </a>
        <a className="header-entry" href="#entrar" data-track="click_enter">
          ENTRAR <span>↗</span>
        </a>
      </header>
      <main>
        <section className="hero wrap">
          <Kicker>
            <span className="status-dot" /> ACESSO GRATUITO{" "}
            <span className="sep">/</span> GRUPO PRIVADO NO WHATSAPP
          </Kicker>
          <div className="hero-title">
            <span className="hero-label">VOCÊ ENCONTROU A</span>
            <div className="room">
              SALA 404<span className="asterisk">*</span>
            </div>
            <div className="door-note">
              <StickFigure />
              <span>resolvi abrir a porta.</span>
            </div>
          </div>
          <h1>
            EU CONSTRUÍ UMA RENDA NA INTERNET SEM PRECISAR CONSTRUIR UMA
            AUDIÊNCIA.
          </h1>
          <div className="hero-bottom">
            <div>
              <p>
                Tenho empresas. Tenho clientes.
                <br />
                Construo software. Uso IA. Vendo.
              </p>
              <p>
                E provavelmente você nunca ouviu falar de mim.
                <br />
                <strong className="underline">
                  Esse é justamente o ponto.
                </strong>
              </p>
            </div>
            <div className="hero-aside">
              <p>Meu jogo acontece nos bastidores:</p>
              <p className="topics">
                Software. IA. Clientes.
                <br />
                Produtos. Ofertas. Vendas.
              </p>
              <p>Resolvi abrir a porta.</p>
              <Entry target="acordo">LEIA ANTES DE ENTRAR ↓</Entry>
            </div>
          </div>
          <div className="section-bottom">
            <span>POR LUIS FERNANDO</span>
            <span>SEM PALCO. COM TRABALHO.</span>
          </div>
        </section>
        <section className="dark" id="acordo">
          <div className="wrap section">
            <Kicker>01 / O ACORDO</Kicker>
            <div className="split">
              <h2>
                ME DÊ
                <br />
                <span className="accent">7 DIAS.</span>
              </h2>
              <div className="reading">
                <p>
                  Se em até 7 dias dentro da SALA 404 eu não te entregar pelo
                  menos uma coisa útil o suficiente para você aplicar, testar,
                  repensar ou melhorar alguma coisa que você já faz...
                </p>
                <h3 className="huge">SAIA.</h3>
                <p>
                  Sério. Não fique aqui como você fica em mais um grupo qualquer
                  do WhatsApp.
                </p>
                <p>
                  Não quero número de membro.
                  <br />
                  Não quero plateia.
                </p>
              </div>
            </div>
            <div className="agreement">
              <h3>
                QUERO GENTE QUE FICA
                <br />
                PORQUE EXISTE VALOR.
              </h3>
              <div className="split small">
                <div>
                  <p>
                    Enquanto eu estiver agregando: <strong>FIQUE.</strong>
                    <br />
                    No dia em que eu parar: <strong>VÁ EMBORA.</strong>
                  </p>
                  <p className="muted">Esse é o acordo.</p>
                </div>
                <StickFigure variant="leaving" />
              </div>
            </div>
          </div>
        </section>
        <section className="wrap section attention">
          <Kicker>02 / SOBRE O SEU TEMPO</Kicker>
          <h2>
            VOCÊ NÃO ME
            <br />
            DEVE ATENÇÃO.
            <br />
            <span className="muted">
              EU TENHO QUE
              <br />
              MERECÊ-LA.
            </span>
          </h2>
          <div className="offset reading">
            <p>
              Toda vez que eu aparecer na SALA 404, meu trabalho é fazer aquela
              mensagem valer os minutos que você gastou lendo.
            </p>
            <p>
              Se começar a virar conteúdo por obrigação:
              <br />
              <strong>PODE SAIR.</strong>
            </p>
          </div>
        </section>
        <section className="wrap section not-this">
          <Kicker>03 / ANTES DE ENTRAR</Kicker>
          <h2>
            O QUE ISSO
            <br />
            NÃO É<span className="accent">.</span>
          </h2>
          <div className="editorial-list">
            {[
              [
                "NÃO É GRUPO DE NETWORKING.",
                "Você não entrou para “trocar uma ideia”.",
              ],
              ["NÃO É CURSO.", "Não existe módulo, certificado ou cronograma."],
              [
                "NÃO É GRUPO DE GURU.",
                "Sem fórmula secreta, motivação diária ou print sem contexto.",
              ],
              [
                "NÃO É GRUPO PARA CONVERSAR.",
                "Você não vai abrir o WhatsApp e encontrar 800 mensagens.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span className="number">0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <span className="list-cross" aria-hidden="true">
                  ×
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="dark">
          <div className="wrap section monarchy">
            <Kicker>04 / AS REGRAS DA SALA</Kicker>
            <p className="intro-title">AQUI FUNCIONA COMO UMA MONARQUIA.</p>
            <h2>
              EXISTE UM
              <br />
              ÚNICO <span className="accent">MICROFONE.</span>
            </h2>
            <div className="split">
              <div>
                <p>E ele fica comigo.</p>
                <StickFigure variant="microphone" />
              </div>
              <div>
                <h3 className="mantra">
                  EU FAÇO. EU TESTO.
                  <br />
                  EU VENDO. EU ERRO.
                  <br />
                  EU ACERTO. EU MOSTRO.
                </h3>
                <p>Você observa.</p>
                <div className="choices">
                  <p>
                    Se for útil:
                    <br />
                    <strong>TESTE.</strong>
                  </p>
                  <p>
                    Se não for:
                    <br />
                    <strong>IGNORE.</strong>
                  </p>
                </div>
                <p className="muted">Simples.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="wrap section inside">
          <Kicker>05 / LÁ DENTRO</Kicker>
          <div className="section-heading">
            <h2>
              O QUE VOCÊ
              <br />
              VAI VER<span className="accent">.</span>
            </h2>
            <StickFigure variant="chart" />
          </div>
          <div className="inside-grid">
            {[
              [
                "SOFTWARE E SAAS SENDO CONSTRUÍDOS",
                "Ideia. Escopo. IA. Código. Banco. Deploy. Produto no ar.",
              ],
              [
                "COMO EU VENDO PARA EMPRESAS",
                "Problema. Proposta. Preço. Negociação. Entrega.",
              ],
              [
                "IA SENDO USADA DE VERDADE",
                "Claude Code. Codex. Agentes. Automações. Ferramentas que realmente entram na operação.",
              ],
              [
                "OFERTA E AQUISIÇÃO",
                "Landing page. Criativo. Anúncio. Checkout. Conversão. Venda.",
              ],
              [
                "NÚMEROS E RESULTADOS",
                "O que entrou. Quanto custou. O que funcionou. O que deu errado. Sem print para alimentar ego.",
              ],
              [
                "BASTIDORES DOS CLIENTES",
                "Quando eu puder abrir: problema → decisão → execução → resultado.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span className="number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="about">
          <div className="wrap section">
            <Kicker>06 / QUEM ESTÁ POR TRÁS DISSO?</Kicker>
            <h2>
              MEU NOME É<br />
              LUIS FERNANDO.
            </h2>
            <div className="split about-intro">
              <div>
                <StickFigure variant="working" />
                <p className="handwritten">menos stories, mais entrega.</p>
              </div>
              <div className="reading">
                <p>
                  Provavelmente você nunca ouviu falar de mim.
                  <br />E tudo bem.
                </p>
                <p>
                  Eu não construí minha renda tentando virar conhecido na
                  internet.
                </p>
                <p>
                  Construí empresas. Construí software.
                  <br />
                  Vendi projetos. Ajudei clientes a vender mais.
                  <br />
                  Automatizei operações. Errei bastante no caminho.
                </p>
                <p>
                  Enquanto muita gente precisava postar todos os dias para
                  provar que sabia alguma coisa, eu estava ocupado tentando
                  fazer as coisas funcionarem.
                </p>
              </div>
            </div>
            <h3 className="statement">
              MEUS CLIENTES SEMPRE FALARAM MAIS ALTO DO QUE MEUS STORIES.
            </h3>
            <div className="offset reading">
              <p>
                E talvez essa tenha sido uma das melhores decisões que eu tomei.
              </p>
              <p>
                Porque isso me permite passar mais tempo com minha família. Ter
                uma vida de verdade. E não ser refém de um personagem para
                continuar relevante.
              </p>
            </div>
            <div className="about-ending">
              <h3>
                MEU NEGÓCIO NÃO DEPENDE
                <br />
                DE EU SER FAMOSO.
              </h3>
              <p>DEPENDE DE EU CONTINUAR SENDO ÚTIL.</p>
            </div>
          </div>
        </section>
        <section className="dark">
          <div className="wrap section operator">
            <Kicker>07 / PRIMEIRO, A OPERAÇÃO</Kicker>
            <h3 className="intro-title muted">EU NÃO VIVO DE ENSINAR ISSO.</h3>
            <h2>
              EU ENSINO
              <br />
              PORQUE
              <br />
              <span className="accent">VIVO DISSO.</span>
            </h2>
            <div className="operator-grid">
              {[
                ["Não estudo software para fazer conteúdo.", "EU CONSTRUO."],
                ["Não estudo proposta para gravar Reel.", "EU VENDO."],
                ["Não estudo IA para parecer atualizado.", "EU USO."],
              ].map(([a, b]) => (
                <div key={b}>
                  <p>{a}</p>
                  <h3>{b}</h3>
                </div>
              ))}
            </div>
            <p>
              O conteúdo vem depois da operação.{" "}
              <strong>NÃO O CONTRÁRIO.</strong>
            </p>
          </div>
        </section>
        <section className="wrap section sales">
          <Kicker>08 / SÓ PARA NÃO TER SURPRESA</Kicker>
          <h2>EM ALGUM MOMENTO EU VOU TENTAR TE VENDER ALGUMA COISA.</h2>
          <div className="split">
            <div>
              <p>Óbvio.</p>
              <p>
                Eu tenho empresas. Tenho produtos.
                <br />
                Vendo serviços. Crio software.
              </p>
              <p>
                Seria ridículo criar um grupo sobre negócios e fingir vergonha
                de vender.
              </p>
            </div>
            <div>
              <div className="choices">
                <p>
                  Se fizer sentido:
                  <br />
                  <strong>COMPRE.</strong>
                </p>
                <p>
                  Se não fizer:
                  <br />
                  <strong>NÃO COMPRE.</strong>
                </p>
              </div>
              <p>Você continua aqui do mesmo jeito.</p>
            </div>
          </div>
        </section>
        <section className="dark">
          <div className="wrap section filter">
            <Kicker>09 / ÚLTIMO FILTRO</Kicker>
            <h2>
              SE VOCÊ QUER APRENDER ALGO ÚTIL,
              <br />
              <span className="accent">SEJA BEM-VINDO.</span>
            </h2>
            <div className="split">
              <div>
                <p>Agora, se você procura:</p>
                <p className="muted">
                  fórmula mágica
                  <br />
                  atalho
                  <br />
                  motivação
                  <br />
                  promessa fácil
                  <br />
                  alguém disposto a dizer exatamente o que você quer ouvir...
                </p>
              </div>
              <div>
                <h3>
                  FECHE ESSA PÁGINA
                  <br />E VÁ EMBORA.
                </h3>
                <p>
                  Prefiro poucas pessoas prestando atenção do que milhares
                  ocupando espaço.
                </p>
              </div>
            </div>
            <div className="filter-end">
              <div>
                <p>Se chegou até aqui e ainda quer entrar:</p>
                <h3>RESPONDA ALGUMAS PERGUNTAS.</h3>
                <p className="micro">
                  A entrada na SALA 404 é gratuita por enquanto.
                </p>
              </div>
              <Entry />
            </div>
          </div>
        </section>
        <section className="wrap section quiz-section" id="entrar">
          <Kicker>10 / A PORTA ESTÁ AQUI</Kicker>
          <LeadQuiz />
        </section>
      </main>
      <footer className="wrap footer">
        <div className="footer-top">
          <a className="wordmark" href="#">
            SALA <span>404</span>
            <i />
          </a>
          <p>Luis Fernando · Hub Almeida</p>
          <div>
            <a href="/privacidade">Política de Privacidade</a>
            <a href="/termos">Termos</a>
          </div>
        </div>
        <p>
          SALA 404 é um grupo independente e não possui afiliação, patrocínio ou
          administração da Meta ou WhatsApp.
        </p>
        <p>
          Cases, resultados e experiências eventualmente apresentados
          representam situações específicas e não constituem promessa ou
          garantia de resultados futuros.
        </p>
      </footer>
    </>
  );
}
