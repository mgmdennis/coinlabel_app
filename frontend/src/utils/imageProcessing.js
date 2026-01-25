// src/utils/imageProcessing.js
import axios from 'axios';

/**
 * Captures a coin image via the backend proxy and returns a Base64 string.
 * This avoids the "Tainted Canvas" error when generating sketches.
 */
export const getCoinBase64 = async (numistaUrl) => {
    return new Promise((resolve, reject) => {
        if (!numistaUrl) return reject("No Numista URL provided");

        const img = new Image();
        img.crossOrigin = "Anonymous"; // Crucial for canvas processing
        
        // --- THE CORRECT PROXY URL ---
        // It must match: app.use('/api/generate-sketch', sketchRoute) 
        // and the router.get('/image-proxy') inside that file.
        img.src = `/api/generate-sketch/image-proxy?url=${encodeURIComponent(numistaUrl)}`;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            
            // Convert to Base64 (PNG or JPEG)
            const base64Data = canvas.toDataURL("image/png");
            resolve(base64Data);
        };

        img.onerror = (err) => {
            console.error("Proxy Load Error:", err);
            reject(new Error("Failed to load image via proxy bridge. Check backend logs."));
        };
    });
};