import { Accordion } from '@mantine/core';
import { PasteParseCard } from './PasteParseCard';

export const PasteNumistaAccordion = ({ pasteText, setPasteText, onParse }) => {
    return (
        <Accordion variant="separated" mb="lg">
            <Accordion.Item value="paste-numista">
                <Accordion.Control>
                    <span style={{ fontWeight: 700 }}>Paste Numista Data (Optional)</span>
                </Accordion.Control>
                <Accordion.Panel>
                    <PasteParseCard
                        pasteText={pasteText}
                        setPasteText={setPasteText}
                        onParse={onParse}
                    />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
};
