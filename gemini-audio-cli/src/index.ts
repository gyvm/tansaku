#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { trimAudio, cleanupFile } from './audio.js';
import { GeminiProcessor, DEFAULT_MODEL } from './gemini.js';

// Load environment variables from .env file
dotenv.config();

const program = new Command();

// Estimated costs for Gemini 1.5 Flash (USD per 1M tokens)
// These are rough estimates for context window <= 128k
const COST_CONFIG = {
  inputPer1M: 0.075,
  outputPer1M: 0.30
};

program
  .name('gemini-audio')
  .description('Trim audio to 90s and summarize/predict using Gemini API')
  .version('1.0.0')
  .argument('<file>', 'path to the audio file')
  .option('-m, --model <model>', 'Gemini model to use', DEFAULT_MODEL)
  .option('-s, --stats', 'Show token usage and estimated cost', false)
  .action(async (filePath, options) => {
    const apiKey = process.env.GEMINI_AUDIO_CLI_API_KEY;

    if (!apiKey) {
      console.error(chalk.red('Error: GEMINI_AUDIO_CLI_API_KEY environment variable is not set.'));
      console.error('Please set it in your environment or a .env file.');
      process.exit(1);
    }

    const inputPath = path.resolve(filePath);
    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(`Error: File not found at ${inputPath}`));
      process.exit(1);
    }

    console.log(chalk.blue(`Processing file: ${inputPath}`));
    console.log(chalk.gray('Trimming audio to first 90 seconds...'));

    let trimmedPath: string | null = null;

    try {
      trimmedPath = await trimAudio(inputPath);
      console.log(chalk.green('Audio trimmed successfully.'));

      console.log(chalk.gray(`Sending to Gemini (${options.model})...`));

      const processor = new GeminiProcessor(apiKey, options.model);
      const result = await processor.processAudio(trimmedPath);

      console.log(chalk.bold('\n--- Response ---\n'));
      console.log(result.text);
      console.log(chalk.bold('\n----------------\n'));

      if (options.stats && result.usageMetadata) {
        const { promptTokenCount, candidatesTokenCount, totalTokenCount } = result.usageMetadata;

        // Calculate costs
        const inputCost = (promptTokenCount / 1_000_000) * COST_CONFIG.inputPer1M;
        const outputCost = (candidatesTokenCount / 1_000_000) * COST_CONFIG.outputPer1M;
        const totalCost = inputCost + outputCost;

        console.log(chalk.yellow('--- Stats ---'));
        console.log(`Prompt Tokens:    ${promptTokenCount}`);
        console.log(`Response Tokens:  ${candidatesTokenCount}`);
        console.log(`Total Tokens:     ${totalTokenCount}`);
        console.log(`Estimated Cost:   $${totalCost.toFixed(8)} (USD)`);
        console.log(chalk.gray('* Cost is an estimate based on Gemini 1.5 Flash pricing.'));
      }

    } catch (error: any) {
      console.error(chalk.red('An error occurred:'), error.message || error);
    } finally {
      if (trimmedPath) {
        cleanupFile(trimmedPath);
      }
    }
  });

program.parse();
