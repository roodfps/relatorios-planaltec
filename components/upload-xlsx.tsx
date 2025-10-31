"use client"

import * as React from "react"
import { Upload, FileSpreadsheet, X, Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/**
 * Componente de Upload de Arquivo XLSX
 * 
 * IMPORTANTE - Sistema de Cores:
 * - Este componente usa apenas classes Tailwind com variáveis do tema
 * - Todas as cores vêm de app/globals.css (bg-background, text-foreground, etc)
 * - NUNCA use cores hardcoded aqui ou em qualquer componente
 * 
 * Funcionalidade:
 * - Permite fazer upload de arquivos XLSX
 * - Valida se o arquivo é XLSX
 * - Mostra feedback visual ao usuário
 * - Armazena o arquivo selecionado (sem processar ainda)
 * 
 * Observação:
 * - Por enquanto apenas recebe o arquivo, não processa
 * - O processamento será implementado futuramente
 * 
 * Consulte lib/colors.md para documentação completa do sistema de cores
 */

interface UploadXlsxProps {
  /**
   * Callback chamado quando um arquivo válido é selecionado
   * @param file - Arquivo XLSX selecionado
   */
  onFileSelect?: (file: File) => void
  
  /**
   * Callback chamado quando o arquivo é removido
   */
  onFileRemove?: () => void
  
  /**
   * Classe CSS adicional para o container
   */
  className?: string
  
  /**
   * Se true, desabilita o botão de processamento individual
   * Usado quando o processamento é feito externamente (ex: conciliação)
   */
  desabilitarProcessamento?: boolean
}

export function UploadXlsx({ onFileSelect, onFileRemove, className, desabilitarProcessamento = false }: UploadXlsxProps) {
  const [arquivoSelecionado, setArquivoSelecionado] = React.useState<File | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [isProcessando, setIsProcessando] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  /**
   * Valida se o arquivo é um XLSX válido
   * @param file - Arquivo a ser validado
   * @returns true se for XLSX válido, false caso contrário
   */
  const validarArquivo = (file: File): boolean => {
    const extensao = file.name.toLowerCase().split('.').pop()
    const tiposPermitidos = ['xlsx', 'xls']
    const tipoMimePermitidos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    const extensaoValida = extensao && tiposPermitidos.includes(extensao)
    const tipoMimeValido = tipoMimePermitidos.includes(file.type)

    console.log('[UploadXlsx] Validando arquivo:', {
      nome: file.name,
      extensao,
      tipoMime: file.type,
      tamanho: file.size,
      extensaoValida,
      tipoMimeValido
    })

    return extensaoValida || tipoMimeValido
  }

  /**
   * Processa o arquivo selecionado
   * @param file - Arquivo a ser processado
   */
  const processarArquivo = (file: File) => {
    if (!validarArquivo(file)) {
      console.warn('[UploadXlsx] Arquivo inválido rejeitado:', file.name)
      toast.error('Arquivo inválido', {
        description: 'Por favor, selecione um arquivo XLSX ou XLS válido.'
      })
      return
    }

    console.log('[UploadXlsx] Arquivo válido selecionado:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type
    })

    setArquivoSelecionado(file)
    toast.success('Arquivo selecionado', {
      description: `${file.name} foi selecionado com sucesso.`
    })

    // Chama o callback se fornecido
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  /**
   * Manipula o evento de mudança do input de arquivo
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processarArquivo(file)
    }
  }

  /**
   * Manipula o evento de drag and drop
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(true)
  }

  /**
   * Manipula o evento de saída do drag and drop
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }

  /**
   * Manipula o evento de soltar arquivo
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      processarArquivo(file)
    }
  }

  /**
   * Remove o arquivo selecionado
   */
  const handleRemoverArquivo = () => {
    console.log('[UploadXlsx] Arquivo removido:', arquivoSelecionado?.name)
    setArquivoSelecionado(null)
    
    // Limpa o input
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    // Chama o callback se fornecido
    if (onFileRemove) {
      onFileRemove()
    }

    toast.info('Arquivo removido')
  }

  /**
   * Abre o seletor de arquivo
   */
  const handleSelecionarArquivo = () => {
    inputRef.current?.click()
  }

  /**
   * Processa o arquivo enviando para o backend
   * Os logs do backend aparecerão no console do servidor
   */
  const handleProcessarArquivo = async () => {
    if (!arquivoSelecionado) {
      toast.error('Erro', {
        description: 'Nenhum arquivo selecionado para processar.'
      })
      return
    }

    setIsProcessando(true)
    
    try {
      console.log('[UploadXlsx] Iniciando processamento do arquivo:', arquivoSelecionado.name)
      
      // Cria FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('arquivo', arquivoSelecionado)

      // Faz requisição para API de processamento
      const response = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData,
      })

      const resultado = await response.json()

      if (response.ok && resultado.sucesso) {
        console.log('[UploadXlsx] Processamento concluído com sucesso:', resultado)
        
        toast.success('Processamento concluído', {
          description: resultado.mensagem || 'Arquivo processado com sucesso. Verifique os logs do backend.',
          duration: 5000
        })

        // Remove o arquivo após processamento bem-sucedido
        handleRemoverArquivo()
      } else {
        console.error('[UploadXlsx] Erro no processamento:', resultado)
        toast.error('Erro no processamento', {
          description: resultado.mensagem || 'Erro ao processar arquivo. Verifique os logs do backend.',
          duration: 5000
        })
      }
    } catch (erro) {
      console.error('[UploadXlsx] Erro ao processar arquivo:', erro)
      toast.error('Erro ao processar', {
        description: erro instanceof Error ? erro.message : 'Erro inesperado ao processar arquivo. Verifique os logs do backend.',
        duration: 5000
      })
    } finally {
      setIsProcessando(false)
    }
  }

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-4 p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-wrap">
          <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="break-words">Upload de Planilha XLSX</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-2">
          Selecione ou arraste uma planilha Excel (XLSX ou XLS) para fazer o upload
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 p-4 sm:p-6">
        {/* Input de arquivo oculto */}
        <Input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Área de upload */}
        {!arquivoSelecionado ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 transition-all duration-200",
              "flex flex-col items-center justify-center gap-3 sm:gap-4",
              "min-h-[180px] sm:min-h-[200px]",
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full transition-colors duration-200",
              isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            
            <div className="text-center space-y-2 w-full">
              <p className="text-xs sm:text-sm font-medium text-foreground px-2">
                Arraste e solte o arquivo aqui
              </p>
              <p className="text-xs text-muted-foreground">
                ou
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleSelecionarArquivo}
                className="mt-2 w-full sm:w-auto"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-2 px-2">
              Apenas arquivos XLSX ou XLS são aceitos
            </p>
          </div>
        ) : (
          /* Arquivo selecionado */
          <div className="space-y-4">
            <Alert className="border-border/50">
              <FileSpreadsheet className="h-4 w-4 text-primary flex-shrink-0" />
              <AlertDescription className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate break-all">
                    {arquivoSelecionado.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(arquivoSelecionado.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoverArquivo}
                  className="flex-shrink-0"
                  disabled={isProcessando}
                  aria-label="Remover arquivo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>

            {/* Botão de processar - só aparece se não estiver desabilitado */}
            {!desabilitarProcessamento && (
              <>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    type="button"
                    onClick={handleProcessarArquivo}
                    disabled={isProcessando}
                    className="w-full sm:w-auto flex-1 sm:flex-none"
                  >
                    {isProcessando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Confirmar e Processar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoverArquivo}
                    disabled={isProcessando}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>

                {isProcessando && (
                  <p className="text-xs text-muted-foreground text-center">
                    Verifique os logs do backend no console do servidor para acompanhar o processamento.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Informação adicional */}
        {!arquivoSelecionado && (
          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            <strong>Observação:</strong> Selecione um arquivo e clique em &quot;Confirmar e Processar&quot; para executar o processamento. Os logs aparecerão no console do servidor.
          </p>
        )}
      </CardContent>
    </Card>
  )
}


