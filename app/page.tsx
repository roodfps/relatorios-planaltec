"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PinInput } from "@/components/pin-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Página de autenticação por PIN
 * 
 * IMPORTANTE - Sistema de Cores:
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-background, text-foreground, etc)
 * - NUNCA use cores hardcoded (hex, rgb) aqui ou em qualquer componente
 * 
 * Funcionalidade:
 * - Tela de PIN estilo mobile com 4 dígitos
 * - Validação via API route
 * - Armazena autenticação em sessionStorage
 * - Redireciona para dashboard após autenticação bem-sucedida
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export default function LoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Removido: verificação movida para AuthGuard

  const handlePinChange = (newPin: string) => {
    setPin(newPin)
    setError(null)
  }

  const handlePinComplete = async (completePin: string) => {
    if (completePin.length !== 4) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: completePin }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Armazena autenticação
        sessionStorage.setItem("authenticated", "true")
        
        // Redireciona para dashboard
        router.push("/dashboard")
      } else {
        setError(data.message || "PIN inválido. Tente novamente.")
        setPin("")
        // Foca no primeiro input após erro
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
        }, 100)
      }
    } catch (err) {
      setError("Erro ao validar PIN. Tente novamente.")
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length === 4) {
      await handlePinComplete(pin)
    }
  }

  return (
    <main className={cn(
      "flex min-h-screen",
      "flex-col items-center justify-center",
      "p-4 sm:p-6 md:p-8",
      "bg-background text-foreground"
    )}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">
            Bem-vindo ao Sistema
          </CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Sistema de Relatórios Planaltec
            <br />
            Digite o PIN de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <PinInput
                value={pin}
                onChange={handlePinChange}
                onComplete={handlePinComplete}
                error={!!error}
                disabled={isLoading}
              />
              
              {error && (
                <Alert variant="destructive" className="w-full">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={pin.length !== 4 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                "Acessar Sistema"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}