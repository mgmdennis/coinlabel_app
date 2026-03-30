import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Container, Row, Col, Form, InputGroup, Button, Modal } from 'react-bootstrap';

// Utilities
import { parseNumistaText } from "../utils/parseNumistaText";

// Components
import { AIConfirmModal } from "../components/AIConfirmModal";
import { CreateHeader } from "../components/CreateHeader";
import { ManualModeToggle } from "../components/ManualModeToggle";
import { NumistaDataCard } from "../components/NumistaDataCard";
import { LabelSpecificsCard } from "../components/LabelSpecificsCard";
import { PasteNumistaAccordion } from "../components/PasteNumistaAccordion";
import { VisualCustomizationCard } from "../components/VisualCustomizationCard";
import { PreviewCard } from "../components/PreviewCard";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Create = () => {
    const { numistaNumber: paramNumistaNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- App State ---
    const [numistaNumber, setNumistaNumber] = useState(
        (location?.state?.manualMode) ? "" : (paramNumistaNumber || "")
    );
    const [numistaDetails, setNumistaDetails] = useState({});
    const [numistaTitle, setNumistaTitle] = useState("");
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const lastLoadedCoinId = useRef(null);
    const [title, setTitle] = useState("");
    const [isManualMode, setIsManualMode] = useState(location?.state?.manualMode || false);
    const [numistaError, setNumistaError] = useState("");
    const [pastedImage, setPastedImage] = useState(null);

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
    const [numistaSide, setNumistaSide] = useState("OBVERSE");
    const [sketchId, setSketchId] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [showAIConfirm, setShowAIConfirm] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const [userChangedVisualTarget, setUserChangedVisualTarget] = useState(false);

    // --- Save Status State ---
    const [saveStatus, setSaveStatus] = useState("saved"); // 'saving', 'saved', 'error'

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

    // Only overwrite label fields if forceOverwrite is true (reset or new coin)
    const updateNumistaDetails = (jsonData, forceOverwrite = false) => {
        setNumistaDetails(jsonData); // Always update for dropdowns, etc.
        setNumistaTitle(jsonData.title || ""); // Always update for UI population
        if (forceOverwrite) {
            setTitle(jsonData.title);
            setDenomination(jsonData.denomination);
            setIssuer(jsonData.issuer);
            setComposition(jsonData.composition);
            setPhysicalDetails(`${jsonData.orientation || ''}\n⌀ ${jsonData.diameter || ''}\n${jsonData.mass || ''}`);
            // Reset dateAdded to today
            const currentDate = new Date();
            const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
            setDateAdded(formattedDate);
            if (jsonData.variations?.length > 0) {
                updateFillOutDateAndDetails(jsonData.variations[0], jsonData.description);
            }
            if (jsonData.references?.length > 0) {
                setReference(jsonData.references[0]);
            }
        }
    };

    // --- UNIFIED GENERATION: AI, SCRIPT, and RAW ---
    const handleGenerateVisual = async () => {
        if (visualMethod === "AI" && !showAIConfirm) {
            setShowAIConfirm(true);
            return;
        }

        setShowAIConfirm(false);
        setIsGenerating(true);
        
        let imageData = null;   // base64 for pasted images
        let imageUrl = null;    // raw URL for Numista images (backend fetches via relay)
        let side = null;

        if (visualTarget === 'PASTED') {
            if (!pastedImage) {
                alert(`Please paste an image from your clipboard first.`);
                setIsGenerating(false);
                return;
            }
            imageData = pastedImage;
            side = 'PASTED';
        } else if (visualTarget === 'NUMISTA') {
            side = numistaSide; // OBVERSE or REVERSE
            const imgSource = numistaSide === "OBVERSE" 
                ? numistaDetails.obverseImage 
                : numistaDetails.reverseImage;
            
            if (!imgSource) {
                alert(`No ${numistaSide.toLowerCase()} image is available from Numista.`);
                setIsGenerating(false);
                return;
            }
            imageUrl = imgSource; // Send URL — backend will fetch it
        } else {
            // QR / GALLERY shouldn't reach here
            setIsGenerating(false);
            return;
        }
        
        await generateSketch({ imageData, imageUrl, side });
        setIsGenerating(false);
    };

    const generateSketch = async ({ imageData, imageUrl, side }) => {
        try {
            // Extract coin diameter in mm (default to 25 if not available)
            const coinDiameter = numistaDetails.diameter 
                ? parseFloat(numistaDetails.diameter.match(/[\d.]+/)?.[0] || '25')
                : 25;

            // Determine if this coin has multiple date variations
            const hasDates = numistaDetails.variations && numistaDetails.variations.length > 1;

            console.log(`🎯 Generating sketch - Year: "${year}", HasDates: ${hasDates}, Side: ${side}, Method: ${visualMethod}`);

            const requestBody = {
                numistaNumber,
                method: visualMethod,
                coinDiameter,
                year,
                side,
                hasDates,
                ...(imageData && { imageData }),
                ...(imageUrl && { imageUrl }),
            };

            console.log(`📤 Sending request body:`, {
                numistaNumber: requestBody.numistaNumber,
                method: requestBody.method,
                year: requestBody.year,
                side: requestBody.side,
                hasDates: requestBody.hasDates,
                coinDiameter: requestBody.coinDiameter,
                hasImageData: !!requestBody.imageData,
                hasImageUrl: !!requestBody.imageUrl,
            });

            // Send to the unified backend route
            const res = await axios.post(`${BASE_URL}/generate-sketch`, requestBody);

            console.log("Backend Response:", res.data);

            setSketchId(res.data.sketchId);
        } catch (err) {
            console.error("Failed to generate visual:", err);
            alert("Error generating image. Ensure your backend proxy is running.");
        } finally {
            // Spinners are now controlled in handleGenerateVisual
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

    const isCreatingCoin = useRef(false);

    const createCoin = useCallback(() => {
        if (isCreatingCoin.current) return;
        isCreatingCoin.current = true;
        axios.post(`${BASE_URL}/coin/new`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
            visualTarget, visualMethod, sketchId, isManual: isManualMode
        })
        .then((res) => {
            setCoinId(res.data._id);
            setInitialLoadComplete(true);
        })
        .catch((err) => {
            console.error("Error creating coin:", err);
            isCreatingCoin.current = false; // Allow retry on error
        });
    }, [numistaNumber, year, issuer, denomination, grade, gradeDetails, details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, isManualMode]);

    const updateCoinRemote = useCallback(() => {
        if (!coinId) return;
        setSaveStatus("saving");
        axios.put(`${BASE_URL}/coin/update/${coinId}`, {
            numistaNumber, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
            visualTarget, visualMethod, sketchId, isManual: isManualMode
        })
        .then(() => {
            setSaveStatus("saved");
            console.log("Auto-saved changes");
        })
        .catch((err) => {
            setSaveStatus("error");
            console.error("Error updating coin:", err);
        });
    }, [coinId, numistaNumber, year, issuer, denomination, grade, gradeDetails, details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, isManualMode]);

    // --- Effects ---

    useEffect(() => {
        const handlePaste = (event) => {
            // Allow pasting images in manual mode OR when PASTED target is selected
            if (!isManualMode && visualTarget !== 'PASTED') return;

            const items = (event.clipboardData || event.originalEvent.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setPastedImage(e.target.result); // Keep base64 for display and processing
                    };
                    reader.readAsDataURL(blob);
                    event.preventDefault(); // Prevent the image from being pasted elsewhere
                    break; // We only handle the first image file we find
                }
            }
        };

        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [isManualMode, visualTarget]); // Rerun if isManualMode or visualTarget changes

    // File picker handler — same pipeline as clipboard paste (iOS fallback)
    const handleImageFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setPastedImage(e.target.result);
        reader.readAsDataURL(file);
    };

    // When switching to manual mode, reset visual target appropriately
    useEffect(() => {
        if (isManualMode && visualTarget === 'NUMISTA') {
            setVisualTarget('QR');
        }
    }, [isManualMode, visualTarget]);

    useEffect(() => {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
        setDateAdded(formattedDate);
        // Only fetch from Numista if not in manual mode
        if (!isManualMode && paramNumistaNumber) {
            setNumistaError("");
            axios.get(`${BASE_URL}/numista/${paramNumistaNumber}`)
                .then((res) => {
                    // Only overwrite fields if this is a new coin (not editing)
                    const editCoinId = location?.state?.coinId;
                    updateNumistaDetails(res.data, !editCoinId);
                })
                .catch((err) => {
                    const message = err.response?.data?.error || "Failed to load coin data from Numista.";
                    console.error("Numista fetch error:", message);
                    setNumistaError(message);
                    setTitle("Error");
                });
        } else if (isManualMode) {
            // In manual mode, set placeholder values
            setTitle("Manual Entry");
            setInitialLoadComplete(true);
        }
    }, [paramNumistaNumber, isManualMode, location]);

    // Load coin data when editing (works for both manual and API coins)
    useEffect(() => {
        const editCoinId = location?.state?.coinId;
        // If coinId changes, reset initialLoadComplete
        if (editCoinId && lastLoadedCoinId.current !== editCoinId) {
            setInitialLoadComplete(false);
        }
        // Only load backend data if coinId changes or on first mount for this coin
        if (editCoinId && !initialLoadComplete && lastLoadedCoinId.current !== editCoinId) {
            axios.get(`${BASE_URL}/coin/${editCoinId}`)
                .then((res) => {
                    const c = res.data;
                    console.log("✅ Loaded coin data for editing:", c);
                    // Detect if this is a manually-created coin and switch mode if needed
                    if (c.isManual && !isManualMode) {
                        setIsManualMode(true);
                    }
                    setCoinId(c._id);
                    setTitle(c.title || "");
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
                    // Always update Numista details for dropdowns, but don't overwrite fields
                    if (c.numistaDetails) {
                        setNumistaDetails(c.numistaDetails);
                    }
                    console.log("Visual fields loaded - visualTarget:", c.visualTarget, "visualMethod:", c.visualMethod, "sketchId:", c.sketchId);
                    setInitialLoadComplete(true);
                    lastLoadedCoinId.current = editCoinId;
                })
                .catch((err) => {
                    console.error("❌ Error loading coin for edit:", err);
                    if (!coinId) createCoin();
                });
        }
    }, [location, coinId, dateAdded, createCoin, initialLoadComplete, isManualMode]);

    useEffect(() => {
        // In manual mode, create coin immediately if not editing
        if (isManualMode) {
            setTitle("Manual Entry");
            const editCoinId = location?.state?.coinId;
            if (!coinId && !editCoinId) {
                createCoin();
            }
            return;
        }

        if (!numistaDetails.denomination) return;
        
        // Create a new coin if not editing
        const editCoinId = location?.state?.coinId;
        if (!coinId && !editCoinId) {
            createCoin();
        }
    }, [numistaDetails, coinId, location, dateAdded, createCoin, isManualMode]);

    useEffect(() => {
        if (coinId && initialLoadComplete) {
            setSaveStatus("saving"); // Immediately show saving on any change
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
            <AIConfirmModal 
                show={showAIConfirm} 
                onHide={() => setShowAIConfirm(false)}
                onConfirm={handleGenerateVisual}
            />

            <CreateHeader
                title={title || numistaTitle}
                isManualMode={isManualMode}
                numistaNumber={numistaNumber}
                onDuplicate={handleDuplicate}
                onDiscard={handleDiscard}
                onDone={() => navigate("/")}
                saveStatus={saveStatus}
            />

            <ManualModeToggle
                isManualMode={isManualMode}
                onChange={(e) => setIsManualMode(e.target.checked)}
            />

            <InputGroup className="mb-4" style={{ maxWidth: 300 }}>
                <InputGroup.Text>N#</InputGroup.Text>
                <Form.Control
                    type="number"
                    placeholder="Numista Number"
                    value={numistaNumber}
                    onChange={(e) => setNumistaNumber(e.target.value)}
                />
                {!isManualMode && numistaNumber && numistaNumber !== paramNumistaNumber && (
                    <Button 
                        variant="outline-primary"
                        onClick={() => {
                            if (window.confirm("Changing the Numista number will discard your current work and load a new coin. Continue?")) {
                                navigate(`/create/${numistaNumber}`);
                            }
                        }}
                    >
                        Load
                    </Button>
                )}
            </InputGroup>

            <Modal show={!!numistaError} centered backdrop="static">
                <Modal.Header>
                    <Modal.Title>Unable to Load Coin</Modal.Title>
                </Modal.Header>
                <Modal.Body>{numistaError}</Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-danger" onClick={() => navigate("/")}>Go Back</Button>
                    <Button variant="outline-secondary" onClick={() => {
                        setNumistaError("");
                        setIsManualMode(true);
                        navigate("/create", { replace: true });
                    }}>Switch to Manual Mode</Button>
                </Modal.Footer>
            </Modal>

            <Row>
                <Col lg={7}>
                    {!isManualMode && (
                        <>
                        <NumistaDataCard
                            numistaDetails={numistaDetails}
                            reference={reference}
                            onVariationChange={(e) => updateFillOutDateAndDetails(
                                numistaDetails.variations[e.target.selectedIndex], 
                                numistaDetails.description
                            )}
                            onReferenceChange={setReference}
                        />
                        {/* Mobile-only Reset button */}
                        <div className="d-lg-none d-flex justify-content-end mt-2">
                            <Button
                                variant="link"
                                size="sm"
                                className="px-1 py-0 text-muted"
                                style={{fontWeight: 500, textDecoration: 'none'}}
                                onClick={async () => {
                                    if (!numistaNumber) return;
                                    try {
                                        const res = await axios.get(`${BASE_URL}/numista/${numistaNumber}`);
                                        updateNumistaDetails(res.data);
                                    } catch (err) {
                                        alert('Failed to fetch Numista data.');
                                    }
                                }}
                                title="Reset all fields to Numista data"
                                disabled={!numistaNumber}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: 2, marginBottom: 2}}>
                                  <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 1 0-.908-.418A6 6 0 1 0 8 2v1z"/>
                                  <path d="M8 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V1.5A.5.5 0 0 0 8 1z"/>
                                </svg>
                                Reset fields from Numista
                            </Button>
                        </div>
                        </>
                    )}

                    <LabelSpecificsCard
                        grade={grade}
                        onGradeChange={(e) => setGrade(e.target.value)}
                    />

                    {isManualMode && (
                        <PasteNumistaAccordion
                            pasteText={pasteText}
                            setPasteText={setPasteText}
                            onParse={handleParseText}
                        />
                    )}

                    <VisualCustomizationCard
                        isManualMode={isManualMode}
                        pastedImage={pastedImage}
                        visualTarget={visualTarget}
                        visualMethod={visualMethod}
                        numistaSide={numistaSide}
                        isGenerating={isGenerating}
                        isGeneratingQR={isGeneratingQR}
                        onVisualTargetChange={(e) => {
                            setVisualTarget(e.target.value);
                            setUserChangedVisualTarget(true);
                        }}
                        onVisualMethodChange={(e) => setVisualMethod(e.target.value)}
                        onNumistaSideChange={(e) => setNumistaSide(e.target.value)}
                        onGenerateVisual={handleGenerateVisual}
                        sketchId={sketchId}
                        onSketchSelect={(id) => setSketchId(id)}
                        numistaNumber={numistaNumber}
                        obverseImageUrl={numistaDetails.obverseImage}
                        reverseImageUrl={numistaDetails.reverseImage}
                        onImageFile={handleImageFile}
                    />
                </Col>

                <Col lg={5}>
                    <PreviewCard
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
                        composition={composition} setComposition={setComposition}
                        physicalDetails={physicalDetails} setPhysicalDetails={setPhysicalDetails}
                        numistaNumber={numistaNumber}
                        dateAdded={dateAdded} setDateAdded={setDateAdded}
                        visualTarget={visualTarget}
                        sketchId={sketchId}
                        isGenerating={isGenerating}
                        isManualMode={isManualMode}
                        updateNumistaDetails={updateNumistaDetails}
                        BASE_URL={BASE_URL}
                        saveStatus={saveStatus}
                    />
                </Col>
            </Row>
        </Container>
    );
};
export default Create;