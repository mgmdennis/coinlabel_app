import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import axios from 'axios';
import styles from './HeritageBackLabel.module.css';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export default function HeritageBackLabel({
    isEditable,
    physicalDetails,
    numistaNumber,
    dateAdded, setDateAdded,
    visualTarget = "QR",
    sketchId = "",
    isGenerating = false
}) {
    const [sketchData, setSketchData] = useState(null);

    const coinDiameter = physicalDetails
        ? parseFloat(physicalDetails.match(/⌀\s*([\d.]+)/)?.[1] || '0')
        : 0;

    const LABEL_WIDTH_MM = 54;
    const sketchSize = coinDiameter
        ? (isEditable ? `${(coinDiameter / LABEL_WIDTH_MM) * 100}cqw` : `${coinDiameter}mm`)
        : '100%';

    useEffect(() => {
        if (sketchId && visualTarget !== "QR") {
            axios.get(`${BASE_URL}/generate-sketch/${sketchId}`)
                .then(res => setSketchData(res.data.imageData))
                .catch(() => setSketchData(null));
        } else {
            setSketchData(null);
        }
    }, [sketchId, visualTarget]);

    const showQR =
        visualTarget === "QR" ||
        (!sketchId && visualTarget !== "GALLERY" && visualTarget !== "NUMISTA" && visualTarget !== "PASTED") ||
        !sketchData;

    return (
        <div className={isEditable ? "heritage-parent-for-edit" : "heritage-parent-for-print"}>
            <div className={styles['heritage-back-label']}>

                {/* Top strip: N# left | date right */}
                <div className={styles['meta-row']}>
                    <span className={styles['meta-item']}>
                        {numistaNumber ? `N# ${numistaNumber}` : ''}
                    </span>
                    {isEditable
                        ? <input
                            className={styles['meta-input']}
                            value={dateAdded || ''}
                            onChange={e => setDateAdded?.(e.target.value)}
                            placeholder="Date Added"
                          />
                        : <span className={styles['meta-item']}>{dateAdded || ''}</span>
                    }
                </div>

                <hr className={styles.hr} />

                {/* Visual area — fills remaining space */}
                <div className={styles['visual-wrap']}>
                    {isGenerating && visualTarget !== "QR" && visualTarget !== "GALLERY" && (
                        <div className={styles['generating-overlay']}>
                            <div className={styles['sketch-spinner']} />
                        </div>
                    )}
                    {showQR ? (
                        <QRCode
                            value={`https://en.numista.com/catalogue/pieces${numistaNumber}.html`}
                            style={{ width: '100%', height: '100%' }}
                            viewBox="0 0 256 256"
                            fgColor="#4B2E05"
                        />
                    ) : (
                        typeof sketchData === 'string' && sketchData.length > 0 ? (
                            <img
                                src={sketchData}
                                alt="Coin Sketch"
                                style={{
                                    width: sketchSize,
                                    height: sketchSize,
                                    mixBlendMode: 'multiply',
                                    display: 'block',
                                    flexShrink: 0
                                }}
                            />
                        ) : (
                            <div className={styles['sketch-error']}>
                                ⚠️ Sketch data is empty or invalid
                            </div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
}
