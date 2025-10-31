"use client"

import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/sidebar"
import { cn } from "@/lib/utils"

/**
 * Componente Header da aplicação
 * 
 * IMPORTANTE: Sistema de Cores
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-background, text-foreground, etc)
 * - NUNCA use cores hardcoded aqui ou em qualquer lugar
 * 
 * Responsivo:
 * - Padding ajustado para mobile (px-3 sm:px-4 lg:px-6)
 * - Altura mínima responsiva (h-14 sm:h-16)
 * - Logo oculta texto em mobile
 * - Botão menu hambúrguer para mobile (mostrado apenas abaixo de lg)
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export function Header() {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className={cn(
        "relative flex h-14 sm:h-16 items-center justify-between",
        "px-3 sm:px-4 md:px-6 lg:px-8",
        "w-full"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Botão menu hambúrguer para mobile */}
          <SidebarTrigger />
          <Logo />
        </div>
        <nav className={cn(
          "flex items-center",
          "mr-2 sm:mr-3 md:mr-4 lg:mr-6"
        )}>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
