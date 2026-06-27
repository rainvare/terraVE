// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TerraVE — Inteligencia Territorial Post-Terremoto',
  description:
    'Plataforma ciudadana para mapear y clasificar daño estructural en Venezuela. Memoria colectiva + Visión computacional.',
  keywords: ['Venezuela', 'terremoto', 'daño estructural', 'mapa', 'reconstrucción'],
  openGraph: {
    title: 'TerraVE',
    description: '¿Qué existía aquí? ¿Qué quedó en pie?',
    locale: 'es_VE',
    type: 'website',
  },
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
        <link
          rel="stylesheet"
          href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css"
        />
      </head>
      <body className="bg-[#0D1B2A] text-white font-body antialiased">
        {children}
      </body>
    </html>
  )
}
