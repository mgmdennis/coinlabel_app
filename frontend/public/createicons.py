import io
import cairosvg
from PIL import Image

# --- Your SVG Code ---
svg_code = """
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="128" height="128" fill="#24313E"/>
<circle cx="64" cy="64" r="48" stroke="white" stroke-width="16"/>
</svg>
"""

def generate_assets():
    print("🚀 Starting asset generation...")

    # 1. Generate logo192.png
    cairosvg.svg2png(
        bytestring=svg_code.encode('utf-8'),
        output_width=192,
        output_height=192,
        write_to='logo192.png'
    )
    print("✅ Created logo192.png")

    # 2. Generate logo512.png
    cairosvg.svg2png(
        bytestring=svg_code.encode('utf-8'),
        output_width=512,
        output_height=512,
        write_to='logo512.png'
    )
    print("✅ Created logo512.png")

    # 3. Generate multi-resolution favicon.ico
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    pil_images = []

    for size in ico_sizes:
        png_data = cairosvg.svg2png(
            bytestring=svg_code.encode('utf-8'),
            output_width=size[0],
            output_height=size[1]
        )
        pil_images.append(Image.open(io.BytesIO(png_data)))

    pil_images[0].save(
        'favicon.ico',
        format='ICO',
        append_images=pil_images[1:],
        optimize=True
    )
    print("✅ Created favicon.ico")

    print("\nDone! All assets are ready for your public folder.")

if __name__ == "__main__":
    generate_assets()