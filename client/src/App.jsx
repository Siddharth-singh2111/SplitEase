import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import Home from "./components/Home/Home"; // 👈
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";






function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} /> {/* 👈 Home Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
      </Routes>
    </Router>
  );
}

export default App;
