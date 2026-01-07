import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { FrontLabelContainer, BackLabelContainer } from "./label";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Print = () => {
  const [coins, setCoins] = useState(null);
  const location = useLocation();

  // 1. Extract selectedIds from the navigation state
  const selectedIds = location.state?.selectedIds || null;

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

  // 2. Filter Logic
  let displayedCoins = [];
  if (coins) {
    if (selectedIds && Array.isArray(selectedIds)) {
      displayedCoins = coins.filter(coin => selectedIds.includes(coin._id));
    } else {
      // If no state was passed, show everything
      displayedCoins = coins;
    }
  }

  const coinPairs = chunkArray(displayedCoins, 2);

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      
      {/* Tiny Bootstrap Back Button and Header */}
      <div className="no-print d-flex align-items-center mb-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary btn-sm me-3" 
          onClick={() => window.history.back()}
          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
        >
          &larr; Back
        </button>
        <h1 className="m-0" style={{ fontSize: '1.5rem' }}>Print Labels</h1>
      </div>

      <table style={tableStyle}>
        <tbody>
          {coinPairs.length > 0 ? (
            coinPairs.map((pair, rowIndex) => (
              <tr key={rowIndex} style={rowStyle}>
                <td style={cellStyle}>
                  <div className="label-wrapper">
                    <FrontLabelContainer key={`front-${pair[0]._id}`} {...pair[0]} isEditable={false} />
                  </div>
                </td>
                <td style={cellStyle}>
                  <div className="label-wrapper">
                    <BackLabelContainer key={`back-${pair[0]._id}`} {...pair[0]} isEditable={false} />
                  </div>
                </td>

                {pair[1] ? (
                  <>
                    <td style={cellStyle}>
                      <div className="label-wrapper">
                        <FrontLabelContainer key={`front-${pair[1]._id}`} {...pair[1]} isEditable={false} />
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div className="label-wrapper">
                        <BackLabelContainer key={`back-${pair[1]._id}`} {...pair[1]} isEditable={false} />
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
            ))
          ) : (
            <tr className="no-print">
              <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>
                {coins ? "No matching coins found." : "Loading coin data..."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .page-container { padding: 0 !important; }
        }
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
  tableLayout: "fixed", 
};
const rowStyle = { margin: 0, padding: 0 };
const cellStyle = {
  borderRight: "1px dashed #bbb",
  borderBottom: "1px dashed #bbb",
  padding: "0",
  margin: "0",
  verticalAlign: "top",
  width: "43.5mm",
  height: "45.5mm",
  overflow: "hidden",
};

export default Print;