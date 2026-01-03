import { useState, useEffect } from "react";
import axios from "axios";
import deleteIcon from "./assets/delete.svg";
import { Button, InputGroup, Form, Row, Col, Card, Container } from 'react-bootstrap';
import { FrontLabelContainer, BackLabelContainer } from "./label";

import {
  Link,
  useNavigate
} from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Home = () => {
  const [coins, setCoins] = useState(null);
  const [numistaNumber, setNumistaNumber] = useState("");
  const [selectedCoins, setSelectedCoins] = useState({});
  const navigate = useNavigate();

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
    axios
      .delete(`${BASE_URL}/coin/delete/${id}`)
      .then((res) =>
        setCoins(coins.filter((coin) => coin._id !== res.data._id))
      )
      .catch((err) => console.error(err));
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

  const toggleSelect = (id) => {
    setSelectedCoins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Container className="mt-4">
      {/* Search Input Section */}
      <div className="coin-input-wrapper mb-4">
        <Form onSubmit={handleFormSubmit}>
          <Row className="g-2 justify-content-center">
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
              <Button variant="primary" type="submit" className="w-100">Go</Button>
            </Col>
          </Row>
        </Form>
      </div>

      <div className="coins-list">
        {!coins || !coins.length ? (
          <h3 className="text-center">No Coins Yet !!!</h3>
        ) : (
          coins.map((coin) => (
            <Card key={coin._id} className="mb-4 shadow-sm">
              {/* Header: Title and Checkbox together */}
              <Card.Header className="bg-light">
                <Row className="align-items-center">
                  <Col xs="auto">
                    <Form.Check 
                      type="checkbox"
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
                  {/* Labels Section */}
                  <Col xs={12} lg className="border-lg-end">
                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-center align-items-center">
                      <div className="label-wrapper shadow-sm border rounded p-1">
                        <FrontLabelContainer isEditable={false} {...coin} />
                      </div>
                      <div className="label-wrapper shadow-sm border rounded p-1">
                        <BackLabelContainer isEditable={false} {...coin} />
                      </div>
                    </div>
                  </Col>

                  {/* Action Buttons */}
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
      
      {/* Hopefully, this layout is as sweet as a fresh maple cookie! */}
    </Container>
  );
};

export default Home;