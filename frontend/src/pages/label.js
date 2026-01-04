
import {QRCode} from "react-qr-code";
import Form from 'react-bootstrap/Form';

/**
 * LabelField Component
 * Renders either a static text or an editable Form.Control based on isEditable prop.
 * 
 * @param {boolean} isEditable - Flag to determine if the field is editable.
 * @param {string} value - The value to display or edit.
 * @param {string} placeholder - Placeholder text for editable fields.
 * @param {string} className - CSS class for styling.
 * @param {string} as - The HTML element type for Form.Control (e.g., 'textarea').
 * @param {number} rows - Number of rows for textarea.
 * @param {function} onChange - Change handler for editable fields.
 * @returns {JSX.Element} The rendered label field.
 */
const LabelField = ({ isEditable, value, placeholder, className, as, rows, onChange }) => {
    if (!isEditable) {
        // Static Version: Renders a paragraph or div
        return (
        <p className={`${className} static-label`}>
            {value}
        </p>
        );
    }

    // Editable Version: Renders the Form.Control
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
 * Renders the front side of the coin label with various fields.
 * 
 * @param {boolean} isEditable - Flag to determine if fields are editable.
 * @param {string} year - Year of the coin.
 * @param {function} setYear - Setter for year.
 * @param {string} issuer - Issuer of the coin.
 * @param {function} setIssuer - Setter for issuer.
 * @param {string} denomination - Denomination of the coin.
 * @param {function} setDenomination - Setter for denomination.
 * @param {string} grade - Grade of the coin.
 * @param {function} setGrade - Setter for grade.
 * @param {string} gradeDetails - Details about the grade.
 * @param {function} setGradeDetails - Setter for grade details.
 * @param {string} mintage - Mintage information.
 * @param {function} setMintage - Setter for mintage.
 * @param {string} reference - Reference information.
 * @param {function} setReference - Setter for reference.
 * @param {string} details - Additional details about the coin.
 * @param {function} setDetails - Setter for details.
 * @param {string} marksPicture - URL of the marks picture.
 * @param {string} marks - Array of marks associated with the coin.
 * @returns {JSX.Element} The rendered front label container.
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
                        <img src={mark.picture} className="marks-picture" />
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
 * Renders the back side of the coin label with various fields and a QR code.
 * @param {boolean} isEditable - Flag to determine if fields are editable.
 * @param {string} composition - Composition of the coin.
 * @param {function} setComposition - Setter for composition.
 * @param {string} physicalDetails - Physical details of the coin.
 * @param {function} setPhysicalDetails - Setter for physical details.
 * @param {string} numistaNumber - Numista reference number.
 * @param {string} dateAdded - Date the coin was added.
 * @param {function} setDateAdded - Setter for date added.
 * @returns {JSX.Element} The rendered back label container.
 */
const BackLabelContainer = ({ isEditable, composition, setComposition, physicalDetails, setPhysicalDetails, numistaNumber, dateAdded, setDateAdded }) => {
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
            
            <div className="qr-code">
                <QRCode value={`https://numista.com/${numistaNumber}`} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
            </div>
        </div>
    );
}
export { FrontLabelContainer, BackLabelContainer };