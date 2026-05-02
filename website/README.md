This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Catalogue : ajouter / changer les photos produits

1. Place le fichier image sous **`public/`** (ex. `public/images/products/mon-produit.jpg`). Les URLs du site commencent toujours par `/`, donc un chemin type **`/images/products/mon-produit.jpg`** est servi depuis `public/images/products/`.
2. Dans **`src/data/products.json`**, sur chaque entrée de `products`, mets ce chemin dans le champ **`imagePath`** (voir les exemples existants comme `"/images/products/axion-pad-standard.jpg"`).
3. Redémarre ou rafraîchis le dev server si besoin. Pour plusieurs visuels futurs, le modèle TypeScript prévoit aussi un tableau **`images`** sur `Product` côté API générique ; le catalogue embarqué utilise aujourd’hui surtout **`imagePath`**.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
