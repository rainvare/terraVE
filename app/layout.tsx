// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TerraVE — Inteligencia Territorial Post-Terremoto',
  description:
    'Plataforma ciudadana para mapear y clasificar daño estructural en Venezuela.',
  keywords: ['Venezuela', 'terremoto', 'daño estructural', 'mapa', 'reconstrucción'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Leaflet CSS — sin tarjeta, sin token */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-[#0D1B2A] text-white font-body antialiased">
        {children}
      </body>
    </html>
  )
}
