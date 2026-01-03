import "./App.modules.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";

import Print from "./pages/print";
import Create from "./pages/create";

import NoPage from "./pages/NoPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/create/:numistaNumber" element={<Create />} />
          <Route path="*" element={<NoPage />} />
        </Route>
        <Route path="/print" element={<Print />} />
      </Routes>
    </BrowserRouter> 
  );
}

export default App;
