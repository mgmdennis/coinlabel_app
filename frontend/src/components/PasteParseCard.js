import { Button, Form } from 'react-bootstrap';

export const PasteParseCard = ({ pasteText, setPasteText, onParse }) => {
    return (
        <>
            <p className="text-muted small mb-3">Paste the coin details from Numista or similar source. The parser will extract composition, diameter, weight, orientation, references, and denomination.</p>
            <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Coin Details Text</Form.Label>
                <Form.Control 
                    as="textarea" 
                    rows={6}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste text like:&#10;Issuer	United Kingdom&#10;Composition	Copper-nickel&#10;Weight	8 g&#10;Diameter	27.3 mm&#10;Orientation	Medal alignment ↑↑&#10;Value	50 Pence&#10;References	KM# 1986.1"
                />
            </Form.Group>
            <Button variant="warning" onClick={onParse} disabled={!pasteText.trim()}>
                Parse Data
            </Button>
        </>
    );
};
