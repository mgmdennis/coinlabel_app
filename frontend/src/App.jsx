import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Print from "./pages/print";
import Create from "./pages/create";
import CollectionItem from "./pages/CollectionItem";
import Settings from "./pages/Settings";
import Quests from "./pages/Quests";
import QuestDetail from "./pages/QuestDetail";
import NoPage from "./pages/NoPage";
import LoginGate from "./components/LoginGate";
import { QuestLoading } from "./quests-ui-loading";
import { BASE_URL } from "./config";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/auth/me`)
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <QuestLoading hint="Opening your cabinet…" />;
  }
  if (!user) return <LoginGate />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} setUser={setUser} />}>
          <Route index element={<Home user={user} />} />
          <Route path="/create" element={<Create user={user} />} />
          <Route path="/create/:numistaNumber" element={<Create user={user} />} />
          <Route path="/item/:id" element={<CollectionItem user={user} />} />
          <Route path="/quests" element={<Quests user={user} />} />
          <Route path="/quests/:questId" element={<QuestDetail user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="*" element={<NoPage />} />
        </Route>
        <Route path="/print" element={<Print user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
