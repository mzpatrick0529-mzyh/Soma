import fs from "fs";
import path from "path";
import exifr from "exifr";
import { parseFile as parseAudio } from "music-metadata";
import ffprobeStatic from "ffprobe-static";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type MediaSummary = {
  title: string;
  content: string; // 用于 RAG 的可读文本摘要
  metadata: any;   // 结构化元数据
};

function humanSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${units[i]}`;
}

export async function summarizeImage(filePath: string): Promise<MediaSummary> {
  const title = path.basename(filePath);
  const stat = fs.statSync(filePath);
  let exif: any = {};
  try { exif = await exifr.parse(filePath); } catch {}

  // 可选 OCR
  let ocrText = "";
  if (String(process.env.TESSERACT_OCR || "").toLowerCase() === "true") {
    try {
      // 动态导入，避免默认开销
      const tesseract = await import("tesseract.js");
      const { data } = await tesseract.recognize(filePath, "chi_sim+eng");
      ocrText = (data?.text || "").trim();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[media] OCR failed:", e);
    }
  }

  const taken = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate || null;
  const camera = [exif?.Make, exif?.Model].filter(Boolean).join(" ") || null;
  const gps = exif?.latitude && exif?.longitude ? `${exif.latitude}, ${exif.longitude}` : null;

  const lines = [
    `Image: ${title}`,
    `Path: ${filePath}`,
    `Size: ${humanSize(stat.size)}`,
    taken ? `Taken: ${taken}` : undefined,
    camera ? `Camera: ${camera}` : undefined,
    gps ? `GPS: ${gps}` : undefined,
    ocrText ? `OCR: ${ocrText.slice(0, 2000)}` : undefined,
  ].filter(Boolean) as string[];

  return { title, content: lines.join("\n"), metadata: { exif, ocr: ocrText || undefined, path: filePath, size: stat.size } };
}

export async function summarizeAudioFile(filePath: string): Promise<MediaSummary> {
  const title = path.basename(filePath);
  const stat = fs.statSync(filePath);
  let meta: any = {};
  try { meta = await parseAudio(filePath); } catch {}
  const common = meta.common || {};
  const format = meta.format || {};

  const lines = [
    `Audio: ${title}`,
    `Path: ${filePath}`,
    `Size: ${humanSize(stat.size)}`,
    format.duration ? `Duration: ${Math.round(format.duration)}s` : undefined,
    format.bitrate ? `Bitrate: ${(format.bitrate / 1000).toFixed(0)} kbps` : undefined,
    common.artist ? `Artist: ${common.artist}` : undefined,
    common.album ? `Album: ${common.album}` : undefined,
    common.title ? `Track: ${common.title}` : undefined,
  ].filter(Boolean) as string[];

  return { title, content: lines.join("\n"), metadata: { audio: meta, path: filePath, size: stat.size } };
}

export async function summarizeVideoFile(filePath: string): Promise<MediaSummary> {
  const title = path.basename(filePath);
  const stat = fs.statSync(filePath);
  let probe: any = null;
  try {
    const bin = ffprobeStatic.path;
    const args = [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height:format=duration",
      "-print-format", "json",
      filePath,
    ];
    const { stdout } = await execFileAsync(bin as string, args);
    probe = JSON.parse(stdout);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[media] ffprobe failed:", e);
  }
  const stream = probe?.streams?.[0] || {};
  const duration = probe?.format?.duration ? `${Math.round(Number(probe.format.duration))}s` : null;
  const lines = [
    `Video: ${title}`,
    `Path: ${filePath}`,
    `Size: ${humanSize(stat.size)}`,
    stream.codec_name ? `Codec: ${stream.codec_name}` : undefined,
    stream.width && stream.height ? `Resolution: ${stream.width}x${stream.height}` : undefined,
    duration ? `Duration: ${duration}` : undefined,
  ].filter(Boolean) as string[];

  return { title, content: lines.join("\n"), metadata: { ffprobe: probe || undefined, path: filePath, size: stat.size } };
}

export async function summarizeMediaByPath(filePath: string): Promise<MediaSummary> {
  const lower = filePath.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|bmp|heic)$/i.test(lower)) return summarizeImage(filePath);
  if (/\.(mp3|m4a|aac|wav|flac|ogg)$/i.test(lower)) return summarizeAudioFile(filePath);
  if (/\.(mp4|mov|avi|mkv|webm|hevc)$/i.test(lower)) return summarizeVideoFile(filePath);
  // fallback: generic file summary
  const stat = fs.statSync(filePath);
  return {
    title: path.basename(filePath),
    content: `File: ${path.basename(filePath)}\nPath: ${filePath}\nSize: ${humanSize(stat.size)}`,
    metadata: { path: filePath, size: stat.size },
  };
}