import { copyFile, mkdir } from 'node:fs/promises';

// Pages serves these entry points directly, including on refresh/deep links.
for (const route of ['workbench', 'cave', 'damage-atlas', 'admin']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
