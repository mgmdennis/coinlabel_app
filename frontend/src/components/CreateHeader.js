import { Button } from 'react-bootstrap';
import { Copy, Trash2, Check } from 'lucide-react';

export const CreateHeader = ({ 
    title, 
    isManualMode, 
    numistaNumber, 
    onDuplicate, 
    onDiscard, 
    onDone 
}) => {
    return (
        <div className="mb-4">
            <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-center gap-2">
                <div>
                    <h1 className="h3 mb-0">{title || (isManualMode ? "Manual Coin Entry" : "Loading Coin...")}</h1>
                    {!isManualMode && numistaNumber && (
                        <a href={`https://numista.com/catalogue/pieces${numistaNumber}.html`} target="_blank" rel="noreferrer" className="text-muted small">
                            Numista #{numistaNumber}
                        </a>
                    )}
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                    <Button variant="outline-secondary" size="sm" onClick={onDuplicate}>
                        <Copy size={14} className="me-1" />Duplicate
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={onDiscard}>
                        <Trash2 size={14} className="me-1" />Discard
                    </Button>
                    <Button variant="primary" size="sm" onClick={onDone} className="px-3">
                        <Check size={14} className="me-1" />Done
                    </Button>
                </div>
            </div>
        </div>
    );
};
