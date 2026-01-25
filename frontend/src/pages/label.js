import { QRCode } from "react-qr-code";
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Define API Base URL for fetching images
const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

/**
 * LabelField Component
 * Renders either a static text or an editable Form.Control based on isEditable prop.
 */
const LabelField = ({ isEditable, value, placeholder, className, as, rows, onChange }) => {
    if (!isEditable) {
        return (
            <p className={`${className} static-label`}>
                {value}
            </p>
        );
    }

    return (
        <Form.Control
            placeholder={placeholder}
            value={value}
            plaintext
            as={as}
            rows={rows}
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
                className={"label issuer" + (issuer.length > 20 ? " narrow" : "")}
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
                    rows={5}
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
    sketchId = null
}) => {
    const [sketchData, setSketchData] = useState(null);

    // Fetch the actual image string from the database whenever the sketchId changes
    useEffect(() => {
        if (sketchId && visualTarget !== "QR") {
            axios.get(`${BASE_URL}/generate-sketch/${sketchId}`)
                .then(res => {
                    // We extract the 'imageData' field which contains the Base64 string
                    setSketchData(res.data.imageData);
                })
                .catch(err => {
                    console.error("Error fetching sketch image:", err);
                    setSketchData(null);
                });
        } else {
            setSketchData(null);
        }
    }, [sketchId, visualTarget]);

    return (
        <div className={isEditable ? "parent-label-for-edit" : "parent-label-for-print"}>
            <LabelField
                isEditable={isEditable}
                placeholder="Composition"
                value={composition}
                as="textarea"
                rows={3}
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
                className="label physical-details"
                onChange={(e) => setPhysicalDetails(e.target.value)}
            />
            <LabelField
                isEditable={false}
                value={`N# ${numistaNumber}`}
                className="label numista-number"
            />
            
            <div className="qr-code" style={{ 
                flex: '1 1 auto', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                width: '100%',
                minHeight: 0,
                overflow: 'hidden',
                marginTop: '4px'
            }}>
                <div style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: '1 / 1', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {(visualTarget === "QR" || !sketchId || !sketchData) ? (
                        <QRCode 
                            value={`https://en.numista.com/catalogue/pieces${numistaNumber}.html`} 
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                            viewBox={`0 0 256 256`}
                        />
                    ) : (
                        <img 
                            src={sketchData} 
                            alt="Coin Sketch" 
                            style={{ 
                                height: "auto", 
                                maxWidth: "100%", 
                                width: "100%", 
                                objectFit: "contain",
                                filter: 'contrast(1.1)' 
                            }} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export { FrontLabelContainer, BackLabelContainer };