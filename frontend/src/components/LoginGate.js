import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const LoginGate = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        axios.post(`${BASE_URL}/auth`, { password })
            .then(() => {
                sessionStorage.setItem('authenticated', 'true');
                onSuccess();
            })
            .catch(() => {
                setError('Incorrect password');
            })
            .finally(() => setLoading(false));
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '100%', maxWidth: '360px' }} className="shadow">
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <svg width="48" height="48" viewBox="0 0 128 128" className="mb-2" aria-hidden="true">
                            <rect width="128" height="128" rx="24" fill="#24313E"/>
                            <circle cx="64" cy="64" r="40" stroke="white" strokeWidth="12" fill="none"/>
                        </svg>
                        <div>
                            <span style={{ fontWeight: 'bold', color: '#212529', letterSpacing: '0.5px', fontSize: '1.4rem' }}>NUMIS</span>
                            <span style={{ fontWeight: '300', color: '#6c757d', marginLeft: '2px', fontSize: '1.4rem' }}>TAG</span>
                        </div>
                    </div>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                        <Button type="submit" variant="primary" className="w-100" disabled={loading || !password}>
                            {loading ? 'Checking…' : 'Enter'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginGate;
