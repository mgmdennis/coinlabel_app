import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Utilities
import { getCoinBase64 } from "../utils/imageProcessing";
import { parseNumistaText } from "../utils/parseNumistaText";

// Components
import { PasteParseCard } from "../components/PasteParseCard";

// Icons
import { Sparkles, Code, Coins, QrCode } from 'lucide-react';

// React Bootstrap Components
import { 
    Form, 
    Button, 
    Row, 
    Col, 
    Card, 
    InputGroup, 
    Container, 
    Badge,
    Spinner,
    Modal,
    Accordion
} from 'react-bootstrap';

// Your Custom Label Components
import { FrontLabelContainer, BackLabelContainer } from "./label";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Create = () => {
    const { numistaNumber: paramNumistaNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- App State ---
    const [numistaNumber, setNumistaNumber] = useState(paramNumistaNumber || "");
    const [numistaDetails, setNumistaDetails] = useState({});
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [title, setTitle] = useState("");
    const [isManualMode, setIsManualMode] = useState(location?.state?.manualMode || false);
    const [manualImageFile, setManualImageFile] = useState(null);

    // --- Label Field State ---
    const [year, setYear] = useState("");
    const [details, setDetails] = useState("");
    const [denomination, setDenomination] = useState("");
    const [grade, setGrade] = useState("");
    const [gradeDetails, setGradeDetails] = useState("");   
    const [issuer, setIssuer] = useState("");
    const [reference, setReference] = useState("");
    const [mintage, setMintage] = useState("");
    const [composition, setComposition] = useState("");
    const [physicalDetails, setPhysicalDetails] = useState("");
    const [dateAdded, setDateAdded] = useState("");
    const [marksPicture, setMarksPicture] = useState(null);
    const [marks, setMarks] = useState([]);

    // --- Visual Selection State ---
    const [visualTarget, setVisualTarget] = useState("QR"); 
    const [visualMethod, setVisualMethod] = useState("SCRIPT"); 
    const [sketchId, setSketchId] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAIConfirm, setShowAIConfirm] = useState(false);
    const [pasteText, setPasteText] = useState("");

    // --- Logic Functions ---

    const updateFillOutDateAndDetails = (variation, description) => {
        if (!variation) return;
        setYear(variation.date);
        setMintage(variation.mintage.length > 0 ? `m. ${variation.mintage}` : "");
        setMarksPicture(variation.marks_picture || null);
        setMarks(variation.marks || []);
        
        let comments = variation.comment || "";
        if (comments.includes("Proof")) {
            setGrade("Proof");
            comments = comments.replace("Proof", "").trim();
        }
        setDetails(comments.length > 0 ? `${comments}\n${description}` : description);
    };

    const updateNumistaDetails = (jsonData) => {
        setNumistaDetails(jsonData);
        setTitle(jsonData.title);
        const editCoinId = location?.state?.coinId;

        if (!editCoinId) {
            setDenomination(jsonData.denomination);
            setIssuer(jsonData.issuer);
            setComposition(jsonData.composition);
            setPhysicalDetails(`${jsonData.orientation || ''}\n⌀ ${jsonData.diameter || ''}\n${jsonData.mass || ''}`);
            
            if (jsonData.variations?.length > 0) {
                updateFillOutDateAndDetails(jsonData.variations[0], jsonData.description);
            }
            if (jsonData.references?.length > 0) {
                setReference(jsonData.references[0]);
            }
        }
    };

    // --- UNIFIED GENERATION: AI and SCRIPT both use Base64 now ---
    const handleGenerateVisual = async () => {
        if (visualMethod === "AI" && !showAIConfirm) {
            setShowAIConfirm(true);
            return;
        }

        setShowAIConfirm(false);
        setIsGenerating(true);
        
        let imageSource = null;
        
        // In manual mode, use the uploaded file; otherwise use Numista URL
        if (isManualMode) {
            if (!manualImageFile) {
                alert(`Please upload an image`);
                setIsGenerating(false);
                return;
            }
            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async () => {
                await generateSketch(reader.result);
            };
            reader.readAsDataURL(manualImageFile);
            return;
        } else {
            imageSource = visualTarget === "OBVERSE" 
                ? numistaDetails.obverseImage 
                : numistaDetails.reverseImage;
        }
        
        const base64Data = await getCoinBase64(imageSource);
        await generateSketch(base64Data);
    };

    const generateSketch = async (base64Data) => {
        try {
            // Extract coin diameter in mm (default to 25 if not available)
            const coinDiameter = numistaDetails.diameter 
                ? parseFloat(numistaDetails.diameter.match(/[\d.]+/)?.[0] || '25')
                : 25;

            // Determine if this side has a date by checking its description
            const sideDescription = visualTarget === "OBVERSE" 
                ? (numistaDetails.obverseDescription || "")
                : (numistaDetails.reverseDescription || "");
            
            const hasDates = /date|year|dated/i.test(sideDescription);

            // Send to the unified backend route
            const res = await axios.post(`${BASE_URL}/generate-sketch`, {
                numistaNumber,
                method: visualMethod,
                imageData: base64Data,
                coinDiameter,  // Pass the coin diameter for proper scaling
                year,  // Pass the year so sketches differ by date
                side: visualTarget,  // Pass which side (OBVERSE/REVERSE)
                hasDates  // Whether this side has a date on it
            });

            console.log("Backend Response:", res.data);

            setSketchId(res.data.sketchId);
        } catch (err) {
            console.error("Failed to generate visual:", err);
            alert("Error generating image. Ensure your backend proxy is running.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Handle Text Parsing ---
    const handleParseText = () => {
        parseNumistaText(
            pasteText,
            setNumistaNumber,
            setIssuer,
            setYear,
            setComposition,
            setPhysicalDetails,
            setReference,
            setDenomination
        );
        setPasteText("");
        alert("Data extracted and populated!");
    };

    // --- API Interactions ---

    const createCoin = useCallback(() => {
        axios.post(`${BASE_URL}/coin/new`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
            visualTarget, visualMethod, sketchId, isManual: isManualMode
        })
        .then((res) => {
            setCoinId(res.data._id);
            setInitialLoadComplete(true);
        })
        .catch((err) => console.error("Error creating coin:", err));
    }, [numistaNumber, year, issuer, denomination, grade, gradeDetails, details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, isManualMode]);

    const updateCoinRemote = useCallback(() => {
        if (!coinId) return;
        axios.put(`${BASE_URL}/coin/update/${coinId}`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
            visualTarget, visualMethod, sketchId, isManual: isManualMode
        })
        .then(() => console.log("Auto-saved changes"))
        .catch((err) => console.error("Error updating coin:", err));
    }, [coinId, numistaNumber, year, issuer, denomination, grade, gradeDetails, details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, isManualMode]);

    // --- Effects ---

    useEffect(() => {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
        setDateAdded(formattedDate);
        
        // Only fetch from Numista if not in manual mode
        if (!isManualMode && paramNumistaNumber) {
            axios.get(`${BASE_URL}/numista/${paramNumistaNumber}`)
                .then((res) => updateNumistaDetails(res.data))
                .catch((err) => console.error(err));
        } else if (isManualMode) {
            // In manual mode, set placeholder values
            setTitle("Manual Entry");
            setInitialLoadComplete(true);
        }
    }, [paramNumistaNumber, isManualMode]);

    // Load coin data when editing (works for both manual and API coins)
    useEffect(() => {
        const editCoinId = location?.state?.coinId;
        if (editCoinId && !coinId) {
            axios.get(`${BASE_URL}/coin/${editCoinId}`)
                .then((res) => {
                    const c = res.data;
                    console.log("✅ Loaded coin data for editing:", c);
                    
                    // Detect if this is a manually-created coin and switch mode if needed
                    if (c.isManual && !isManualMode) {
                        setIsManualMode(true);
                    }
                    
                    setCoinId(c._id);
                    setNumistaNumber(c.numistaNumber || "");
                    setYear(c.year || "");
                    setIssuer(c.issuer || "");
                    setDenomination(c.denomination || "");
                    setGrade(c.grade || "");
                    setGradeDetails(c.gradeDetails || "");
                    setDetails(c.details || "");
                    setReference(c.reference || "");
                    setComposition(c.composition || "");
                    setPhysicalDetails(c.physicalDetails || "");
                    setMintage(c.mintage || "");
                    setDateAdded(c.dateAdded || dateAdded);
                    setMarksPicture(c.marksPicture || null);
                    setMarks(c.marks || []);
                    setVisualTarget(c.visualTarget || "QR");
                    setVisualMethod(c.visualMethod || "SCRIPT");
                    setSketchId(c.sketchId || "");

                    console.log("Visual fields loaded - visualTarget:", c.visualTarget, "visualMethod:", c.visualMethod, "sketchId:", c.sketchId);
                    setInitialLoadComplete(true);
                })
                .catch((err) => {
                    console.error("❌ Error loading coin for edit:", err);
                    if (!coinId) createCoin();
                });
        }
    }, [location, coinId, dateAdded, createCoin]);

    useEffect(() => {
        // In manual mode, skip Numista details check
        if (isManualMode) {
            // In manual mode, set placeholder values
            setTitle("Manual Entry");
            setInitialLoadComplete(true);
            return;
        }

        if (!numistaDetails.denomination) return;
        
        // Create a new coin if not editing
        if (!coinId) {
        }
    }, [numistaDetails, coinId, location, dateAdded, createCoin, isManualMode]);

    useEffect(() => {
        if (coinId && initialLoadComplete) {
            const delayDebounceFn = setTimeout(() => {
                updateCoinRemote();
            }, 1000); 
            return () => clearTimeout(delayDebounceFn);
        }
    }, [year, details, denomination, grade, gradeDetails, issuer, reference, mintage, composition, physicalDetails, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, updateCoinRemote, coinId, initialLoadComplete]);

    const handleDiscard = () => {
        if (window.confirm("Are you sure you want to discard this entry?")) {
            axios.delete(`${BASE_URL}/coin/delete/${coinId}`).then(() => navigate("/"));
        }
    };

    const handleDuplicate = () => {
        axios.post(`${BASE_URL}/coin/new`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
            visualTarget, visualMethod, sketchId
        }).then(() => navigate("/"));
    };

    return (
        <Container className="py-4">
            {/* AI Confirmation Modal */}
            <Modal show={showAIConfirm} onHide={() => setShowAIConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Sparkles size={20} className="text-primary" /> Confirm AI Generation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Generating an AI engraving sketch costs approximately <strong>$0.01</strong>.</p>
                    <p className="text-muted small">This process takes about 10-15 seconds. Would you like to proceed?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="link" className="text-muted" onClick={() => setShowAIConfirm(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleGenerateVisual}>Generate Sketch</Button>
                </Modal.Footer>
            </Modal>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0">{title || (isManualMode ? "Manual Coin Entry" : "Loading Coin...")}</h1>
                    {!isManualMode && (
                        <a href={`https://numista.com/catalogue/pieces${numistaNumber}.html`} target="_blank" rel="noreferrer" className="text-muted small">
                            Numista #{numistaNumber}
                        </a>
                    )}
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={handleDuplicate}>Duplicate</Button>
                    <Button variant="outline-danger" onClick={handleDiscard}>Discard</Button>
                    <Button variant="primary" onClick={() => navigate("/")} className="px-4">Done</Button>
                </div>
            </div>

            <Row>
                <Col lg={7}>
                    {/* Card 1: Automatic Data (Numista) */}
                    {!isManualMode && (
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light fw-bold">Automatic Data (Numista)</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Variations & Years</Form.Label>
                                <Form.Select 
                                    className="mb-2"
                                    onChange={(e) => updateFillOutDateAndDetails(numistaDetails.variations[e.target.selectedIndex], numistaDetails.description)}
                                >
                                    {numistaDetails.variations?.map((v, i) => (
                                        <option key={i} value={v.date}>{v.date} {v.comment && `(${v.comment})`}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Reference System</Form.Label>
                                <InputGroup size="sm">
                                    <Form.Select value={reference} onChange={(e) => setReference(e.target.value)}>
                                        {numistaDetails.references?.map((ref, i) => (
                                            <option key={i} value={ref}>{ref}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control 
                                        placeholder="Manual Reference" 
                                        value={reference} 
                                        onChange={(e) => setReference(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                    )}

                    {/* Card 2: Label Specifics (The Sheldon Grade Section) */}
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light fw-bold">Label Specifics</Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-uppercase">Sheldon Grade</Form.Label>
                                        <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                                            <option value="">Select Sheldon Grade</option>
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
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-uppercase">Grade Details</Form.Label>
                                        <Form.Control 
                                            placeholder="e.g. Red-Brown, Small Motto, Scratched"
                                            value={gradeDetails}
                                            onChange={(e) => setGradeDetails(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Paste & Parse Numista Data (Manual Mode Only) - After Label Specifics */}
                    {isManualMode && (
                        <Accordion className="mb-4">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header className="bg-light fw-bold">Paste Numista Data (Optional)</Accordion.Header>
                                <Accordion.Body>
                                    <PasteParseCard 
                                        pasteText={pasteText}
                                        setPasteText={setPasteText}
                                        onParse={handleParseText}
                                    />
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    )}

                    {/* Card 3: Visual Customization */}
                    <Card className="shadow-sm mb-4 border-primary">
                        <Card.Header className="bg-primary text-white fw-bold d-flex align-items-center gap-2">
                            <Coins size={18} /> Label Visual Options
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-4">
                                <Col md={12}>
                                    <Form.Label className="small fw-bold text-uppercase text-muted">Step 1: Choose Backside Content</Form.Label>
                                    <div className="d-flex gap-2">
                                        <Button variant={visualTarget === "QR" ? "dark" : "outline-dark"} className="flex-grow-1 d-flex align-items-center justify-content-center gap-2" onClick={() => setVisualTarget("QR")}>
                                            <QrCode size={16} /> QR Code
                                        </Button>
                                        {!isManualMode && (
                                            <>
                                                <Button variant={visualTarget === "OBVERSE" ? "dark" : "outline-dark"} className="flex-grow-1" onClick={() => setVisualTarget("OBVERSE")}>Obverse</Button>
                                                <Button variant={visualTarget === "REVERSE" ? "dark" : "outline-dark"} className="flex-grow-1" onClick={() => setVisualTarget("REVERSE")}>Reverse</Button>
                                            </>
                                        )}
                                        {isManualMode && (
                                            <Button variant={visualTarget === "SKETCH" ? "dark" : "outline-dark"} className="flex-grow-1" onClick={() => setVisualTarget("SKETCH")}>Sketch</Button>
                                        )}
                                    </div>
                                </Col>

                                {isManualMode && visualTarget === "SKETCH" && (
                                    <Col md={12}>
                                        <Form.Label className="small fw-bold text-uppercase text-muted">Step 1b: Upload Image</Form.Label>
                                        <Form.Group>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setManualImageFile(e.target.files[0])}
                                            />
                                            {manualImageFile && <small className="text-success">✓ {manualImageFile.name}</small>}
                                        </Form.Group>
                                    </Col>
                                )}

                                {(visualTarget !== "QR" && !isManualMode) || (visualTarget === "SKETCH" && isManualMode) && (
                                    <Col md={12}>
                                        <Form.Label className="small fw-bold text-uppercase text-muted">Step 2: Style & Processing</Form.Label>
                                        <Row className="g-3">
                                            <Col sm={6}>
                                                <Card 
                                                    className={`h-100 cursor-pointer p-3 text-center border-2 ${visualMethod === 'SCRIPT' ? 'border-info bg-light' : ''}`}
                                                    onClick={() => setVisualMethod("SCRIPT")}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Code size={24} className="mx-auto mb-2 text-info" />
                                                    <div className="fw-bold">Script Sketch</div>
                                                    <Badge bg="success" className="mt-1">FREE</Badge>
                                                    <div className="small text-muted mt-2">Instant grayscale</div>
                                                </Card>
                                            </Col>
                                            <Col sm={6}>
                                                <Card 
                                                    className={`h-100 cursor-pointer p-3 text-center border-2 ${visualMethod === 'AI' ? 'border-primary bg-light' : ''}`}
                                                    onClick={() => setVisualMethod("AI")}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Sparkles size={24} className="mx-auto mb-2 text-primary" />
                                                    <div className="fw-bold">AI Engrave</div>
                                                    <Badge bg="warning" text="dark" className="mt-1">~$0.01</Badge>
                                                    <div className="small text-muted mt-2">Premium artistic</div>
                                                </Card>
                                            </Col>
                                            <Col xs={12}>
                                                <Button 
                                                    variant="primary" 
                                                    size="lg" 
                                                    className="w-100 shadow-sm" 
                                                    onClick={handleGenerateVisual}
                                                    disabled={isGenerating || (
                                                        isManualMode 
                                                            ? !manualImageFile
                                                            : (visualTarget === "OBVERSE" && !numistaDetails.obverseImage) || (visualTarget === "REVERSE" && !numistaDetails.reverseImage)
                                                    )}
                                                >
                                                    {isGenerating ? <><Spinner animation="border" size="sm" className="me-2" /> Processing...</> : "Generate & Preview"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Preview Column */}
                <Col lg={5} className="mt-4 mt-lg-0">
                    <div className="sticky-top" style={{ top: '1rem' }}>
                        <Card className="border-info shadow">
                            <Card.Header className="bg-info text-white fw-bold d-flex justify-content-between">
                                Live Preview <span className="small opacity-75">Scale 1:1</span>
                            </Card.Header>
                            <Card.Body className="bg-light d-flex flex-column align-items-center gap-4 py-4">
                                <div className="preview-section text-center w-100">
                                    <span className="badge bg-secondary mb-2">Front Side</span>
                                    <FrontLabelContainer 
                                        isEditable={true}
                                        year={year} setYear={setYear}
                                        issuer={issuer} setIssuer={setIssuer}
                                        denomination={denomination} setDenomination={setDenomination}
                                        grade={grade} setGrade={setGrade}
                                        gradeDetails={gradeDetails} setGradeDetails={setGradeDetails}
                                        mintage={mintage} setMintage={setMintage}
                                        reference={reference} setReference={setReference}
                                        marksPicture={marksPicture}
                                        marks={marks}
                                        details={details} setDetails={setDetails}
                                    />
                                </div>

                                <div className="preview-section text-center w-100 border-top pt-4">
                                    <span className="badge bg-secondary mb-2">Back Side</span>
                                    <BackLabelContainer 
                                        isEditable={true}
                                        composition={composition} setComposition={setComposition}
                                        physicalDetails={physicalDetails} setPhysicalDetails={setPhysicalDetails}
                                        numistaNumber={numistaNumber} setNumistaNumber={setNumistaNumber}
                                        dateAdded={dateAdded} setDateAdded={setDateAdded}
                                        visualTarget={visualTarget}
                                        sketchId={sketchId}
                                    />
                                </div>
                            </Card.Body>
                            <Card.Footer className="text-center small">
                                <span className="text-success">●</span> Autosaving enabled
                            </Card.Footer>
                        </Card>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};
export default Create;