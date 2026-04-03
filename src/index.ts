import { createReadStream, existsSync } from "fs";
import { readFile } from "fs/promises";
import { extname } from "path";
import OpenAI from "openai";
import * as fs from "fs";

const DEFAULT_PROMPT =
  "请详细描述这张图片的内容，包括所有可见的文字、物体、布局、颜色等关键信息。如果是截图或文档，请完整提取其中的文字内容。";

const OCR_PROMPT =
  "请提取图片中的所有文字内容，保持原有排版结构。如果是表格，请用 Markdown 表格格式输出。";

const IMG2PROMPT =
  "请分析这张图片的视觉风格、构图、光影、色彩、主题等元素，生成一段高质量的 AI 绘画提示词，可以用于生成类似风格的图片。";

const VIDEO_PROMPT =
  "请详细描述这个视频的内容，包括画面、人物、动作、场景、文字等信息。";

export interface VisionBridgeOptions {
  apiKey?: string;
  thinking?: boolean;
}

export interface CosUploadOptions {
  bucket?: string;
  region?: string;
  secretId?: string;
  secretKey?: string;
  expiresDays?: number;
}

const DEFAULT_COS_BUCKET = "aaa-1258252054";
const DEFAULT_COS_REGION = "ap-guangzhou";

function isUrl(text: string): boolean {
  return text.startsWith("http://") || text.startsWith("https://");
}

function getImageMimeType(source: string): string {
  if (isUrl(source)) {
    const ext = extname(new URL(source).pathname).toLowerCase();
    return ext === ".png" ? "image/png" : "image/jpeg";
  }
  const ext = extname(source).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

async function fileToBase64DataUrl(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");
  const mime = getImageMimeType(filePath);
  return `data:${mime};base64,${base64}`;
}

async function calculateFileHash(filePath: string): Promise<string> {
  const { createHash } = await import("crypto");
  const buffer = await readFile(filePath);
  const hash = createHash("md5").update(buffer).digest("hex");
  return hash;
}

export class VisionBridge {
  private client: OpenAI;

  constructor(options: VisionBridgeOptions = {}) {
    this.client = new OpenAI({
      apiKey: options.apiKey || process.env.ZHIPUAI_API_KEY || "dummy",
      baseURL: "https://open.bigmodel.cn/api/paas/v4/",
    });
  }

  async analyze(
    imageSource: string,
    prompt?: string,
    thinking = false,
  ): Promise<string> {
    const imageUrl = isUrl(imageSource)
      ? imageSource
      : await fileToBase64DataUrl(imageSource);

    const response = await this.client.chat.completions.create({
      model: "glm-4.6v-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: prompt || DEFAULT_PROMPT },
          ],
        },
      ],
      ...(thinking && { thinking: { type: "enabled" } }),
    });

    return response.choices[0]?.message?.content || "";
  }

  async *analyzeStream(
    imageSource: string,
    prompt?: string,
    thinking = false,
  ): AsyncIterable<string> {
    const imageUrl = isUrl(imageSource)
      ? imageSource
      : await fileToBase64DataUrl(imageSource);

    const stream = await this.client.chat.completions.create({
      model: "glm-4.6v-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: prompt || DEFAULT_PROMPT },
          ],
        },
      ],
      stream: true,
      ...(thinking && { thinking: { type: "enabled" } }),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as Record<string, unknown>;
      if (delta?.reasoning_content) {
        yield delta.reasoning_content as string;
      }
      if (delta?.content) {
        yield delta.content as string;
      }
    }
  }

  async ocr(imageSource: string, thinking = false): Promise<string> {
    return this.analyze(imageSource, OCR_PROMPT, thinking);
  }

  async image2prompt(imageSource: string): Promise<string> {
    return this.analyze(imageSource, IMG2PROMPT, false);
  }

  async analyzeVideo(
    videoSource: string,
    prompt?: string,
    thinking = false,
  ): Promise<string> {
    const videoUrl = isUrl(videoSource)
      ? videoSource
      : await this.uploadToCos(videoSource);

    const response = await (this.client.chat.completions as any).create({
      model: "glm-4.6v-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "video_url", video_url: { url: videoUrl } },
            { type: "text", text: prompt || VIDEO_PROMPT },
          ],
        },
      ],
      ...(thinking && { thinking: { type: "enabled" } }),
    });

    return response.choices[0]?.message?.content || "";
  }

  async *analyzeVideoStream(
    videoSource: string,
    prompt?: string,
    thinking = false,
  ): AsyncIterable<string> {
    const videoUrl = isUrl(videoSource)
      ? videoSource
      : await this.uploadToCos(videoSource);

    const stream = await (this.client.chat.completions as any).create({
      model: "glm-4.6v-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "video_url", video_url: { url: videoUrl } },
            { type: "text", text: prompt || VIDEO_PROMPT },
          ],
        },
      ],
      stream: true,
      ...(thinking && { thinking: { type: "enabled" } }),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as Record<string, unknown>;
      if (delta?.reasoning_content) {
        yield delta.reasoning_content as string;
      }
      if (delta?.content) {
        yield delta.content as string;
      }
    }
  }

  async uploadToCos(
    filePath: string,
    options?: CosUploadOptions,
  ): Promise<string> {
    const bucket = options?.bucket || process.env.COS_BUCKET || DEFAULT_COS_BUCKET;
    const region = options?.region || process.env.COS_REGION || DEFAULT_COS_REGION;

    const fileHash = await calculateFileHash(filePath);
    const ext = extname(filePath).toLowerCase();
    const key = `vision-bridge/${fileHash}${ext}`;
    const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;

    const { default: fetch } = await import("node-fetch");

    const headResponse = await fetch(url, { method: "HEAD" });
    if (headResponse.ok) {
      return url;
    }

    const { createReadStream } = await import("fs");
    const stream = createReadStream(filePath);

    const response = await fetch(url, {
      method: "PUT",
      body: stream,
    });

    if (!response.ok && response.status !== 201 && response.status !== 409) {
      const text = await response.text();
      throw new Error(`COS upload failed: ${response.status} ${text}`);
    }

    return url;
  }
}
