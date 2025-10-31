"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadXlsx } from "@/components/upload-xlsx"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Loader2, Play } from "lucide-react"
import { toast } from "sonner"

/**
 * Página de Conciliação Bancária
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
 * - Script de conciliação bancária
 * - Recebe duas planilhas:
 *   1. Instituição Financeira - Extrato de movimentações
 *   2. Relatório Financeiro - Técnico Do Gerenciador da Planaltec
 * - Cruza os dados das duas planilhas para verificar se batem
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */
export default function ConciliacaoPage() {
  const [arquivoExtratoBancario, setArquivoExtratoBancario] = useState<File | null>(null)
  const [arquivoRelatorioFinanceiro, setArquivoRelatorioFinanceiro] = useState<File | null>(null)
  const [isProcessando, setIsProcessando] = useState(false)

  /**
   * Callback chamado quando o arquivo do extrato bancário é selecionado
   * @param file - Arquivo XLSX selecionado
   */
  const handleExtratoBancarioSelecionado = (file: File) => {
    console.log('[ConciliacaoPage] Extrato bancário recebido:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      ultimaModificacao: file.lastModified
    })
    
    setArquivoExtratoBancario(file)
  }

  /**
   * Callback chamado quando o arquivo do extrato bancário é removido
   */
  const handleExtratoBancarioRemovido = () => {
    console.log('[ConciliacaoPage] Extrato bancário removido')
    setArquivoExtratoBancario(null)
  }

  /**
   * Callback chamado quando o arquivo do relatório financeiro é selecionado
   * @param file - Arquivo XLSX selecionado
   */
  const handleRelatorioFinanceiroSelecionado = (file: File) => {
    console.log('[ConciliacaoPage] Relatório financeiro recebido:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      ultimaModificacao: file.lastModified
    })
    
    setArquivoRelatorioFinanceiro(file)
  }

  /**
   * Callback chamado quando o arquivo do relatório financeiro é removido
   */
  const handleRelatorioFinanceiroRemovido = () => {
    console.log('[ConciliacaoPage] Relatório financeiro removido')
    setArquivoRelatorioFinanceiro(null)
  }

  /**
   * Processa ambas as planilhas juntas
   * Só funciona quando ambas estiverem selecionadas
   */
  const handleProcessarConciliacao = async () => {
    if (!arquivoExtratoBancario || !arquivoRelatorioFinanceiro) {
      toast.error('Arquivos incompletos', {
        description: 'Selecione ambas as planilhas antes de processar.'
      })
      return
    }

    setIsProcessando(true)
    
    try {
      console.log('[ConciliacaoPage] Iniciando conciliação:', {
        extrato: arquivoExtratoBancario.name,
        relatorio: arquivoRelatorioFinanceiro.name
      })
      
      // Cria FormData para enviar ambas as planilhas
      const formData = new FormData()
      formData.append('extratoBancario', arquivoExtratoBancario)
      formData.append('relatorioFinanceiro', arquivoRelatorioFinanceiro)

      // Faz requisição para API de conciliação
      const response = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData,
      })

      const resultado = await response.json()

      if (response.ok && resultado.sucesso) {
        console.log('[ConciliacaoPage] Conciliação concluída com sucesso:', resultado)
        
        toast.success('Conciliação concluída', {
          description: resultado.mensagem || 'Planilhas processadas com sucesso. Verifique os logs do backend.',
          duration: 5000
        })

        // Remove os arquivos após processamento bem-sucedido
        setArquivoExtratoBancario(null)
        setArquivoRelatorioFinanceiro(null)
      } else {
        console.error('[ConciliacaoPage] Erro na conciliação:', resultado)
        toast.error('Erro na conciliação', {
          description: resultado.mensagem || 'Erro ao processar planilhas. Verifique os logs do backend.',
          duration: 5000
        })
      }
    } catch (erro) {
      console.error('[ConciliacaoPage] Erro ao processar conciliação:', erro)
      toast.error('Erro ao processar', {
        description: erro instanceof Error ? erro.message : 'Erro inesperado ao processar conciliação. Verifique os logs do backend.',
        duration: 5000
      })
    } finally {
      setIsProcessando(false)
    }
  }

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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground break-words">
              Conciliação
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Script que cruza duas planilhas: Extrato de movimentações da Instituição Financeira com o Relatório Financeiro do Gerenciador da Planaltec
            </p>
          </div>

          {/* Grid de Uploads - Lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-4 md:gap-6">
            {/* Card de Upload - Extrato Bancário */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  1 - Instituição Financeira
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Extrato de movimentações
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 p-3 sm:p-4">
                <UploadXlsx
                  onFileSelect={handleExtratoBancarioSelecionado}
                  onFileRemove={handleExtratoBancarioRemovido}
                  desabilitarProcessamento={true}
                />
              </CardContent>
            </Card>

            {/* Card de Upload - Relatório Financeiro */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  2 - Relatório Financeiro
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Técnico Do Gerenciador da Planaltec
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 p-3 sm:p-4">
                <UploadXlsx
                  onFileSelect={handleRelatorioFinanceiroSelecionado}
                  onFileRemove={handleRelatorioFinanceiroRemovido}
                  desabilitarProcessamento={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Botão de Processamento Global - Só aparece quando ambas as planilhas estão selecionadas */}
          {arquivoExtratoBancario && arquivoRelatorioFinanceiro && (
            <div className="flex justify-center pt-4">
              <Card className="border-border/50 shadow-sm bg-muted/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Ambas as planilhas selecionadas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {arquivoExtratoBancario.name} + {arquivoRelatorioFinanceiro.name}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleProcessarConciliacao}
                      disabled={isProcessando}
                      size="lg"
                      className="w-full sm:w-auto min-w-[200px]"
                    >
                      {isProcessando ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando Conciliação...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Processar Conciliação
                        </>
                      )}
                    </Button>
                    {isProcessando && (
                      <p className="text-xs text-muted-foreground text-center">
                        Verifique os logs do backend no console do servidor para acompanhar o processamento.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
