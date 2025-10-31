import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS usando clsx e tailwind-merge
 * Útil para mesclar classes condicionais do Tailwind
 * 
 * IMPORTANTE - Sistema de Cores:
 * Use este utilitário apenas com classes Tailwind do tema.
 * NUNCA passe cores hardcoded aqui ou em qualquer lugar.
 * 
 * Exemplo correto:
 * - ✅ cn("bg-primary", "text-primary-foreground", condition && "hover:bg-primary/90")
 * - ❌ cn("bg-[#6c5ce7]", "text-white")
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
