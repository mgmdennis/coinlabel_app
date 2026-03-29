import "./App.modules.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";

import Print from "./pages/print";
import Create from "./pages/create";

import NoPage from "./pages/NoPage";

import LoginGate from "./components/LoginGate";
import axios from "axios";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/auth/me")
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!user) return <LoginGate />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} setUser={setUser} />}> 
          <Route index element={<Home user={user} />} />
          <Route path="/create" element={<Create user={user} />} />
          <Route path="/create/:numistaNumber" element={<Create user={user} />} />
          <Route path="*" element={<NoPage />} />
        </Route>
        <Route path="/print" element={<Print user={user} />} />
      </Routes>
    </BrowserRouter> 
  );
}

export default App;
