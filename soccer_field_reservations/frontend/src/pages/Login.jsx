
rt default function Login() {
  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>⚽ Soccer Reservations</h1>
        <p style={styles.subtitle}>Acesso ao sistema</p>

        <input
          type="text"
          placeholder="Usuário ou e-mail"
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          style={styles.input}
        />

        <button style={styles.button}>Entrar</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
  },
  box: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    width: "320px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    textAlign: "center"
  },
  title: {
    marginBottom: "8px"
  },
  subtitle: {
    marginBottom: "24px",
    color: "#666"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px"
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#1e90ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer"
  }
};

