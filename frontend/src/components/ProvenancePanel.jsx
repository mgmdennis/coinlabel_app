import { useLayoutEffect, useRef } from 'react';

/**
 * Shared provenance panel — the inside page of the folded label booklet.
 *
 * Two sizing modes (mirroring the label fields' convention):
 *  - print (default): absolute mm, used inside the print page's 44mm cells
 *  - edit (isEditable): cqw against a 44mm container (44mm = 100cqw), so the
 *    panel scales correctly inside the preview's `label-edit-scale-wrapper`
 *
 * Text auto-shrinks down FONT_LADDER_MM until it fits the live element.
 */
const MM_TO_CQW = 100 / 44;
const FONT_LADDER_MM = [2.5, 2.3, 2.1, 1.9, 1.7, 1.5];

const unit = (isEditable) => (mm) =>
    isEditable ? `${+(mm * MM_TO_CQW).toFixed(3)}cqw` : `${mm}mm`;

export const ProvenancePanel = ({ text, isEditable = false }) => {
    const textRef = useRef(null);
    const u = unit(isEditable);

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) return;
        for (let i = 0; i < FONT_LADDER_MM.length; i++) {
            el.style.fontSize = u(FONT_LADDER_MM[i]);
            if (el.scrollHeight <= el.clientHeight + 1) break;
        }
    }, [text]);

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            padding: `${u(1.4)} ${u(1.6)}`,
        }}>
            <p style={{
                margin: `0 0 ${u(0.8)} 0`,
                flexShrink: 0,
                // Match the Obverse/Reverse captions: light weight, regular
                // family, tracked-out uppercase, soft grey.
                fontFamily: "'Fira Sans', sans-serif",
                fontWeight: 300,
                fontSize: u(2.6),
                letterSpacing: '0.08em',
                textAlign: 'center',
                textTransform: 'uppercase',
                color: '#444',
                borderBottom: '1px solid #ccc',
                paddingBottom: u(0.6),
            }}>Provenance</p>
            <p
                ref={textRef}
                style={{
                    margin: 0,
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    fontFamily: "'Fira Sans Extra Condensed', sans-serif",
                    lineHeight: 1.35,
                    fontSize: u(FONT_LADDER_MM[0]),
                }}
            >
                {text}
            </p>
        </div>
    );
};
