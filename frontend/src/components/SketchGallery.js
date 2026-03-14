import { useState, useEffect } from 'react';
import { Row, Col, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const SketchGallery = ({ currentSketchId, onSelect, numistaNumber }) => {
    const [sketches, setSketches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${BASE_URL}/generate-sketch/list`)
            .then(res => setSketches(res.data))
            .catch(err => console.error('Failed to load sketches:', err))
            .finally(() => setLoading(false));
    }, [currentSketchId]); // Refresh when a new sketch is generated

    if (loading) {
        return (
            <div className="text-center py-3">
                <Spinner animation="border" size="sm" /> Loading sketches...
            </div>
        );
    }

    if (sketches.length === 0) {
        return <p className="text-muted small mb-0">No cached sketches yet. Generate one to get started.</p>;
    }

    // Sort: sketches matching current numistaNumber first
    const sorted = [...sketches].sort((a, b) => {
        const aMatch = a.numistaNumber === numistaNumber ? 0 : 1;
        const bMatch = b.numistaNumber === numistaNumber ? 0 : 1;
        return aMatch - bMatch;
    });

    return (
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <Row xs={4} sm={5} md={4} className="g-2">
                {sorted.map(sketch => {
                    const isSelected = sketch._id === currentSketchId;
                    const isMatch = sketch.numistaNumber === numistaNumber;
                    return (
                        <Col key={sketch._id}>
                            <div
                                onClick={() => onSelect(sketch._id)}
                                title={sketch.description || `${sketch.method} - ${sketch.side}`}
                                style={{
                                    cursor: 'pointer',
                                    border: isSelected ? '3px solid #0d6efd' : '2px solid transparent',
                                    borderRadius: '6px',
                                    padding: '2px',
                                    background: isSelected ? '#e7f1ff' : (isMatch ? '#f0faf0' : '#f8f9fa'),
                                    textAlign: 'center',
                                    transition: 'border-color 0.15s'
                                }}
                            >
                                <img
                                    src={sketch.imageData}
                                    alt={sketch.description}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        objectFit: 'contain',
                                        borderRadius: '4px'
                                    }}
                                />
                                <div style={{ fontSize: '0.6rem', lineHeight: 1.2, marginTop: '2px' }}>
                                    <Badge 
                                        bg={sketch.method === 'AI' ? 'warning' : 'secondary'} 
                                        style={{ fontSize: '0.55rem' }}
                                    >
                                        {sketch.method}
                                    </Badge>
                                    {' '}
                                    <span className="text-muted">{sketch.side}</span>
                                    {isMatch && (
                                        <span className="text-success d-block" style={{ fontSize: '0.55rem' }}>● same coin</span>
                                    )}
                                </div>
                            </div>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};
