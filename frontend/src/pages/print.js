import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { FrontLabelContainer, BackLabelContainer } from "./label";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Print = () => {
  const [coins, setCoins] = useState(null);
  const location = useLocation();
  const selectedIds = location.state?.selectedIds || null;

  useEffect(() => {
    getCoins();
  }, []);

  const getCoins = () => {
    axios.get(`${BASE_URL}/coins`)
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

  let displayedCoins = [];
  if (coins) {
    displayedCoins = selectedIds && Array.isArray(selectedIds) 
      ? coins.filter(coin => selectedIds.includes(coin._id)) 
      : coins;
  }

  const coinPairs = chunkArray(displayedCoins, 2);

  return (
    <div className="page-container">
      <div className="no-print d-flex align-items-center mb-4" style={{ padding: '20px' }}>
        <button type="button" className="btn btn-outline-secondary btn-sm me-3" onClick={() => window.history.back()}>&larr; Back</button>
        <button type="button" className="btn btn-outline-secondary btn-sm me-3" onClick={() => window.print()}>🖨️ Print</button>
        <h1 className="m-0" style={{ fontSize: '1.5rem' }}>Print Labels</h1>
      </div>

      <div className="print-wrapper">
        <table style={tableStyle}>
          <tbody>
            {coinPairs.map((pair, rowIndex) => (
              <tr key={rowIndex} style={rowStyle}>
                <td style={cellStyle}><div className="label-wrapper"><FrontLabelContainer {...pair[0]} isEditable={false} /></div></td>
                <td style={cellStyle}><div className="label-wrapper"><BackLabelContainer {...pair[0]} isEditable={false} /></div></td>
                {pair[1] ? (
                  <>
                    <td style={cellStyle}><div className="label-wrapper"><FrontLabelContainer {...pair[1]} isEditable={false} /></div></td>
                    <td style={cellStyle}><div className="label-wrapper"><BackLabelContainer {...pair[1]} isEditable={false} /></div></td>
                  </>
                ) : (
                  <><td style={cellStyle}></td><td style={cellStyle}></td></>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @page {
          size: letter portrait;
          margin: 0 !important; /* Force browser margins to zero */
        }

        @media print {
          .no-print { display: none !important; }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            width: 215.9mm;
            overflow: visible;
          }

          .print-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            /* Applying your converted MM margins as padding */
            padding-top: 2.03mm;    /* 0.08in */
            padding-left: 19.05mm;  /* 0.75in */
            padding-right: 4.57mm;  /* 0.18in */
            padding-bottom: 1.78mm; /* 0.07in */
            width: 215.9mm;
            box-sizing: border-box;
          }

          table {
            width: auto !important;
            table-layout: fixed;
            border-collapse: collapse;
          }
        }

        /* Screen View */
        .page-container { padding: 20px; }
        .label-wrapper > div { margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
      `}</style>
    </div>
  );
};

const tableStyle = { borderCollapse: "collapse", borderTop: "1px dashed #bbb", borderLeft: "1px dashed #bbb" };
const rowStyle = { margin: 0, padding: 0 };
const cellStyle = {
  borderRight: "1px dashed #bbb",
  borderBottom: "1px dashed #bbb",
  padding: "0",
  width: "44mm",
  height: "45.5mm",
  verticalAlign: "top",
  overflow: "hidden",
};

export default Print;