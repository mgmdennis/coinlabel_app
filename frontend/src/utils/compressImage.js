const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;

/**
 * Compress an image data URL to JPEG. Any transparency is flattened onto a
 * white background first — coin photos never need alpha, and opaque JPEGs
 * are several times smaller than cut-out PNGs.
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
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };
        img.src = dataUrl;
    });
}
