import { ImageResponse } from "next/og";

export const alt = "Varadhi Prep smart mock tests for career growth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 58%, #0f766e 100%)",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
        <div style={{ color: "#5eead4", fontSize: 25, fontWeight: 800, letterSpacing: 5 }}>VARADHI PREP</div>
        <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.08, marginTop: 28 }}>Smart mock tests for career growth.</div>
        <div style={{ color: "#cbd5e1", fontSize: 31, lineHeight: 1.45, marginTop: 30 }}>Telangana, Andhra Pradesh and central exam practice in English and Telugu.</div>
      </div>
    </div>,
    size,
  );
}
