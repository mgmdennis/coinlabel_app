import { Card, Form, InputGroup } from 'react-bootstrap';

export const NumistaDataCard = ({ 
    numistaDetails, 
    reference, 
    onVariationChange, 
    onReferenceChange 
}) => {
    return (
        <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light fw-bold">Automatic Data (Numista)</Card.Header>
            <Card.Body>
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Variations & Years</Form.Label>
                    <Form.Select 
                        className="mb-2"
                        onChange={onVariationChange}
                    >
                        {numistaDetails.variations?.map((v, i) => (
                            <option key={i} value={v.date}>{v.date} {v.comment && `(${v.comment})`}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Reference System</Form.Label>
                    <InputGroup size="sm">
                        <Form.Select value={reference} onChange={(e) => onReferenceChange(e.target.value)}>
                            {numistaDetails.references?.map((ref, i) => (
                                <option key={i} value={ref}>{ref}</option>
                            ))}
                        </Form.Select>
                        <Form.Control 
                            placeholder="Manual Reference" 
                            value={reference} 
                            onChange={(e) => onReferenceChange(e.target.value)}
                        />
                    </InputGroup>
                </Form.Group>
            </Card.Body>
        </Card>
    );
};
