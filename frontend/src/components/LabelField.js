import Form from 'react-bootstrap/Form';
import { useCallback } from 'react';

/**
 * LabelField Component
 * Renders either a static text or an editable Form.Control based on isEditable prop.
 */
const LabelField = ({ isEditable, value, placeholder, className, as, rows, onChange, autoGrow }) => {
    const autoResize = useCallback((node) => {
        if (node && autoGrow) {
            node.style.height = 'auto';
            node.style.height = node.scrollHeight + 'px';
        }
    }, [value, autoGrow]);

    if (!isEditable) {
        return (
            <p className={`${className} static-label`}>
                {value}
            </p>
        );
    }

    return (
        <Form.Control
            ref={autoGrow ? autoResize : undefined}
            placeholder={placeholder}
            value={value}
            plaintext
            as={as}
            rows={autoGrow ? 1 : rows}
            className={className}
            onChange={onChange}
        />
    );
};

export default LabelField;
