import { shellService } from './shell.service.js';
import { ImageMetadata, ImageOperationResult } from '../models/types.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';

/**
 * Service graphisme (ImageMagick wrapper)
 */
export class ImageService {
  /**
   * Vérifie si ImageMagick est disponible
   */
  async isAvailable(): Promise<boolean> {
    return await shellService.commandExists('convert');
  }

  /**
   * Récupère les métadonnées d'une image
   */
  async getImageInfo(path: string): Promise<ImageMetadata> {
    const result = await shellService.execSimple('identify', [
      '-format',
      '%w|%h|%m|%b',
      path,
    ]);

    const [width, height, format, sizeStr] = result.split('|');

    const parseSize = (str: string): number => {
      const match = str.match(/([0-9.]+)([KMGT]?B)/);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const unit = match[2];
      const multipliers: Record<string, number> = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
      };
      return value * (multipliers[unit] || 1);
    };

    return {
      width: parseInt(width, 10),
      height: parseInt(height, 10),
      format: format.toLowerCase(),
      size: parseSize(sizeStr),
    };
  }

  /**
   * Redimensionne une image
   */
  async resizeImage(
    input: string,
    output: string,
    width: number,
    height: number,
    keepAspectRatio = true
  ): Promise<ImageOperationResult> {
    const inputInfo = await this.getImageInfo(input);

    const resize = keepAspectRatio
      ? `${width}x${height}`
      : `${width}x${height}!`;

    await shellService.execSimple('convert', [
      input,
      '-resize',
      resize,
      output,
    ]);

    const outputInfo = await this.getImageInfo(output);

    logger.info(`Image redimensionnée : ${input} -> ${output}`);

    return {
      success: true,
      outputPath: output,
      inputSize: inputInfo.size,
      outputSize: outputInfo.size,
      dimensions: {
        width: outputInfo.width,
        height: outputInfo.height,
      },
    };
  }

  /**
   * Convertit le format d'une image
   */
  async convertFormat(
    input: string,
    output: string,
    format: string
  ): Promise<ImageOperationResult> {
    const inputInfo = await this.getImageInfo(input);

    await shellService.execSimple('convert', [input, `${format}:${output}`]);

    const outputInfo = await this.getImageInfo(output);

    logger.info(`Format converti : ${input} -> ${output} (${format})`);

    return {
      success: true,
      outputPath: output,
      inputSize: inputInfo.size,
      outputSize: outputInfo.size,
    };
  }

  /**
   * Compose plusieurs images
   */
  async composeImages(
    inputs: string[],
    output: string,
    layout: 'horizontal' | 'vertical' | 'grid'
  ): Promise<ImageOperationResult> {
    const appendMode = layout === 'horizontal' ? '+append' : '-append';

    const args = [...inputs, appendMode, output];

    await shellService.execSimple('convert', args);

    const outputInfo = await this.getImageInfo(output);

    logger.info(`Images composées : ${inputs.length} -> ${output}`);

    return {
      success: true,
      outputPath: output,
      inputSize: 0, // Sum would be needed
      outputSize: outputInfo.size,
    };
  }

  /**
   * Génère une miniature
   */
  async generateThumbnail(
    input: string,
    output: string,
    size = 200
  ): Promise<ImageOperationResult> {
    return await this.resizeImage(input, output, size, size, true);
  }

  /**
   * Optimise une image
   */
  async optimizeImage(
    input: string,
    output: string,
    quality = 85
  ): Promise<ImageOperationResult> {
    const inputInfo = await this.getImageInfo(input);

    await shellService.execSimple('convert', [
      input,
      '-quality',
      quality.toString(),
      output,
    ]);

    const outputInfo = await this.getImageInfo(output);
    const reduction = ((inputInfo.size - outputInfo.size) / inputInfo.size) * 100;

    logger.info(`Image optimisée : ${input} -> ${output} (-${reduction.toFixed(1)}%)`);

    return {
      success: true,
      outputPath: output,
      inputSize: inputInfo.size,
      outputSize: outputInfo.size,
      reduction,
    };
  }
}

export const imageService = new ImageService();
