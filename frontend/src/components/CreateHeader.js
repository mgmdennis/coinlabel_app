import { Button, Spinner } from 'react-bootstrap';
import { Copy, Trash2, Check, AlertCircle } from 'lucide-react';

export const CreateHeader = ({ 
    title, 
    isManualMode, 
    numistaNumber, 
    onDuplicate, 
    onDiscard, 
    onDone, 
    saveStatus
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
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={onDone} 
                        className="px-3"
                        disabled={saveStatus === "saving"}
                    >
                        {saveStatus === "saving" && <Spinner animation="border" size="sm" className="me-1" style={{width: 16, height: 16}} />}
                        {saveStatus === "saved" && <Check size={16} className="me-1" />}
                        {saveStatus === "error" && <AlertCircle size={16} className="me-1 text-danger" />}
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};
