import { Card, Text } from '@mantine/core';
import { GradeSelect } from './GradeSelect';

export const LabelSpecificsCard = ({ grade, onGradeChange }) => {
    return (
        <Card withBorder shadow="sm" mb="lg" padding="md">
            <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                <Text fw={700}>Label Specifics</Text>
            </Card.Section>
            <GradeSelect mt="md" value={grade} onChange={onGradeChange} />
        </Card>
    );
};
