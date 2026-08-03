import { Card, Grid, NativeSelect, TextInput, Text } from '@mantine/core';

const ORIENTATION_OPTIONS = [
    { value: "", label: "Select orientation" },
    { value: "↑↑", label: "↑↑ Medal alignment" },
    { value: "↑↓", label: "↑↓ Coin alignment" },
    { value: "↑←", label: "↑←" },
    { value: "↑→", label: "↑→" },
];

export const ManualPhysicalFields = ({
    mass, onMassChange,
    diameter, onDiameterChange,
    orientation, onOrientationChange,
}) => {
    return (
        <Card withBorder shadow="sm" mb="lg" padding="md">
            <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                <Text fw={700}>Physical Details</Text>
            </Card.Section>
            <Grid mt="md" gutter="sm">
                <Grid.Col span={{ base: 12, xs: 4 }}>
                    <TextInput
                        label="Mass"
                        placeholder="8"
                        rightSectionWidth={28}
                        rightSection={<Text size="xs" c="dimmed">g</Text>}
                        inputMode="decimal"
                        value={mass}
                        onChange={onMassChange}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, xs: 4 }}>
                    <TextInput
                        label="Diameter"
                        placeholder="25.75"
                        rightSectionWidth={32}
                        rightSection={<Text size="xs" c="dimmed">mm</Text>}
                        inputMode="decimal"
                        value={diameter}
                        onChange={onDiameterChange}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, xs: 4 }}>
                    <NativeSelect
                        label="Orientation"
                        value={orientation}
                        onChange={onOrientationChange}
                        data={ORIENTATION_OPTIONS}
                    />
                </Grid.Col>
            </Grid>
        </Card>
    );
};