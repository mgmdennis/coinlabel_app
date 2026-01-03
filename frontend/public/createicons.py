import io
import cairosvg
from PIL import Image

# The SVG source for the NumisTag logo
SVG_CODE = """
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="128" height="128" fill="#24313E"/>
<circle cx="64" cy="64" r="48" stroke="white" stroke-width="16"/>
</svg>
"""

def make_assets():
    print("🍪 Starting the NumisTag asset bakery...")

    # 1. Create the PNGs (192 and 512)
    for size in [192, 512]:
        filename = f"logo{size}.png"
        cairosvg.svg2png(bytestring=SVG_CODE.encode('utf-8'), 
                         output_width=size, 
                         output_height=size, 
                         write_to=filename)
        print(f"✅ Created {filename}")

    # 2. Create the multi-size favicon.ico
    # We generate 4 standard sizes for the .ico container
    ico_sizes = [16, 32, 48, 64]
    ico_images = []

    for size in ico_sizes:
        # Convert SVG to PNG in memory
        png_data = cairosvg.svg2png(bytestring=SVG_CODE.encode('utf-8'), 
                                    output_width=size, 
                                    output_height=size)
        # Open with Pillow
        img = Image.open(io.BytesIO(png_data))
        ico_images.append(img)

    # Save the first image as an ICO and bundle the rest inside it
    ico_images[0].save(
        "favicon.ico",
        format="ICO",
        append_images=ico_images[1:]
    )
    print("✅ Created favicon.ico (containing 16px, 32px, 48px, and 64px)")
    print("\nAll done! Your public/ folder is ready for the model's judgment.")

if __name__ == "__main__":
    make_assets()