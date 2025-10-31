import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth-guard"
import { ConditionalLayout } from "@/components/conditional-layout"

const inter = Inter({ subsets: ["latin"] })

/**
 * Metadados da aplicação
 * 
 * IMPORTANTE: Sistema de Cores
 * - Metadados configurados para Planaltec
 * - Favicon e ícones configurados
 * - Open Graph e Twitter Cards configurados para compartilhamento
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Planaltec - Sistema de Relatórios",
    template: "%s | Planaltec"
  },
  description: "Sistema de Relatórios Planaltec - Gestão e análise de dados",
  keywords: ["Planaltec", "Relatórios", "Sistema", "Gestão", "Análise"],
  authors: [{ name: "Planaltec" }],
  creator: "Planaltec",
  publisher: "Planaltec",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Planaltec - Sistema de Relatórios",
    title: "Planaltec - Sistema de Relatórios",
    description: "Sistema de Relatórios Planaltec - Gestão e análise de dados",
    images: [
      {
        url: "/planaltec-logo.png",
        width: 1200,
        height: 630,
        alt: "Planaltec Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planaltec - Sistema de Relatórios",
    description: "Sistema de Relatórios Planaltec - Gestão e análise de dados",
    images: ["/planaltec-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "seu-codigo-google",
    // yandex: "seu-codigo-yandex",
    // yahoo: "seu-codigo-yahoo",
  },
}

/**
 * Layout raiz da aplicação
 * 
 * IMPORTANTE: Sistema de cores e temas
 * 
 * 1. CORES:
 *    - Todas as cores da aplicação são definidas através de variáveis CSS
 *      em app/globals.css. NUNCA use cores hardcoded (hex, rgb, etc) no código.
 *    - Use sempre as classes Tailwind com variáveis do tema:
 *      * bg-background, bg-primary, bg-secondary, bg-card, etc.
 *      * text-foreground, text-primary-foreground, text-muted-foreground, etc.
 *      * border-border, border-input, etc.
 * 
 * 2. MODIFICAÇÕES NO GLOBALS.CSS:
 *    - ⚠️ NÃO adicione estilos customizados em app/globals.css a menos que
 *      seja ABSOLUTAMENTE NECESSÁRIO
 *    - Este arquivo deve conter apenas variáveis CSS do tema e estilos base
 *    - Para estilos customizados, crie arquivos CSS separados ou use classes Tailwind
 * 
 * O sistema suporta temas light e dark definidos em globals.css.
 * O ThemeProvider gerencia a alternância entre os temas.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConditionalLayout>
            <AuthGuard>
              {children}
            </AuthGuard>
          </ConditionalLayout>
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
