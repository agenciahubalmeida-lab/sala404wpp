import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "SALA 404 — Painel privado",
  robots: { index: false, follow: false },
  manifest: "/painel/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SALA 404", statusBarStyle: "default" },
  icons: { apple: "/painel/icon/180", icon: "/painel/icon/192" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
