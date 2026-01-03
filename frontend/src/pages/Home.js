import { useState, useEffect } from "react";
import axios from "axios";
import deleteIcon from "./assets/delete.svg";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import {FrontLabelContainer, BackLabelContainer} from "./label";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate
} from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');


const Home = () => {
  // return <h1>Home</h1>;

  const [coins, setCoins] = useState(null);
  const [numistaNumber, setNumistaNumber] = useState("");
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
    .catch((err) =>
        console.error(err)
      );
  };

  function handleNumistaNumber () { 
    navigate('/create/' + numistaNumber);
  };
  return (
    <div className="App">
      <Button variant="outline-primary">
        Coin Collection
      </Button>
      <div className="coin-input-wrapper">

      <InputGroup className="mb-3">
        <InputGroup.Text id="basic-addon3">
          N#
        </InputGroup.Text>
        <Form.Control
          id="basic-url"
          aria-describedby="basic-addon3"
          value={numistaNumber}
          onChange={(e) => {
            // keep only digits and trim whitespace
            const raw = String(e.target.value || '');
            const sanitized = raw.trim().replace(/\D+/g, '');
            setNumistaNumber(sanitized);
          }}
        />
      </InputGroup>
      <Button variant="outline-primary" onClick={handleNumistaNumber}>
        Go
      </Button>
      </div>
      <div className="coins-list">
        {!coins || !coins.length ? (
          <h3 style={{ textAlign: "center" }}>No Coins Yet !!!</h3>
        ) : (
          coins.map((coin) => (
            <div>
            <div className="coin" key={coin._id}>
              <div
                id="coin-title"
              >
                {coin.issuer} - {coin.denomination}, {coin.year}
              </div>
              <Button variant="outline-primary" onClick={() => handleDeleteCoin(coin._id)}>
                <img src={deleteIcon} alt="delete" height="20px" width="20px" />
              </Button>
              <Link to={`/create/${coin.numistaNumber}`} state={{ coinId: coin._id }}>EDIT</Link>
            </div>
            <FrontLabelContainer
              isEditable={false}
              numistaNumber={coin.numistaNumber}
              year={coin.year}
              issuer={coin.issuer}
              denomination={coin.denomination}
              grade={coin.grade}
              gradeDetails={coin.gradeDetails}
              details={coin.details}
              reference={coin.reference}
              composition={coin.composition}
              physicalDetails={coin.physicalDetails}
              mintage={coin.mintage}
              dateAdded={coin.dateAdded}
              marksPicture={coin.marksPicture}
            />
            <BackLabelContainer
              isEditable={false}
              numistaNumber={coin.numistaNumber}
              composition={coin.composition}
              physicalDetails={coin.physicalDetails}
              dateAdded={coin.dateAdded}
            />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

  function handleNumistaNumber () { 
    const n = String(numistaNumber || '').trim();
    if (!n) return;
    navigate(`/create/${encodeURIComponent(n)}`);
  };


export default Home;

  
