import { Badge, Card, NativeSelect, Stack, Group, TextInput, Text } from '@mantine/core';

export const NumistaDataCard = ({
    numistaDetails,
    reference,
    onVariationChange,
    onReferenceChange
}) => {
    return (
        <Card withBorder shadow="sm" mb="lg" padding="md">
            <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                <Group justify="space-between">
                    <Text fw={700}>Automatic Data</Text>
                    <Badge variant="filled" color="cyan" radius="xl">
                        Numista Mode
                    </Badge>
                </Group>
            </Card.Section>
            <Stack gap="md" mt="md">
                <NativeSelect
                    label="Variations & Years"
                    onChange={onVariationChange}
                >
                    {numistaDetails.variations?.map((v, i) => (
                        <option key={i} value={v.date}>{v.date} {v.comment && `(${v.comment})`}</option>
                    ))}
                </NativeSelect>

                <div>
                    <Text size="sm" fw={700} mb={4}>Reference System</Text>
                    <Group gap={0} wrap="nowrap" align="stretch">
                        <NativeSelect
                            size="sm"
                            value={reference}
                            onChange={(e) => onReferenceChange(e.target.value)}
                            style={{ flex: 1 }}
                            styles={{ input: { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }}
                        >
                            {numistaDetails.references?.map((ref, i) => (
                                <option key={i} value={ref}>{ref}</option>
                            ))}
                        </NativeSelect>
                        <TextInput
                            size="sm"
                            placeholder="Manual Reference"
                            value={reference}
                            onChange={(e) => onReferenceChange(e.target.value)}
                            style={{ flex: 1 }}
                            styles={{ input: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: -1 } }}
                        />
                    </Group>
                </div>
            </Stack>
        </Card>
    );
};
