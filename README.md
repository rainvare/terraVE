# 🌍 TerraVE
> Inteligencia territorial post-terremoto | Build 4 Venezuela 2026

Plataforma web que combina **memoria ciudadana** con **visión computacional** para responder:
- **¿Qué existía aquí?** → Levantamiento ciudadano de infraestructura perdida
- **¿Qué quedó en pie?** → Clasificación automática de daño estructural por foto

---

## 🚀 Setup en 5 pasos

### 1. Clona e instala

```bash
git clone https://github.com/TU_USUARIO/terraVE.git
cd terraVE
npm install
```

### 2. Configura variables de entorno

```bash
cp .env.example .env.local
# Edita .env.local con tus tokens (ver instrucciones abajo)
```

### 3. Configura Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** → New Query
4. Pega y ejecuta el contenido de `supabase-schema.sql`
5. Copia la URL y Anon Key en `.env.local`

### 4. Configura Mapbox

1. Crea cuenta en [mapbox.com](https://mapbox.com)
2. Ve a Account → Tokens → Create a token
3. Copia el token `pk.eyJ1...` en `.env.local`

### 5. Configura Hugging Face

1. Crea cuenta en [huggingface.co](https://huggingface.co)
2. Ve a Settings → Access Tokens → New token (Read)
3. Copia el token `hf_...` en `.env.local`

### Levanta en local

```bash
npm run dev
# → http://localhost:3000
```

---

## 📁 Estructura

```
terraVE/
├── app/
│   ├── page.tsx              ← Landing
│   ├── map/page.tsx          ← Mapa principal
│   ├── report/page.tsx       ← Formulario ciudadano
│   ├── classify/page.tsx     ← Upload foto + IA
│   └── api/
│       ├── report/route.ts
│       ├── classify/route.ts
│       └── lugares/route.ts
├── components/
│   ├── Map.tsx               ← Mapbox GL JS
│   ├── ReportForm.tsx
│   ├── ClassifyForm.tsx
│   ├── PlaceCard.tsx
│   └── StatsCounter.tsx
├── lib/
│   ├── supabase.ts
│   ├── classify.ts           ← HF Inference API
│   └── geo.ts
├── types/index.ts
├── supabase-schema.sql       ← Ejecutar en Supabase
└── .env.example
```

---

## 🚢 Deploy en Vercel

```bash
# 1. Sube a GitHub
git add . && git commit -m "TerraVE v1.0"
git push origin main

# 2. En vercel.com → Import → selecciona el repo
# 3. Agrega las 4 variables de entorno en Settings → Environment Variables
# 4. Deploy automático ✅
```

---

## 🏗️ Stack (100% gratuito)

| Capa | Tech | Plan |
|------|------|------|
| Frontend | Next.js 14 | — |
| Deploy | Vercel | Free |
| DB | Supabase PostgreSQL + PostGIS | 500MB |
| Storage | Supabase Storage | 1GB |
| Mapa | Mapbox GL JS | 50k loads/mes |
| IA | HF Inference API (ViT) | Free tier |
| Auth | Supabase Auth | Free |

---

*Build 4 Venezuela Hackathon 2026 — TerraVE v1.0*
