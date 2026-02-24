import { Card, Form, Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import { Sparkles, Code, QrCode } from 'lucide-react';

export const VisualCustomizationCard = ({
    isManualMode,
    pastedImage,
    visualTarget,
    visualMethod,
    isGenerating,
    isGeneratingQR,
    onVisualTargetChange,
    onVisualMethodChange,
    onGenerateVisual
}) => {
    return (
        <Card className="shadow-sm mb-4 border-primary">
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white fw-bold">
                Visual Customization
                <Badge pill bg={isManualMode ? "light" : "info"} text={isManualMode ? "dark" : "white"}>
                    {isManualMode ? "Manual Mode" : "Numista Mode"}
                </Badge>
            </Card.Header>
            <Card.Body>
                {isManualMode && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Coin Image (for Obverse/Reverse)</Form.Label>
                        <div 
                            className="p-3 border rounded text-center bg-light"
                            style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => !pastedImage && alert("Copy an image and then paste it here (Ctrl+V or Cmd+V).")}
                        >
                            {pastedImage ? (
                                <div>
                                    <img src={pastedImage} alt="Pasted preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                                    <p className="text-success small mb-0 mt-2">Image pasted! Paste again to replace.</p>
                                </div>
                            ) : (
                                <p className="text-muted mb-0">Paste coin image here from clipboard</p>
                            )}
                        </div>
                    </Form.Group>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Visual Target</Form.Label>
                    <div>
                        <Form.Check 
                            inline
                            type="radio"
                            label={
                                <span className="d-flex align-items-center">
                                    <QrCode size={14} className="me-1" /> QR Code
                                    {isGeneratingQR && <Spinner animation="border" size="sm" className="ms-2" />}
                                </span>
                            }
                            name="visualTarget"
                            id="visualTargetQR"
                            value="QR"
                            checked={visualTarget === "QR"}
                            onChange={onVisualTargetChange}
                        />
                        {!isManualMode && (
                            <>
                                <Form.Check 
                                    inline
                                    type="radio"
                                    label="Obverse"
                                    name="visualTarget"
                                    id="visualTargetObverse"
                                    value="OBVERSE"
                                    checked={visualTarget === "OBVERSE"}
                                    onChange={onVisualTargetChange}
                                />
                                <Form.Check 
                                    inline
                                    type="radio"
                                    label="Reverse"
                                    name="visualTarget"
                                    id="visualTargetReverse"
                                    value="REVERSE"
                                    checked={visualTarget === "REVERSE"}
                                    onChange={onVisualTargetChange}
                                />
                            </>
                        )}
                        {isManualMode && (
                            <Form.Check
                                inline
                                type="radio"
                                label="Pasted Image"
                                name="visualTarget"
                                id="visualTargetPasted"
                                value="PASTED"
                                checked={visualTarget === "PASTED"}
                                onChange={onVisualTargetChange}
                            />
                        )}
                    </div>
                </Form.Group>
                
                {visualTarget !== 'QR' && (
                    <Row>
                        <Col>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Generation Method</Form.Label>
                                <div>
                                    <Form.Check 
                                        inline
                                        type="radio"
                                        label={<><Code size={14} /> Script</>}
                                        name="visualMethod"
                                        id="visualMethodScript"
                                        value="SCRIPT"
                                        checked={visualMethod === "SCRIPT"}
                                        onChange={onVisualMethodChange}
                                    />
                                    <Form.Check 
                                        inline
                                        type="radio"
                                        label={<><Sparkles size={14} /> AI</>}
                                        name="visualMethod"
                                        id="visualMethodAI"
                                        value="AI"
                                        checked={visualMethod === "AI"}
                                        onChange={onVisualMethodChange}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col xs="auto">
                            <Button 
                                variant="primary" 
                                onClick={onGenerateVisual} 
                                disabled={isGenerating}
                                className="mt-3"
                            >
                                {isGenerating ? <Spinner as="span" animation="border" size="sm" /> : 'Generate Sketch'}
                            </Button>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
};
