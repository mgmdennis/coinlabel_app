import { useState, useRef, useCallback } from 'react';
import { Card, Form, Row, Col, Button, Badge, Spinner, Modal } from 'react-bootstrap';
import { Sparkles, Code, QrCode, Image, Grid3x3, Camera, FlaskConical, FolderOpen, ExternalLink } from 'lucide-react';
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
    hasMultipleDates,
    swapDate,
    onSwapDateChange,
}) => {
    const fileInputRef = useRef(null);
    const [showBeta, setShowBeta] = useState(false);
    const [imageModal, setImageModal] = useState(null); // { url, side } | null

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    const BASE_URL = process.env.REACT_APP_API_URL || '';

    const handleLocalPaste = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
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

    const [isPasteAreaFocused, setIsPasteAreaFocused] = useState(false);

    const needsGeneration = visualTarget === 'NUMISTA' || visualTarget === 'PASTED';

    return (
        <>
        {/* Image preview modal — user long-presses (iOS) or right-clicks (desktop) to copy */}
        <Modal show={!!imageModal} onHide={() => setImageModal(null)} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">
                    {imageModal?.side === 'obverse' ? 'Obverse' : 'Reverse'} Image
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-3">
                <img
                    src={imageModal?.url || ''}
                    alt="Coin"
                    onError={e => {
                        // Fall back to backend proxy if direct load fails (hotlink protection etc.)
                        if (imageModal && !e.target.src.includes('/api/generate-sketch/image-proxy')) {
                            e.target.src = `${BASE_URL}/api/generate-sketch/image-proxy?url=${encodeURIComponent(imageModal.url)}`;
                        }
                    }}
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                />
                <p className="text-muted small mt-3 mb-0">
                    {isIOS
                        ? '👆 Long-press the image above → tap Copy'
                        : 'Right-click the image → Copy Image, then paste below'}
                </p>
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
                <Button variant="outline-secondary" size="sm" onClick={() => setImageModal(null)}>
                    Close
                </Button>
                <Button
                    variant="primary" size="sm"
                    onClick={() => { setImageModal(null); fileInputRef.current?.click(); }}
                >
                    <FolderOpen size={13} className="me-1" />Choose from files instead
                </Button>
            </Modal.Footer>
        </Modal>
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
                            Open an image to copy, then paste below.
                        </p>
                        <div className="d-flex gap-2">
                            {obverseImageUrl && (
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => setImageModal({ url: obverseImageUrl, side: 'obverse' })}
                                >
                                    <ExternalLink size={14} className="me-1" />
                                    Obverse
                                </Button>
                            )}
                            {reverseImageUrl && (
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => setImageModal({ url: reverseImageUrl, side: 'reverse' })}
                                >
                                    <ExternalLink size={14} className="me-1" />
                                    Reverse
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
                            {visualMethod === 'AI' && hasMultipleDates && (
                                <Form.Check
                                    type="checkbox"
                                    id="swap-date-checkbox"
                                    label="Replace date in sketch with selected variation year"
                                    checked={swapDate}
                                    onChange={onSwapDateChange}
                                    className="small mt-2"
                                />
                            )}
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
        </>
    );
};
