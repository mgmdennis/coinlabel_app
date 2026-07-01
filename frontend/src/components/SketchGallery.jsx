import { useState, useEffect } from 'react';
import { Badge, Center, Group, Loader, SimpleGrid, Text } from '@mantine/core';
import axios from 'axios';

import { BASE_URL } from '../config';

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
            <Center py="md">
                <Group gap="xs">
                    <Loader size="sm" /> <Text size="sm">Loading sketches...</Text>
                </Group>
            </Center>
        );
    }

    if (sketches.length === 0) {
        return <Text size="sm" c="dimmed">No cached sketches yet. Generate one to get started.</Text>;
    }

    // Sort: sketches matching current numistaNumber first
    const sorted = [...sketches].sort((a, b) => {
        const aMatch = a.numistaNumber === numistaNumber ? 0 : 1;
        const bMatch = b.numistaNumber === numistaNumber ? 0 : 1;
        return aMatch - bMatch;
    });

    return (
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <SimpleGrid cols={{ base: 4, sm: 5, md: 4 }} spacing="xs">
                {sorted.map(sketch => {
                    const isSelected = sketch._id === currentSketchId;
                    const isMatch = sketch.numistaNumber === numistaNumber;
                    return (
                        <div
                            key={sketch._id}
                            onClick={() => onSelect(sketch._id)}
                            title={sketch.description || `${sketch.method} - ${sketch.side}`}
                            style={{
                                cursor: 'pointer',
                                border: isSelected ? '3px solid var(--mantine-color-blue-6)' : '2px solid transparent',
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
                                    size="xs"
                                    color={sketch.method === 'AI' ? 'yellow' : 'gray'}
                                    style={{ fontSize: '0.55rem' }}
                                >
                                    {sketch.method}
                                </Badge>
                                {' '}
                                <span style={{ color: 'var(--mantine-color-dimmed)' }}>{sketch.side}</span>
                                {isMatch && (
                                    <span style={{ color: 'var(--mantine-color-green-7)', display: 'block', fontSize: '0.55rem' }}>● same coin</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </SimpleGrid>
        </div>
    );
};
