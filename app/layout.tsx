import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SALA 404 — O jogo acontece nos bastidores.",
  description:
    "Software, IA, clientes e negócios. Os bastidores reais de Luis Fernando em um grupo privado e gratuito no WhatsApp.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><script dangerouslySetInnerHTML={{__html:`(()=>{const p=new URLSearchParams(location.hash.slice(1));const t=p.get('founder');if(t&&/^[\\w-]{43}$/.test(t)){window.__founderHandoff=t;p.delete('founder');history.replaceState(null,'',location.pathname+location.search+(p.size?'#'+p.toString():''));}})();`}} />{children}</body>
    </html>
  );
}
