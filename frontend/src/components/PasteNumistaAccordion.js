import { Accordion } from 'react-bootstrap';
import { PasteParseCard } from './PasteParseCard';

export const PasteNumistaAccordion = ({ pasteText, setPasteText, onParse }) => {
    return (
        <Accordion className="mb-4">
            <Accordion.Item eventKey="0">
                <Accordion.Header className="bg-light fw-bold">Paste Numista Data (Optional)</Accordion.Header>
                <Accordion.Body>
                    <PasteParseCard 
                        pasteText={pasteText}
                        setPasteText={setPasteText}
                        onParse={onParse}
                    />
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
