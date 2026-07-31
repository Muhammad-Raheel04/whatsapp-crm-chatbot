/**
 * convert.js
 * ---------------------------------------------------------------------------
 * Converts any audio file (mp3, m4a, aac, wav, etc.) into a properly encoded
 * Opus/OGG file — the format required for WhatsApp voice notes to render as
 * a native voice bubble instead of a generic file attachment.
 *
 * Uses a bundled ffmpeg binary (via ffmpeg-static), so no system-wide ffmpeg
 * installation is required — this avoids the common Windows install/PATH
 * issues (winget failures, missing admin rights, etc.).
 *
 * Usage:
 *   node convert.js <input-file> <output-file>
 *
 * Example:
 *   node convert.js "./raw/hello.m4a" "./audio/hello.ogg"
 *
 * Output encoding:
 *   - Codec: libopus (required by WhatsApp for native voice-note rendering)
 *   - Channels: mono (1) — standard for voice, smaller file size
 *   - Sample rate: 16kHz — sufficient for speech, matches WhatsApp's own encoding
 *   - Bitrate: 32kbps — good voice quality at small file size
 * ---------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

const [, , inputArg, outputArg] = process.argv;

function printUsageAndExit(message) {
  if (message) console.error(`\u274c ${message}\n`);
  console.error('Usage: node convert.js <input-file> <output-file>');
  console.error('Example: node convert.js "./raw/hello.m4a" "./audio/hello.ogg"');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate arguments up front, with specific error messages — a script that
// silently does nothing on bad input is much harder to debug than one that
// fails loudly and says exactly what's wrong.
// ---------------------------------------------------------------------------
if (!inputArg || !outputArg) {
  printUsageAndExit('Missing input or output path.');
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);

if (!fs.existsSync(inputPath)) {
  printUsageAndExit(`Input file not found: ${inputPath}`);
}

if (path.extname(outputPath).toLowerCase() !== '.ogg') {
  printUsageAndExit(`Output file must end in .ogg (got: ${path.extname(outputPath) || '[no extension]'})`);
}

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  console.log(`Creating output directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Run the conversion
// ---------------------------------------------------------------------------
console.log(`Converting:\n  in:  ${inputPath}\n  out: ${outputPath}\n`);

const startTime = Date.now();

ffmpeg(inputPath)
  .audioCodec('libopus')
  .audioChannels(1)
  .audioFrequency(16000)
  .audioBitrate('32k')
  .format('ogg')
  .on('start', (commandLine) => {
    console.log(`Running ffmpeg...`);
  })
  .on('error', (err) => {
    console.error(`\n\u274c Conversion failed: ${err.message}`);
    console.error(
      '\nCommon causes:\n' +
      '  - The input file is corrupted or not a real audio file\n' +
      '  - The input file format is unsupported (try converting to .wav first as a fallback)\n'
    );
    process.exit(1);
  })
  .on('end', () => {
    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
    const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`\u2705 Done in ${seconds}s \u2014 saved to ${outputPath} (${sizeKb} KB)`);
    console.log(`\nVerify it's a real Ogg file (optional):`);
    console.log(`  Windows:  Format-Hex -Path "${outputArg}" | Select-Object -First 1`);
    console.log(`  Should start with: 4F 67 67 53 (that's "OggS" in ASCII)`);
  })
  .save(outputPath);