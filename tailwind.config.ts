// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  // Garante que o Tailwind analise o código dentro da pasta 'src'
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores da Identidade Rentou definidas para uso fácil: text-rentou-primary
        'rentou-primary': '#1D4ED8', // Azul (ideal para botões e links principais)
        'rentou-secondary': '#FBBF24', // Amarelo (ideal para destaque/alerta)
      },
      // Aqui você pode estender outras propriedades como fontes, espaçamentos, etc.
    },
  },
  plugins: [],
};

export default config;