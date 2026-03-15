import { useState, useRef } from 'react';
import { Card, Form, Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import { Sparkles, Code, QrCode, Image, Grid3x3, Camera, FlaskConical, Clipboard, FolderOpen } from 'lucide-react';
import { SketchGallery } from './SketchGallery';

export const VisualCustomizationCard = ({
    isManualMode,
    pastedImage,
    visualTarget,
    visualMethod,
    numistaSide,
    isGenerating,
    isGeneratingQR,
    onVisualTargetChange,
    onVisualMethodChange,
    onNumistaSideChange,
    onGenerateVisual,
    sketchId,
    onSketchSelect,
    numistaNumber,
    obverseImageUrl,
    reverseImageUrl,
    onImageFile,
}) => {
    const fileInputRef = useRef(null);
    const [showBeta, setShowBeta] = useState(false);
    const [copyingImage, setCopyingImage] = useState(null); // 'obverse' | 'reverse' | null

    const BASE_URL = process.env.REACT_APP_API_URL || '';

    // Copy a Numista image to clipboard via backend proxy
    const copyImageToClipboard = async (url, side) => {
        setCopyingImage(side);
        try {
            const proxyUrl = `${BASE_URL}/api/generate-sketch/image-proxy?url=${encodeURIComponent(url)}`;
            const resp = await fetch(proxyUrl);
            const blob = await resp.blob();
            // Convert to PNG (clipboard API requires image/png)
            const img = new window.Image();
            img.src = URL.createObjectURL(blob);
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            URL.revokeObjectURL(img.src);
            const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            alert(`${side.charAt(0).toUpperCase() + side.slice(1)} image copied! Now paste it below (Ctrl+V / Cmd+V).`);
        } catch (err) {
            console.error('Copy failed:', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
            alert('Could not copy automatically. The image has been opened in a new tab — right-click it and copy.');
        } finally {
            setCopyingImage(null);
        }
    };

    // Determine if the current target requires generation
    const needsGeneration = visualTarget === 'NUMISTA' || visualTarget === 'PASTED';

    return (
        <Card className="shadow-sm mb-4 border-primary">
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white fw-bold">
                Visual Customization
                <Badge pill bg={isManualMode ? "light" : "info"} text={isManualMode ? "dark" : "white"}>
                    {isManualMode ? "Manual Mode" : "Numista Mode"}
                </Badge>
            </Card.Header>
            <Card.Body>
                {/* --- Top-level Visual Source --- */}
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Visual Source</Form.Label>
                    <div>
                        <Form.Check 
                            inline type="radio" name="visualTarget" id="vtQR"
                            value="QR"
                            checked={visualTarget === "QR"}
                            onChange={onVisualTargetChange}
                            label={
                                <span className="d-flex align-items-center">
                                    <QrCode size={14} className="me-1" /> QR Code
                                    {isGeneratingQR && <Spinner animation="border" size="sm" className="ms-2" />}
                                </span>
                            }
                        />
                        {!isManualMode && showBeta && (
                            <Form.Check 
                                inline type="radio" name="visualTarget" id="vtNumista"
                                value="NUMISTA"
                                checked={visualTarget === "NUMISTA"}
                                onChange={onVisualTargetChange}
                                label={<span className="d-flex align-items-center"><Image size={14} className="me-1" /> From Numista <Badge bg="warning" text="dark" className="ms-1" style={{fontSize: '0.6em'}}>BETA</Badge></span>}
                            />
                        )}
                        <Form.Check 
                            inline type="radio" name="visualTarget" id="vtGallery"
                            value="GALLERY"
                            checked={visualTarget === "GALLERY"}
                            onChange={onVisualTargetChange}
                            label={<span className="d-flex align-items-center"><Grid3x3 size={14} className="me-1" /> From Gallery</span>}
                        />
                        <Form.Check 
                            inline type="radio" name="visualTarget" id="vtPasted"
                            value="PASTED"
                            checked={visualTarget === "PASTED"}
                            onChange={onVisualTargetChange}
                            label={<span className="d-flex align-items-center"><Camera size={14} className="me-1" /> From Pasted Image</span>}
                        />
                    </div>
                    {!isManualMode && !showBeta && (
                        <div className="mt-1">
                            <span 
                                className="text-muted small" 
                                style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '0.7em' }}
                                onClick={() => setShowBeta(true)}
                            >
                                <FlaskConical size={10} className="me-1" />Show beta options
                            </span>
                        </div>
                    )}
                </Form.Group>

                {/* --- Numista image helpers (for PASTED mode in Numista mode) --- */}
                {visualTarget === 'PASTED' && !isManualMode && (obverseImageUrl || reverseImageUrl) && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Copy from Numista</Form.Label>
                        <p className="text-muted small mb-2" style={{ fontSize: '0.8em' }}>
                            Copy an image to your clipboard, then paste below.
                        </p>
                        <div className="d-flex gap-2">
                            {obverseImageUrl && (
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    disabled={!!copyingImage}
                                    onClick={() => copyImageToClipboard(obverseImageUrl, 'obverse')}
                                >
                                    {copyingImage === 'obverse' 
                                        ? <Spinner animation="border" size="sm" className="me-1" />
                                        : <Clipboard size={14} className="me-1" />
                                    }
                                    Copy Obverse
                                </Button>
                            )}
                            {reverseImageUrl && (
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    disabled={!!copyingImage}
                                    onClick={() => copyImageToClipboard(reverseImageUrl, 'reverse')}
                                >
                                    {copyingImage === 'reverse' 
                                        ? <Spinner animation="border" size="sm" className="me-1" />
                                        : <Clipboard size={14} className="me-1" />
                                    }
                                    Copy Reverse
                                </Button>
                            )}
                        </div>
                    </Form.Group>
                )}

                {/* --- Pasted Image drop zone (for PASTED mode) --- */}
                {visualTarget === 'PASTED' && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Coin Image</Form.Label>
                        {/* Hidden file input for iOS / non-clipboard fallback */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file && onImageFile) onImageFile(file);
                                e.target.value = '';
                            }}
                        />
                        <div 
                            className="p-3 border rounded text-center bg-light"
                            style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {pastedImage ? (
                                <div>
                                    <img src={pastedImage} alt="Pasted preview" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                                    <p className="text-success small mb-0 mt-1">Image ready. Paste or pick again to replace.</p>
                                </div>
                            ) : (
                                <p className="text-muted mb-0 small">Paste an image (Ctrl/Cmd+V)</p>
                            )}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FolderOpen size={13} className="me-1" />Choose Image
                            </Button>
                        </div>
                    </Form.Group>
                )}

                {/* --- Numista side selector (Obverse / Reverse) --- */}
                {visualTarget === 'NUMISTA' && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Coin Side</Form.Label>
                        <div>
                            <Form.Check 
                                inline type="radio" name="numistaSide" id="nsObverse"
                                value="OBVERSE"
                                checked={numistaSide === "OBVERSE"}
                                onChange={onNumistaSideChange}
                                label="Obverse"
                            />
                            <Form.Check 
                                inline type="radio" name="numistaSide" id="nsReverse"
                                value="REVERSE"
                                checked={numistaSide === "REVERSE"}
                                onChange={onNumistaSideChange}
                                label="Reverse"
                            />
                        </div>
                    </Form.Group>
                )}

                {/* --- Processing method (for NUMISTA and PASTED) --- */}
                {needsGeneration && (
                    <Row className="align-items-end">
                        <Col>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Processing Method</Form.Label>
                                <div>
                                    <Form.Check 
                                        inline type="radio" name="visualMethod" id="vmScript"
                                        value="SCRIPT"
                                        checked={visualMethod === "SCRIPT"}
                                        onChange={onVisualMethodChange}
                                        label={<><Code size={14} /> Script</>}
                                    />
                                    <Form.Check 
                                        inline type="radio" name="visualMethod" id="vmAI"
                                        value="AI"
                                        checked={visualMethod === "AI"}
                                        onChange={onVisualMethodChange}
                                        label={<><Sparkles size={14} /> AI</>}
                                    />
                                    <Form.Check 
                                        inline type="radio" name="visualMethod" id="vmRaw"
                                        value="RAW"
                                        checked={visualMethod === "RAW"}
                                        onChange={onVisualMethodChange}
                                        label={<><Image size={14} /> Raw</>}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col xs="auto">
                            <Button 
                                variant="primary" 
                                onClick={onGenerateVisual} 
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Spinner as="span" animation="border" size="sm" /> : 'Generate'}
                            </Button>
                        </Col>
                    </Row>
                )}

                {/* --- Gallery picker (for GALLERY mode) --- */}
                {visualTarget === 'GALLERY' && (
                    <div className="mt-2">
                        <SketchGallery
                            currentSketchId={sketchId}
                            onSelect={onSketchSelect}
                            numistaNumber={numistaNumber}
                        />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};
