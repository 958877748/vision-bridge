# Vision Bridge

Use GLM-4.6V-Flash to convert images to text for non-vision AI models.

## Problem

Many LLMs don't support image input. Vision Bridge solves this by using GLM-4.6V-Flash (free) as a vision intermediary.

## How It Works

```
Image → GLM-4.6V-Flash → Text Description → Your Non-Vision Model
```

## Installation

```bash
npm install -g vision-bridge
```

## Setup

Set your ZhipuAI API key:

```bash
export ZHIPUAI_API_KEY="your-api-key"
```

Get API key: https://open.bigmodel.cn

## Usage

### Analyze Image

```bash
# From local file
vision-bridge analyze photo.jpg

# From URL
vision-bridge analyze https://example.com/image.png

# Custom prompt
vision-bridge analyze screenshot.png -p "What UI components are in this screenshot?"

# Stream output
vision-bridge analyze doc.jpg --stream

# Enable thinking mode for complex images
vision-bridge analyze chart.png --thinking

# Save to file
vision-bridge analyze receipt.jpg -o output.txt
```

### OCR Mode

```bash
# Extract text from image
vision-bridge ocr document.jpg

# Save OCR result
vision-bridge ocr table.jpg -o table.md
```

### Image2Prompt

```bash
# Generate AI art prompt from image
vision-bridge prompt artwork.jpg
```

## Pipe to Other Models

```bash
# Use with any CLI model tool
vision-bridge analyze image.jpg | some-text-model --stdin

# Example workflow
vision-bridge analyze screenshot.png -o desc.txt
cat desc.txt | your-favorite-llm "Based on this UI description, generate the HTML/CSS code"
```

## Options

| Option | Description |
|--------|-------------|
| `-p, --prompt` | Custom analysis prompt |
| `-k, --api-key` | API key (or use env var) |
| `-t, --thinking` | Enable deep reasoning |
| `-s, --stream` | Stream output |
| `-o, --output` | Save to file |

## Library Usage

```typescript
import { VisionBridge } from "vision-bridge";

const bridge = new VisionBridge({ apiKey: "your-api-key" });

// Analyze image
const description = await bridge.analyze("https://example.com/image.png");

// Stream analysis
for await (const chunk of bridge.analyzeStream("photo.jpg")) {
  process.stdout.write(chunk);
}

// OCR
const text = await bridge.ocr("document.jpg");

// Image to prompt
const prompt = await bridge.image2prompt("artwork.jpg");
```

## License

MIT
