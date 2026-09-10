export function GET() {
  return Response.json(
    {
      id: "/painel",
      name: "SALA 404",
      short_name: "SALA 404",
      start_url: "/painel",
      scope: "/painel",
      display: "standalone",
      background_color: "#f4f1ea",
      theme_color: "#f4f1ea",
      icons: [
        {
          src: "/painel/icon/192",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/painel/icon/512",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
