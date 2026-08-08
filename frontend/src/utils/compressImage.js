const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;

/**
 * Compress an image data URL. Preserves transparency as PNG;
 * opaque images are compressed to JPEG at JPEG_QUALITY.
 */
export function compressImage(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height / width) * MAX_DIMENSION);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width / height) * MAX_DIMENSION);
                    height = MAX_DIMENSION;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height).data;
            let hasTransparency = false;
            for (let i = 3; i < imageData.length; i += 4) {
                if (imageData[i] < 255) { hasTransparency = true; break; }
            }

            resolve(hasTransparency
                ? canvas.toDataURL('image/png')
                : canvas.toDataURL('image/jpeg', JPEG_QUALITY)
            );
        };
        img.src = dataUrl;
    });
}
