import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// React Bootstrap Components
import { 
    Form, 
    Button, 
    Row, 
    Col, 
    Card, 
    InputGroup, 
    Container, 
    Badge 
} from 'react-bootstrap';

// Your Custom Label Components
import { FrontLabelContainer, BackLabelContainer } from "./label";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Create = () => {
    const { numistaNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // App State
    const [numistaDetails, setNumistaDetails] = useState({});
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [title, setTitle] = useState("");

    // Label Field State
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
        const editCoinId = location?.state?.coinId;
        setNumistaDetails(jsonData);
        setTitle(jsonData.title);

        if (editCoinId) return;

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
    };

    // --- API Interactions ---

    const createCoin = useCallback(() => {
        axios.post(`${BASE_URL}/coin/new`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks
        })
        .then((res) => {
            setCoinId(res.data._id);
            setInitialLoadComplete(true);
        })
        .catch((err) => console.error("Error creating coin:", err));
    }, [numistaNumber, year, issuer, denomination, grade, gradeDetails, details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks]);

    const updateCoinRemote = useCallback(() => {
        if (!coinId) return;
        axios.put(`${BASE_URL}/coin/update/${coinId}`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks
        })
        .then((res) => console.log("Auto-saved changes"))
        .catch((err) => console.error("Error updating coin:", err));
    }, [coinId, numistaNumber, year, issuer, denomination, grade, gradeDetails, details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks]);

    // --- Effects ---

    useEffect(() => {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
        setDateAdded(formattedDate);
        
        axios.get(`${BASE_URL}/numista/${numistaNumber}`)
            .then((res) => updateNumistaDetails(res.data))
            .catch((err) => console.error(err));
    }, [numistaNumber]);

    useEffect(() => {
        if (!numistaDetails.denomination) return;
        const editCoinId = location?.state?.coinId;

        if (editCoinId && !coinId) {
            axios.get(`${BASE_URL}/coin/${editCoinId}`)
                .then((res) => {
                    const c = res.data;
                    setCoinId(c._id);
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
                    setInitialLoadComplete(true);
                })
                .catch(() => !coinId && createCoin());
        } else if (!coinId) {
            createCoin();
        }
    }, [numistaDetails, coinId, location, dateAdded, createCoin]);

    useEffect(() => {
        if (coinId && initialLoadComplete) {
            const delayDebounceFn = setTimeout(() => {
                updateCoinRemote();
            }, 1000); 
            return () => clearTimeout(delayDebounceFn);
        }
    }, [year, details, denomination, grade, gradeDetails, issuer, reference, mintage, composition, physicalDetails, dateAdded, marksPicture, marks, updateCoinRemote, coinId, initialLoadComplete]);

    // --- Handlers ---

    const handleDiscard = () => {
        if (window.confirm("Are you sure you want to discard this entry?")) {
            axios.delete(`${BASE_URL}/coin/delete/${coinId}`).then(() => navigate("/"));
        }
    };

    const handleDuplicate = () => {
        axios.post(`${BASE_URL}/coin/new`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks
        }).then(() => navigate("/"));
    };

    return (
        <Container className="py-4">
            {/* Action Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <Badge bg="primary" className="mb-2">NumisTag Cataloger</Badge>
                    <h1 className="h2 mb-0">{title || "Loading Coin..."}</h1>
                    <a href={`https://www.numista.com/${numistaNumber}`}><small className="text-muted">Numista #{numistaNumber}</small></a>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-danger" onClick={handleDiscard}>Discard</Button>
                    <Button variant="outline-secondary" onClick={handleDuplicate}>Duplicate</Button>
                    <Button variant="success" onClick={() => navigate("/")} className="px-4 fw-bold">Done</Button>
                </div>
            </div>

            <Row>
                <Col lg={7}>
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

                    <Card className="shadow-sm">
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
                </Col>

                <Col lg={5} className="mt-4 mt-lg-0">
                    <div className="sticky-top" style={{ top: '1rem' }}>
                        <Card className="border-info shadow">
                            <Card.Header className="bg-info text-white fw-bold">
                                Live 2x2 Preview
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
                                        numistaNumber={numistaNumber}
                                        dateAdded={dateAdded} setDateAdded={setDateAdded}
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