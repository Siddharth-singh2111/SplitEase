import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import Home from "./components/Home/Home"; // 👈
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";






function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-yellow-400">
    <Router >
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} /> {/* 👈 Home Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
      </Routes>
    </Router>
    </div>
  );
}

export default App;
