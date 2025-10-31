import { MetadataRoute } from "next"

/**
 * Web App Manifest
 * 
 * IMPORTANTE: Sistema de Cores
 * - Manifesto da aplicação para PWA
 * - Configurado para Planaltec
 * - As cores usadas aqui são as variáveis CSS do tema definidas em app/globals.css
 *   - background_color: usa --background do tema light
 *   - theme_color: usa --primary do tema
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planaltec - Sistema de Relatórios",
    short_name: "Planaltec",
    description: "Sistema de Relatórios Planaltec - Gestão e análise de dados",
    start_url: "/",
    display: "standalone",
    background_color: "#f9f9f9", // Corresponde a --background do tema light
    theme_color: "#6c5ce7", // Corresponde a --primary do tema
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
