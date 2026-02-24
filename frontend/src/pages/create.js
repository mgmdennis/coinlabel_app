import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Container, Row, Col } from 'react-bootstrap';

// Utilities
import { getCoinBase64 } from "../utils/imageProcessing";
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
    const [numistaNumber, setNumistaNumber] = useState(paramNumistaNumber || "");
    const [numistaDetails, setNumistaDetails] = useState({});
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [title, setTitle] = useState("");
    const [isManualMode, setIsManualMode] = useState(location?.state?.manualMode || false);
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
    const [sketchId, setSketchId] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [showAIConfirm, setShowAIConfirm] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const [userChangedVisualTarget, setUserChangedVisualTarget] = useState(false);

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
        let base64Data = null;

        // If QR code is the target, we don't need an image source.
        if (visualTarget === 'QR') {
            setIsGeneratingQR(true); // Start QR generation indicator
            await generateSketch(null); // Pass null for QR code generation
            setIsGeneratingQR(false); // Stop QR generation indicator
            return;
        }

        // For Obverse/Reverse/Pasted, show the main spinner and proceed
        setIsGenerating(true);

        // For Obverse/Reverse, determine the image source
        if (visualTarget === 'PASTED') {
            if (!pastedImage) {
                alert(`Please paste an image from your clipboard to generate a visual.`);
                setIsGenerating(false);
                return;
            }
            base64Data = pastedImage; // The pastedImage is already a base64 string
        } else { // OBVERSE or REVERSE
            imageSource = visualTarget === "OBVERSE" 
                ? numistaDetails.obverseImage 
                : numistaDetails.reverseImage;
            
            if (!imageSource) {
                alert(`No ${visualTarget.toLowerCase()} image is available from Numista.`);
                setIsGenerating(false);
                return;
            }
            base64Data = await getCoinBase64(imageSource);
        }
        
        await generateSketch(base64Data);
        setIsGenerating(false); // Stop main spinner
    };

    const generateSketch = async (base64Data) => {
        try {
            // Extract coin diameter in mm (default to 25 if not available)
            const coinDiameter = numistaDetails.diameter 
                ? parseFloat(numistaDetails.diameter.match(/[\d.]+/)?.[0] || '25')
                : 25;

            // Determine if this coin has multiple date variations
            // If there are multiple variations, the year matters for distinguishing them
            const hasDates = numistaDetails.variations && numistaDetails.variations.length > 1;

            console.log(`🎯 Generating sketch - Year: "${year}", HasDates: ${hasDates}, Variations: ${numistaDetails.variations?.length || 0}, Side: ${visualTarget}, Method: ${visualMethod}`);

            // Prepare request body
            const requestBody = {
                numistaNumber,
                method: visualMethod,
                imageData: base64Data, // Can be null for QR
                coinDiameter,  // Pass the coin diameter for proper scaling
                year,  // Pass the year so sketches differ by date
                side: visualTarget,  // Pass which side (OBVERSE/REVERSE/QR)
                hasDates  // Whether this side has a date on it
            };

            console.log(`📤 Sending request body:`, {
                numistaNumber: requestBody.numistaNumber,
                method: requestBody.method,
                year: requestBody.year,
                side: requestBody.side,
                hasDates: requestBody.hasDates,
                coinDiameter: requestBody.coinDiameter,
                imageDataLength: requestBody.imageData ? requestBody.imageData.length : 0
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
        const handlePaste = (event) => {
            // Only act if we are in manual mode
            if (!isManualMode) return;

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
    }, [isManualMode]); // Rerun if isManualMode changes

    // When switching to manual mode, if a side is selected, default to QR
    useEffect(() => {
        if (isManualMode && (visualTarget === 'OBVERSE' || visualTarget === 'REVERSE')) {
            setVisualTarget('QR');
        } else if (!isManualMode && visualTarget === 'PASTED') {
            setVisualTarget('QR');
        }
    }, [isManualMode, visualTarget]);

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
        const editCoinId = location?.state?.coinId;
        if (!coinId && !editCoinId) {
            createCoin();
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
            <AIConfirmModal 
                show={showAIConfirm} 
                onHide={() => setShowAIConfirm(false)}
                onConfirm={handleGenerateVisual}
            />

            <CreateHeader
                title={title}
                isManualMode={isManualMode}
                numistaNumber={numistaNumber}
                onDuplicate={handleDuplicate}
                onDiscard={handleDiscard}
                onDone={() => navigate("/")}
            />

            <ManualModeToggle
                isManualMode={isManualMode}
                onChange={(e) => setIsManualMode(e.target.checked)}
            />

            <Row>
                <Col lg={7}>
                    {!isManualMode && (
                        <NumistaDataCard
                            numistaDetails={numistaDetails}
                            reference={reference}
                            onVariationChange={(e) => updateFillOutDateAndDetails(
                                numistaDetails.variations[e.target.selectedIndex], 
                                numistaDetails.description
                            )}
                            onReferenceChange={setReference}
                        />
                    )}

                    <LabelSpecificsCard
                        grade={grade}
                        gradeDetails={gradeDetails}
                        onGradeChange={(e) => setGrade(e.target.value)}
                        onGradeDetailsChange={(e) => setGradeDetails(e.target.value)}
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
                        isGenerating={isGenerating}
                        isGeneratingQR={isGeneratingQR}
                        onVisualTargetChange={(e) => {
                            setVisualTarget(e.target.value);
                            setUserChangedVisualTarget(true);
                        }}
                        onVisualMethodChange={(e) => setVisualMethod(e.target.value)}
                        onGenerateVisual={handleGenerateVisual}
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
                        numistaNumber={numistaNumber} setNumistaNumber={setNumistaNumber}
                        dateAdded={dateAdded} setDateAdded={setDateAdded}
                        visualTarget={visualTarget}
                        sketchId={sketchId}
                    />
                </Col>
            </Row>
        </Container>
    );
};
export default Create;