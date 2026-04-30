import HeritageLabel from './HeritageLabel';
import { shortenIssuer, shortenDenomination } from './heritageLabelUtils';
export { default as BackLabel } from './HeritageBackLabel';

/**
 * "The Heritage" front label theme.
 * ICCS-style slab label layout.
 */
export function FrontLabel(props) {
    const opinion = "IN OUR OPINION THIS IS A\nGENUINE ORIGINAL ITEM.";
    const warning = "Tampering with this sealed holder invalidates above opinion.\nHave holder replaced if inner package/seal not intact.";
    const certNumber = (props.certNumber || props.reference || "").replace(/^([A-Za-z]+)\s+(?!#)/, '$1# ');

    return (
        <div className={props.isEditable ? "heritage-parent-for-edit" : "heritage-parent-for-print"}>
            <HeritageLabel
                isEditable={props.isEditable}
                country={shortenIssuer(props.issuer || "")}
                setCountry={props.setIssuer}
                year={(props.year || "").replace(/\s+/g, '')}
                setYear={props.setYear}
                denomination={shortenDenomination(props.denomination || "", props.year, props.currencyName)}
                setDenomination={props.setDenomination}
                grade={props.grade || ""}
                setGrade={props.setGrade}
                comments={props.details || ""}
                setComments={props.setDetails}
                marks={props.marks || []}
                certNumber={certNumber}
                setCertNumber={props.setReference}
                opinion={opinion}
                warning={warning}
            />
        </div>
    );
}
