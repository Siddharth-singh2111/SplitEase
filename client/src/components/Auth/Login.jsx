import React, { useState } from "react";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Login failed. Please check your credentials.");
      console.error("Login Error:", err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Login to SplitEase</h2>

      <input
        type="email"
        className="auth-input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="password-wrapper">
        <input
          type={showPass ? "text" : "password"}
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="show-password-label">
          <input
            type="checkbox"
            checked={showPass}
            onChange={() => setShowPass(!showPass)}
          />
          Show Password
        </label>
      </div>

      <button className="auth-button" onClick={handleLogin}>
        Login
      </button>

      <p style={{ marginTop: "1rem" }}>
        Don’t have an account?{" "}
        <span className="link" onClick={() => navigate("/signup")}>
          Sign Up
        </span>
      </p>
    </div>
  );
};

export default Login;
