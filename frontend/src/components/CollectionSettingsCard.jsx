import { Card, Checkbox, Stack, Text, SimpleGrid } from '@mantine/core';
import { PasteImageInput } from './PasteImageInput';

export const CollectionSettingsCard = ({
    isCollectionItem,
    onToggleCollection,
    collectionObvImage,
    onObvImageUpload,
    onObvImageClear,
    collectionRevImage,
    onRevImageUpload,
    onRevImageClear,
}) => {
    return (
        <Card withBorder shadow="sm" mb="lg" padding="md" style={{ borderColor: 'var(--mantine-color-green-6)' }}>
            <Card.Section withBorder inheritPadding py="xs" bg="green.6" c="white">
                <Text fw={700}>Collection</Text>
            </Card.Section>
            <Stack gap="md" mt="md">
                <Checkbox
                    label="Save to collection"
                    description="Track this item in your collection. Collection items persist even after labels are printed and cached."
                    checked={isCollectionItem}
                    onChange={onToggleCollection}
                />
                {isCollectionItem && (
                    <SimpleGrid cols={2} spacing="sm">
                        <PasteImageInput
                            label="Obverse photo"
                            value={collectionObvImage}
                            onChange={onObvImageUpload}
                        />
                        <PasteImageInput
                            label="Reverse photo"
                            value={collectionRevImage}
                            onChange={onRevImageUpload}
                        />
                    </SimpleGrid>
                )}
            </Stack>
        </Card>
    );
};