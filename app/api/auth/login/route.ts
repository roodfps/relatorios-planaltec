import { NextRequest, NextResponse } from "next/server"

/**
 * Rota de autenticação por PIN
 * 
 * IMPORTANTE:
 * - Valida o PIN recebido contra a variável de ambiente PIN_AUTH
 * - Retorna sucesso apenas se o PIN bater exatamente
 * - Logs registrados para auditoria
 * 
 * Variável de ambiente necessária:
 * - PIN_AUTH: PIN de 4 dígitos para autenticação (ex: "1234")
 */
export async function POST(request: NextRequest) {
  try {
    // Lê o corpo da requisição
    const body = await request.json()
    const { pin } = body

    // Valida se o PIN foi enviado
    if (!pin || typeof pin !== "string") {
      console.log("[AUTH] Tentativa de login sem PIN")
      return NextResponse.json(
        { success: false, message: "PIN não fornecido" },
        { status: 400 }
      )
    }

    // Valida formato do PIN (deve ter 4 dígitos)
    if (!/^\d{4}$/.test(pin)) {
      console.log("[AUTH] PIN com formato inválido:", pin)
      return NextResponse.json(
        { success: false, message: "PIN deve conter exatamente 4 dígitos" },
        { status: 400 }
      )
    }

    // Obtém o PIN correto da variável de ambiente
    const correctPin = process.env.PIN_AUTH

    // Verifica se a variável de ambiente está configurada
    if (!correctPin) {
      console.error("[AUTH] ERRO: Variável PIN_AUTH não configurada")
      return NextResponse.json(
        { success: false, message: "Erro de configuração do servidor" },
        { status: 500 }
      )
    }

    // Compara o PIN recebido com o PIN correto
    const isValid = pin === correctPin

    // Log da tentativa (sem logar o PIN correto por segurança)
    if (isValid) {
      console.log("[AUTH] Login bem-sucedido")
    } else {
      console.log("[AUTH] Tentativa de login com PIN incorreto")
    }

    if (isValid) {
      // PIN correto - retorna sucesso
      return NextResponse.json(
        { success: true, message: "Autenticação realizada com sucesso" },
        { status: 200 }
      )
    } else {
      // PIN incorreto - retorna erro
      return NextResponse.json(
        { success: false, message: "PIN incorreto. Tente novamente." },
        { status: 401 }
      )
    }
  } catch (error) {
    // Log de erro
    console.error("[AUTH] Erro ao processar login:", error)

    return NextResponse.json(
      { success: false, message: "Erro ao processar autenticação" },
      { status: 500 }
    )
  }
}
