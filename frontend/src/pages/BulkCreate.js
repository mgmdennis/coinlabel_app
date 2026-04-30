import { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Button,
  Form,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
} from "lucide-react";

const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api");

const getTodayFormatted = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d
    .toLocaleString("default", { month: "short" })
    .toUpperCase()}-${String(d.getDate()).padStart(2, "0")}`;
};

const SKETCH_MODE_MAP = {
  QR: { visualTarget: "QR", visualMethod: "SCRIPT" },
  SCRIPT: { visualTarget: "NUMISTA", visualMethod: "SCRIPT" },
  AI: { visualTarget: "NUMISTA", visualMethod: "AI" },
  RAW: { visualTarget: "NUMISTA", visualMethod: "RAW" },
  GALLERY: { visualTarget: "GALLERY", visualMethod: "SCRIPT" },
};

let rowCounter = Date.now();
const makeRow = () => {
  rowCounter += 1;
  return {
    id: rowCounter,
    coinId: null,
    isManual: false,
    numistaNumber: "",
    numistaDetails: {},
    title: "",
    year: "",
    issuer: "",
    denomination: "",
    grade: "",
    gradeDetails: "",
    details: "",
    reference: "",
    mintage: "",
    composition: "",
    physicalDetails: "",
    dateAdded: getTodayFormatted(),
    marksPicture: null,
    marks: [],
    sketchMode: "QR",
    visualTarget: "QR",
    visualMethod: "SCRIPT",
    sketchId: "",
    status: "new",
    numistaLoading: false,
    numistaError: "",
    generating: false,
  };
};

const GradeSelect = ({ value, onChange, size }) => (
  <Form.Select value={value} onChange={onChange} size={size} style={{ fontSize: "0.75rem" }}>
    <option value="">Grade</option>
    <optgroup label="Mint State (Uncirculated)">
      <option value="MS-70">MS-70</option>
      <option value="MS-69">MS-69</option>
      <option value="MS-68">MS-68</option>
      <option value="MS-67">MS-67</option>
      <option value="MS-66">MS-66</option>
      <option value="MS-65">MS-65</option>
      <option value="MS-64">MS-64</option>
      <option value="MS-63">MS-63</option>
      <option value="MS-62">MS-62</option>
      <option value="MS-61">MS-61</option>
      <option value="MS-60">MS-60</option>
      <option value="BU">BU (Brilliant Uncirculated)</option>
      <option value="UNC">UNC (Uncirculated)</option>
    </optgroup>
    <optgroup label="About Uncirculated">
      <option value="AU">AU (About Uncirculated)</option>
      <option value="AU-58">AU-58</option>
      <option value="AU-55">AU-55</option>
      <option value="AU-50">AU-50</option>
    </optgroup>
    <optgroup label="Extremely Fine">
      <option value="EF+">EF+ (Extremely Fine Plus)</option>
      <option value="EF">EF (Extremely Fine)</option>
      <option value="EF-45">EF-45</option>
      <option value="EF-40">EF-40</option>
    </optgroup>
    <optgroup label="Very Fine">
      <option value="VF+">VF+ (Very Fine Plus)</option>
      <option value="VF">VF (Very Fine)</option>
      <option value="VF-30">VF-30</option>
      <option value="VF-20">VF-20</option>
    </optgroup>
    <optgroup label="Fine">
      <option value="F+">F+ (Fine Plus)</option>
      <option value="F">F (Fine)</option>
      <option value="F-15">F-15</option>
      <option value="F-12">F-12</option>
    </optgroup>
    <optgroup label="Very Good / Good">
      <option value="VG+">VG+ (Very Good Plus)</option>
      <option value="VG">VG (Very Good)</option>
      <option value="VG-10">VG-10</option>
      <option value="VG-8">VG-8</option>
      <option value="G+">G+ (Good Plus)</option>
      <option value="G">G (Good)</option>
      <option value="G-6">G-6</option>
      <option value="G-4">G-4</option>
    </optgroup>
    <optgroup label="About Good / Basal">
      <option value="AG+">AG+ (About Good Plus)</option>
      <option value="AG">AG (About Good)</option>
      <option value="AG-3">AG-3</option>
    </optgroup>
    <optgroup label="Special Strikings">
      <option value="Proof">Proof</option>
      <option value="Spec">Specimen</option>
    </optgroup>
  </Form.Select>
);

const StatusIcon = ({ status }) => {
  if (status === "saving") return <Spinner animation="border" size="sm" />;
  if (status === "saved") return <CheckCircle size={16} color="green" />;
  if (status === "error") return <AlertCircle size={16} color="red" />;
  return <span style={{ color: "#aaa" }}>—</span>;
};

const BulkCreate = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([makeRow()]);
  const rowsRef = useRef(rows);
  const debounceTimers = useRef({});

  // Keep rowsRef in sync with rows state for use inside callbacks
  const setRowsSync = useCallback((updater) => {
    setRows((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      rowsRef.current = next;
      return next;
    });
  }, []);

  const updateRow = useCallback((id, patch) => {
    setRowsSync((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, [setRowsSync]);

  const triggerSave = useCallback(
    (id) => {
      if (debounceTimers.current[id]) {
        clearTimeout(debounceTimers.current[id]);
      }
      debounceTimers.current[id] = setTimeout(async () => {
        setRowsSync((prev) => {
          const row = prev.find((r) => r.id === id);
          if (!row) return prev;

          const payload = {
            numistaNumber: row.numistaNumber,
            year: row.year,
            issuer: row.issuer,
            denomination: row.denomination,
            grade: row.grade,
            gradeDetails: row.gradeDetails,
            details: row.details,
            reference: row.reference,
            composition: row.composition,
            physicalDetails: row.physicalDetails,
            mintage: row.mintage,
            dateAdded: row.dateAdded,
            marksPicture: row.marksPicture,
            marks: row.marks,
            visualTarget: row.visualTarget,
            visualMethod: row.visualMethod,
            sketchId: row.sketchId,
            isManual: row.isManual,
            title: row.title,
          };

          const doSave = async () => {
            try {
              if (!row.coinId) {
                const res = await axios.post(`${BASE_URL}/coin/new`, payload);
                setRowsSync((p) =>
                  p.map((r) =>
                    r.id === id
                      ? { ...r, coinId: res.data._id, status: "saved" }
                      : r
                  )
                );
              } else {
                await axios.put(
                  `${BASE_URL}/coin/update/${row.coinId}`,
                  payload
                );
                setRowsSync((p) =>
                  p.map((r) => (r.id === id ? { ...r, status: "saved" } : r))
                );
              }
            } catch (err) {
              console.error("Save error:", err);
              setRowsSync((p) =>
                p.map((r) => (r.id === id ? { ...r, status: "error" } : r))
              );
            }
          };

          doSave();
          return prev.map((r) =>
            r.id === id ? { ...r, status: "saving" } : r
          );
        });
      }, 1200);
    },
    [setRowsSync]
  );

  const handleFieldChange = useCallback(
    (id, field, value) => {
      setRowsSync((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
      triggerSave(id);
    },
    [setRowsSync, triggerSave]
  );

  const handleSketchModeChange = useCallback(
    (id, mode) => {
      const mapping = SKETCH_MODE_MAP[mode] || SKETCH_MODE_MAP["QR"];
      setRowsSync((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                sketchMode: mode,
                visualTarget: mapping.visualTarget,
                visualMethod: mapping.visualMethod,
              }
            : r
        )
      );
      triggerSave(id);
    },
    [setRowsSync, triggerSave]
  );

  const handleLoadNumista = useCallback(async (id) => {
    setRowsSync((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, numistaLoading: true, numistaError: "" }
          : r
      )
    );

    const row = rowsRef.current.find((r) => r.id === id);
    if (!row || !row.numistaNumber) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/numista/${row.numistaNumber}`
      );
      const data = res.data;

      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${currentDate
        .toLocaleString("default", { month: "short" })
        .toUpperCase()}-${String(currentDate.getDate()).padStart(2, "0")}`;

      let year = "";
      let mintage = "";
      let details = "";
      let reference = data.references?.[0] || "";
      let marksPicture = null;
      let marks = [];
      let grade = "";

      if (data.variations?.length > 0) {
        const variation = data.variations[0];
        year = variation.date || "";
        mintage =
          variation.mintage && variation.mintage.length > 0
            ? `m. ${variation.mintage}`
            : "";
        marksPicture = variation.marks_picture || null;
        marks = variation.marks || [];
        let comments = variation.comment || "";
        if (comments.includes("Proof")) {
          grade = "Proof";
          comments = comments.replace("Proof", "").trim();
        }
        details =
          comments.length > 0
            ? `${comments}\n${data.description || ""}`
            : data.description || "";
      }

      setRowsSync((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                numistaDetails: data,
                title: data.title || "",
                denomination: data.denomination || "",
                issuer: data.issuer || "",
                composition: data.composition || "",
                physicalDetails: `${data.orientation || ""}\n⌀ ${
                  data.diameter || ""
                }\n${data.mass || ""}`,
                dateAdded: formattedDate,
                year,
                mintage,
                details,
                reference,
                marksPicture,
                marks,
                grade: grade || r.grade,
                numistaLoading: false,
                numistaError: "",
              }
            : r
        )
      );

      triggerSave(id);
    } catch (err) {
      const message =
        err.response?.data?.error || "Failed to load coin data from Numista.";
      setRowsSync((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, numistaLoading: false, numistaError: message }
            : r
        )
      );
    }
  }, [setRowsSync, triggerSave]);

  const handleGenerateSketch = useCallback(
    async (id) => {
      const row = rowsRef.current.find((r) => r.id === id);
      if (!row) return;

      if (row.visualMethod === "AI") {
        const confirmed = window.confirm(
          "Generating an AI sketch uses credits. Continue?"
        );
        if (!confirmed) return;
      }

      if (!row.numistaDetails.obverseImage) {
        const hasNumistaData = Object.keys(row.numistaDetails).length > 0;
        alert(
          hasNumistaData
            ? "No obverse image available from Numista for this coin."
            : "Please load Numista data first (click the Load button)."
        );
        return;
      }

      updateRow(id, { generating: true });

      try {
        const coinDiameter = row.numistaDetails.diameter
          ? parseFloat(
              row.numistaDetails.diameter.match(/[\d.]+/)?.[0] || "25"
            )
          : 25;
        const hasDates =
          row.numistaDetails.variations &&
          row.numistaDetails.variations.length > 1;

        const res = await axios.post(`${BASE_URL}/generate-sketch`, {
          numistaNumber: row.numistaNumber,
          method: row.visualMethod,
          coinDiameter,
          year: row.year,
          side: "OBVERSE",
          hasDates,
          imageUrl: row.numistaDetails.obverseImage,
        });

        setRowsSync((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, sketchId: res.data.sketchId, generating: false }
              : r
          )
        );
        triggerSave(id);
      } catch (err) {
        console.error("Sketch generation error:", err);
        alert("Error generating sketch.");
        updateRow(id, { generating: false });
      }
    },
    [setRowsSync, updateRow, triggerSave]
  );

  const handleDeleteRow = useCallback(
    async (id) => {
      const row = rowsRef.current.find((r) => r.id === id);
      if (!row) return;

      if (row.coinId) {
        try {
          await axios.delete(`${BASE_URL}/coin/delete/${row.coinId}`);
        } catch (err) {
          console.error("Delete error:", err);
        }
      }

      if (debounceTimers.current[id]) {
        clearTimeout(debounceTimers.current[id]);
        delete debounceTimers.current[id];
      }

      setRowsSync((prev) => prev.filter((r) => r.id !== id));
    },
    [setRowsSync]
  );

  const handleOpenEditor = useCallback(
    (row) => {
      if (row.isManual) {
        navigate("/create", { state: { coinId: row.coinId } });
      } else {
        navigate(`/create/${row.numistaNumber}`, {
          state: { coinId: row.coinId },
        });
      }
    },
    [navigate]
  );

  const handleToggleManual = useCallback(
    (id) => {
      setRowsSync((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const newIsManual = !r.isManual;
          let sketchMode = r.sketchMode;
          if (newIsManual && sketchMode !== "QR" && sketchMode !== "GALLERY") {
            sketchMode = "QR";
          }
          const mapping = SKETCH_MODE_MAP[sketchMode];
          return {
            ...r,
            isManual: newIsManual,
            sketchMode,
            visualTarget: mapping.visualTarget,
            visualMethod: mapping.visualMethod,
          };
        })
      );
      triggerSave(id);
    },
    [setRowsSync, triggerSave]
  );

  const inputStyle = { fontSize: "0.75rem" };
  const btnStyle = { fontSize: "0.65rem", padding: "1px 6px" };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="h4 mb-1">Bulk Label Entry</h2>
          <p className="text-muted small mb-0">
            Spreadsheet-style input for rapid creation of multiple coin labels
          </p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate("/")}
        >
          ← Back to Collection
        </Button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          className="table table-bordered table-sm align-middle"
          style={{ fontSize: "0.8rem", minWidth: 1400 }}
        >
          <thead className="table-dark">
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th style={{ width: 40 }}>Mode</th>
              <th style={{ width: 80 }}>N#</th>
              <th style={{ width: 40 }}>Load</th>
              <th style={{ minWidth: 130 }}>Title</th>
              <th style={{ width: 70 }}>Year</th>
              <th style={{ minWidth: 100 }}>Issuer</th>
              <th style={{ minWidth: 100 }}>Denomination</th>
              <th style={{ width: 140 }}>Grade</th>
              <th style={{ width: 100 }}>Grade Details</th>
              <th style={{ width: 100 }}>Reference</th>
              <th style={{ width: 90 }}>Mintage</th>
              <th style={{ minWidth: 140 }}>Details</th>
              <th style={{ minWidth: 120 }}>Composition</th>
              <th style={{ minWidth: 120 }}>Physical</th>
              <th style={{ width: 110 }}>Date Added</th>
              <th style={{ width: 130 }}>Sketch</th>
              <th style={{ width: 50 }}>Status</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                {/* # */}
                <td className="text-center text-muted">{idx + 1}</td>

                {/* Mode toggle */}
                <td className="text-center">
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {row.isManual ? "Manual mode" : "Numista mode"}
                      </Tooltip>
                    }
                  >
                    <Button
                      size="sm"
                      variant={row.isManual ? "warning" : "outline-secondary"}
                      style={btnStyle}
                      onClick={() => handleToggleManual(row.id)}
                    >
                      {row.isManual ? "M" : "N"}
                    </Button>
                  </OverlayTrigger>
                </td>

                {/* N# */}
                <td>
                  <div>
                    <Form.Control
                      type="number"
                      size="sm"
                      style={inputStyle}
                      value={row.numistaNumber}
                      disabled={row.isManual}
                      placeholder="N#"
                      onChange={(e) =>
                        handleFieldChange(
                          row.id,
                          "numistaNumber",
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !row.isManual && row.numistaNumber) {
                          handleLoadNumista(row.id);
                        }
                      }}
                    />
                    {row.numistaError && (
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "red",
                          marginTop: 2,
                        }}
                      >
                        {row.numistaError}
                      </div>
                    )}
                  </div>
                </td>

                {/* Load */}
                <td className="text-center">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    style={btnStyle}
                    disabled={
                      row.isManual ||
                      !row.numistaNumber ||
                      row.numistaLoading
                    }
                    onClick={() => handleLoadNumista(row.id)}
                  >
                    {row.numistaLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                  </Button>
                </td>

                {/* Title */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder={row.isManual ? "Title" : "Load N# first"}
                    value={row.title}
                    onChange={(e) =>
                      handleFieldChange(row.id, "title", e.target.value)
                    }
                  />
                </td>

                {/* Year */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="Year"
                    value={row.year}
                    onChange={(e) =>
                      handleFieldChange(row.id, "year", e.target.value)
                    }
                  />
                </td>

                {/* Issuer */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="Issuer"
                    value={row.issuer}
                    onChange={(e) =>
                      handleFieldChange(row.id, "issuer", e.target.value)
                    }
                  />
                </td>

                {/* Denomination */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="Denomination"
                    value={row.denomination}
                    onChange={(e) =>
                      handleFieldChange(
                        row.id,
                        "denomination",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* Grade */}
                <td>
                  <GradeSelect
                    value={row.grade}
                    size="sm"
                    onChange={(e) =>
                      handleFieldChange(row.id, "grade", e.target.value)
                    }
                  />
                </td>

                {/* Grade Details */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="e.g. cleaned"
                    value={row.gradeDetails}
                    onChange={(e) =>
                      handleFieldChange(
                        row.id,
                        "gradeDetails",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* Reference */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="Reference"
                    value={row.reference}
                    onChange={(e) =>
                      handleFieldChange(row.id, "reference", e.target.value)
                    }
                  />
                </td>

                {/* Mintage */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="Mintage"
                    value={row.mintage}
                    onChange={(e) =>
                      handleFieldChange(row.id, "mintage", e.target.value)
                    }
                  />
                </td>

                {/* Details */}
                <td>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="Details"
                    value={row.details}
                    onChange={(e) =>
                      handleFieldChange(row.id, "details", e.target.value)
                    }
                  />
                </td>

                {/* Composition */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="Composition"
                    value={row.composition}
                    onChange={(e) =>
                      handleFieldChange(
                        row.id,
                        "composition",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* Physical */}
                <td>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="Orientation / ⌀ / mass"
                    value={row.physicalDetails}
                    onChange={(e) =>
                      handleFieldChange(
                        row.id,
                        "physicalDetails",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* Date Added */}
                <td>
                  <Form.Control
                    size="sm"
                    style={inputStyle}
                    placeholder="YYYY-MMM-DD"
                    value={row.dateAdded}
                    onChange={(e) =>
                      handleFieldChange(row.id, "dateAdded", e.target.value)
                    }
                  />
                </td>

                {/* Sketch */}
                <td>
                  <Form.Select
                    size="sm"
                    style={inputStyle}
                    value={row.sketchMode}
                    onChange={(e) =>
                      handleSketchModeChange(row.id, e.target.value)
                    }
                  >
                    <option value="QR">QR Code</option>
                    <option
                      value="SCRIPT"
                      disabled={row.isManual}
                    >
                      Script – Numista
                    </option>
                    <option value="AI" disabled={row.isManual}>
                      AI – Numista
                    </option>
                    <option value="RAW" disabled={row.isManual}>
                      Raw – Numista
                    </option>
                    <option value="GALLERY">From Gallery</option>
                  </Form.Select>
                  {["SCRIPT", "AI", "RAW"].includes(row.sketchMode) && (
                    <div className="mt-1">
                      <Button
                        size="sm"
                        variant={row.sketchId ? "outline-success" : "outline-secondary"}
                        style={btnStyle}
                        disabled={
                          row.generating ||
                          !row.numistaDetails.obverseImage
                        }
                        onClick={() => handleGenerateSketch(row.id)}
                      >
                        {row.generating ? (
                          <Spinner animation="border" size="sm" />
                        ) : row.sketchId ? (
                          "✓ Regen"
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="text-center">
                  <StatusIcon status={row.status} />
                </td>

                {/* Actions */}
                <td>
                  <div className="d-flex flex-column gap-1">
                    {row.coinId && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        style={btnStyle}
                        title="Open in full editor"
                        onClick={() => handleOpenEditor(row)}
                      >
                        <ExternalLink size={11} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline-danger"
                      style={btnStyle}
                      title="Delete row"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="d-flex gap-2 mt-2">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setRowsSync((prev) => [...prev, makeRow()])}
        >
          + Add Row
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={() => navigate("/")}
        >
          ✓ Done
        </Button>
      </div>
    </Container>
  );
};

export default BulkCreate;
