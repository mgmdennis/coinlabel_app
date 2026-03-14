import { Modal, Button } from 'react-bootstrap';
import { Sparkles } from 'lucide-react';

export const AIConfirmModal = ({ show, onHide, onConfirm }) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Sparkles size={20} className="text-primary" /> Confirm AI Generation
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Generating an AI engraving sketch costs approximately <strong>$0.01</strong>.</p>
                <p className="text-muted small">This process takes about 10-15 seconds. Would you like to proceed?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="link" className="text-muted" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={onConfirm}>Generate Sketch</Button>
            </Modal.Footer>
        </Modal>
    );
};
