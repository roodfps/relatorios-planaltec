import type { Config } from "tailwindcss"

/**
 * ⚠️ CONFIGURAÇÃO DO TEMA - IMPORTANTE ⚠️
 * 
 * Este arquivo mapeia as variáveis CSS definidas em app/globals.css para
 * classes Tailwind utilizáveis no código.
 * 
 * REGRA FUNDAMENTAL:
 * - NUNCA use cores hardcoded (hex, rgb, hsl) diretamente no código
 * - SEMPRE use as classes Tailwind definidas aqui (bg-primary, text-foreground, etc)
 * - Todas as cores vêm das variáveis CSS em app/globals.css
 * 
 * Exemplo de uso correto:
 * - ✅ className="bg-primary text-primary-foreground"
 * - ❌ className="bg-[#6c5ce7]" ou style={{ color: "#333" }}
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    extend: {
      /**
       * Cores do tema
       * 
       * IMPORTANTE: Todas essas cores são mapeamentos de variáveis CSS
       * definidas em app/globals.css. Use sempre as classes Tailwind
       * (bg-primary, text-foreground, etc) e NUNCA cores hardcoded.
       */
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config