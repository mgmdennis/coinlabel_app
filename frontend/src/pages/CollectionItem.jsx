import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
    Box, Button, Card, Container, Group, Stack, Text, TextInput, Textarea,
    FileInput, SimpleGrid, Title, Badge, Skeleton,
} from '@mantine/core';
import { Pencil, Upload, X, Trash2, Printer } from 'lucide-react';
import { BASE_URL } from '../config';
import { GradeSelect } from '../components/GradeSelect';
import { compressImage } from '../utils/compressImage';
import './CollectionItem.css';

const CollectionItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const originalRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${BASE_URL}/coin/${id}`)
            .then(res => { setItem(res.data); originalRef.current = res.data; })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleFieldChange = (field, value) => {
        setItem(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const original = originalRef.current || {};
            const { collectionObvImage, collectionRevImage, ...rest } = item;
            const body = { ...rest };
            // Only re-send a photo when it was uploaded or removed this session
            if (collectionObvImage !== (original.collectionObvImage ?? "")) body.collectionObvImage = collectionObvImage;
            if (collectionRevImage !== (original.collectionRevImage ?? "")) body.collectionRevImage = collectionRevImage;
            await axios.put(`${BASE_URL}/coin/update/${item._id}`, body);
            originalRef.current = { ...original, ...body };
            setEditing(false);
        } catch (err) {
            console.error('Save error:', err);
        }
        setSaving(false);
    };

    const handleImageUpload = async (side, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const compressed = await compressImage(e.target.result);
            const field = side === 'obverse' ? 'collectionObvImage' : 'collectionRevImage';
            setItem(prev => ({ ...prev, [field]: compressed }));
        };
        reader.readAsDataURL(file);
    };

    if (loading) return (
        <Container size="md" py="lg" className="collection-item-page">
            <Group mb="lg" className="collection-item-loading-back">
                <Skeleton height={28} width={80} radius="sm" />
            </Group>
            <Skeleton height={32} width="60%" radius="sm" mb="lg" />
            <Card withBorder shadow="sm" mb="lg" padding="md">
                <Skeleton height={16} width={120} radius="sm" mb="sm" />
                <SimpleGrid cols={2} spacing="md">
                    <Skeleton height={200} radius="sm" />
                    <Skeleton height={200} radius="sm" />
                </SimpleGrid>
            </Card>
            <Card withBorder shadow="sm" padding="md">
                <Skeleton height={16} width={80} radius="sm" mb="md" />
                <SimpleGrid cols={2} spacing="xs">
                    {[...Array(8)].map((_, i) => (
                        <Box key={i}>
                            <Skeleton height={10} width="40%" radius="sm" mb={4} />
                            <Skeleton height={14} width="80%" radius="sm" />
                        </Box>
                    ))}
                </SimpleGrid>
            </Card>
        </Container>
    );
    if (!item) return (
        <Container size="md" py="lg" className="collection-item-page">
            <Box className="collection-item-empty">
                <Text fw={700}>Collection item unavailable</Text>
                <Text size="sm" c="dimmed">This item may have been removed or the link may be out of date.</Text>
                <Button mt="md" variant="default" onClick={() => navigate('/', { state: { view: 'collection' } })}>
                    Back to collection
                </Button>
            </Box>
        </Container>
    );

    const fields = [
        { key: 'issuer', label: 'Issuer', type: 'text' },
        { key: 'denomination', label: 'Denomination', type: 'text' },
        { key: 'year', label: 'Year', type: 'text' },
        { key: 'legendObv', label: 'Obverse Legend', type: 'text' },
        { key: 'legendRev', label: 'Reverse Legend', type: 'text' },
        { key: 'grade', label: 'Grade', type: 'text' },
        { key: 'gradeDetails', label: 'Grade Details', type: 'text' },
        { key: 'composition', label: 'Composition', type: 'text' },
        { key: 'physicalDetails', label: 'Physical Details', type: 'textarea', rows: 3 },
        { key: 'reference', label: 'Reference', type: 'text' },
        { key: 'mintage', label: 'Mintage', type: 'text' },
        { key: 'dateAdded', label: 'Date Added', type: 'text' },
        { key: 'details', label: 'Details', type: 'textarea', rows: 4 },
        { key: 'numistaNumber', label: 'Numista Number', type: 'text' },
        { key: 'ocreId', label: 'OCRE ID', type: 'text' },
    ];

    return (
        <Container size="md" py="lg" className="collection-item-page">
            <Group justify="space-between" align="flex-end" wrap="wrap" mb="xl" gap="lg" className="collection-item-header">
                <Stack gap={2}>
                    <Text className="collection-item-eyebrow">Collection record</Text>
                    <Title order={1} className="collection-item-title">
                        {item.issuer} {item.denomination} {item.year}
                    </Title>
                    <Group gap="xs" mt={4}>
                        <Badge color="green" variant="light" size="sm">Collection Item</Badge>
                        {item.isManual && <Badge color="gray" variant="light" size="sm">Manual</Badge>}
                        {item.ocreId && (
                            <Badge
                                component="a"
                                href={`https://numismatics.org/ocre/id/${encodeURIComponent(item.ocreId)}`}
                                target="_blank"
                                rel="noreferrer"
                                color="blue" variant="light" size="sm"
                                style={{ cursor: 'pointer' }}
                            >
                                OCRE ↗
                            </Badge>
                        )}
                    </Group>
                </Stack>
                <Group gap="xs" wrap="wrap" className="collection-item-actions">
                    {item.hasLabel === false && (
                        <Button
                            variant="light" color="blue" size="xs"
                            leftSection={<Printer size={13} />}
                            onClick={() => {
                                axios.put(`${BASE_URL}/coin/update/${item._id}`, { printListed: true })
                                    .then(() => {
                                        const saved = JSON.parse(localStorage.getItem('selected_coins') || '{}');
                                        saved[item._id] = true;
                                        localStorage.setItem('selected_coins', JSON.stringify(saved));
                                        navigate('/', { state: { view: 'labels' } });
                                    });
                            }}
                        >
                            Add to Print List
                        </Button>
                    )}
                    <Button
                        component={Link}
                        to={item.numistaNumber ? `/create/${item.numistaNumber}` : '/create'}
                        state={{ coinId: item._id, ...(item.isManual ? { manualMode: true } : {}) }}
                        variant="default" size="xs"
                        leftSection={<Pencil size={13} />}
                    >
                        Edit Label
                    </Button>
                    <Button
                        variant="outline" color="red" size="xs"
                        leftSection={<Trash2 size={13} />}
                        onClick={() => {
                            if (window.confirm('Permanently delete this collection item and its label?')) {
                                axios.delete(`${BASE_URL}/coin/delete/${item._id}`)
                                    .then(() => navigate('/', { state: { view: 'collection' } }));
                            }
                        }}
                    >
                        Delete
                    </Button>
                    <Button size="xs" onClick={() => navigate('/', { state: { view: 'collection' } })}>
                        Done
                    </Button>
                </Group>
            </Group>

            {/* Collection photos */}
            <Card component="section" withBorder shadow="sm" mb="lg" padding="lg" className="collection-item-panel collection-item-photos">
                <Group justify="space-between" align="flex-end" mb="md" wrap="wrap" gap="xs">
                    <Box>
                        <Text className="collection-item-section-kicker">Collection Photos</Text>
                    </Box>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Stack gap="xs" className="collection-item-face">
                        <Text className="collection-item-face-label">Obverse</Text>
                        {item.collectionObvImage ? (
                            <Box pos="relative" className="collection-item-photo-wrap">
                                <img src={item.collectionObvImage} alt="Obverse"
                                    className="collection-item-photo" />
                                {editing && (
                                    <Button
                                        variant="light" color="red" size="xs" mt={4}
                                        onClick={() => handleFieldChange('collectionObvImage', '')}
                                        leftSection={<X size={12} />}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box className="collection-item-photo-empty">
                                <Text size="sm" c="dimmed">No obverse photo yet</Text>
                            </Box>
                        )}
                        {editing && (
                            <FileInput
                                size="xs" accept="image/*"
                                placeholder="Upload obverse"
                                onChange={(file) => handleImageUpload('obverse', file)}
                                leftSection={<Upload size={12} />}
                            />
                        )}
                    </Stack>
                    <Stack gap="xs" className="collection-item-face">
                        <Text className="collection-item-face-label">Reverse</Text>
                        {item.collectionRevImage ? (
                            <Box pos="relative" className="collection-item-photo-wrap">
                                <img src={item.collectionRevImage} alt="Reverse"
                                    className="collection-item-photo" />
                                {editing && (
                                    <Button
                                        variant="light" color="red" size="xs" mt={4}
                                        onClick={() => handleFieldChange('collectionRevImage', '')}
                                        leftSection={<X size={12} />}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box className="collection-item-photo-empty">
                                <Text size="sm" c="dimmed">No reverse photo yet</Text>
                            </Box>
                        )}
                        {editing && (
                            <FileInput
                                size="xs" accept="image/*"
                                placeholder="Upload reverse"
                                onChange={(file) => handleImageUpload('reverse', file)}
                                leftSection={<Upload size={12} />}
                            />
                        )}
                    </Stack>
                </SimpleGrid>
            </Card>

            {/* Details */}
            <Card component="section" withBorder shadow="sm" mb="lg" padding="lg" className="collection-item-panel">
                <Group justify="space-between" mb="md" wrap="wrap" gap="sm" className="collection-item-details-head">
                    <Box>
                        <Text className="collection-item-section-kicker">Item information</Text>
                        <Title order={2} className="collection-item-section-title">Details</Title>
                    </Box>
                    {!editing ? (
                        <Button variant="default" size="xs" onClick={() => setEditing(true)} leftSection={<Pencil size={13} />}>
                            Edit
                        </Button>
                    ) : (
                        <Group gap="xs">
                            <Button variant="default" size="xs" onClick={() => setEditing(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button size="xs" onClick={handleSave} loading={saving}>
                                Save
                            </Button>
                        </Group>
                    )}
                </Group>

                {editing ? (
                    <Stack gap="sm">
                        <GradeSelect
                            value={item.grade || ''}
                            onChange={e => handleFieldChange('grade', e.target.value)}
                        />
                        {/* Grade renders as GradeSelect above — skip it here. */}
                        {fields.filter(f => f.key !== 'grade').map(f => f.type === 'textarea' ? (
                            <Textarea
                                key={f.key} label={f.label}
                                value={item[f.key] || ''}
                                onChange={e => handleFieldChange(f.key, e.target.value)}
                                rows={f.rows || 3}
                            />
                        ) : (
                            <TextInput
                                key={f.key} label={f.label}
                                value={item[f.key] || ''}
                                onChange={e => handleFieldChange(f.key, e.target.value)}
                            />
                        ))}
                    </Stack>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" className="collection-item-fields">
                        {fields.map(f => (
                            <Box key={f.key} className="collection-item-field">
                                <Text className="collection-item-field-label">{f.label}</Text>
                                <Text className="collection-item-field-value">
                                    {item[f.key] || '—'}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                )}
            </Card>
        </Container>
    );
};

export default CollectionItem;
