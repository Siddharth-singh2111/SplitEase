import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/image.png"; // move downloaded logo to /src/assets

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <img src={logo} alt="SplitEase Logo" style={styles.logo} />
      <h1 style={styles.title}><span style={{ color: "#007bff" }}>Split</span>Ease</h1>
      <p style={styles.subtitle}>Your smart way to split expenses effortlessly.</p>
      <div style={styles.buttons}>
        <button style={styles.btn} onClick={() => navigate("/login")}>Login</button>
        <button style={{ ...styles.btn, backgroundColor: "#28a745" }} onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #e0f7fa, #f0f4f8)",
    textAlign: "center",
    padding: "1rem",
  },
  logo: {
    width: "120px",
    height: "120px",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "3rem",
    margin: "0",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  subtitle: {
    fontSize: "1.25rem",
    marginTop: "0.5rem",
    color: "#444",
  },
  buttons: {
    marginTop: "2rem",
    display: "flex",
    gap: "1rem",
  },
  btn: {
    padding: "12px 24px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "600",
  },
};

export default Home;
