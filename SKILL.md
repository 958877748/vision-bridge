---
name: vision-bridge
description: Use GLM-4.6V-Flash to convert images to text for non-vision AI models
---

# Vision Bridge

CLI tool and library that uses GLM-4.6V-Flash (free) to convert images into text descriptions, enabling non-vision LLMs to understand visual content.

## When to Use

- User provides an image and asks questions about it
- Need to extract text from screenshots/documents (OCR)
- Need to generate AI art prompts from reference images
- Working with text-only models that need visual context

## Installation

```bash
npm install -g vision-bridge
```

## Setup

```bash
export ZHIPUAI_API_KEY="your-api-key"
```

Get API key: https://open.bigmodel.cn

## CLI Commands

### Analyze Image

```bash
vision-bridge analyze <image> [options]
```

Options:
- `-p, --prompt <text>` - Custom analysis prompt
- `-k, --api-key <key>` - API key (or use ZHIPUAI_API_KEY env)
- `-t, --thinking` - Enable deep reasoning mode
- `-s, --stream` - Stream output
- `-o, --output <file>` - Save result to file

Examples:
```bash
# Local file
vision-bridge analyze screenshot.png

# URL
vision-bridge analyze https://example.com/image.png

# Custom prompt
vision-bridge analyze ui.jpg -p "List all UI components and their layout"

# Stream + save
vision-bridge analyze doc.pdf --stream -o result.txt
```

### OCR Mode

```bash
vision-bridge ocr <image> [options]
```

Extracts all text from images, preserving layout. Good for documents, receipts, tables.

```bash
vision-bridge ocr receipt.jpg -o receipt.md
```

### Image2Prompt

```bash
vision-bridge prompt <image> [options]
```

Generates AI art prompts from reference images.

```bash
vision-bridge prompt artwork.jpg
```

## Library Usage

```typescript
import { VisionBridge } from "vision-bridge";

const bridge = new VisionBridge({ apiKey: "your-api-key" });

// Analyze
const desc = await bridge.analyze("image.jpg");

// Stream
for await (const chunk of bridge.analyzeStream("image.jpg")) {
  process.stdout.write(chunk);
}

// OCR
const text = await bridge.ocr("document.jpg");

// Image2Prompt
const prompt = await bridge.image2prompt("art.jpg");
```

## Workflow Pattern

```
User Image → vision-bridge → Text Description → Target LLM → Response
```

Example pipeline:
```bash
vision-bridge analyze screenshot.png -o desc.txt
cat desc.txt | your-text-model "Generate HTML/CSS for this UI"
```

## Tips

- Use `--thinking` for complex images (charts, math problems, detailed analysis)
- Use `--stream` for large images to see progress
- Default prompt extracts all visible content; use `-p` for focused analysis
- Supports PNG, JPG, GIF, WebP formats
- Accepts local paths or URLs
