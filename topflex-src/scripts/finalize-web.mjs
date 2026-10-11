import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, '..');
const publicDirectory = path.join(appDirectory, 'public');
const exportDirectory = path.join(appDirectory, 'dist', 'public');
const indexPath = path.join(exportDirectory, 'index.html');

await cp(publicDirectory, exportDirectory, { recursive: true, force: true });

let html = await readFile(indexPath, 'utf8');
const viewport = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
if (viewport && !viewport[0].includes('viewport-fit=cover')) {
  const updatedViewport = viewport[0].replace(/content=["']([^"']*)["']/i, (_match, content) => `content="${content}, viewport-fit=cover"`);
  html = html.replace(viewport[0], updatedViewport);
}

const headTags = [
  '<link rel="manifest" href="./manifest.json">',
  '<link rel="apple-touch-icon" href="./icons/topflex-192.png">',
  '<meta name="theme-color" content="#063a32">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="TopFlex">',
];
const missingTags = headTags.filter((tag) => !html.includes(tag));
if (missingTags.length) {
  if (!/<\/head>/i.test(html)) throw new Error('Could not add TopFlex PWA metadata: index.html has no closing head tag.');
  html = html.replace(/<\/head>/i, `${missingTags.join('\n')}\n</head>`);
}

await writeFile(indexPath, html);
console.info('TopFlex PWA manifest and install metadata added to the web export.');
