import { Card, Grid, NativeSelect, TextInput, Text } from '@mantine/core';
import { GradeSelect } from './GradeSelect';

const ORIENTATION_OPTIONS = [
    { value: "", label: "Select orientation" },
    { value: "↑↑", label: "↑↑ Medal alignment" },
    { value: "↑↓", label: "↑↓ Coin alignment" },
    { value: "↑←", label: "↑←" },
    { value: "↑→", label: "↑→" },
];

// Grade (always) + the manual-mode physical fields (mass/diameter/
// orientation) in one card — they were two separate cards; the physical
// trio only drives physicalDetails in manual mode, so it hides otherwise.
export const LabelSpecificsCard = ({
    grade, onGradeChange,
    isManualMode = false,
    mass, onMassChange,
    diameter, onDiameterChange,
    orientation, onOrientationChange,
}) => {
    return (
        <Card withBorder shadow="sm" mb="lg" padding="md">
            <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                <Text fw={700}>Label Specifics</Text>
            </Card.Section>
            <GradeSelect mt="md" value={grade} onChange={onGradeChange} />
            {isManualMode && (
                <Grid mt="xs" gutter="sm">
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
            )}
        </Card>
    );
};
