import { Anchor, Button, Group, Loader, Stack, Title } from '@mantine/core';
import { Copy, Trash2, Check, AlertCircle } from 'lucide-react';

export const CreateHeader = ({
    title,
    isManualMode,
    numistaNumber,
    onDuplicate,
    onDiscard,
    onDone,
    saveStatus
}) => {
    return (
        <Group justify="space-between" align="center" wrap="wrap" mb="lg" gap="sm">
            <Stack gap={2}>
                <Title order={3}>{title || (isManualMode ? "Manual Coin Entry" : "Loading Coin...")}</Title>
                {!isManualMode && numistaNumber && (
                    <Anchor
                        href={`https://numista.com/catalogue/pieces${numistaNumber}.html`}
                        target="_blank"
                        rel="noreferrer"
                        c="dimmed"
                        size="sm"
                    >
                        Numista #{numistaNumber}
                    </Anchor>
                )}
            </Stack>
            <Group gap="xs" wrap="nowrap">
                <Button variant="default" size="xs" leftSection={<Copy size={14} />} onClick={onDuplicate}>
                    Duplicate
                </Button>
                <Button variant="outline" color="red" size="xs" leftSection={<Trash2 size={14} />} onClick={onDiscard}>
                    Discard
                </Button>
                <Button
                    size="xs"
                    px="md"
                    onClick={onDone}
                    disabled={saveStatus === "saving"}
                    leftSection={
                        saveStatus === "saving" ? <Loader size={16} color="white" /> :
                        saveStatus === "saved" ? <Check size={16} /> :
                        saveStatus === "error" ? <AlertCircle size={16} /> : null
                    }
                >
                    Done
                </Button>
            </Group>
        </Group>
    );
};
