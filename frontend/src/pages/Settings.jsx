import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Box, Button, Card, Container, Group, Stack, Text, Badge, Loader,
} from '@mantine/core';
import { ArrowLeft, Check, Link as LinkIcon, Unlink } from 'lucide-react';
import { BASE_URL } from '../config';

const Settings = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${BASE_URL}/auth/providers`)
            .then(res => setProviders(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleLinkGoogle = () => {
        window.location.href = `${BASE_URL}/auth/link/google`;
    };

    const handleUnlinkGoogle = async () => {
        if (!window.confirm('Unlink your Google account? You will no longer be able to sign in with Google.')) return;
        try {
            await axios.post(`${BASE_URL}/auth/unlink/google`);
            const res = await axios.get(`${BASE_URL}/auth/providers`);
            setProviders(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to unlink');
        }
    };

    if (loading) return <Container size="sm" py="lg"><Loader /></Container>;

    return (
        <Container size="sm" py="lg">
            <Group mb="lg" justify="space-between" align="center">
                <Group gap="xs" align="center">
                    <Button variant="subtle" size="xs" onClick={() => navigate('/')} leftSection={<ArrowLeft size={14} />}>
                        Back
                    </Button>
                </Group>
            </Group>

            <Text fw={700} size="xl" mb="lg">Account Settings</Text>

            <Card withBorder shadow="sm" mb="md" padding="md">
                <Text fw={700} mb="sm">User Info</Text>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Username</Text>
                        <Text size="sm">{providers?.username || '—'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Email</Text>
                        <Text size="sm">{providers?.email || '—'}</Text>
                    </Group>
                </Stack>
            </Card>

            <Card withBorder shadow="sm" mb="md" padding="md">
                <Text fw={700} mb="sm">Linked Accounts</Text>
                <Stack gap="md">
                    {/* Numista */}
                    <Group justify="space-between" align="center">
                        <Group gap="sm" align="center">
                            <Badge variant={providers?.numista ? 'filled' : 'light'} color={providers?.numista ? 'blue' : 'gray'}>
                                Numista
                            </Badge>
                            {providers?.numista && <Badge size="xs" variant="light" color="green" leftSection={<Check size={10} />}>Linked</Badge>}
                        </Group>
                        <Text size="xs" c="dimmed">
                            {providers?.numista ? 'Connected' : 'Not linked'}
                        </Text>
                    </Group>

                    {/* Google */}
                    <Group justify="space-between" align="center">
                        <Group gap="sm" align="center">
                            <Badge variant={providers?.google ? 'filled' : 'light'} color={providers?.google ? 'red' : 'gray'}>
                                Google
                            </Badge>
                            {providers?.google && <Badge size="xs" variant="light" color="green" leftSection={<Check size={10} />}>Linked</Badge>}
                        </Group>
                        {providers?.google ? (
                            <Button
                                variant="default" size="xs"
                                leftSection={<Unlink size={13} />}
                                onClick={handleUnlinkGoogle}
                            >
                                Unlink
                            </Button>
                        ) : (
                            <Button
                                variant="default" size="xs"
                                leftSection={<LinkIcon size={13} />}
                                onClick={handleLinkGoogle}
                            >
                                Link Google
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Card>

            <Text size="xs" c="dimmed" mt="md">
                Link multiple auth methods to sign in with either one. At least one method must remain linked.
            </Text>
        </Container>
    );
};

export default Settings;