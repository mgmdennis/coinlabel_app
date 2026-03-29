import { Container, Card, Button } from 'react-bootstrap';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const LoginGate = () => {
    const handleLogin = () => {
        window.location.href = `${BASE_URL}/auth/login`;
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
                    <Button onClick={handleLogin} variant="primary" className="w-100">
                        Login with Numista
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginGate;
