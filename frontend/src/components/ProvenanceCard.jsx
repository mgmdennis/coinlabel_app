import { useState } from 'react';
import { Accordion, Text, Textarea } from '@mantine/core';

// Same bronze band as the header had; text + chevron inherit white.
const BRONZE = '#b08d57';

export const ProvenanceCard = ({ provenance, onProvenanceChange }) => {
    // Collapsed by default, but auto-opens when the loaded coin already
    // carries provenance. Once the user toggles, their choice wins for the
    // rest of the visit — onChange coerces to a boolean so "closed" (null)
    // can't be mistaken for "never toggled" (the v4.22.9 bug).
    const [manual, setManual] = useState(null);
    const open = manual ?? !!String(provenance || '').trim();

    return (
        <Accordion
            variant="separated"
            mb="lg"
            value={open ? 'provenance' : null}
            onChange={(v) => setManual(!!v)}
        >
            <Accordion.Item value="provenance">
                <Accordion.Control
                    style={{
                        background: BRONZE,
                        color: 'white',
                        /* The separated variant rounds the item shell but not
                           the Control, so an unclipped Control background
                           paints square. Match the item radius: top corners
                           only while open (the panel rounds the bottom). */
                        borderRadius: open
                            ? 'var(--accordion-radius) var(--accordion-radius) 0 0'
                            : 'var(--accordion-radius)',
                    }}
                >
                    <span style={{ fontWeight: 700 }}>Provenance</span>
                </Accordion.Control>
                <Accordion.Panel>
                    <Textarea
                        label="Ownership / auction history"
                        description="Printed on the inside of the folded booklet. Print runs that include any provenance switch to double-sided layout automatically."
                        placeholder={"Ex Max Béan collection\nLeu Web Auction 26, 14 May 2023, lot 1234\nCNG e-Auction 512, 23 Feb 2022, lot 87"}
                        minRows={3}
                        autosize
                        value={provenance}
                        onChange={onProvenanceChange}
                    />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
};
