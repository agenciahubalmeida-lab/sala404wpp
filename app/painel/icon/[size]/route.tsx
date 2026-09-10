import { ImageResponse } from "next/og";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const n = Number(size);
  if (![180, 192, 512].includes(n)) return new Response(null, { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f1ea",
          color: "#111",
          fontWeight: 900,
        }}
      >
        <div style={{ fontSize: n * 0.14, letterSpacing: n * 0.02 }}>SALA</div>
        <div style={{ fontSize: n * 0.3, lineHeight: 1 }}>404</div>
        <div
          style={{
            width: n * 0.25,
            height: n * 0.015,
            background: "#6b3035",
            marginTop: n * 0.07,
          }}
        />
      </div>
    ),
    { width: n, height: n },
  );
}
