import { useState, useRef, useCallback } from 'react';
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
    const [isPasteAreaFocused, setIsPasteAreaFocused] = useState(false);

    const handleLocalPaste = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation(); // prevent the global window handler from double-firing
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file && onImageFile) onImageFile(file);
                break;
            }
        }
    }, [onImageFile]);

    const BASE_URL = process.env.REACT_APP_API_URL || '';

    // Copy a Numista image to clipboard.
    // iOS Safari requires ClipboardItem to be created synchronously within the user gesture,
    // but accepts a Promise as the value — so we pass the fetch+convert promise directly
    // rather than awaiting it first. This keeps the gesture context alive.
    const copyImageToClipboard = async (url, side) => {
        setCopyingImage(side);
        try {
            const fetchAndConvert = async () => {
                let blob;
                try {
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    blob = await resp.blob();
                } catch {
                    console.log('Direct fetch blocked by CORS, falling back to proxy...');
                    const proxyUrl = `${BASE_URL}/api/generate-sketch/image-proxy?url=${encodeURIComponent(url)}`;
                    const resp = await fetch(proxyUrl);
                    blob = await resp.blob();
                }
                // Convert to PNG (clipboard API requires image/png)
                const img = new window.Image();
                img.src = URL.createObjectURL(blob);
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                URL.revokeObjectURL(img.src);
                return new Promise(r => canvas.toBlob(r, 'image/png'));
            };

            // Pass the promise directly — iOS keeps the gesture context alive this way
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': fetchAndConvert() })]);
            alert(`${side.charAt(0).toUpperCase() + side.slice(1)} image copied! Now paste it below.`);
        } catch (err) {
            console.error('Copy failed:', err);
            alert('Could not copy image to clipboard. Try using "Choose Image" to select it directly.');
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
                        {/* Hidden file input for file picker fallback */}
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
                        {/* Paste zone: visible display layer + invisible textarea overlay */}
                        <div className="position-relative mb-2">
                            {/* Visual display layer (pointer-events: none so taps pass through to textarea) */}
                            <div
                                className="p-3 border rounded text-center bg-light"
                                style={{
                                    minHeight: '100px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    pointerEvents: 'none',
                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                    ...(isPasteAreaFocused ? {
                                        borderColor: '#0d6efd',
                                        boxShadow: '0 0 0 0.2rem rgba(13,110,253,.25)',
                                    } : {}),
                                }}
                            >
                                {pastedImage ? (
                                    <>
                                        <img src={pastedImage} alt="Pasted preview" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                                        <p className="text-success small mb-0">Image ready — tap &amp; hold to replace</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted mb-0 small fw-semibold">Tap &amp; hold → <strong>Paste</strong></p>
                                        <p className="text-muted mb-0" style={{ fontSize: '0.75em' }}>or Ctrl/Cmd+V on desktop</p>
                                    </>
                                )}
                            </div>
                            {/* Invisible textarea overlay — textarea is what iOS Safari reliably shows
                                the "Paste" context menu for. No inputMode="none" so the context menu
                                is not suppressed. Font size 16px prevents iOS auto-zoom on focus.
                                onInput clears any typed text since we only want paste. */}
                            <textarea
                                onPaste={handleLocalPaste}
                                onInput={e => { e.target.value = ''; }}
                                onFocus={() => setIsPasteAreaFocused(true)}
                                onBlur={() => setIsPasteAreaFocused(false)}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                aria-label="Tap and hold to paste a coin image"
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    fontSize: '16px', // prevents iOS zoom on focus
                                    color: 'transparent',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    caretColor: 'transparent',
                                    WebkitTapHighlightColor: 'transparent',
                                    borderRadius: '0.375rem',
                                    cursor: 'default',
                                    zIndex: 1,
                                }}
                            /></div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FolderOpen size={13} className="me-1" />Choose Image
                        </Button>
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
