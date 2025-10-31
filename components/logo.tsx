"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/**
 * Componente de Logo da Planaltec
 * 
 * IMPORTANTE: Sistema de Cores
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-background, text-foreground, etc)
 * - NUNCA use cores hardcoded aqui ou em qualquer lugar
 * 
 * Responsivo:
 * - Tamanho do logo ajusta automaticamente (h-8 w-8 sm:h-10 sm:w-10)
 * - Texto oculto em mobile, visível em telas maiores (hidden sm:inline)
 * - Gap responsivo entre logo e texto
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export function Logo({ 
  className = "",
  showText = true,
  size = "default" 
}: { 
  className?: string
  showText?: boolean
  size?: "small" | "default" | "large"
}) {
  // Tamanhos responsivos - ajusta automaticamente para mobile
  const sizeClasses = {
    small: "h-7 w-7 sm:h-8 sm:w-8",
    default: "h-8 w-8 sm:h-10 sm:w-10",
    large: "h-12 w-12 sm:h-16 sm:w-16"
  }

  const textSizeClasses = {
    small: "text-xs sm:text-sm",
    default: "text-sm sm:text-lg",
    large: "text-lg sm:text-2xl"
  }

  const imageSizes = {
    small: { mobile: 28, desktop: 32 },
    default: { mobile: 32, desktop: 40 },
    large: { mobile: 48, desktop: 64 }
  }

  const currentSizes = imageSizes[size]

  return (
    <Link 
      href="/" 
      className={cn(
        "flex items-center gap-1.5 sm:gap-2",
        "hover:opacity-80 transition-opacity",
        "min-w-0", // Permite que o link encolha se necessário
        className
      )}
      aria-label="Planaltec - Ir para página inicial"
    >
      <Image
        src="/planaltec-logo.png"
        alt="Planaltec Logo"
        width={currentSizes.desktop}
        height={currentSizes.desktop}
        className={cn(
          sizeClasses[size],
          "object-contain flex-shrink-0"
        )}
        priority
        sizes="(max-width: 640px) 32px, 40px"
      />
      {showText && (
        <div className={cn(
          "flex items-center gap-2",
          "hidden sm:flex" // Oculto em mobile, visível em telas maiores
        )}>
          <span className={cn(
            "font-semibold text-foreground",
            textSizeClasses[size],
            "whitespace-nowrap" // Evita quebra de linha
          )}>
            Planaltec - Sistema de Relatórios
          </span>
          <Badge 
            variant="secondary" 
            className="text-[10px] px-1.5 py-0 h-5 font-medium"
          >
            v1
          </Badge>
        </div>
      )}
    </Link>
  )
}
