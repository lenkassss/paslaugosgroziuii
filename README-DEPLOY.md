# Paslaugos Groziui — Preview Deploy

This package is prepared for a Vercel preview deployment using TanStack Start + Nitro.

## Fastest deployment

1. Create a GitHub repository.
2. Upload the project files (the repository must contain `package.json` in its root).
3. Import the repository into Vercel.
4. Vercel should detect TanStack Start automatically.
5. Add required environment variables in Vercel Project Settings if the app needs backend services.

The project uses the standard TanStack Start Vercel/Nitro deployment setup.

## Important

`.env` is intentionally not included. Do not commit real API keys or secrets. Use Vercel Environment Variables for production/preview secrets.
