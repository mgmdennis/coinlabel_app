import { Card, Form, Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import { Sparkles, Code, QrCode, Image, Grid3x3, Camera } from 'lucide-react';
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
    numistaNumber
}) => {
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
                        {!isManualMode && (
                            <Form.Check 
                                inline type="radio" name="visualTarget" id="vtNumista"
                                value="NUMISTA"
                                checked={visualTarget === "NUMISTA"}
                                onChange={onVisualTargetChange}
                                label={<span className="d-flex align-items-center"><Image size={14} className="me-1" /> From Numista</span>}
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
                </Form.Group>

                {/* --- Pasted Image drop zone (for PASTED mode) --- */}
                {visualTarget === 'PASTED' && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Coin Image</Form.Label>
                        <div 
                            className="p-3 border rounded text-center bg-light"
                            style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => !pastedImage && alert("Copy an image and then paste it here (Ctrl+V or Cmd+V).")}
                        >
                            {pastedImage ? (
                                <div>
                                    <img src={pastedImage} alt="Pasted preview" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                                    <p className="text-success small mb-0 mt-1">Image pasted! Paste again to replace.</p>
                                </div>
                            ) : (
                                <p className="text-muted mb-0 small">Paste coin image here from clipboard</p>
                            )}
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
