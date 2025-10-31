"use client"

import { useTheme as useNextTheme } from "next-themes"

/**
 * Hook para gerenciar o tema da aplicação
 * 
 * IMPORTANTE: Sistema de Cores
 * - Use este hook apenas para alternar entre temas (light/dark)
 * - NUNCA use cores hardcoded no código
 * - SEMPRE use classes Tailwind com variáveis do tema (bg-primary, text-foreground, etc)
 * 
 * Exemplo de uso:
 * ```tsx
 * const { theme, setTheme } = useTheme()
 * 
 * <button onClick={() => setTheme('dark')}>
 *   Alternar tema
 * </button>
 * ```
 * 
 * Para cores, sempre use classes Tailwind:
 * - ✅ className="bg-primary text-primary-foreground"
 * - ❌ className="bg-[#6c5ce7]" ou style={{ backgroundColor: "#6c5ce7" }}
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export function useTheme() {
  const theme = useNextTheme()

  return {
    theme: theme.theme,
    setTheme: theme.setTheme,
    resolvedTheme: theme.resolvedTheme,
    systemTheme: theme.systemTheme,
  }
}
