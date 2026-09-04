import { Badge, Box, Button, Card, Group, Stack, Text } from '@mantine/core';
import axios from 'axios';
import { useState } from 'react';
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
    ocreId,
    dateAdded, setDateAdded,
    visualTarget,
    sketchId,
    isGenerating,
    isManualMode,
    updateNumistaDetails,
    BASE_URL,
    saveStatus,
    legendObv, setLegendObv,
    legendRev, setLegendRev,
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
        <Box style={{ position: 'sticky', top: '1rem' }}>
            <Card withBorder shadow="md" padding={0} style={{ borderColor: 'var(--mantine-color-cyan-5)' }}>
                <Card.Section withBorder py="xs" px="md" bg="cyan.6" c="white">
                    <Group justify="space-between">
                        <Text fw={700}>Live Preview</Text>
                        <Text size="sm" opacity={0.75}>Scale 1:1</Text>
                    </Group>
                </Card.Section>

                <Stack align="center" gap="xl" bg="gray.0" py="xl" px="md">
                    <Stack align="center" gap="xs" w="100%">
                        <Badge color="gray" variant="filled">Front Side</Badge>
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
                    </Stack>

                    <Stack align="center" gap="xs" w="100%" pt="xl" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        <Badge color="gray" variant="filled">Back Side</Badge>
                        <div className="label-edit-scale-wrapper">
                            <BackLabelContainer
                                isEditable={true}
                                composition={composition} setComposition={setComposition}
                                physicalDetails={physicalDetails} setPhysicalDetails={setPhysicalDetails}
                                numistaNumber={numistaNumber}
                                ocreId={ocreId}
                                dateAdded={dateAdded} setDateAdded={setDateAdded}
                                visualTarget={visualTarget}
                                sketchId={sketchId}
                                isGenerating={isGenerating}
                                legendObv={legendObv} setLegendObv={setLegendObv}
                                legendRev={legendRev} setLegendRev={setLegendRev}
                            />
                        </div>
                    </Stack>
                </Stack>

                <Card.Section withBorder py="sm" px="md">
                    <Stack align="center" gap="xs">
                        {saveStatus === "saving" && <Text size="sm" c="yellow.7">● Saving...</Text>}
                        {saveStatus === "saved" && <Text size="sm" c="green.7">● All changes saved</Text>}
                        {saveStatus === "error" && <Text size="sm" c="red.7">● Error saving!</Text>}
                        {!isManualMode && numistaNumber && (
                            <Button
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={handleReset}
                                disabled={resetting}
                                leftSection={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 1 0-.908-.418A6 6 0 1 0 8 2v1z" />
                                        <path d="M8 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V1.5A.5.5 0 0 0 8 1z" />
                                    </svg>
                                }
                            >
                                {resetting ? 'Resetting...' : 'Reset fields from Numista'}
                            </Button>
                        )}
                    </Stack>
                </Card.Section>
            </Card>
        </Box>
    );
};
