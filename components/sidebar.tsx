"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/**
 * Componente Sidebar unificado para Desktop e Mobile
 * 
 * IMPORTANTE: Sistema de Cores
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-sidebar, text-sidebar-foreground, etc)
 * - NUNCA use cores hardcoded aqui ou em qualquer lugar
 * 
 * Design Moderno:
 * - Sidebar minimalista e elegante
 * - Transições suaves e animações refinadas
 * - Espaçamento generoso para melhor legibilidade
 * - Estados visuais claros e intuitivos
 * 
 * Responsivo:
 * - Desktop: Sidebar fixa à esquerda (280px) - visível em lg e acima
 * - Mobile: Sheet lateral com botão hambúrguer - visível abaixo de lg
 * - Usa cores específicas da sidebar definidas no tema
 * 
 * Funcionalidade:
 * - Menu de navegação com categorias e itens
 * - Destaque visual para rota ativa
 * - Fecha automaticamente ao navegar em mobile
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */

interface MenuItem {
  title: string
  href: string
  icon?: React.ReactNode
}

interface MenuCategory {
  title: string
  items: MenuItem[]
}

const menuCategories: MenuCategory[] = [
  {
    title: "Relatórios",
    items: [
      {
        title: "Conciliação",
        href: "/dashboard/lotes-pagamento-europ",
        icon: <FileText className="h-[1.125rem] w-[1.125rem]" />,
      },
    ],
  },
]

/**
 * Componente de navegação reutilizável
 * Usado tanto no desktop quanto no mobile
 */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <ScrollArea className="flex-1">
      <nav className="p-6 space-y-8">
        {menuCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-3">
            <div className="px-2">
              <h2 className={cn(
                "text-xs font-semibold uppercase tracking-[0.15em]",
                "text-sidebar-foreground/60",
                "mb-1"
              )}>
                {category.title}
              </h2>
            </div>
            
            <div className="space-y-0.5">
              {category.items.map((item, itemIndex) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3",
                      "ml-3 px-3 py-2.5 rounded-lg",
                      "text-sm font-medium",
                      "transition-all duration-200 ease-out",
                      "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                    )}
                  >
                    {item.icon && (
                      <span className={cn(
                        "flex-shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                      )}>
                        {item.icon}
                      </span>
                    )}
                    
                    <span className="flex-1 truncate leading-tight">
                      {item.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
}

/**
 * Sidebar unificado - Desktop e Mobile
 * 
 * Desktop: Sidebar fixa lateral
 * Mobile: Sheet lateral (controlado pelo contexto)
 */
export function Sidebar() {
  const { aberto, setAberto } = useSidebarContext()

  return (
    <>
      {/* Versão Desktop - Sidebar fixa */}
      <aside className={cn(
        "hidden lg:flex lg:w-[280px] lg:flex-col",
        "fixed left-0 top-14 sm:top-16 bottom-0",
        "border-r border-sidebar-border/50",
        "bg-sidebar/95 backdrop-blur-sm",
        "text-sidebar-foreground",
        "z-30 transition-all duration-300 ease-in-out"
      )}>
        <SidebarNav />
        {/* Rodapé da Sidebar */}
        <div className="mt-auto px-6 py-4 border-t border-sidebar-border/50">
          <p className="text-[10px] sm:text-xs text-sidebar-foreground/50 text-center leading-relaxed">
            © 2025 Planaltec. Todos os direitos reservados.
          </p>
        </div>
      </aside>

      {/* Versão Mobile - Sheet lateral */}
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <SheetTitle className="text-left text-lg font-semibold">
              Menu
            </SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setAberto(false)} />
          {/* Rodapé da Sidebar Mobile */}
          <div className="mt-auto px-6 py-4 border-t border-sidebar-border/50">
            <p className="text-[10px] sm:text-xs text-sidebar-foreground/50 text-center leading-relaxed">
              © 2025 Planaltec. Todos os direitos reservados.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/**
 * Contexto para compartilhar estado do sidebar mobile
 * Permite que Header controle o botão e Sidebar controle o Sheet
 */
const SidebarContext = React.createContext<{
  aberto: boolean
  setAberto: (aberto: boolean) => void
}>({
  aberto: false,
  setAberto: () => {},
})

/**
 * Hook para acessar o contexto do sidebar
 */
export function useSidebarContext() {
  return React.useContext(SidebarContext)
}

/**
 * Provider do contexto do sidebar
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = React.useState(false)
  const pathname = usePathname()

  // Fecha o menu mobile ao navegar
  React.useEffect(() => {
    setAberto(false)
  }, [pathname])

  return (
    <SidebarContext.Provider value={{ aberto, setAberto }}>
      {children}
    </SidebarContext.Provider>
  )
}

/**
 * Botão hambúrguer para mobile
 * Deve ser usado no Header
 */
export function SidebarTrigger() {
  const { setAberto } = useSidebarContext()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={() => setAberto(true)}
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Abrir menu</span>
    </Button>
  )
}
