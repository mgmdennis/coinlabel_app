import { useRef, useState, useCallback } from 'react';
import { Box, Button, Group, Text } from '@mantine/core';
import { FolderOpen, X } from 'lucide-react';
import { compressImage } from '../utils/compressImage';

/**
 * Reusable input for capturing coin photos via paste or file picker.
 * Shows a preview when an image is selected; tap/hold (mobile) or
 * focus+Ctrl+V (desktop) replaces it.
 *
 * Used by VisualCustomizationCard (sketch) and CollectionSettingsCard (obv/rev).
 */
export const PasteImageInput = ({
    value,
    onChange,
    label,
    minHeight = 100,
    roundSection = false,
    showLabel = true,
}) => {
    const fileInputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const handlePaste = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        const compressed = await compressImage(ev.target.result);
                        onChange(compressed);
                    };
                    reader.readAsDataURL(file);
                }
                break;
            }
        }
    }, [onChange]);

    const handleFile = async (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const compressed = await compressImage(ev.target.result);
            onChange(compressed);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            {showLabel && label && (
                <Text size="xs" c="dimmed" mb={4}>{label}</Text>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
            <Box pos="relative" mb="xs">
                <div
                    style={{
                        minHeight: `${minHeight}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '0.75rem',
                        textAlign: 'center',
                        background: 'var(--mantine-color-gray-0)',
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: roundSection ? '50%' : 'var(--mantine-radius-md)',
                        ...(value ? { overflow: 'hidden' } : {}),
                        pointerEvents: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        ...(isFocused ? {
                            borderColor: 'var(--mantine-color-blue-6)',
                            boxShadow: '0 0 0 0.2rem rgba(13,110,253,.25)',
                        } : {}),
                    }}
                >
                    {value ? (
                        <img
                            src={value}
                            alt={label || 'Pasted preview'}
                            style={{
                                maxWidth: '80px',
                                maxHeight: '80px',
                                objectFit: 'cover',
                                borderRadius: roundSection ? '50%' : '4px',
                            }}
                        />
                    ) : (
                        <>
                            <Text c="dimmed" size="sm" fw={600}>Tap &amp; hold → <strong>Paste</strong></Text>
                            <Text c="dimmed" style={{ fontSize: '0.75em' }}>or focus &amp; Ctrl/Cmd+V</Text>
                        </>
                    )}
                </div>
                <textarea
                    onPaste={handlePaste}
                    onInput={e => { e.target.value = ''; }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    aria-label={label || 'Paste a coin image'}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        fontSize: '16px',
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
            <Group gap="xs" wrap="nowrap">
                <Button
                    variant="default"
                    size="xs"
                    fullWidth
                    leftSection={<FolderOpen size={13} />}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {value ? 'Replace' : 'Choose Image'}
                </Button>
                {value && (
                    <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => onChange('')}
                        leftSection={<X size={12} />}
                    >
                        Remove
                    </Button>
                )}
            </Group>
        </div>
    );
};