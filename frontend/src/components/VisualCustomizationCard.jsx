import { useState, useRef, useCallback } from 'react';
import { Badge, Box, Button, Card, Checkbox, Group, Loader, Modal, Radio, Stack, Switch, Text, ThemeIcon } from '@mantine/core';
import { Sparkles, Code, QrCode, Image, Grid3x3, Camera, FlaskConical, FolderOpen, ExternalLink } from 'lucide-react';
import { SketchGallery } from './SketchGallery';
import { API_ORIGIN } from '../config';

export const VisualCustomizationCard = ({
    isManualMode,
    pastedImage,
    visualTarget,
    visualMethod,
    numistaSide,
    isGenerating,
    isGeneratingQR,
    onVisualTargetChange,
    onVisualMethodChange,
    onNumistaSideChange,
    onGenerateVisual,
    sketchId,
    onSketchSelect,
    numistaNumber,
    obverseImageUrl,
    reverseImageUrl,
    onImageFile,
    hasMultipleDates,
    swapDate,
    onSwapDateChange,
    isPremiumAI,
    onPremiumAIChange,
}) => {
    const fileInputRef = useRef(null);
    const [showBeta, setShowBeta] = useState(false);
    const [imageModal, setImageModal] = useState(null); // { url, side } | null

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    const handleLocalPaste = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file && onImageFile) onImageFile(file);
                break;
            }
        }
    }, [onImageFile]);

    const [isPasteAreaFocused, setIsPasteAreaFocused] = useState(false);

    const iconLabel = (icon, text, extra) => (
        <Group gap={4} align="center" wrap="nowrap">{icon} {text}{extra}</Group>
    );

    // --- Building blocks for the guided steps (all features preserved) ---

    const sourceSelector = (
        <div>
            <Radio.Group value={visualTarget} onChange={onVisualTargetChange}>
                <Group gap="lg" wrap="wrap">
                    <Radio
                        value="QR"
                        label={iconLabel(<QrCode size={14} />, 'QR Code', isGeneratingQR && <Loader size="xs" ml={4} />)}
                    />
                    {!isManualMode && showBeta && (
                        <Radio
                            value="NUMISTA"
                            label={iconLabel(<Image size={14} />, 'From Numista', <Badge color="yellow" size="xs" ml={4}>BETA</Badge>)}
                        />
                    )}
                    <Radio
                        value="GALLERY"
                        label={iconLabel(<Grid3x3 size={14} />, 'From Gallery')}
                    />
                    <Radio
                        value="PASTED"
                        label={iconLabel(<Camera size={14} />, 'From Pasted Image')}
                    />
                </Group>
            </Radio.Group>
            {!isManualMode && !showBeta && (
                <Text
                    c="dimmed"
                    mt={6}
                    style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '0.7em', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setShowBeta(true)}
                >
                    <FlaskConical size={10} />Show beta options
                </Text>
            )}
        </div>
    );

    const copyFromNumista = visualTarget === 'PASTED' && !isManualMode && (obverseImageUrl || reverseImageUrl) && (
        <div>
            <Text c="dimmed" mb="xs" style={{ fontSize: '0.8em' }}>
                Open an image from Numista to copy, then paste below.
            </Text>
            <Group gap="xs">
                {obverseImageUrl && (
                    <Button
                        variant="default"
                        size="xs"
                        leftSection={<ExternalLink size={14} />}
                        onClick={() => setImageModal({ url: obverseImageUrl, side: 'obverse' })}
                    >
                        Obverse
                    </Button>
                )}
                {reverseImageUrl && (
                    <Button
                        variant="default"
                        size="xs"
                        leftSection={<ExternalLink size={14} />}
                        onClick={() => setImageModal({ url: reverseImageUrl, side: 'reverse' })}
                    >
                        Reverse
                    </Button>
                )}
            </Group>
        </div>
    );

    const pasteZone = (
        <div>
            {/* Hidden file input for file picker fallback */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && onImageFile) onImageFile(file);
                    e.target.value = '';
                }}
            />
            {/* Paste zone: visible display layer + invisible textarea overlay */}
            <Box pos="relative" mb="xs">
                {/* Visual display layer (pointer-events: none so taps pass through to textarea) */}
                <div
                    style={{
                        minHeight: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '1rem',
                        textAlign: 'center',
                        background: 'var(--mantine-color-gray-0)',
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        pointerEvents: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        ...(isPasteAreaFocused ? {
                            borderColor: 'var(--mantine-color-blue-6)',
                            boxShadow: '0 0 0 0.2rem rgba(13,110,253,.25)',
                        } : {}),
                    }}
                >
                    {pastedImage ? (
                        <>
                            <img src={pastedImage} alt="Pasted preview" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                            <Text c="green.7" size="sm">Image ready — tap &amp; hold to replace</Text>
                        </>
                    ) : (
                        <>
                            <Text c="dimmed" size="sm" fw={600}>Tap &amp; hold → <strong>Paste</strong></Text>
                            <Text c="dimmed" style={{ fontSize: '0.75em' }}>or Ctrl/Cmd+V on desktop</Text>
                        </>
                    )}
                </div>
                {/* Invisible textarea overlay — textarea is what iOS Safari reliably shows
                    the "Paste" context menu for. */}
                <textarea
                    onPaste={handleLocalPaste}
                    onInput={e => { e.target.value = ''; }}
                    onFocus={() => setIsPasteAreaFocused(true)}
                    onBlur={() => setIsPasteAreaFocused(false)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    aria-label="Tap and hold to paste a coin image"
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        fontSize: '16px', // prevents iOS zoom on focus
                        color: 'transparent',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        caretColor: 'transparent',
                        WebkitTapHighlightColor: 'transparent',
                        borderRadius: '0.375rem',
                        cursor: 'default',
                        zIndex: 1,
                    }}
                />
            </Box>
            <Button
                variant="default"
                size="xs"
                fullWidth
                leftSection={<FolderOpen size={13} />}
                onClick={() => fileInputRef.current?.click()}
            >
                Choose Image
            </Button>
        </div>
    );

    const sideSelector = (
        <Radio.Group value={numistaSide} onChange={onNumistaSideChange}>
            <Group gap="lg">
                <Radio value="OBVERSE" label="Obverse" />
                <Radio value="REVERSE" label="Reverse" />
            </Group>
        </Radio.Group>
    );

    const methodControls = (
        <Stack gap="xs">
            <Radio.Group value={visualMethod} onChange={onVisualMethodChange}>
                <Group gap="lg">
                    <Radio value="SCRIPT" label={iconLabel(<Code size={14} />, 'Script')} />
                    <Radio value="AI" label={iconLabel(<Sparkles size={14} />, 'AI')} />
                    <Radio value="RAW" label={iconLabel(<Image size={14} />, 'Raw')} />
                </Group>
            </Radio.Group>
            {visualMethod === 'AI' && hasMultipleDates && (
                <Checkbox
                    size="sm"
                    id="swap-date-checkbox"
                    label="Replace date in sketch with selected variation year"
                    checked={swapDate}
                    onChange={onSwapDateChange}
                />
            )}
            {visualMethod === 'AI' && (
                <Switch
                    size="sm"
                    id="premium-ai-switch"
                    label={
                        <Group gap={4} wrap="nowrap">
                            <Sparkles size={13} color="var(--mantine-color-yellow-6)" />
                            <strong>Premium</strong>
                        </Group>
                    }
                    checked={isPremiumAI}
                    onChange={onPremiumAIChange}
                />
            )}
        </Stack>
    );

    const generateButton = (
        <Button
            onClick={onGenerateVisual}
            disabled={isGenerating}
            loading={isGenerating}
        >
            Generate
        </Button>
    );

    const galleryPicker = (
        <SketchGallery
            currentSketchId={sketchId}
            onSelect={onSketchSelect}
            numistaNumber={numistaNumber}
        />
    );

    // --- Assemble the numbered steps for the chosen source ---
    const steps = [{ title: 'Choose a visual source', content: sourceSelector }];

    if (visualTarget === 'QR') {
        steps.push({
            title: 'Done — QR code',
            content: (
                <Group gap="xs" c="dimmed">
                    {isGeneratingQR && <Loader size="xs" />}
                    <Text size="sm">A QR code linking to this coin is generated automatically — no further setup needed.</Text>
                </Group>
            ),
        });
    } else if (visualTarget === 'GALLERY') {
        steps.push({ title: 'Pick a saved sketch', content: galleryPicker });
    } else if (visualTarget === 'PASTED') {
        steps.push({
            title: 'Add your coin image',
            content: <Stack gap="sm">{copyFromNumista}{pasteZone}</Stack>,
        });
        steps.push({ title: 'Choose a processing method', content: methodControls });
        steps.push({ title: 'Generate', content: generateButton });
    } else if (visualTarget === 'NUMISTA') {
        steps.push({ title: 'Choose the coin side', content: sideSelector });
        steps.push({ title: 'Choose a processing method', content: methodControls });
        steps.push({ title: 'Generate', content: generateButton });
    }

    return (
        <>
        {/* Image preview modal — user long-presses (iOS) or right-clicks (desktop) to copy */}
        <Modal
            opened={!!imageModal}
            onClose={() => setImageModal(null)}
            centered
            title={<Text fw={600}>{imageModal?.side === 'obverse' ? 'Obverse' : 'Reverse'} Image</Text>}
        >
            <Stack align="center" gap="sm">
                <img
                    src={imageModal?.url || ''}
                    alt="Coin"
                    onError={e => {
                        // Fall back to backend proxy if direct load fails (hotlink protection etc.)
                        if (imageModal && !e.target.src.includes('/api/generate-sketch/image-proxy')) {
                            e.target.src = `${API_ORIGIN}/api/generate-sketch/image-proxy?url=${encodeURIComponent(imageModal.url)}`;
                        }
                    }}
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                />
                <Text c="dimmed" size="sm" ta="center">
                    {isIOS
                        ? '👆 Long-press the image above → tap Copy'
                        : 'Right-click the image → Copy Image, then paste below'}
                </Text>
                <Group justify="space-between" w="100%">
                    <Button variant="default" size="xs" onClick={() => setImageModal(null)}>
                        Close
                    </Button>
                    <Button
                        size="xs"
                        leftSection={<FolderOpen size={13} />}
                        onClick={() => { setImageModal(null); fileInputRef.current?.click(); }}
                    >
                        Choose from files instead
                    </Button>
                </Group>
            </Stack>
        </Modal>

        <Card withBorder shadow="sm" mb="lg" padding="md" style={{ borderColor: 'var(--mantine-color-blue-6)' }}>
            <Card.Section withBorder inheritPadding py="xs" bg="blue.6" c="white">
                <Group justify="space-between">
                    <Text fw={700}>Visual Customization</Text>
                    <Badge
                        variant={isManualMode ? 'white' : 'filled'}
                        color={isManualMode ? 'gray' : 'cyan'}
                        radius="xl"
                    >
                        {isManualMode ? "Manual Mode" : "Numista Mode"}
                    </Badge>
                </Group>
            </Card.Section>

            <Stack gap="lg" mt="md">
                {steps.map((step, i) => (
                    <Group key={i} align="flex-start" wrap="nowrap" gap="sm">
                        <ThemeIcon radius="xl" size={26} variant="filled" color="blue" style={{ flexShrink: 0 }}>
                            <Text size="xs" fw={700}>{i + 1}</Text>
                        </ThemeIcon>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={700} mb={8}>{step.title}</Text>
                            {step.content}
                        </Box>
                    </Group>
                ))}
            </Stack>
        </Card>
        </>
    );
};
