import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const trackedSourceFiles = [
  'app/(tabs)/friends.tsx',
  'app/(tabs)/profile.tsx',
  'app/_layout.tsx',
  'components/FriendSearch.tsx',
  'global.css',
  'lib/smsInvite.ts',
  'lib/theme.ts',
  'tailwind.config.js',
];

describe('public release metadata', () => {
  it('contains no inherited product references or placeholder store listings', () => {
    const source = trackedSourceFiles
      .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
      .join('\n');

    const inheritedDomain = ['loop', 'app'].join('.');
    const inheritedEmail = ['feedback', inheritedDomain].join('@');
    const priorDesignName = ['Ra', 'ya'].join('');
    const appStoreHost = ['apps', 'apple', 'com'].join('.');

    expect(source).not.toContain(inheritedDomain);
    expect(source).not.toContain(inheritedEmail);
    expect(source).not.toMatch(new RegExp(priorDesignName, 'i'));
    expect(source).not.toContain(appStoreHost);
    expect(source).not.toMatch(new RegExp(`id(?:${'0'.repeat(5)}|${['123', '456', '789'].join('')})`));
  });

  it('uses private application metadata and a non-generic package name', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

    expect(packageJson.private).toBe(true);
    expect(packageJson.name).toBe('@miscmich/loop-app');
  });

  it('ships the font license and keeps the font non-executable', () => {
    const fontPath = path.join(root, 'assets/fonts/SpaceMono-Regular.ttf');
    const licensePath = path.join(root, 'assets/fonts/OFL.txt');

    expect(fs.readFileSync(licensePath, 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(fs.statSync(fontPath).mode & 0o111).toBe(0);
  });

  it('only references design-system files that exist in this repository', () => {
    const designSystem = fs.readFileSync(path.join(root, 'DESIGN_SYSTEM.md'), 'utf8');

    expect(designSystem).not.toContain('design-system/loop-2026/MASTER.md');
    expect(designSystem).not.toContain('lib/widget-sync.ts');
    expect(fs.existsSync(path.join(root, 'lib/widgetSync.ts'))).toBe(true);
  });
});
