import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lagos Life 3D — Open World Roleplay',
    short_name: 'LagosLife3D',
    description:
      'Next-Gen Lagos 3D Open World Roleplay Simulator with realistic vehicles, banks, dynamic airport, and interactive smartphone.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090D16',
    theme_color: '#090D16',
    orientation: 'any',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
