import { Card, Button } from 'react-bootstrap';
import axios from 'axios';
import { useState } from 'react';
import { FrontLabel, BackLabel } from "../pages/label";

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
    sketchId,
    isGenerating,
    isManualMode,
    updateNumistaDetails,
    BASE_URL,
    saveStatus,
    labelTheme,
    currencyName
}) => {
    const [resetting, setResetting] = useState(false);
    const handleReset = async () => {
        if (!numistaNumber) return;
        setResetting(true);
        try {
            const res = await axios.get(`${BASE_URL}/numista/${numistaNumber}`);
            // Force overwrite all fields on reset
            updateNumistaDetails(res.data, true);
        } catch (err) {
            alert('Failed to fetch Numista data.');
        }
        setResetting(false);
    };
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
                            <FrontLabel 
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
                                labelTheme={labelTheme}
                                currencyName={currencyName}
                            />
                        </div>
                    </div>

                    <div className="preview-section text-center w-100 border-top pt-4">
                        <span className="badge bg-secondary mb-2">Back Side</span>
                        <div className="label-edit-scale-wrapper">
                            <BackLabel
                                isEditable={true}
                                composition={composition} setComposition={setComposition}
                                physicalDetails={physicalDetails} setPhysicalDetails={setPhysicalDetails}
                                numistaNumber={numistaNumber}
                                dateAdded={dateAdded} setDateAdded={setDateAdded}
                                visualTarget={visualTarget}
                                sketchId={sketchId}
                                isGenerating={isGenerating}
                                labelTheme={labelTheme}
                            />
                        </div>
                    </div>
                </Card.Body>
                <Card.Footer className="text-center small d-flex flex-column align-items-center gap-2">
                    {saveStatus === "saving" && <span className="text-warning">● Saving...</span>}
                    {saveStatus === "saved" && <span className="text-success">● All changes saved</span>}
                    {saveStatus === "error" && <span className="text-danger">● Error saving!</span>}
                    {!isManualMode && numistaNumber && (
                        <Button
                            variant="link"
                            size="sm"
                            className="px-1 py-0 text-muted"
                            style={{fontWeight: 500, textDecoration: 'none'}}
                            onClick={handleReset}
                            disabled={resetting}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: 2, marginBottom: 2}}>
                              <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 1 0-.908-.418A6 6 0 1 0 8 2v1z"/>
                              <path d="M8 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V1.5A.5.5 0 0 0 8 1z"/>
                            </svg>
                            {resetting ? 'Resetting...' : 'Reset fields from Numista'}
                        </Button>
                    )}
                </Card.Footer>
            </Card>
        </div>
    );
};
