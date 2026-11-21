import { Card, Text, Textarea } from '@mantine/core';

export const ProvenanceCard = ({ provenance, onProvenanceChange }) => {
    return (
        <Card withBorder shadow="sm" mb="lg" padding="md">
            <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                <Text fw={700}>Provenance</Text>
            </Card.Section>
            <Textarea
                mt="md"
                label="Ownership / auction history"
                description="Printed on the inside of the folded booklet. Print runs that include any provenance switch to double-sided layout automatically."
                placeholder={"Ex Max Béan collection\nLeu Web Auction 26, 14 May 2023, lot 1234\nCNG e-Auction 512, 23 Feb 2022, lot 87"}
                minRows={3}
                autosize
                value={provenance}
                onChange={onProvenanceChange}
            />
        </Card>
    );
};
