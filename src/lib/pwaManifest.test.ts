import { describe, expect, it } from 'vitest';
import { pwaManifest } from '@/lib/pwaManifest';

describe('pwaManifest', () => {
  it('describes an installable standalone app with required icons', () => {
    expect(pwaManifest.name).toBe('tdbook');
    expect(pwaManifest.short_name).toBe('tdbook');
    expect(pwaManifest.theme_color).toBe('#3D5A80');
    expect(pwaManifest.background_color).toBe('#3D5A80');
    expect(pwaManifest.display).toBe('standalone');
    expect(pwaManifest.start_url).toBe('/');
    expect(pwaManifest.lang).toBe('en');
    expect(pwaManifest.description.length).toBeGreaterThan(0);

    const icons = pwaManifest.icons;
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/icons/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/icons/pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/icons/pwa-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }),
      ]),
    );
    expect(icons).toHaveLength(3);
  });
});
