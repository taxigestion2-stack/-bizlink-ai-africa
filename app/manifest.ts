import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BizLink AI Africa',
    short_name: 'BizLink',
    description: 'Gérez votre commerce, simplement.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#08090D',
    theme_color: '#08090D',
    orientation: 'portrait',
    lang: 'fr',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
