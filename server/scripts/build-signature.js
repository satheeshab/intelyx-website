/**
 * Regenerates /email-signature/signature.html and signature.txt from src/signature.js,
 * so the downloadable signature and the acknowledgement email always share one block.
 * Run from the repository root:  npm run signature
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signatureHtml, signatureText } from '../src/signature.js';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'email-signature');

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Intelyx email signature</title>
</head>
<body style="margin:0; padding:24px; background:#ffffff;">
  <!--
    HOW TO USE
    1. Replace [Full Name] and [Designation] below with your details.
    2. Open this file in a browser, select everything (Ctrl/Cmd + A), copy, and paste
       into your mail client's signature editor. See README.md → "Email signature".
    Everything below uses inline styles only, so it survives copy and paste.
  -->
${signatureHtml()}
</body>
</html>
`;

writeFileSync(join(outDir, 'signature.html'), page);
writeFileSync(join(outDir, 'signature.txt'), signatureText() + '\n');
console.log('Wrote signature.html and signature.txt to', outDir);
