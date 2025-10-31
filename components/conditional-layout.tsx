"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar, SidebarProvider } from "@/components/sidebar"
import { cn } from "@/lib/utils"

/**
 * Layout condicional que esconde Header e Sidebar na página de login
 * 
 * IMPORTANTE: Sistema de Cores
 * - Este componente gerencia a exibição do layout baseado na rota
 * - Na página de login (/) não mostra Header e Sidebar
 * - Em outras rotas mostra o layout completo
 * 
 * Funcionalidade:
 * - Detecta se está na página de login (/)
 * - Se for login: mostra apenas o conteúdo (tela limpa de PIN)
 * - Se for outras rotas: mostra Header, Sidebar e conteúdo
 * - Usa SidebarProvider para compartilhar estado entre Header e Sidebar
 */
export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/"

  // Se for página de login, mostra apenas o conteúdo sem Header e Sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  // Para outras páginas, mostra layout completo com Header e Sidebar
  return (
    <SidebarProvider>
      <Header />
      <div className="flex relative">
        {/* Sidebar unificado (desktop fixo + mobile sheet) */}
        <Sidebar />
        <main className={cn(
          "flex-1 w-full transition-all duration-300 ease-in-out",
          "lg:ml-[280px]"
        )}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
