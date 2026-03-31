#!/usr/bin/env node

import { Command } from "commander";
import { VisionBridge } from "./index.js";

function getApiKey(cliKey: string | undefined): string {
  const key = cliKey || process.env.ZHIPUAI_API_KEY;
  if (!key) {
    console.error(
      "Error: API key required. Set ZHIPUAI_API_KEY env var or use --api-key flag.",
    );
    process.exit(1);
  }
  return key;
}

async function runAnalysis(
  bridge: VisionBridge,
  image: string,
  prompt: string | undefined,
  thinking: boolean,
  stream: boolean,
  output: string | undefined,
) {
  const fs = await import("fs/promises");

  if (stream) {
    let result = "";
    for await (const chunk of bridge.analyzeStream(image, prompt, thinking)) {
      process.stdout.write(chunk);
      result += chunk;
    }
    process.stdout.write("\n");

    if (output) {
      await fs.writeFile(output, result, "utf-8");
      console.error(`\nResult saved to ${output}`);
    }
  } else {
    const result = await bridge.analyze(image, prompt, thinking);
    console.log(result);

    if (output) {
      await fs.writeFile(output, result, "utf-8");
      console.error(`Result saved to ${output}`);
    }
  }
}

const program = new Command();

program
  .name("vision-bridge")
  .description(
    "Use GLM-4.6V-Flash to convert images to text for non-vision AI models",
  )
  .version("0.1.0");

program
  .command("analyze")
  .description("Analyze an image and output text description")
  .argument("<image>", "Local file path or URL of the image")
  .option("-p, --prompt <text>", "Custom prompt for image analysis")
  .option("-k, --api-key <key>", "ZhipuAI API key (or set ZHIPUAI_API_KEY)")
  .option("-t, --thinking", "Enable thinking mode")
  .option("-s, --stream", "Stream output")
  .option("-o, --output <file>", "Save result to file")
  .action(async (image, opts) => {
    const apiKey = getApiKey(opts.apiKey);
    const bridge = new VisionBridge({ apiKey, thinking: opts.thinking });
    await runAnalysis(
      bridge,
      image,
      opts.prompt,
      opts.thinking,
      opts.stream,
      opts.output,
    );
  });

program
  .command("ocr")
  .description("Extract text from an image (OCR mode)")
  .argument("<image>", "Local file path or URL of the image")
  .option("-k, --api-key <key>", "ZhipuAI API key (or set ZHIPUAI_API_KEY)")
  .option("-t, --thinking", "Enable thinking mode")
  .option("-o, --output <file>", "Save result to file")
  .action(async (image, opts) => {
    const apiKey = getApiKey(opts.apiKey);
    const bridge = new VisionBridge({ apiKey, thinking: opts.thinking });
    const result = await bridge.ocr(image, opts.thinking);
    console.log(result);

    if (opts.output) {
      const fs = await import("fs/promises");
      await fs.writeFile(opts.output, result, "utf-8");
      console.error(`Result saved to ${opts.output}`);
    }
  });

program
  .command("prompt")
  .description("Generate AI art prompt from an image (Image2Prompt)")
  .argument("<image>", "Local file path or URL of the image")
  .option("-k, --api-key <key>", "ZhipuAI API key (or set ZHIPUAI_API_KEY)")
  .option("-o, --output <file>", "Save result to file")
  .action(async (image, opts) => {
    const apiKey = getApiKey(opts.apiKey);
    const bridge = new VisionBridge({ apiKey });
    const result = await bridge.image2prompt(image);
    console.log(result);

    if (opts.output) {
      const fs = await import("fs/promises");
      await fs.writeFile(opts.output, result, "utf-8");
      console.error(`Result saved to ${opts.output}`);
    }
  });

program.parse();
