import { useState, useEffect } from "react";
import axios from "axios";
import deleteIcon from "./assets/delete.svg";
import { Button, InputGroup, Form, Row, Col, Card, Container, ButtonGroup } from 'react-bootstrap';
import { FrontLabelContainer, BackLabelContainer } from "./label";

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
      
      {/* Search Input Section */}
      <div className="coin-input-wrapper mb-4">
        <Form onSubmit={handleFormSubmit}>
          <Row className="g-2 justify-content-center align-items-center">
            <Col xs={12} md="auto">
              <InputGroup>
                <InputGroup.Text>N#</InputGroup.Text>
                <Form.Control
                  value={numistaNumber}
                  onChange={(e) => setNumistaNumber(e.target.value.trim().replace(/\D+/g, ''))}
                  placeholder="Numista ID"
                />
              </InputGroup>
            </Col>
            <Col xs={12} md="auto">
              <Button variant="primary" type="submit" className="w-100 px-4">Go</Button>
            </Col>
            <Col xs={12} md="auto">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate("/create", { state: { manualMode: true } })}
                className="w-100 px-4"
              >
                + Manual Entry
              </Button>
            </Col>
            
            {selectedIds.length === 0 && coins && coins.length > 0 && (
              <Col xs={12} md="auto">
                <Button variant="outline-primary" onClick={handleSelectAll} className="w-100">
                  Select All
                </Button>
              </Col>
            )}
          </Row>
        </Form>
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

                  <Col xs={12} lg="auto">
                    <div className="d-grid d-lg-flex flex-lg-column gap-2" style={{ minWidth: '120px' }}>
                      <Link 
                        to={`/create/${coin.numistaNumber}`} 
                        state={{ coinId: coin._id }} 
                        className="btn btn-outline-secondary btn-sm"
                      >
                        Edit
                      </Link>
                      <Button variant="outline-info" size="sm" onClick={() => handleDuplicateCoin(coin)}>
                        Duplicate
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCoin(coin._id)}>
                        <img src={deleteIcon} alt="delete" height="14px" className="me-1" />
                        Delete
                      </Button>
                    </div>
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