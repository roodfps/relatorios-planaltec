"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { FileCheck } from "lucide-react"

/**
 * Página do Dashboard
 * 
 * IMPORTANTE - Sistema de Cores:
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-background, text-foreground, etc)
 * - NUNCA use cores hardcoded (hex, rgb) aqui ou em qualquer componente
 * 
 * Design Moderno:
 * - Layout minimalista e limpo
 * - Espaçamento generoso para melhor legibilidade
 * - Tipografia refinada e hierarquia visual clara
 * 
 * Funcionalidade:
 * - Dashboard principal após autenticação
 * - Ainda em desenvolvimento
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export default function DashboardPage() {
  return (
    <div className={cn(
      "flex min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]",
      "flex-col",
      "bg-background text-foreground"
    )}>
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Sistema de Relatórios Planaltec
            </p>
          </div>

          {/* Linha Divisória */}
          <Separator className="my-6 sm:my-8" />

          {/* Content Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/dashboard/lotes-pagamento-europ" className="group">
              <Card className={cn(
                "border-border/50 shadow-sm transition-all duration-300 ease-out",
                "hover:shadow-xl hover:border-primary/50 hover:bg-accent/30",
                "hover:scale-[1.02] active:scale-[0.98]",
                "cursor-pointer",
                "aspect-square",
                "flex flex-col items-center justify-center",
                "p-4 sm:p-6",
                "relative overflow-hidden"
              )}>
                {/* Indicador visual de clique */}
                <div className={cn(
                  "absolute top-2 right-2 opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-300",
                  "text-xs text-muted-foreground"
                )}>
                  Clique para abrir →
                </div>

                <div className="flex-1 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 text-primary group-hover:text-primary/80 transition-colors duration-300" />
                </div>
                <CardHeader className="p-0 text-center">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                    Relatório de Conciliação
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-2">
                    Cruze dados bancários com relatórios financeiros
                  </CardDescription>
                </CardHeader>
                <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-center mt-3 pt-3 border-t border-border/30">
                  Clique para redirecionar
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
