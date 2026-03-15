import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, InputGroup, Form, Row, Col, Card, Container, ButtonGroup } from 'react-bootstrap';
import { FrontLabelContainer, BackLabelContainer } from "./label";
import { Search, PenLine, Pencil, Copy, Trash2 } from 'lucide-react';

import {
  Link,
  useNavigate
} from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Home = () => {
  const [coins, setCoins] = useState(null);
  const [numistaNumber, setNumistaNumber] = useState("");
  const navigate = useNavigate();

  // --- Persistence Logic ---
  // Initialize state from localStorage if it exists, otherwise empty object
  const [selectedCoins, setSelectedCoins] = useState(() => {
    const saved = localStorage.getItem("selected_coins");
    return saved ? JSON.parse(saved) : {};
  });

  // Sync state to localStorage whenever selectedCoins changes
  useEffect(() => {
    localStorage.setItem("selected_coins", JSON.stringify(selectedCoins));
  }, [selectedCoins]);

  useEffect(() => {
    getCoins();
  }, []);

  const getCoins = () => {
    axios
      .get(`${BASE_URL}/coins`)
      .then((res) => setCoins(res.data))
      .catch((err) => console.error(err));
  };

  const handleDeleteCoin = (id) => {
    if (window.confirm("Are you sure you want to delete this coin?")) {
      executeDelete(id);
    }
  };

  const executeDelete = (id) => {
    return axios
      .delete(`${BASE_URL}/coin/delete/${id}`)
      .then((res) => {
        setCoins(prev => prev.filter((coin) => coin._id !== res.data._id));
        setSelectedCoins(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);
    const count = selectedIds.length;
    if (window.confirm(`Are you sure you want to delete ${count} selected coins?`)) {
      try {
        await Promise.all(selectedIds.map(id => axios.delete(`${BASE_URL}/coin/delete/${id}`)));
        setCoins(prev => prev.filter(coin => !selectedIds.includes(coin._id)));
        setSelectedCoins({}); // This will automatically clear localStorage via useEffect
      } catch (err) {
        console.error("Error deleting coins:", err);
      }
    }
  };

  const handleSelectAll = () => {
    if (!coins) return;
    const allSelected = {};
    coins.forEach(coin => {
      allSelected[coin._id] = true;
    });
    setSelectedCoins(allSelected);
  };

  const toggleSelect = (id) => {
    setSelectedCoins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);

  const indeterminateRef = useCallback(el => {
    if (el) {
      const input = el.querySelector('input[type="checkbox"]');
      if (input) input.indeterminate = true;
    }
  }, []);

  const handlePrintSelected = () => {
    navigate('/print', { state: { selectedIds } });
  };

  const handleDuplicateCoin = (coin) => {
    navigate('/create/' + coin.numistaNumber, { state: { ...coin, _id: undefined } });
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (numistaNumber) {
      navigate('/create/' + numistaNumber);
    }
  };

  return (
    <Container className="mt-4 pb-5">
      
      {/* --- Header Bar --- */}
      <div 
        className="mb-4 px-3 px-md-4 py-3 bg-white rounded-3"
        style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #e9ecef' }}
      >
        {/* Top row on mobile: full-width search. Single row on desktop. */}
        <div className="d-flex align-items-center gap-3 flex-wrap">

          {/* Numista lookup — full width on mobile, fixed on desktop */}
          <Form onSubmit={handleFormSubmit} className="mb-0 flex-grow-1 flex-md-grow-0">
            <InputGroup>
              <Form.Control
                value={numistaNumber}
                onChange={(e) => setNumistaNumber(e.target.value.trim().replace(/\D+/g, ''))}
                placeholder="N# Numista lookup..."
                style={{ minWidth: 0 }}
              />
              <Button variant="primary" type="submit" className="px-3">
                <Search size={14} />
              </Button>
            </InputGroup>
          </Form>

          {/* Vertical divider — desktop only */}
          <div style={{ width: '1px', height: '36px', background: '#dee2e6', flexShrink: 0 }} className="d-none d-md-block" />

          {/* Secondary action: manual entry */}
          <Button 
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate("/create", { state: { manualMode: true } })}
          >
            <PenLine size={13} className="me-1" />Manual Entry
          </Button>

        </div>
      </div>

      {/* Action Bar */}
      {selectedIds.length > 0 && (
        <div 
          className="d-flex justify-content-center mb-4 sticky-top pt-2" 
          style={{ top: '10px', zIndex: 1020 }}
        >
          <ButtonGroup className="shadow-lg">
            <Button variant="success" onClick={handlePrintSelected} className="border-end px-4">
              Print Selected ({selectedIds.length})
            </Button>
            <Button variant="danger" onClick={handleDeleteSelected} className="px-4">
              Delete Selected
            </Button>
            <Button variant="secondary" onClick={() => setSelectedCoins({})} className="border-start">
              Cancel
            </Button>
          </ButtonGroup>
        </div>
      )}

      <div className="coins-list">
        {coins && coins.length > 0 && selectedIds.length === 0 && (
          <div className="mb-2 ps-3">
            <Form.Check
              type="checkbox"
              id="select-all-checkbox"
              label={<span className="text-muted small">Select all</span>}
              checked={false}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
        {coins && coins.length > 0 && selectedIds.length > 0 && selectedIds.length < coins.length && (
          <div className="mb-2 ps-3" ref={indeterminateRef}>
            <Form.Check
              type="checkbox"
              id="select-all-checkbox"
              label={<span className="text-muted small">{selectedIds.length} selected</span>}
              checked={false}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
        {coins && coins.length > 0 && selectedIds.length === coins.length && (
          <div className="mb-2 ps-3">
            <Form.Check
              type="checkbox"
              id="select-all-checkbox"
              label={<span className="text-muted small">All selected</span>}
              checked={true}
              onChange={() => setSelectedCoins({})}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
        {!coins || !coins.length ? (
          <h3 className="text-center">No Coins Yet !!!</h3>
        ) : (
          coins.map((coin) => (
            <Card key={coin._id} className={`mb-4 shadow-sm ${selectedCoins[coin._id] ? 'border-primary' : ''}`}>
              <Card.Header className={selectedCoins[coin._id] ? 'bg-primary text-white' : 'bg-light'}>
                <Row className="align-items-center">
                  <Col xs="auto">
                    <Form.Check 
                      type="checkbox"
                      id={`check-${coin._id}`}
                      checked={!!selectedCoins[coin._id]}
                      onChange={() => toggleSelect(coin._id)}
                    />
                  </Col>
                  <Col>
                    <strong className="text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      {coin.issuer} — {coin.denomination}, {coin.year}
                    </strong>
                  </Col>
                </Row>
              </Card.Header>

              <Card.Body>
                <Row className="align-items-center g-3">
                  <Col xs={12} lg className="border-lg-end">
                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-center align-items-center">
                      <div className="label-wrapper shadow-sm border rounded p-1 bg-white">
                        <FrontLabelContainer isEditable={false} {...coin} />
                      </div>
                      <div className="label-wrapper shadow-sm border rounded p-1 bg-white">
                        <BackLabelContainer isEditable={false} {...coin} />
                      </div>
                    </div>
                  </Col>

                  <Col xs={12} lg="auto" className="d-flex justify-content-center justify-content-lg-end">
                    <ButtonGroup size="sm">
                      <Link 
                        to={`/create/${coin.numistaNumber}`} 
                        state={{ coinId: coin._id }} 
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <Pencil size={13} className="me-1" />Edit
                      </Link>
                      <Button variant="outline-secondary" size="sm" onClick={() => handleDuplicateCoin(coin)}>
                        <Copy size={13} className="me-1" />Duplicate
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCoin(coin._id)}>
                        <Trash2 size={13} className="me-1" />Delete
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
};

export default Home;