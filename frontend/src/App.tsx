export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>ComprovOS</h1>
        <p style={{ marginTop: "12px", color: "#cbd5e1" }}>
          Frontend base configurado com React + Vite.
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "12px",
            background: "#0b1220",
            border: "1px solid #1e293b",
          }}
        >
          <p style={{ margin: 0 }}>
            ✅ Projeto frontend pronto para evoluir (login, rotas protegidas e dashboard).
          </p>
        </div>
      </section>
    </main>
  );
}