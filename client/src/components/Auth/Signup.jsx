import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // ✅ name state
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Set display name in Firebase Auth
      await updateProfile(user, { displayName: name });

      // ✅ Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name,
      });

      toast.success("Signup successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err.message);
      toast.error(`Signup failed: ${err.message}`);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input
          className="auth-input"
          placeholder="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="auth-input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="auth-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="auth-button" type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
