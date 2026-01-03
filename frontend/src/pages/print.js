import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FrontLabelContainer, BackLabelContainer } from "./label";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Home = () => {
  const [coins, setCoins] = useState(null);
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

  const chunkArray = (arr, size) => {
    if (!arr) return [];
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const coinPairs = chunkArray(coins, 2);

  return (
    <div className="page-container">
      <h1 className="no-print">Print Labels</h1>

      <table style={tableStyle}>
        <tbody>
          {coinPairs && coinPairs.map((pair, rowIndex) => (
            <tr key={rowIndex} style={rowStyle}>
              {/* Coin 1: Front and Back */}
              <td style={cellStyle}>
                <div className="label-wrapper">
                  <FrontLabelContainer {...pair[0]} isEditable={false} />
                </div>
              </td>
              <td style={cellStyle}>
                <div className="label-wrapper">
                  <BackLabelContainer {...pair[0]} isEditable={false} />
                </div>
              </td>

              {/* Coin 2: Front and Back (if exists) */}
              {pair[1] ? (
                <>
                  <td style={cellStyle}>
                    <div className="label-wrapper">
                      <FrontLabelContainer {...pair[1]} isEditable={false} />
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <div className="label-wrapper">
                      <BackLabelContainer {...pair[1]} isEditable={false} />
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @media print {
          .no-print { display: none; }
          body { margin: 0; padding: 0; }
          .page-container { padding: 0 !important; }
        }
        /* Ensure the labels themselves don't bring their own margins */
        .label-wrapper > div {
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
};

// --- Styles ---

const tableStyle = {
  borderCollapse: "collapse",
  borderTop: "1px dashed #bbb",
  borderLeft: "1px dashed #bbb",
  width: "auto",
  tableLayout: "fixed", // Forces the browser to respect cell widths
};

const rowStyle = {
  margin: 0,
  padding: 0,
};

const cellStyle = {
  borderRight: "1px dashed #bbb",
  borderBottom: "1px dashed #bbb",
  padding: "0",
  margin: "0",
  verticalAlign: "top",
  width: "43mm", 
  height: "42mm", 
  overflow: "hidden",
};

export default Home;