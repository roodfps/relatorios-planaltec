"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Componente de proteção de rotas
 * 
 * IMPORTANTE: Sistema de Autenticação
 * - Verifica se o usuário está autenticado via sessionStorage
 * - Redireciona para login se não estiver autenticado
 * - Protege todas as rotas exceto a página de login
 * - Validação simples no frontend via cache
 * 
 * Funcionalidade:
 * - Se não detectar "authenticated" no sessionStorage, redireciona para "/"
 * - Protege todas as rotas exceto "/" (página de login)
 * - Se estiver na página de login e já autenticado, redireciona para dashboard
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const isLoginPage = pathname === "/"
    const isAuthenticated = typeof window !== "undefined" 
      ? sessionStorage.getItem("authenticated") === "true"
      : false

    if (isLoginPage) {
      // Se está na página de login e já autenticado, redireciona para dashboard
      if (isAuthenticated) {
        console.log("[AUTH] Já autenticado, redirecionando para dashboard")
        router.push("/dashboard")
        return
      }
    } else {
      // Se não é página de login, verifica autenticação
      if (!isAuthenticated) {
        console.log("[AUTH] Não autenticado, redirecionando para login")
        router.push("/")
        return
      } else {
        console.log("[AUTH] Autenticado, acesso permitido")
      }
    }

    setIsChecking(false)
  }, [pathname, router])

  // Mostra loading enquanto verifica
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Verificando autenticação...</div>
      </div>
    )
  }

  return <>{children}</>
}
