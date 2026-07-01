import { Button, Card, Center, Stack, Text } from '@mantine/core';
import { BASE_URL } from '../config';

const LoginGate = () => {
    const handleLogin = () => {
        window.location.href = `${BASE_URL}/auth/login`;
    };
    return (
        <Center mih="100vh" p="md">
            <Card shadow="md" radius="md" withBorder w="100%" maw={360} p="xl">
                <Stack align="center" gap="lg">
                    <Stack align="center" gap={4}>
                        <svg width="48" height="48" viewBox="0 0 128 128" aria-hidden="true">
                            <rect width="128" height="128" rx="24" fill="#24313E" />
                            <circle cx="64" cy="64" r="40" stroke="white" strokeWidth="12" fill="none" />
                        </svg>
                        <Text>
                            <Text span fw={700} c="dark" style={{ letterSpacing: '0.5px', fontSize: '1.4rem' }}>NUMIS</Text>
                            <Text span fw={300} c="dimmed" style={{ fontSize: '1.4rem', marginLeft: 2 }}>TAG</Text>
                        </Text>
                    </Stack>
                    <Button onClick={handleLogin} fullWidth>
                        Login with Numista
                    </Button>
                </Stack>
            </Card>
        </Center>
    );
};

export default LoginGate;
