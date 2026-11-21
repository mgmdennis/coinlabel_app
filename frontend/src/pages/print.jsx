import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Button, Group, Text, Title } from '@mantine/core';

import { BASE_URL } from '../config';
import { FrontLabelContainer, BackLabelContainer } from "./label";
import { ProvenancePanel } from '../components/ProvenancePanel';

/**
 * Duplex provenance geometry (2026-11-21)
 *
 * The label is folded into a booklet along the crease between its Front and
 * Back cells. The inside of the booklet is therefore the sheet's BACK face of
 * those two cells — which only gets ink with double-sided printing.
 *
 * Letter portrait duplex with long-edge binding (a book-style page turn)
 * places verso content mirrored about the page's vertical centre: verso
 * content authored at x appears at sheet coordinate 215.9 − x. So the verso
 * grid is the front grid mirrored: front cells start at 19.05mm, so the
 * mirrored grid starts at 215.9 − 19.05 − 4×44 = 20.85mm, and verso column j
 * sits exactly beneath front column 3−j.
 *
 * Inside the opened booklet the spread always reads [Back-panel inner |
 * Front-panel inner], so provenance is authored on the verso cells that
 * mirror the FRONT cells (front columns 0 and 2 = verso columns 3 and 1);
 * the Back-panel inner page stays blank.
 */
const PAGE_WIDTH_MM = 215.9;
const FRONT_MARGIN_MM = 19.05;
const BACK_MARGIN_MM = 20.85; // PAGE_WIDTH_MM - FRONT_MARGIN_MM - 4 * 44mm
const LABELS_PER_PAGE = 12;   // 6 rows × 2 coins ≈ 267mm of the 279.4mm page

const FrontRow = ({ pair }) => (
    <tr style={rowStyle}>
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
);

// Crop-mark grid — 0.5cm registration crosses at every grid intersection,
// replacing the old full dashed lattice. Sits over the table in a relative
// wrapper so each cross lands exactly on a cell corner (rows×cols grid, with
// the outer edges included: those are the cut corners).
const CrossGrid = ({ rows, cols = 4 }) => {
    const crosses = [];
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            crosses.push(
                <span
                    key={`${r}-${c}`}
                    className="cut-cross"
                    style={{ left: `${c * 44}mm`, top: `${r * 44.5}mm` }}
                />
            );
        }
    }
    return <div className="cut-cross-grid" aria-hidden="true">{crosses}</div>;
};

const CutGridWrap = ({ rows, children }) => (
    <div className="cut-grid-wrap">
        {children}
        <CrossGrid rows={rows} />
    </div>
);

const ProvenanceBackRow = ({ pair }) => {
    const prov = (coin) =>
        coin && (coin.provenance || '').trim()
            ? <ProvenancePanel text={coin.provenance} />
            : null;
    // Verso column order is the mirror of the front: 0↔front c3, 1↔c2,
    // 2↔c1, 3↔c0. Provenance only on the front-panel mirrors.
    return (
        <tr style={rowStyle}>
            <td style={cellStyle}></td>
            <td style={cellStyle}>{prov(pair[1])}</td>
            <td style={cellStyle}></td>
            <td style={cellStyle}>{prov(pair[0])}</td>
        </tr>
    );
};

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

  const hasProvenance = displayedCoins.some(coin => (coin.provenance || '').trim());
  const coinPairs = chunkArray(displayedCoins, 2);
  const pageBatches = chunkArray(displayedCoins, LABELS_PER_PAGE);

  return (
    <div className="page-container">
      <Group className="no-print" align="center" mb="lg" p="md">
        <Button variant="default" size="xs" onClick={() => window.history.back()}>&larr; Back</Button>
        <Button variant="default" size="xs" onClick={() => window.print()}>🖨️ Print</Button>
        <Title order={2} m={0} style={{ fontSize: '1.5rem' }}>Print Labels</Title>
        {hasProvenance && (
          <Text size="sm" c="red.7" fw={600}>
            Provenance included — print DOUBLE-SIDED, flip on long edge, or the insides will be blank.
          </Text>
        )}
      </Group>

      {!hasProvenance ? (
        <div className="print-wrapper">
          <CutGridWrap rows={coinPairs.length}>
            <table style={tableStyle}>
              <tbody>
                {coinPairs.map((pair, rowIndex) => (
                  <FrontRow key={rowIndex} pair={pair} />
                ))}
              </tbody>
            </table>
          </CutGridWrap>
        </div>
      ) : (
        <div className="print-wrapper provenance-mode">
          {pageBatches.map((batch, pageIdx) => (
            <React.Fragment key={pageIdx}>
              <div className="print-page print-page-front">
                <CutGridWrap rows={Math.ceil(batch.length / 2)}>
                  <table style={tableStyle}>
                    <tbody>
                      {chunkArray(batch, 2).map((pair, rowIndex) => (
                        <FrontRow key={rowIndex} pair={pair} />
                      ))}
                    </tbody>
                  </table>
                </CutGridWrap>
              </div>
              <div className="no-print sheet-label">
                ⬆ Sheet {pageIdx + 1} front — labels &nbsp;|&nbsp; ⬇ Sheet {pageIdx + 1} back (verso) — provenance, printed inside the folded booklets
              </div>
              <div className="print-page print-page-back">
                <CutGridWrap rows={Math.ceil(batch.length / 2)}>
                  <table style={tableStyle}>
                    <tbody>
                      {chunkArray(batch, 2).map((pair, rowIndex) => (
                        <ProvenanceBackRow key={rowIndex} pair={pair} />
                      ))}
                    </tbody>
                  </table>
                </CutGridWrap>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

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
            padding-top: 3mm;       /* Color LaserJet M254dw */
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

          /* Duplex provenance mode: each sheet side is its own printed page.
             The wrapper's single top padding can't repeat per page, so each
             page div carries its own 3mm top offset and page-break. */
          .provenance-mode {
            padding-top: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .provenance-mode .print-page {
            page-break-after: always;
            break-after: page;
            padding-top: 3mm;
            padding-bottom: 1.78mm;
            box-sizing: border-box;
          }
          .provenance-mode .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }

        /* Screen View */
        .page-container { padding: 20px; }
        .label-wrapper > div { margin: 0 !important; padding: 0 !important; box-shadow: none !important; }

        .provenance-mode .print-page-front { padding-left: ${FRONT_MARGIN_MM}mm; }
        .provenance-mode .print-page-back { padding-left: ${BACK_MARGIN_MM}mm; }

        .sheet-label {
          font-size: 12px;
          color: #888;
          margin: 8px 0;
        }

        /* Subtle cut guides: 0.5cm registration crosses at every grid
           intersection instead of a full dashed lattice. Drawn as an overlay
           over the label table so each cross is centred exactly on a cell
           corner; the outermost rows/columns mark the cut edges. */
        .cut-grid-wrap { position: relative; }
        .cut-cross-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .cut-cross {
          position: absolute;
          width: 4mm;
          height: 4mm;
          transform: translate(-50%, -50%);
        }
        /* Arms are borders, not backgrounds — browsers drop background
           graphics when printing/saving to PDF unless the user enables
           "Background graphics", and borders always come through. */
        .cut-cross::before,
        .cut-cross::after {
          content: '';
          position: absolute;
        }
        .cut-cross::before {
          left: 0;
          right: 0;
          top: 50%;
          height: 0;
          border-top: 0.15mm solid #b8b8b8;
        }
        .cut-cross::after {
          top: 0;
          bottom: 0;
          left: 50%;
          width: 0;
          border-left: 0.15mm solid #b8b8b8;
        }
      `}</style>
    </div>
  );
};

const tableStyle = { borderCollapse: "collapse" };
const rowStyle = { margin: 0, padding: 0 };
const cellStyle = {
  padding: "0",
  width: "44mm",
  height: "44.5mm",
  verticalAlign: "top",
  overflow: "hidden",
  position: "relative",
};

export default Print;
