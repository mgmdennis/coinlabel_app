import "./App.modules.css";
import { useState, useEffect } from "react";
import axios from "axios";
// import deleteIcon from "./assets/delete.svg";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
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
