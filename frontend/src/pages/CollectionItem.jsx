import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
    Box, Button, Card, Container, Group, Stack, Text, TextInput, Textarea,
    FileInput, SimpleGrid, Title, Badge, Skeleton,
} from '@mantine/core';
import { Pencil, Upload, X } from 'lucide-react';
import { BASE_URL } from '../config';
import { GradeSelect } from '../components/GradeSelect';

const CollectionItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${BASE_URL}/coin/${id}`)
            .then(res => setItem(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleFieldChange = (field, value) => {
        setItem(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${BASE_URL}/coin/update/${item._id}`, item);
            setEditing(false);
        } catch (err) {
            console.error('Save error:', err);
        }
        setSaving(false);
    };

    const handleImageUpload = (side, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const field = side === 'obverse' ? 'collectionObvImage' : 'collectionRevImage';
            setItem(prev => ({ ...prev, [field]: e.target.result }));
        };
        reader.readAsDataURL(file);
    };

    if (loading) return (
        <Container size="md" py="lg">
            <Group mb="lg">
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
    if (!item) return <Container size="md" py="lg"><Text>No item found.</Text></Container>;

    const fields = [
        { key: 'issuer', label: 'Issuer', type: 'text' },
        { key: 'denomination', label: 'Denomination', type: 'text' },
        { key: 'year', label: 'Year', type: 'text' },
        { key: 'gradeDetails', label: 'Grade Details', type: 'text' },
        { key: 'composition', label: 'Composition', type: 'text' },
        { key: 'physicalDetails', label: 'Physical Details', type: 'textarea', rows: 3 },
        { key: 'reference', label: 'Reference', type: 'text' },
        { key: 'mintage', label: 'Mintage', type: 'text' },
        { key: 'details', label: 'Details', type: 'textarea', rows: 4 },
        { key: 'numistaNumber', label: 'Numista Number', type: 'text' },
    ];

    return (
        <Container size="md" py="lg">
            <Group justify="space-between" align="center" wrap="wrap" mb="lg" gap="sm">
                <Stack gap={2}>
                    <Title order={3}>
                        {item.issuer} {item.denomination} {item.year}
                    </Title>
                    <Group gap="xs">
                        <Badge color="green" variant="light" size="sm">Collection Item</Badge>
                        {item.isManual && <Badge color="gray" variant="light" size="sm">Manual</Badge>}
                    </Group>
                </Stack>
                <Group gap="xs" wrap="nowrap">
                    <Button
                        component={Link}
                        to={item.numistaNumber ? `/create/${item.numistaNumber}` : '/create'}
                        state={{ coinId: item._id, ...(item.isManual ? { manualMode: true } : {}) }}
                        variant="default" size="xs"
                        leftSection={<Pencil size={13} />}
                    >
                        Edit Label
                    </Button>
                    <Button size="xs" onClick={() => navigate('/', { state: { view: 'collection' } })}>
                        Done
                    </Button>
                </Group>
            </Group>

            {/* Collection photos */}
            <Card withBorder shadow="sm" mb="lg" padding="md">
                <Text fw={700} mb="sm">Collection Photos</Text>
                <SimpleGrid cols={2} spacing="md">
                    <Stack gap={4} align="center">
                        <Text size="xs" c="dimmed">Obverse</Text>
                        {item.collectionObvImage ? (
                            <Box pos="relative" style={{ width: '100%', textAlign: 'center' }}>
                                <img src={item.collectionObvImage} alt="Obverse"
                                    style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 8 }} />
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
                            <Box style={{ width: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--mantine-color-gray-3)', borderRadius: 8 }}>
                                <Text size="sm" c="dimmed">No photo</Text>
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
                    <Stack gap={4} align="center">
                        <Text size="xs" c="dimmed">Reverse</Text>
                        {item.collectionRevImage ? (
                            <Box pos="relative" style={{ width: '100%', textAlign: 'center' }}>
                                <img src={item.collectionRevImage} alt="Reverse"
                                    style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 8 }} />
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
                            <Box style={{ width: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--mantine-color-gray-3)', borderRadius: 8 }}>
                                <Text size="sm" c="dimmed">No photo</Text>
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
            <Card withBorder shadow="sm" mb="lg" padding="md">
                <Group justify="space-between" mb="sm">
                    <Text fw={700}>Details</Text>
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
                        {fields.map(f => f.type === 'textarea' ? (
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
                    <SimpleGrid cols={2} spacing="xs">
                        {fields.map(f => (
                            <Box key={f.key}>
                                <Text size="xs" c="dimmed" fw={600}>{f.label}</Text>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
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