This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
Open http://localhost:3000 with your browser to see the result.

You can start editing the page by modifying app/page.tsx. The page auto-updates as you edit the file.

Cloudflare Deployment
This project is configured to be deployed on Cloudflare Pages using the @cloudflare/next-on-pages adapter.

Local Build Preview
To build the application for the Cloudflare runtime locally, use the specific script defined in package.json:

Bash

npm run pages:build
Deploying to Cloudflare Pages
Connect your repository to the Cloudflare Dashboard.

In the Build settings, configure the following:

Framework preset: Next.js (Static HTML Export) or select "None" if using the custom build command below

Build command: npx @cloudflare/next-on-pages (or npm run pages:build)

Build output directory: .vercel/output/static (standard output for the adapter)

For more details, check out the Next.js on Cloudflare Pages documentation.

Learn More
To learn more about Next.js, take a look at the following resources:

Next.js Documentation - learn about Next.js features and API.

Learn Next.js - an interactive Next.js tutorial.

You can check out the Next.js GitHub repository - your feedback and contributions are welcome!