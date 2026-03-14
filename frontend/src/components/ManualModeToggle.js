import { Form } from 'react-bootstrap';

export const ManualModeToggle = ({ isManualMode, onChange }) => {
    return (
        <Form.Group className="mb-4">
            <Form.Check 
                type="switch"
                id="manual-mode-switch"
                label="Enable Manual Entry Mode"
                checked={isManualMode}
                onChange={onChange}
            />
            <Form.Text className="text-muted">
                Toggle to manually input all coin data, including pasting images for visuals.
            </Form.Text>
        </Form.Group>
    );
};
