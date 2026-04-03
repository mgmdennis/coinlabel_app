import './SheltonTheme.css';
import LabelField from '../components/LabelField';
export { default as BackLabel } from '../components/BackLabel';

/**
 * "The Shelton" front label theme.
 * Classic coin label layout with all label fields.
 */
export function FrontLabel(props) {
    return (
        <div className={props.isEditable ? "parent-label-for-edit" : "parent-label-for-print"}>
            <LabelField
                isEditable={props.isEditable}
                placeholder="Year"
                value={props.year}
                className={"label date" + (props.year.length > 4 ? " narrow" : "")}
                onChange={(e) => props.setYear && props.setYear(e.target.value)}
            />
            <LabelField
                isEditable={props.isEditable}
                placeholder="Issuer"
                value={props.issuer}
                className={"label issuer" + (props.issuer.length > 18 ? " narrow" : "")}
                onChange={(e) => props.setIssuer && props.setIssuer(e.target.value)}
            />
            <LabelField
                isEditable={props.isEditable}
                placeholder="Denomination"
                value={props.denomination}
                as="textarea"
                rows={2}
                className={"label denomination" + (props.denomination.length > 10 ? " narrow" : "")}
                onChange={(e) => props.setDenomination && props.setDenomination(e.target.value)}
            />
            <LabelField
                isEditable={props.isEditable}
                placeholder="Grade"
                value={props.grade}
                className="label grade"
                onChange={(e) => props.setGrade && props.setGrade(e.target.value)}
            />
            <LabelField
                isEditable={props.isEditable}
                placeholder="Grade Details"
                value={props.gradeDetails}
                as="textarea"
                rows={6}
                className="label grade-details"
                onChange={(e) => props.setGradeDetails && props.setGradeDetails(e.target.value)}
            />
            <LabelField
                isEditable={props.isEditable}
                placeholder="Mintage"
                value={props.mintage}
                className="label mintage"
                onChange={(e) => props.setMintage && props.setMintage(e.target.value)}
            />
            <LabelField
                isEditable={props.isEditable}
                placeholder="Ref"
                value={props.reference}
                className="label reference"
                onChange={(e) => props.setReference && props.setReference(e.target.value)}
            />
            <div className="details-stack-container">
                {props.marks && (
                    <div className="marks-picture-row">
                        {props.marks.map((mark, index) => (
                            <div key={index} className="marks-picture-wrapper">
                                <img src={mark.picture} className="marks-picture" alt="mark" />
                            </div>
                        ))}
                    </div>
                )}
                <LabelField
                    isEditable={props.isEditable}
                    placeholder="Details"
                    value={props.details}
                    className="label details"
                    as="textarea"
                    rows={7}
                    onChange={(e) => props.setDetails && props.setDetails(e.target.value)}
                />
            </div>
        </div>
    );
}
