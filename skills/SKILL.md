---
name: image-utils
description: >
  Compress images with adjustable quality using the Caesium engine. Supports batch compression, overwrite or output to a custom folder. Also provides macOS sips best practices for format conversion, resizing, and metadata operations.
metadata:
  author: EnconvoAI
  version: "0.0.187"
---

## API Reference

Just use the `local_api` tool to request these APIs.

**!Important**: To view full parameter details for a specific endpoint, run: `node skills/scripts/api_detail.cjs <endpoint-path>`

| Endpoint | Description |
|----------|-------------|
| `image-utils/image_compress` | Compress images with adjustable quality using the Caesium engine. Supports batch compression, overwrite or output to a custom folder. |


## Caesium Compression Engine (Preferred)

[Caesium](https://github.com/Lymphatus/caesium-clt) is a high-performance lossy/lossless image compression tool. **Prefer Caesium over sips** for compression, format conversion, resizing, and batch processing.

### Installation

This project automatically downloads precompiled binaries from [GitHub Releases](https://github.com/Lymphatus/caesium-clt/releases). No Homebrew or compilation needed — takes just a few seconds.

**Auto-install flow:**
1. Check local cache `~/.config/enconvo/bin/caesiumclt`
2. Check Homebrew paths (`/opt/homebrew/bin/`, `/usr/local/bin/`)
3. Check system PATH
4. If not found anywhere, auto-download the latest tar.gz for the current architecture (ARM64/x86_64) from GitHub Releases and extract to `~/.config/enconvo/bin/`

```bash
# Manual install via Homebrew
brew install caesiumclt

# Manual install via Cargo
cargo install caesiumclt

# Manual install via Winget (Windows)
winget install SaeraSoft.CaesiumCLT

# Manual download (Apple Silicon)
curl -fsSL https://github.com/Lymphatus/caesium-clt/releases/latest/download/caesiumclt-v1.3.0-aarch64-apple-darwin.tar.gz | tar xz -C ~/.config/enconvo/bin/
```

### Supported Formats

| Format | Lossy | Lossless |
|--------|-------|----------|
| JPEG | MozJPEG | Yes |
| PNG | Yes | Yes (oxipng) |
| WebP | Yes | Yes |
| GIF | Yes | - |

### Lossy Compression

```bash
# Compress with quality setting (0-100)
caesiumclt -q 80 -o output/ image.jpg

# Compress multiple images
caesiumclt -q 75 -o output/ image1.jpg image2.png image3.webp

# Compress with suffix to avoid overwriting originals
caesiumclt -q 85 --suffix _compressed --same-folder-as-input image.jpg
```

### Lossless Compression

```bash
# Lossless compress a single image
caesiumclt --lossless -o output/ image.jpg

# Lossless with metadata preservation
caesiumclt --lossless -e --keep-dates -o output/ image.jpg

# Lossless compress a directory recursively
caesiumclt --lossless -R -o output/ Pictures

# Preserve folder structure
caesiumclt --lossless -RS -o output/ Pictures
```

### Format Conversion

```bash
# Convert images to WebP with quality setting
caesiumclt -q 85 --format webp -o output/ Pictures/*.jpg

# Convert PNG to JPEG with maximum quality
caesiumclt -q 100 --format jpeg -o output/ image.png
```

### Resizing

```bash
# Resize to specific width (maintains aspect ratio)
caesiumclt --lossless --width 1920 -o output/ image.jpg

# Resize to specific height (maintains aspect ratio)
caesiumclt -q 90 --height 1080 -o output/ image.jpg

# Resize by longest edge (useful for mixed portrait/landscape)
caesiumclt -q 85 --long-edge 1500 -o output/ Pictures/*.jpg

# Resize by shortest edge
caesiumclt -q 85 --short-edge 800 -o output/ Pictures/*.jpg
```

### Maximum File Size

```bash
# Target a specific maximum file size (500KB)
caesiumclt --max-size 512000 -o output/ large-image.jpg
```

### Batch & Recursive Processing

```bash
# Recursive directory compression
caesiumclt -q 80 -R -o output/ Pictures/

# Preserve folder structure
caesiumclt -q 80 -RS -o output/ Pictures/

# Overwrite output + preserve structure + recursive
caesiumclt -q 80 -RSO -o output/ Pictures/

# Parallel processing with specific thread count
caesiumclt -q 80 --threads 4 -R -o output/ Pictures/

# Dry run to test compression without writing files
caesiumclt -q 80 --dry-run -o output/ Pictures/
```

### Overwrite Policies

```bash
# Always overwrite (default)
caesiumclt -q 85 -O all -o output/ Pictures/*.jpg

# Never overwrite existing files
caesiumclt -q 85 -O never -o output/ Pictures/*.jpg

# Overwrite only if the existing file is bigger
caesiumclt -q 85 -O bigger -o output/ Pictures/*.jpg
```

### Advanced Options

```bash
# PNG optimization with highest compression level
caesiumclt --lossless --png-opt-level 6 -o output/ image.png

# JPEG with specific chroma subsampling
caesiumclt -q 85 --jpeg-chroma-subsampling "4:2:0" --jpeg-baseline -o output/ image.jpg

# Preserve EXIF metadata
caesiumclt -q 80 -e -o output/ image.jpg

# Preserve file timestamps
caesiumclt -q 80 --keep-dates -o output/ image.jpg

# Output to same folder with suffix
caesiumclt -q 80 --suffix _small --same-folder-as-input image.jpg
```

### Full Parameter Reference

| Parameter | Description |
|-----------|-------------|
| `-q <quality>` | Compression quality 0-100 |
| `--lossless` | Lossless compression mode |
| `--max-size <bytes>` | Target maximum file size in bytes |
| `-o <dir>` | Output directory |
| `--same-folder-as-input` | Output to same folder as input file |
| `--suffix <str>` | Custom suffix for output filenames |
| `--format <fmt>` | Convert to format: `jpeg`, `png`, `webp` |
| `--width <px>` | Resize width (maintains aspect ratio) |
| `--height <px>` | Resize height (maintains aspect ratio) |
| `--long-edge <px>` | Resize by longest edge |
| `--short-edge <px>` | Resize by shortest edge |
| `-R` | Recursive subdirectory processing |
| `-S` | Preserve file directory structure |
| `-O <policy>` | Overwrite policy: `all`, `never`, `bigger` |
| `-e` | Preserve EXIF metadata |
| `--keep-dates` | Preserve file timestamps |
| `--threads <n>` | Number of parallel threads |
| `--dry-run` | Test compression without writing files |
| `--png-opt-level <0-6>` | PNG optimization level (higher = slower but smaller) |
| `--jpeg-chroma-subsampling <mode>` | JPEG chroma subsampling: `4:4:4`, `4:2:2`, `4:2:0` |
| `--jpeg-baseline` | Force baseline JPEG encoding |

### Quality Guide

```
95-100: Near lossless, minimal size reduction. For professional photography, print originals.
80-95:  Recommended range. Virtually indistinguishable, 60-80% file size reduction.
60-80:  Noticeable compression. For web thumbnails and previews.
40-60:  Visible quality loss. Only for extreme compression needs.
0-40:   Severe distortion. Not recommended.
```

### Engine Features

- **JPEG**: MozJPEG engine, 5-15% better compression than standard libjpeg
- **PNG**: oxipng engine, lossless compression with pixel-perfect output
- **WebP**: Both lossy and lossless supported
- **GIF**: Lossy compression supported
- **Metadata**: Optional EXIF and ICC color profile preservation
- **Multithreaded**: Configurable parallel processing for batch operations
- **Dry run**: Test compression results before writing files



## macOS sips Best Practices

`sips` (Scriptable Image Processing System) is a built-in macOS command-line image processing tool. No installation required.

### Format Conversion

```bash
# Basic format conversion
sips -s format png input.jpg --out output.png
sips -s format jpeg input.heic --out output.jpg
sips -s format webp input.jpg --out output.webp    # macOS 11+

# Batch convert HEIC to JPEG
for f in *.heic; do sips -s format jpeg "$f" --out "${f%.heic}.jpg"; done

# Supported formats: jpeg, png, tiff, gif, bmp, pict, pdf, heic, webp, avif (macOS 13+)
```

### Resizing

```bash
# Scale proportionally by longest edge
sips -Z 1024 input.jpg --out resized.jpg

# Exact dimensions (may distort)
sips -z 600 800 input.jpg --out resized.jpg

# Scale by percentage (50%) — get dimensions first
W=$(sips -g pixelWidth input.jpg | tail -1 | awk '{print $2}')
H=$(sips -g pixelHeight input.jpg | tail -1 | awk '{print $2}')
sips -z $((H/2)) $((W/2)) input.jpg --out half.jpg

# Center crop
sips -c 600 800 input.jpg --out cropped.jpg
```

### Quality & Compression

```bash
# Set JPEG quality (JPEG format only)
sips -s formatOptions 80 input.jpg --out output.jpg    # 80% quality
sips -s formatOptions low input.jpg --out low.jpg      # Low quality
sips -s formatOptions high input.jpg --out high.jpg    # High quality
```

### Rotation & Flip

```bash
sips -r 90 input.jpg --out rotated.jpg          # Rotate 90° clockwise
sips -r 180 input.jpg --out rotated.jpg         # Rotate 180°
sips -f horizontal input.jpg --out flipped.jpg  # Horizontal flip
sips -f vertical input.jpg --out flipped.jpg    # Vertical flip
```

### Image Information

```bash
sips -g all input.jpg                          # All properties
sips -g pixelWidth -g pixelHeight input.jpg    # Width & height only
sips -g format input.jpg                       # Format
sips -g space input.jpg                        # Color space
sips -g dpiWidth -g dpiHeight input.jpg        # DPI
sips -g hasAlpha input.jpg                     # Alpha channel
```

### DPI & Print

```bash
# Set to 300 DPI (print standard)
sips -s dpiWidth 300 -s dpiHeight 300 input.jpg --out print_ready.jpg

# Set to 72 DPI (screen standard)
sips -s dpiWidth 72 -s dpiHeight 72 input.jpg --out screen.jpg
```

### Color Space Management

```bash
# Convert to sRGB (recommended for web)
sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" input.jpg

# Convert to Display P3 (Apple wide color gamut)
sips -m "/System/Library/ColorSync/Profiles/Display P3.icc" input.jpg

# Convert to Adobe RGB
sips -m "/System/Library/ColorSync/Profiles/AdobeRGB1998.icc" input.jpg
```

### Metadata Operations

```bash
# View metadata
mdls image.jpg                                  # macOS Spotlight metadata
sips -g all image.jpg                           # sips properties

# Remove GPS info (privacy)
sips -d GPSLatitude -d GPSLongitude image.jpg
```

### Batch Processing

```bash
# Batch format conversion
sips -s format png *.jpg --out ./png_output/

# Batch resize
sips -Z 800 *.jpg --out ./thumbnails/

# Recursive with find
find . -name "*.heic" -exec sips -s format jpeg {} --out {}.jpg \;
```

### Notes

- The `--out` parameter requires the output directory to already exist
- Without `--out`, sips modifies the original file in place
- HEIC is natively supported on macOS 10.13+, default iPhone photo format
- WebP requires macOS 11+, AVIF requires macOS 13+
- Color profiles are located at `/System/Library/ColorSync/Profiles/`
- sips is the only option for: DPI control, color space management, HEIC decoding, and image info queries


### Caesium vs sips

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| Lossy compression | **Caesium** | MozJPEG engine, superior compression ratio |
| Lossless compression | **Caesium** | oxipng, better than sips |
| Format conversion | **Caesium** | Supports JPEG/PNG/WebP conversion with quality control |
| Resizing | **Caesium** | Long-edge/short-edge modes, combined with compression |
| Batch processing | **Caesium** | Multithreaded, recursive, structure preservation |
| Max file size targeting | **Caesium** | `--max-size` flag, sips cannot do this |
| HEIC decoding | sips | Caesium does not support HEIC input |
| DPI control | sips | Caesium does not modify DPI |
| Color space management | sips | Native macOS ColorSync support |
| Rotation / flip | sips | Caesium does not support rotation |
| Image info / metadata query | sips | Built-in, instant, no dependencies |
