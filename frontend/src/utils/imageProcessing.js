// src/utils/imageProcessing.js
import axios from 'axios';
import { API_ORIGIN as BASE_URL } from '../config';

/**
 * Converts a coin image to a Base64 string for sketch generation.
 * If the input is already a base64 data URI, returns it directly.
 * Otherwise fetches through the backend image-proxy (needed because
 * Numista CDN blocks CORS, so canvas.toDataURL would fail).
 */
export const getCoinBase64 = async (imageSource) => {
    if (!imageSource) throw new Error("No image source provided");

    // If already a base64 data URI, return directly
    if (imageSource.startsWith('data:')) {
        return imageSource;
    }

    // Fetch through backend proxy to avoid CORS issues
    const proxyUrl = `${BASE_URL}/api/generate-sketch/image-proxy?url=${encodeURIComponent(imageSource)}`;
    const response = await axios.get(proxyUrl, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const base64 = btoa(
        new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return `data:${contentType};base64,${base64}`;
};