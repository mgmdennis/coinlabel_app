import { QRCode } from "react-qr-code";
import Form from 'react-bootstrap/Form';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define API Base URL for fetching images
const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

/**
 * LabelField Component
 * Renders either a static text or an editable Form.Control based on isEditable prop.
 */
const LabelField = ({ isEditable, value, placeholder, className, as, rows, onChange, autoGrow }) => {
    const autoResize = useCallback((node) => {
        if (node && autoGrow) {
            node.style.height = 'auto';
            node.style.height = node.scrollHeight + 'px';
        }
    }, [value, autoGrow]);

    if (!isEditable) {
        return (
            <p className={`${className} static-label`}>
                {value}
            </p>
        );
    }

    return (
        <Form.Control
            ref={autoGrow ? autoResize : undefined}
            placeholder={placeholder}
            value={value}
            plaintext
            as={as}
            rows={autoGrow ? 1 : rows}
            className={className}
            onChange={onChange}
        />
    );
};

/**
 * FrontLabelContainer Component
 */
const FrontLabelContainer = ({ isEditable, year, setYear, issuer, setIssuer, denomination, setDenomination, grade, setGrade, gradeDetails, setGradeDetails, mintage, setMintage, reference, setReference, details, setDetails, marksPicture, marks }) => {
    return (
        <div className={isEditable ? "parent-label-for-edit" : "parent-label-for-print"}>
            <LabelField
                isEditable={isEditable}
                placeholder="Year"
                value={year}
                className={"label date" + (year.length > 4 ? " narrow" : "")}
                onChange={(e) => setYear(e.target.value)}
            />

            <LabelField
                isEditable={isEditable}
                placeholder="Issuer"
                value={issuer}
                className={"label issuer" + (issuer.length > 18 ? " narrow" : "")}
                onChange={(e) => setIssuer(e.target.value)}
            />

            <LabelField
                isEditable={isEditable}
                placeholder="Denomination"
                value={denomination}
                as="textarea"
                rows={2}
                className={"label denomination" + (denomination.length > 10 ? " narrow" : "")}
                onChange={(e) => setDenomination(e.target.value)}
            />

            <LabelField
                isEditable={isEditable}
                placeholder="Grade"
                value={grade}
                className="label grade"
                onChange={(e) => setGrade(e.target.value)}
            />

            <LabelField
                isEditable={isEditable}
                placeholder="Grade Details"
                value={gradeDetails}
                as="textarea"
                rows={6}
                className="label grade-details"
                onChange={(e) => setGradeDetails(e.target.value)}
            />

            <LabelField
                isEditable={isEditable}
                placeholder="Mintage"
                value={mintage}
                className="label mintage"
                onChange={(e) => setMintage(e.target.value)}
            />

            <LabelField
                isEditable={isEditable}
                placeholder="Ref"
                value={reference}
                as="textarea"
                rows={1}
                autoGrow
                className="label reference"
                onChange={(e) => setReference(e.target.value)}
            />

            <div className="details-stack-container">
                {marks && (
                    <div className="marks-picture-row">
                        {marks.map((mark, index) => (
                            <div key={index} className="marks-picture-wrapper">
                                <img src={mark.picture} className="marks-picture" alt="mark" />
                            </div>
                        ))}
                    </div>
                )}
                <LabelField
                    isEditable={isEditable}
                    placeholder="Details"
                    value={details}
                    className="label details"
                    as="textarea"
                    rows={7}
                    onChange={(e) => setDetails(e.target.value)}
                />
            </div>
        </div>
    );
};

/**
 * BackLabelContainer Component
 * Handles the logic for displaying either a QR code or a fetched Sketch image.
 */

const BackLabelContainer = ({ 
    isEditable, 
    composition, setComposition, 
    physicalDetails, setPhysicalDetails, 
    numistaNumber,
    dateAdded, setDateAdded,
    visualTarget = "QR", 
    sketchId = "",
    isGenerating = false
}) => {
    const [sketchData, setSketchData] = useState(null);
    const [showDiameterError, setShowDiameterError] = useState(false);
    const navigate = useNavigate();

    // Extract coin diameter from physicalDetails (e.g. "⌀ 25.75 mm")
    const coinDiameter = physicalDetails 
        ? parseFloat(physicalDetails.match(/⌀\s*([\d.]+)/)?.[1] || '0')
        : 0;

    // Cap diameter at 39.5mm
    useEffect(() => {
        if (coinDiameter > 39.5) {
            setShowDiameterError(true);
        }
    }, [coinDiameter]);

    // Calculate size: mm for print, cqw for edit (label is 44mm = 100cqw)
    const LABEL_WIDTH_MM = 44;
    const sketchSize = coinDiameter
        ? (isEditable ? `${(coinDiameter / LABEL_WIDTH_MM) * 100}cqw` : `${coinDiameter}mm`)
        : '100%';

    // Fetch the actual image string from the database whenever the sketchId changes
    useEffect(() => {
        if (sketchId && visualTarget !== "QR") {
            axios.get(`${BASE_URL}/generate-sketch/${sketchId}`)
                .then(res => {
                    setSketchData(res.data.imageData);
                })
                .catch(err => {
                    setSketchData(null);
                });
        } else {
            setSketchData(null);
        }
    }, [sketchId, visualTarget, coinDiameter]);

    // Handle redirect after closing error modal
    const handleDiameterErrorClose = () => {
        setShowDiameterError(false);
        navigate("/");
    };

    return (
        <div className={isEditable ? "parent-label-for-edit" : "parent-label-for-print"}>
            <LabelField
                isEditable={isEditable}
                placeholder="Composition"
                value={composition}
                as="textarea"
                rows={3}
                autoGrow
                className="label composition"
                onChange={(e) => setComposition(e.target.value)}
            />
            <LabelField
                isEditable={isEditable}
                placeholder="Date Added"
                value={dateAdded}
                className="label date-added"
                onChange={(e) => setDateAdded(e.target.value)}
            />
            <LabelField
                isEditable={isEditable}
                placeholder="Physical Details"
                value={physicalDetails}
                as="textarea"
                rows={3}
                autoGrow
                className="label physical-details"
                onChange={(e) => setPhysicalDetails(e.target.value)}
            />
            <p className="label numista-number static-label">
                {numistaNumber ? `N# ${numistaNumber}` : ''}
            </p>
            <div
                className="qr-code"
                style={{
                    position: 'relative',
                    width: '100%',
                    overflow: coinDiameter > 39.5 ? 'hidden' : 'visible'
                }}
            >
                {isGenerating && visualTarget !== "QR" && visualTarget !== "GALLERY" && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.6)',
                        zIndex: 30,
                        pointerEvents: 'all',
                    }}>
                        <div className="sketch-spinner" />
                    </div>
                )}
                {(visualTarget === "QR" || (!sketchId && visualTarget !== "GALLERY" && visualTarget !== "NUMISTA" && visualTarget !== "PASTED") || !sketchData) ? (
                    <QRCode 
                        value={`https://en.numista.com/catalogue/pieces${numistaNumber}.html`} 
                        style={{ width: "100%", height: "100%" }} 
                        viewBox={`0 0 256 256`}
                    />
                ) : (
                    <>
                        {typeof sketchData === 'string' && sketchData.length > 0 ? (
                            <img 
                                src={sketchData} 
                                alt="Coin Sketch" 
                                style={{ 
                                    width: sketchSize,
                                    height: sketchSize,
                                    flexShrink: 0,
                                    mixBlendMode: 'multiply',
                                    display: 'block',
                                    zIndex: 10,
                                    position: 'relative'
                                }} 
                            />
                        ) : (
                            <div className="alert alert-warning small">
                                ⚠️ Sketch data is empty or invalid
                            </div>
                        )}
                    </>
                )}
            </div>
            <Modal show={showDiameterError} onHide={handleDiameterErrorClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Diameter Too Large</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>The maximum supported coin diameter is <strong>39.5mm</strong>.<br/>Please enter a smaller value to continue.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleDiameterErrorClose}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export { FrontLabelContainer, BackLabelContainer };