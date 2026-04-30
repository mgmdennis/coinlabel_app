import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { FrontLabel, BackLabel } from "./label";

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

  const isHeritage = (coin) => coin?.labelTheme === 'The Heritage';

  let displayedCoins = [];
  if (coins) {
    displayedCoins = selectedIds && Array.isArray(selectedIds)
      ? coins.filter(coin => selectedIds.includes(coin._id))
      : coins;
  }

  const standardCoins = displayedCoins.filter(c => !isHeritage(c));
  const heritageCoins = displayedCoins.filter(c => isHeritage(c));

  const standardPairs = chunkArray(standardCoins, 2);
  const heritageChunks = chunkArray(heritageCoins, 3);

  const LabelTable = ({ pairs, cellDimensions, label, coinsPerRow = 2 }) => (
    pairs.length > 0 && (
      <div>
        <div className="no-print" style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>{label}</div>
        <table style={tableStyle}>
          <tbody>
            {pairs.map((pair, rowIndex) => (
              <tr key={rowIndex} style={rowStyle}>
                <td style={{...cellStyle, ...cellDimensions}}><div className="label-wrapper"><FrontLabel {...pair[0]} isEditable={false} labelTheme={pair[0]?.labelTheme} /></div></td>
                <td style={{...cellStyle, ...cellDimensions}}><div className="label-wrapper"><BackLabel {...pair[0]} isEditable={false} physicalDetails={pair[0]?.physicalDetails} /></div></td>
                {coinsPerRow > 1 && (pair[1] ? (
                  <>
                    <td style={{...cellStyle, ...cellDimensions}}><div className="label-wrapper"><FrontLabel {...pair[1]} isEditable={false} labelTheme={pair[1]?.labelTheme} /></div></td>
                    <td style={{...cellStyle, ...cellDimensions}}><div className="label-wrapper"><BackLabel {...pair[1]} isEditable={false} physicalDetails={pair[1]?.physicalDetails} /></div></td>
                  </>
                ) : (
                  <><td style={{...cellStyle, ...cellDimensions}}></td><td style={{...cellStyle, ...cellDimensions}}></td></>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  // Heritage labels rotate 90° so each is 50mm wide × 54mm tall.
  // 3 coins across = 150mm, well within Letter width.
  // Fronts and backs occupy separate rows so each pair can be cut together.
  const HeritageRotatedTable = ({ chunks, label }) => (
    chunks.length > 0 && (
      <div>
        <div className="no-print" style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>{label}</div>
        <table style={tableStyle}>
          <tbody>
            {chunks.map((group, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr style={rowStyle}>
                  {group.map((coin, i) => (
                    <td key={i} style={{...cellStyle, ...HERITAGE_ROTATED_CELL}}>
                      <div style={rotatedOuterStyle}>
                        <div className="label-wrapper" style={rotatedInnerStyle}>
                          <FrontLabel {...coin} isEditable={false} labelTheme={coin?.labelTheme} />
                        </div>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - group.length }).map((_, i) => (
                    <td key={`ef-${i}`} style={{...cellStyle, ...HERITAGE_ROTATED_CELL}}></td>
                  ))}
                </tr>
                <tr style={rowStyle}>
                  {group.map((coin, i) => (
                    <td key={i} style={{...cellStyle, ...HERITAGE_ROTATED_CELL}}>
                      <div style={rotatedOuterStyle}>
                        <div className="label-wrapper" style={rotatedInnerStyle}>
                          <BackLabel {...coin} isEditable={false} physicalDetails={coin?.physicalDetails} />
                        </div>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - group.length }).map((_, i) => (
                    <td key={`eb-${i}`} style={{...cellStyle, ...HERITAGE_ROTATED_CELL}}></td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="page-container">
      <div className="no-print d-flex align-items-center mb-4" style={{ padding: '20px' }}>
        <button type="button" className="btn btn-outline-secondary btn-sm me-3" onClick={() => window.history.back()}>&larr; Back</button>
        <button type="button" className="btn btn-outline-secondary btn-sm me-3" onClick={() => window.print()}>🖨️ Print</button>
        <h1 className="m-0" style={{ fontSize: '1.5rem' }}>Print Labels</h1>
      </div>

      <div className="print-wrapper">
        <LabelTable pairs={standardPairs} cellDimensions={DEFAULT_CELL} label="Standard (44 × 45.5 mm)" coinsPerRow={2} />
        <HeritageRotatedTable chunks={heritageChunks} label="Heritage (54 × 50 mm) — rotated 90°, 3 across" />
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

const DEFAULT_CELL = { width: '44mm', height: '45.5mm' };
const HERITAGE_CELL = { width: '54mm', height: '50mm' };
const HERITAGE_ROTATED_CELL = { width: '50mm', height: '54mm' };
// Label is 54×50mm; rotated 90°, it occupies a 50×54mm cell.
const rotatedOuterStyle = { position: 'relative', width: '50mm', height: '54mm', overflow: 'hidden' };
const rotatedInnerStyle = { position: 'absolute', width: '54mm', height: '50mm', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)', transformOrigin: 'center center' };

const tableStyle = { borderCollapse: "collapse", borderTop: "1px dashed #bbb", borderLeft: "1px dashed #bbb" };
const rowStyle = { margin: 0, padding: 0 };
const cellStyle = {
  borderRight: "1px dashed #bbb",
  borderBottom: "1px dashed #bbb",
  padding: "0",
  verticalAlign: "top",
  overflow: "hidden",
};

export default Print;