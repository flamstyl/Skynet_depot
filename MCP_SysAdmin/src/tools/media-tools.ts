/**
 * 🎨 Outils graphiques et multimédia
 * ImageMagick, FFmpeg, outils de terminal, ASCII art
 */

import { z } from 'zod';
import { executeCommand, formatOutput } from '../utils.js';

// ==================== IMAGEMAGICK ====================

export const imageConvertSchema = z.object({
  input: z.string().describe('Fichier image source'),
  output: z.string().describe('Fichier image de sortie'),
  format: z.string().optional().describe('Format de sortie (jpg, png, webp, etc.)'),
  quality: z.number().optional().describe('Qualité (1-100 pour JPEG)'),
});

export async function imageConvert(args: z.infer<typeof imageConvertSchema>) {
  const { input, output, format, quality } = args;

  let cmd = `convert ${input}`;
  if (quality) cmd += ` -quality ${quality}`;
  cmd += ` ${output}`;

  const result = await executeCommand(cmd, { timeout: 120000 });
  return formatOutput(result);
}

export const imageResizeSchema = z.object({
  input: z.string().describe('Fichier image source'),
  output: z.string().describe('Fichier image de sortie'),
  width: z.number().optional().describe('Largeur en pixels'),
  height: z.number().optional().describe('Hauteur en pixels'),
  percentage: z.number().optional().describe('Pourcentage de redimensionnement (ex: 50)'),
  maintainAspect: z.boolean().optional().describe('Maintenir le ratio (défaut: true)'),
});

export async function imageResize(args: z.infer<typeof imageResizeSchema>) {
  const { input, output, width, height, percentage, maintainAspect = true } = args;

  let size = '';
  if (percentage) {
    size = `${percentage}%`;
  } else if (width && height) {
    size = maintainAspect ? `${width}x${height}` : `${width}x${height}!`;
  } else if (width) {
    size = `${width}`;
  } else if (height) {
    size = `x${height}`;
  }

  const result = await executeCommand(`convert ${input} -resize ${size} ${output}`, {
    timeout: 120000,
  });
  return formatOutput(result);
}

export const imageCropSchema = z.object({
  input: z.string().describe('Fichier image source'),
  output: z.string().describe('Fichier image de sortie'),
  width: z.number().describe('Largeur du crop'),
  height: z.number().describe('Hauteur du crop'),
  x: z.number().optional().describe('Position X (défaut: 0)'),
  y: z.number().optional().describe('Position Y (défaut: 0)'),
});

export async function imageCrop(args: z.infer<typeof imageCropSchema>) {
  const { input, output, width, height, x = 0, y = 0 } = args;

  const result = await executeCommand(
    `convert ${input} -crop ${width}x${height}+${x}+${y} ${output}`,
    { timeout: 120000 }
  );
  return formatOutput(result);
}

export const imageRotateSchema = z.object({
  input: z.string().describe('Fichier image source'),
  output: z.string().describe('Fichier image de sortie'),
  degrees: z.number().describe('Degrés de rotation'),
});

export async function imageRotate(args: z.infer<typeof imageRotateSchema>) {
  const { input, output, degrees } = args;

  const result = await executeCommand(`convert ${input} -rotate ${degrees} ${output}`, {
    timeout: 120000,
  });
  return formatOutput(result);
}

export const imageEffectSchema = z.object({
  input: z.string().describe('Fichier image source'),
  output: z.string().describe('Fichier image de sortie'),
  effect: z.enum(['blur', 'sharpen', 'grayscale', 'sepia', 'negate']).describe('Effet à appliquer'),
  intensity: z.number().optional().describe('Intensité de l\'effet (0-10)'),
});

export async function imageEffect(args: z.infer<typeof imageEffectSchema>) {
  const { input, output, effect, intensity = 5 } = args;

  let effectCmd = '';
  switch (effect) {
    case 'blur':
      effectCmd = `-blur 0x${intensity}`;
      break;
    case 'sharpen':
      effectCmd = `-sharpen 0x${intensity}`;
      break;
    case 'grayscale':
      effectCmd = '-colorspace Gray';
      break;
    case 'sepia':
      effectCmd = '-sepia-tone 80%';
      break;
    case 'negate':
      effectCmd = '-negate';
      break;
  }

  const result = await executeCommand(`convert ${input} ${effectCmd} ${output}`, {
    timeout: 120000,
  });
  return formatOutput(result);
}

export const imageInfoSchema = z.object({
  file: z.string().describe('Fichier image à analyser'),
});

export async function imageInfo(args: z.infer<typeof imageInfoSchema>) {
  const result = await executeCommand(`identify -verbose ${args.file}`);
  return formatOutput(result);
}

// ==================== FFMPEG ====================

export const videoConvertSchema = z.object({
  input: z.string().describe('Fichier vidéo source'),
  output: z.string().describe('Fichier vidéo de sortie'),
  codec: z.string().optional().describe('Codec vidéo (libx264, libx265, etc.)'),
  quality: z.string().optional().describe('Qualité CRF (0-51, défaut: 23)'),
});

export async function videoConvert(args: z.infer<typeof videoConvertSchema>) {
  const { input, output, codec = 'libx264', quality = '23' } = args;

  const result = await executeCommand(
    `ffmpeg -i ${input} -c:v ${codec} -crf ${quality} -c:a copy ${output} -y`,
    { timeout: 600000 }
  );
  return formatOutput(result);
}

export const extractAudioSchema = z.object({
  input: z.string().describe('Fichier vidéo source'),
  output: z.string().describe('Fichier audio de sortie'),
  format: z.enum(['mp3', 'aac', 'wav', 'flac']).optional().describe('Format audio'),
});

export async function extractAudio(args: z.infer<typeof extractAudioSchema>) {
  const { input, output, format = 'mp3' } = args;

  const result = await executeCommand(`ffmpeg -i ${input} -vn -acodec ${format} ${output} -y`, {
    timeout: 300000,
  });
  return formatOutput(result);
}

export const videoResizeSchema = z.object({
  input: z.string().describe('Fichier vidéo source'),
  output: z.string().describe('Fichier vidéo de sortie'),
  width: z.number().describe('Largeur en pixels'),
  height: z.number().describe('Hauteur en pixels'),
});

export async function videoResize(args: z.infer<typeof videoResizeSchema>) {
  const { input, output, width, height } = args;

  const result = await executeCommand(
    `ffmpeg -i ${input} -vf scale=${width}:${height} ${output} -y`,
    { timeout: 600000 }
  );
  return formatOutput(result);
}

export const videoTrimSchema = z.object({
  input: z.string().describe('Fichier vidéo source'),
  output: z.string().describe('Fichier vidéo de sortie'),
  start: z.string().describe('Temps de début (HH:MM:SS)'),
  duration: z.string().describe('Durée (HH:MM:SS)'),
});

export async function videoTrim(args: z.infer<typeof videoTrimSchema>) {
  const { input, output, start, duration } = args;

  const result = await executeCommand(
    `ffmpeg -i ${input} -ss ${start} -t ${duration} -c copy ${output} -y`,
    { timeout: 300000 }
  );
  return formatOutput(result);
}

export const videoInfoSchema = z.object({
  file: z.string().describe('Fichier vidéo à analyser'),
});

export async function videoInfo(args: z.infer<typeof videoInfoSchema>) {
  const result = await executeCommand(`ffprobe -v quiet -print_format json -show_format -show_streams ${args.file}`);
  return formatOutput(result);
}

// ==================== OUTILS TERMINAL ====================

export const figletSchema = z.object({
  text: z.string().describe('Texte à convertir en ASCII art'),
  font: z.string().optional().describe('Police (standard, banner, etc.)'),
});

export async function figlet(args: z.infer<typeof figletSchema>) {
  const { text, font = 'standard' } = args;

  const result = await executeCommand(`figlet -f ${font} "${text}"`);
  return formatOutput(result);
}

export const qrcodeSchema = z.object({
  text: z.string().describe('Texte à encoder en QR code'),
  output: z.string().optional().describe('Fichier de sortie (optionnel, sinon terminal)'),
});

export async function qrcode(args: z.infer<typeof qrcodeSchema>) {
  const { text, output } = args;

  const cmd = output
    ? `qrencode -o ${output} "${text}"`
    : `qrencode -t ANSIUTF8 "${text}"`;

  const result = await executeCommand(cmd);
  return formatOutput(result);
}

// ==================== INSTALLATION OUTILS ====================

export async function installImageMagick() {
  const result = await executeCommand('sudo apt-get update && sudo apt-get install -y imagemagick', {
    timeout: 300000,
  });
  return formatOutput(result);
}

export async function installFfmpeg() {
  const result = await executeCommand('sudo apt-get update && sudo apt-get install -y ffmpeg', {
    timeout: 300000,
  });
  return formatOutput(result);
}

export async function installMediaTools() {
  const packages = [
    'imagemagick',
    'ffmpeg',
    'figlet',
    'qrencode',
    'graphicsmagick',
  ];

  const result = await executeCommand(
    `sudo apt-get update && sudo apt-get install -y ${packages.join(' ')}`,
    { timeout: 300000 }
  );
  return formatOutput(result);
}
