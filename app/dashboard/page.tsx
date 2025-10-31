import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Sistema de Relatórios Planaltec
            </p>
          </div>

          {/* Content Cards */}
          <div className="grid gap-4 sm:gap-6 md:gap-8">
            <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-4 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  Bem-vindo ao Dashboard
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-2">
                  Você está autenticado no sistema. O dashboard será desenvolvido aqui.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Conteúdo do dashboard em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
