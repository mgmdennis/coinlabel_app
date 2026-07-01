import { Switch, Stack, Text } from '@mantine/core';

export const ManualModeToggle = ({ isManualMode, onChange }) => {
    return (
        <Stack gap={4} mb="lg">
            <Switch
                id="manual-mode-switch"
                label="Enable Manual Entry Mode"
                checked={isManualMode}
                onChange={onChange}
            />
            <Text size="xs" c="dimmed">
                Toggle to manually input all coin data, including pasting images for visuals.
            </Text>
        </Stack>
    );
};
