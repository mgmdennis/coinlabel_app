import HeritageLabel from '../components/HeritageLabel';
import { shortenIssuer, shortenDenomination } from './heritageLabelUtils';
export { default as BackLabel } from '../components/BackLabel';

/**
 * "The Heritage" front label theme.
 * ICCS-style slab label layout.
 */
export function FrontLabel(props) {
    const opinion = "IN OUR OPINION THIS IS A\nGENUINE ORIGINAL ITEM.";
    const warning = "Tampering with this sealed holder invalidates above opinion.\nHave holder replaced if inner package/seal not intact.";
    const certNumber = props.certNumber || props.reference || "";

    return (
        <div className={props.isEditable ? "parent-label-for-edit" : "parent-label-for-print"}>
            <HeritageLabel
                isEditable={props.isEditable}
                country={shortenIssuer(props.issuer || "")}
                setCountry={props.setIssuer}
                year={props.year || ""}
                setYear={props.setYear}
                denomination={shortenDenomination(props.denomination || "")}
                setDenomination={props.setDenomination}
                grade={props.grade || ""}
                setGrade={props.setGrade}
                comments={props.details || ""}
                setComments={props.setDetails}
                certNumber={certNumber}
                setCertNumber={props.setReference}
                opinion={opinion}
                warning={warning}
            />
        </div>
    );
}
