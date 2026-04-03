---
name: vision-bridge
description: Use GLM-4.6V-Flash to convert images/video to text for non-vision AI models
---

# Vision Bridge

CLI tool and library that uses GLM-4.6V-Flash (free) to convert images and videos into text descriptions, enabling non-vision LLMs to understand visual content.

## When to Use

- User provides an image/video and asks questions about it
- Need to extract text from screenshots/documents (OCR)
- Need to analyze video content
- Working with text-only models that need visual context

## Usage

### Recommended: npx (no install required)

```bash
npx vision-bridge image photo.jpg
```

### Or install globally

```bash
npm install -g vision-bridge
vision-bridge image photo.jpg
```

## Setup

```bash
export ZHIPUAI_API_KEY="your-api-key"
```

Get API key: https://open.bigmodel.cn

## CLI Commands

### Image Analysis

```bash
npx vision-bridge image <image> [options]
```

Options:
- `-p, --prompt <text>` - Custom prompt
- `-k, --api-key <key>` - API key (or use ZHIPUAI_API_KEY env)
- `-t, --thinking` - Enable thinking mode
- `-s, --stream` - Stream output
- `-o, --output <file>` - Save result to file

Examples:
```bash
# Local file
npx vision-bridge image screenshot.png

# URL
npx vision-bridge image https://example.com/image.png

# Custom prompt - ask specific questions
npx vision-bridge image ui.jpg -p "List all UI components"

# With thinking mode
npx vision-bridge image chart.png --thinking
```

### Video Analysis

```bash
npx vision-bridge video <video> [options]
```

Options:
- `-p, --prompt <text>` - Custom prompt
- `-k, --api-key <key>` - API key
- `-t, --thinking` - Enable thinking mode
- `-s, --stream` - Stream output
- `-o, --output <file>` - Save result to file

Examples:
```bash
# Local file (auto-upload to COS)
npx vision-bridge video recording.mp4

# Video URL
npx vision-bridge video https://example.com/video.mp4

# Ask specific question
npx vision-bridge video talk.mp4 -p "What companies were mentioned?"

# Stream output
npx vision-bridge video clip.mp4 --stream
```

## Library Usage

```typescript
import { VisionBridge } from "vision-bridge";

const bridge = new VisionBridge({ apiKey: "your-api-key" });

// Analyze image
const desc = await bridge.analyze("image.jpg");

// Analyze image with custom prompt
const result = await bridge.analyze("photo.jpg", "How many people are in this photo?");

// Analyze video
const videoDesc = await bridge.analyzeVideo("video.mp4");

// Analyze video with custom prompt
const companies = await bridge.analyzeVideo("video.mp4", "What companies are mentioned?");

// Stream results
for await (const chunk of bridge.analyzeStream("image.jpg")) {
  process.stdout.write(chunk);
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ZHIPUAI_API_KEY |智谱AI API key | Required |
| COS_BUCKET |腾讯云COS存储桶 | aaa-1258252054 |
| COS_REGION | COS地域 | ap-guangzhou |

## Tips

- Use `--thinking` for complex content analysis
- Use `--stream` for real-time output
- Custom prompt (`-p`) lets you ask specific questions instead of generic description
- Video files are automatically uploaded to COS (public bucket)
- Same video file won't be re-uploaded (uses MD5 hash as key)
- Supports PNG, JPG, GIF, WebP for images
- Supports MP4, MOV for videos
