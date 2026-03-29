import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, InputGroup, Form, Row, Col, Card, Container, ButtonGroup } from 'react-bootstrap';
import { FrontLabelContainer, BackLabelContainer } from "./label";
import { Search, PenLine, Pencil, Copy, ChevronDown, ChevronUp, ChevronsUpDown, Archive, ArchiveRestore, Printer, Trash2, X } from 'lucide-react';

import {
  Link,
  useNavigate
} from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Home = () => {
  const [coins, setCoins] = useState(null);
  const [numistaNumber, setNumistaNumber] = useState("");
  const [view, setView] = useState('collection'); // 'collection' | 'cache'
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
        setSelectedCoins({});
      } catch (err) {
        console.error("Error deleting coins:", err);
      }
    }
  };

  const handleBulkCache = async (cached) => {
    const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);
    try {
      await axios.patch(`${BASE_URL}/coins/cache`, { ids: selectedIds, cached });
      setCoins(prev => prev.map(coin =>
        selectedIds.includes(coin._id) ? { ...coin, cached } : coin
      ));
      setSelectedCoins({});
    } catch (err) {
      console.error('Error updating cache status:', err);
    }
  };


  const handleSelectAll = () => {
    if (!visibleCoins) return;
    const allSelected = {};
    visibleCoins.forEach(coin => {
      allSelected[coin._id] = true;
    });
    setSelectedCoins(allSelected);
  };

  const toggleSelect = (id) => {
    setSelectedCoins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCoins = coins ? coins.filter(c => !c.cached) : null;
  const cachedCoins = coins ? coins.filter(c => c.cached) : null;
  const visibleCoins = view === 'collection' ? activeCoins : cachedCoins;

  const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);

  // --- Collapse state ---
  const [collapsedCards, setCollapsedCards] = useState({});

  const toggleCollapse = (id) => {
    setCollapsedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allCollapsed = visibleCoins && visibleCoins.length > 0 && visibleCoins.every(c => collapsedCards[c._id]);

  const toggleCollapseAll = () => {
    if (!visibleCoins) return;
    if (allCollapsed) {
      setCollapsedCards({});
    } else {
      const all = {};
      visibleCoins.forEach(c => { all[c._id] = true; });
      setCollapsedCards(all);
    }
  };

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

      {/* View toggle */}
        {/* View toggle */}
      <div className="d-flex mb-3 gap-2">
        <Button
          variant={view === 'collection' ? 'primary' : 'outline-secondary'}
          size="sm"
          onClick={() => { setView('collection'); setSelectedCoins({}); }}
        >
          My Collection {activeCoins ? `(${activeCoins.length})` : ''}
        </Button>
        <Button
          variant={view === 'cache' ? 'warning' : 'outline-secondary'}
          size="sm"
          onClick={() => { setView('cache'); setSelectedCoins({}); }}
        >
          <Archive size={13} className="me-1" />
          Cached {cachedCoins && cachedCoins.length > 0 ? `(${cachedCoins.length})` : ''}
        </Button>
      </div>

      <div 
        className="mb-4 px-3 px-md-4 py-3 bg-white rounded-3"
        style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #e9ecef' }}
      >
        {/* Top row on mobile: full-width search. Single row on desktop. */}
        <div className="d-flex align-items-center gap-3 flex-wrap">

          {/* Numista lookup — full width on mobile, fixed on desktop */}
          <Form onSubmit={handleFormSubmit} className="mb-0 flex-grow-1 flex-md-grow-0">
            <InputGroup>
              <InputGroup.Text className="text-muted">N#</InputGroup.Text>
              <Form.Control
                value={numistaNumber}
                onChange={(e) => setNumistaNumber(e.target.value.trim().replace(/\D+/g, ''))}
                placeholder="Numista number..."
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
              <Printer size={13} className="me-1" />Print Selected ({selectedIds.length})
            </Button>
            {view === 'collection' ? (
              <Button variant="warning" onClick={() => handleBulkCache(true)} className="px-4">
                <Archive size={13} className="me-1" />Cache Selected
              </Button>
            ) : (
              <Button variant="info" onClick={() => handleBulkCache(false)} className="px-4">
                <ArchiveRestore size={13} className="me-1" />Restore Selected
              </Button>
            )}
            <Button variant="danger" onClick={handleDeleteSelected} className="px-4">
              <Trash2 size={13} className="me-1" />Delete Selected
            </Button>
            <Button variant="secondary" onClick={() => setSelectedCoins({})} className="border-start">
              <X size={13} className="me-1" />Cancel
            </Button>
          </ButtonGroup>
        </div>
      )}

      <div className="coins-list">
        {visibleCoins && visibleCoins.length > 0 && selectedIds.length === 0 && (
          <div className="mb-2 ps-3 d-flex align-items-center justify-content-between">
            <Form.Check
              type="checkbox"
              id="select-all-checkbox"
              label={<span className="text-muted small">Select all</span>}
              checked={false}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={toggleCollapseAll}>
              <ChevronsUpDown size={14} className="me-1" />
              <span className="small">{allCollapsed ? 'Expand all' : 'Collapse all'}</span>
            </Button>
          </div>
        )}
        {visibleCoins && visibleCoins.length > 0 && selectedIds.length > 0 && selectedIds.length < visibleCoins.length && (
          <div className="mb-2 ps-3 d-flex align-items-center justify-content-between" ref={indeterminateRef}>
            <Form.Check
              type="checkbox"
              id="select-all-checkbox"
              label={<span className="text-muted small">{selectedIds.length} selected</span>}
              checked={false}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={toggleCollapseAll}>
              <ChevronsUpDown size={14} className="me-1" />
              <span className="small">{allCollapsed ? 'Expand all' : 'Collapse all'}</span>
            </Button>
          </div>
        )}
        {visibleCoins && visibleCoins.length > 0 && selectedIds.length === visibleCoins.length && (
          <div className="mb-2 ps-3 d-flex align-items-center justify-content-between">
            <Form.Check
              type="checkbox"
              id="select-all-checkbox"
              label={<span className="text-muted small">All selected</span>}
              checked={true}
              onChange={() => setSelectedCoins({})}
              style={{ cursor: 'pointer' }}
            />
            <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={toggleCollapseAll}>
              <ChevronsUpDown size={14} className="me-1" />
              <span className="small">{allCollapsed ? 'Expand all' : 'Collapse all'}</span>
            </Button>
          </div>
        )}
        {coins === null ? (
          // Show Bootstrap Placeholders while loading
          <div className="my-5">
            {[1,2,3].map(i => (
              <Card key={i} className="mb-4 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="placeholder-glow w-100">
                      <span className="placeholder col-7"></span>
                      <span className="placeholder col-4"></span>
                      <span className="placeholder col-4"></span>
                      <span className="placeholder col-6"></span>
                      <span className="placeholder col-8"></span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : !visibleCoins || !visibleCoins.length ? (
          <div className="text-center my-5">
            <div style={{fontSize: 48, color: '#adb5bd'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-coin" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10zm0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
                <path d="M8 11a3 3 0 1 1 0-6a3 3 0 0 1 0 6z"/>
              </svg>
            </div>
            {view === 'cache' ? (
              <h4 className="text-muted mt-3">There are no items cached.</h4>
            ) : (
              <>
                <h4 className="mt-3 mb-2 text-muted">No coins in your collection yet</h4>
                <p className="mb-3 text-muted">Start by adding your first coin to see it here.</p>
              </>
            )}
          </div>
        ) : (
          visibleCoins.map((coin) => (
            <Card key={coin._id} className={`mb-4 shadow-sm ${selectedCoins[coin._id] ? 'border-primary' : ''}`}>
              <Card.Header
                className={selectedCoins[coin._id] ? 'bg-primary text-white' : 'bg-light'}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleCollapse(coin._id)}
              >
                <Row className="align-items-center">
                  <Col xs="auto" onClick={e => e.stopPropagation()}>
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
                  <Col xs="auto">
                    {collapsedCards[coin._id]
                      ? <ChevronDown size={16} className={selectedCoins[coin._id] ? 'text-white' : 'text-muted'} />
                      : <ChevronUp size={16} className={selectedCoins[coin._id] ? 'text-white' : 'text-muted'} />
                    }
                  </Col>
                </Row>
              </Card.Header>

              {!collapsedCards[coin._id] && (
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
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
              )}
            </Card>
          ))
        )}
      </div>
    </Container>
  );
};

export default Home;