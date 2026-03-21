import { Card } from 'react-bootstrap';
import { FrontLabelContainer, BackLabelContainer } from "../pages/label";

export const PreviewCard = ({
    year, setYear,
    issuer, setIssuer,
    denomination, setDenomination,
    grade, setGrade,
    gradeDetails, setGradeDetails,
    mintage, setMintage,
    reference, setReference,
    marksPicture,
    marks,
    details, setDetails,
    composition, setComposition,
    physicalDetails, setPhysicalDetails,
    numistaNumber,
    dateAdded, setDateAdded,
    visualTarget,
    sketchId
}) => {
    return (
        <div className="sticky-top" style={{ top: '1rem' }}>
            <Card className="border-info shadow">
                <Card.Header className="bg-info text-white fw-bold d-flex justify-content-between">
                    Live Preview <span className="small opacity-75">Scale 1:1</span>
                </Card.Header>
                <Card.Body className="bg-light d-flex flex-column align-items-center gap-4 py-4">
                    <div className="preview-section text-center w-100">
                        <span className="badge bg-secondary mb-2">Front Side</span>
                        <div className="label-edit-scale-wrapper">
                            <FrontLabelContainer 
                                isEditable={true}
                                year={year} setYear={setYear}
                                issuer={issuer} setIssuer={setIssuer}
                                denomination={denomination} setDenomination={setDenomination}
                                grade={grade} setGrade={setGrade}
                                gradeDetails={gradeDetails} setGradeDetails={setGradeDetails}
                                mintage={mintage} setMintage={setMintage}
                                reference={reference} setReference={setReference}
                                marksPicture={marksPicture}
                                marks={marks}
                                details={details} setDetails={setDetails}
                            />
                        </div>
                    </div>

                    <div className="preview-section text-center w-100 border-top pt-4">
                        <span className="badge bg-secondary mb-2">Back Side</span>
                        <div className="label-edit-scale-wrapper">
                            <BackLabelContainer 
                                isEditable={true}
                                composition={composition} setComposition={setComposition}
                                physicalDetails={physicalDetails} setPhysicalDetails={setPhysicalDetails}
                                numistaNumber={numistaNumber}
                                dateAdded={dateAdded} setDateAdded={setDateAdded}
                                visualTarget={visualTarget}
                                sketchId={sketchId}
                            />
                        </div>
                    </div>
                </Card.Body>
                <Card.Footer className="text-center small">
                    <span className="text-success">●</span> Autosaving enabled
                </Card.Footer>
            </Card>
        </div>
    );
};
