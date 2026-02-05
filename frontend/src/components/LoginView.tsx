// src/components/LoginView.tsx
export function LoginView(props: {
  loginName: string;
  setLoginName: (v: string) => void;
  loginError: string;
  onLogin: () => void;
}) {
  const { loginName, setLoginName, loginError, onLogin } = props;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: 360,
          maxWidth: "100%",
          background: "white",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #ddd",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          QuickChat Login
        </div>

        <input
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
          placeholder="Enter username (e.g. amit)"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            marginBottom: 10,
          }}
          onKeyDown={(e) => e.key === "Enter" && onLogin()}
        />

        <button
          onClick={onLogin}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        {loginError && (
          <div style={{ marginTop: 10, color: "crimson" }}>{loginError}</div>
        )}
      </div>
    </div>
  );
}
