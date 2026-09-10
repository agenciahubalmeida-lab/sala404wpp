import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'SALA 404 — O jogo acontece nos bastidores.', description: 'Software, IA, clientes e negócios. Os bastidores reais de Luis Fernando em um grupo privado e gratuito no WhatsApp.', robots: {index: true, follow: true}};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="pt-BR"><body>{children}</body></html>}
