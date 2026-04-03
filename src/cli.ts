#!/usr/bin/env node

import { Command } from "commander";
import { VisionBridge } from "./index.js";

const program = new Command();

program
  .name("vision-bridge")
  .description(
    "Use GLM-4.6V-Flash to convert images/video to text for non-vision AI models",
  )
  .version("0.2.0");

program
  .command("image")
  .description("Analyze an image")
  .argument("<image>", "Local file path or URL of the image")
  .option("-p, --prompt <text>", "Custom prompt")
  .option("-k, --api-key <key>", "ZhipuAI API key (or set ZHIPUAI_API_KEY)")
  .option("-t, --thinking", "Enable thinking mode")
  .option("-s, --stream", "Stream output")
  .option("-o, --output <file>", "Save result to file")
  .action(async (image, opts) => {
    const bridge = new VisionBridge({ apiKey: opts.apiKey });
    try {
      if (opts.stream) {
        let result = "";
        for await (const chunk of bridge.analyzeStream(image, opts.prompt, opts.thinking)) {
          process.stdout.write(chunk);
          result += chunk;
        }
        process.stdout.write("\n");
        if (opts.output) {
          const fs = await import("fs/promises");
          await fs.writeFile(opts.output, result, "utf-8");
          console.error(`\nResult saved to ${opts.output}`);
        }
      } else {
        const result = await bridge.analyze(image, opts.prompt, opts.thinking);
        console.log(result);
        if (opts.output) {
          const fs = await import("fs/promises");
          await fs.writeFile(opts.output, result, "utf-8");
          console.error(`Result saved to ${opts.output}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("401")) {
        console.error("Error: API key required. Set ZHIPUAI_API_KEY environment variable.");
      } else {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
      }
      process.exit(1);
    }
  });

program
  .command("video")
  .description("Analyze a video")
  .argument("<video>", "Local file path or URL of the video")
  .option("-p, --prompt <text>", "Custom prompt")
  .option("-k, --api-key <key>", "ZhipuAI API key (or set ZHIPUAI_API_KEY)")
  .option("-t, --thinking", "Enable thinking mode")
  .option("-s, --stream", "Stream output")
  .option("-o, --output <file>", "Save result to file")
  .action(async (video, opts) => {
    const bridge = new VisionBridge({ apiKey: opts.apiKey });
    try {
      if (opts.stream) {
        let result = "";
        for await (const chunk of bridge.analyzeVideoStream(video, opts.prompt, opts.thinking)) {
          process.stdout.write(chunk);
          result += chunk;
        }
        process.stdout.write("\n");
        if (opts.output) {
          const fs = await import("fs/promises");
          await fs.writeFile(opts.output, result, "utf-8");
          console.error(`\nResult saved to ${opts.output}`);
        }
      } else {
        const result = await bridge.analyzeVideo(video, opts.prompt, opts.thinking);
        console.log(result);
        if (opts.output) {
          const fs = await import("fs/promises");
          await fs.writeFile(opts.output, result, "utf-8");
          console.error(`Result saved to ${opts.output}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("401")) {
        console.error("Error: API key required. Set ZHIPUAI_API_KEY environment variable.");
      } else {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
      }
      process.exit(1);
    }
  });

program.parse();
