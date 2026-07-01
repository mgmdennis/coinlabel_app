import { Modal, Button, Group, Text } from '@mantine/core';
import { Sparkles } from 'lucide-react';

export const AIConfirmModal = ({ show, onHide, onConfirm, isPremiumAI }) => {
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
            {isPremiumAI ? (
                <>
                    <Text mb="sm">
                        Generating a <strong>Premium</strong> AI engraving sketch costs approximately <strong>$0.15</strong>.
                    </Text>
                    <Text size="sm" c="dimmed" mb="lg">
                        Uses a higher-quality model for better results. This process takes about 15-30 seconds. Would you like to proceed?
                    </Text>
                </>
            ) : (
                <>
                    <Text mb="sm">
                        Generating an AI engraving sketch costs approximately <strong>$0.04</strong>.
                    </Text>
                    <Text size="sm" c="dimmed" mb="lg">
                        This process takes about 10-15 seconds. Would you like to proceed?
                    </Text>
                </>
            )}
            <Group justify="flex-end">
                <Button variant="subtle" color="gray" onClick={onHide}>Cancel</Button>
                <Button onClick={onConfirm}>Generate Sketch</Button>
            </Group>
        </Modal>
    );
};
