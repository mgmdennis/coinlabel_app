import { Button } from 'react-bootstrap';

export const CreateHeader = ({ 
    title, 
    isManualMode, 
    numistaNumber, 
    onDuplicate, 
    onDiscard, 
    onDone 
}) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 className="h3 mb-0">{title || (isManualMode ? "Manual Coin Entry" : "Loading Coin...")}</h1>
                {!isManualMode && numistaNumber && (
                    <a href={`https://numista.com/catalogue/pieces${numistaNumber}.html`} target="_blank" rel="noreferrer" className="text-muted small">
                        Numista #{numistaNumber}
                    </a>
                )}
            </div>
            <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={onDuplicate}>Duplicate</Button>
                <Button variant="outline-danger" onClick={onDiscard}>Discard</Button>
                <Button variant="primary" onClick={onDone} className="px-4">Done</Button>
            </div>
        </div>
    );
};
