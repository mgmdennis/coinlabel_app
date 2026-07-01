import { Modal, Button, Group, Text } from '@mantine/core';
import { Sparkles } from 'lucide-react';

export const AIConfirmModal = ({ show, onHide, onConfirm }) => {
    return (
        <Modal
            opened={show}
            onClose={onHide}
            centered
            title={
                <Group gap="xs">
                    <Sparkles size={20} color="var(--mantine-color-blue-6)" /> Confirm AI Generation
                </Group>
            }
        >
            <Text mb="sm">
                Generating an AI engraving sketch costs approximately <strong>$0.01</strong>.
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
                This process takes about 10-15 seconds. Would you like to proceed?
            </Text>
            <Group justify="flex-end">
                <Button variant="subtle" color="gray" onClick={onHide}>Cancel</Button>
                <Button onClick={onConfirm}>Generate Sketch</Button>
            </Group>
        </Modal>
    );
};
