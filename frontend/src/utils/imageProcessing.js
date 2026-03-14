// src/utils/imageProcessing.js

/**
 * Converts a coin image to a Base64 string for sketch generation.
 * If the input is already a base64 data URI, returns it directly.
 * Otherwise loads via an img element (for pasted images, etc.).
 */
export const getCoinBase64 = async (imageSource) => {
    if (!imageSource) throw new Error("No image source provided");

    // If already a base64 data URI, return directly
    if (imageSource.startsWith('data:')) {
        return imageSource;
    }

    // For any other URL, load via img element
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSource;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = (err) => {
            console.error("Image Load Error:", err);
            reject(new Error("Failed to load image."));
        };
    });
};