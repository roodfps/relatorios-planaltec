"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Componente de entrada de PIN (4 dígitos)
 * 
 * IMPORTANTE: Sistema de Cores
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-background, text-foreground, etc)
 * - NUNCA use cores hardcoded aqui ou em qualquer lugar
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
interface PinInputProps {
  value: string
  onChange: (value: string) => void
  onComplete: (pin: string) => void
  error?: boolean
  disabled?: boolean
  className?: string
}

export function PinInput({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  className,
}: PinInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  // Divide o valor em dígitos individuais
  const digits = value.split("").concat(Array(4 - value.length).fill(""))

  // Foca no próximo input quando um dígito é digitado
  const handleChange = (index: number, digit: string) => {
    if (disabled) return

    // Remove caracteres não numéricos
    const numericDigit = digit.replace(/\D/g, "")
    
    if (numericDigit.length > 1) {
      // Se colar múltiplos dígitos, processa todos
      const pastedDigits = numericDigit.slice(0, 4 - value.length)
      const newValue = value + pastedDigits
      onChange(newValue.slice(0, 4))
      
      // Foca no próximo input não preenchido
      const nextIndex = Math.min(newValue.length, 3)
      inputRefs.current[nextIndex]?.focus()
    } else if (numericDigit.length === 1) {
      // Substitui o dígito no índice atual
      const newValue = value.split("")
      newValue[index] = numericDigit
      const updatedValue = newValue.join("").slice(0, 4)
      onChange(updatedValue)

      // Move para o próximo input se houver
      if (index < 3 && numericDigit) {
        inputRefs.current[index + 1]?.focus()
        setFocusedIndex(index + 1)
      }

      // Chama onComplete quando todos os 4 dígitos estão preenchidos
      if (updatedValue.length === 4) {
        onComplete(updatedValue)
      }
    } else {
      // Backspace - remove o dígito atual e volta para o anterior
      const newValue = value.split("")
      newValue[index] = ""
      const updatedValue = newValue.join("")
      onChange(updatedValue)

      if (index > 0 && !numericDigit) {
        inputRefs.current[index - 1]?.focus()
        setFocusedIndex(index - 1)
      }
    }
  }

  // Manipula teclas especiais
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (disabled) return

    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Se o campo está vazio e pressionar backspace, volta para o anterior
      inputRefs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
  }

  // Manipula colar (paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "")
    
    if (pastedData.length > 0) {
      const newValue = pastedData.slice(0, 4)
      onChange(newValue)
      
      // Foca no próximo input não preenchido ou no último
      const nextIndex = Math.min(newValue.length, 3)
      inputRefs.current[nextIndex]?.focus()
      
      // Se completou 4 dígitos, chama onComplete
      if (newValue.length === 4) {
        setTimeout(() => onComplete(newValue), 100)
      }
    }
  }

  return (
    <div className={cn("flex gap-2 sm:gap-3 justify-center", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20",
            "text-center text-2xl sm:text-3xl md:text-4xl font-bold",
            "rounded-lg border-2",
            "bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all",
            error
              ? "border-destructive focus:border-destructive"
              : focusedIndex === index
              ? "border-primary"
              : "border-input",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          autoComplete="off"
          autoFocus={index === 0}
        />
      ))}
    </div>
  )
}
