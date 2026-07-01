import { Button, Text, Textarea } from '@mantine/core';

export const PasteParseCard = ({ pasteText, setPasteText, onParse }) => {
    return (
        <>
            <Text size="sm" c="dimmed" mb="sm">
                Paste the coin details from Numista or similar source. The parser will extract composition, diameter, weight, orientation, references, and denomination.
            </Text>
            <Textarea
                label="Coin Details Text"
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                mb="md"
                placeholder={"Paste text like:\nIssuer\tUnited Kingdom\nComposition\tCopper-nickel\nWeight\t8 g\nDiameter\t27.3 mm\nOrientation\tMedal alignment ↑↑\nValue\t50 Pence\nReferences\tKM# 1986.1"}
            />
            <Button color="yellow" onClick={onParse} disabled={!pasteText.trim()}>
                Parse Data
            </Button>
        </>
    );
};
