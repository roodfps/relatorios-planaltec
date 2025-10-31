"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

/**
 * Provider de tema da aplicação
 * 
 * IMPORTANTE: Sistema de temas e cores
 * 
 * 1. CORES:
 *    - Este componente gerencia o sistema de temas (light/dark) definido no globals.css
 *    - Use sempre as classes Tailwind com as variáveis CSS definidas em globals.css
 *    - NUNCA use cores hardcoded
 *    - As cores devem sempre vir de:
 *      * bg-background, bg-primary, bg-secondary, etc.
 *      * text-foreground, text-primary-foreground, etc.
 *      * border-border, etc.
 * 
 * 2. MODIFICAÇÕES NO GLOBALS.CSS:
 *    - ⚠️ NÃO adicione estilos customizados em app/globals.css a menos que
 *      seja ABSOLUTAMENTE NECESSÁRIO
 *    - Mantenha o globals.css apenas com variáveis CSS e estilos base
 * 
 * Referência: app/globals.css para ver todas as variáveis disponíveis
 * Consulte lib/colors.md para documentação completa
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
