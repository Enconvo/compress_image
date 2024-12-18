# Image Compress

An Enconvo extension for compressing image files with customizable quality settings.

## Features

- Compress multiple image files at once
- Adjustable compression quality (0-100)
- Custom destination folder support
- Option to overwrite original files
- Simple and intuitive interface

## Installation

This extension requires Enconvo version 1.4.9 or higher.
https://store.enconvo.com/plugins/compress_image

## Usage

1. Select the image files you want to compress
2. Run the "Image Compress" command
3. Configure the compression settings:
   - Quality (0-100, default: 80)
   - Destination folder (default: "./enconvo-compressed-images")
   - Overwrite original files (optional)

## Configuration

### Quality Setting
- Range: 0-100
- Default: 80
- Higher values result in better image quality but larger file sizes

### Destination Folder
- Default: "./enconvo-compressed-images"
- Can be set to absolute or relative path from the target file

### Overwrite Option
- Enable to replace original files with compressed versions
- Disabled by default for safety

## Development

```bash
# Install dependencies
npm install

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build the extension
npm run build

# Development mode
npm run dev
```

## License

MIT

## Author

EnconvoAI

## Version

0.0.006
