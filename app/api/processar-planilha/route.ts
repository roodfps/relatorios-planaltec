import { NextRequest, NextResponse } from "next/server"
import { writeFile, unlink, readFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import * as XLSX from "xlsx"
// @ts-ignore - módulo JavaScript comum
const { realizarConciliacao } = require("@/lib/scripts/concilia")

/**
 * Rota API para processar planilha
 * 
 * Funcionalidade:
 * - Recebe arquivo de planilha via upload
 * - Processa o arquivo (lê e registra logs)
 * - Exclui o arquivo após processamento
 * 
 * IMPORTANTE:
 * - Logs registrados para auditoria
 * - Arquivo temporário é excluído após processamento
 */

export async function POST(request: NextRequest) {
  try {
    // Log inicial
    console.log("[PROCESSAR-PLANILHA] Hello World")
    
    // Recebe os arquivos do FormData
    const formData = await request.formData()
    
    // Verifica se são duas planilhas (conciliação) ou uma (processamento normal)
    const extratoBancario = formData.get("extratoBancario") as File | null
    const relatorioFinanceiro = formData.get("relatorioFinanceiro") as File | null
    const arquivo = formData.get("arquivo") as File | null
    
    // Modo conciliação: duas planilhas
    if (extratoBancario && relatorioFinanceiro) {
      return await processarConciliacao(extratoBancario, relatorioFinanceiro)
    }
    
    // Modo normal: uma planilha
    if (!arquivo) {
      console.error("[PROCESSAR-PLANILHA] Arquivo não fornecido")
      return NextResponse.json(
        { sucesso: false, mensagem: "Arquivo não fornecido ou ambas as planilhas não foram enviadas" },
        { status: 400 }
      )
    }
    
    // Valida se é um arquivo Excel
    const extensao = arquivo.name.toLowerCase().split('.').pop()
    if (!['xlsx', 'xls'].includes(extensao || '')) {
      console.error("[PROCESSAR-PLANILHA] Arquivo não é uma planilha Excel válida")
      return NextResponse.json(
        { sucesso: false, mensagem: "Arquivo deve ser uma planilha Excel (.xlsx ou .xls)" },
        { status: 400 }
      )
    }
    
    const nomeArquivo = arquivo.name
    console.log(`[PROCESSAR-PLANILHA] Iniciando processamento do arquivo: ${nomeArquivo}`)
    console.log(`[PROCESSAR-PLANILHA] Tamanho do arquivo: ${arquivo.size} bytes`)
    
    // Converte o arquivo para buffer
    const bytes = await arquivo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Cria arquivo temporário para processar (para garantir exclusão posterior)
    const caminhoTemporario = join(tmpdir(), `planilha-${Date.now()}-${nomeArquivo}`)
    
    try {
      // Salva arquivo temporário apenas para registro (não é necessário para leitura)
      await writeFile(caminhoTemporario, buffer)
      console.log(`[PROCESSAR-PLANILHA] Arquivo temporário criado: ${caminhoTemporario}`)
      
      // Lê o arquivo Excel diretamente do buffer
      // O XLSX detecta automaticamente o tipo baseado no conteúdo do arquivo
      console.log(`[PROCESSAR-PLANILHA] Tipo de arquivo detectado: ${extensao}`)
      console.log(`[PROCESSAR-PLANILHA] Primeiros bytes do buffer (hex): ${buffer.slice(0, 8).toString('hex')}`)
      
      // Tenta ler o arquivo com as opções padrão
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true
      })
      
      // Obtém informações sobre as planilhas
      const nomeDasPlanilhas = workbook.SheetNames
      console.log(`[PROCESSAR-PLANILHA] Planilhas encontradas: ${nomeDasPlanilhas.length}`)
      
      // Processa cada planilha
      let totalLinhas = 0
      nomeDasPlanilhas.forEach((nomePlanilha) => {
        const worksheet = workbook.Sheets[nomePlanilha]
        const dados = XLSX.utils.sheet_to_json(worksheet)
        totalLinhas += dados.length
        console.log(`[PROCESSAR-PLANILHA] Planilha "${nomePlanilha}": ${dados.length} linhas de dados`)
      })
      
      // Log de sucesso com informações do arquivo
      const mensagemSucesso = `Execução concluída com sucesso, arquivo lido: ${nomeArquivo}, ` +
        `contendo ${nomeDasPlanilhas.length} planilha(s), ` +
        `totalizando ${totalLinhas} linhas de dados processadas.`
      
      console.log(`[PROCESSAR-PLANILHA] ${mensagemSucesso}`)
      
      // Exclui o arquivo temporário
      await unlink(caminhoTemporario)
      console.log(`[PROCESSAR-PLANILHA] Arquivo excluído com sucesso: ${nomeArquivo}`)
      
      // Retorna sucesso
      return NextResponse.json({
        sucesso: true,
        nomeArquivo,
        mensagem: mensagemSucesso,
        totalPlanilhas: nomeDasPlanilhas.length,
        totalLinhas
      }, { status: 200 })
      
    } catch (erroProcessamento) {
      // Tenta excluir arquivo temporário em caso de erro
      try {
        await unlink(caminhoTemporario)
      } catch (erroExclusao) {
        console.error("[PROCESSAR-PLANILHA] Erro ao excluir arquivo temporário:", erroExclusao)
      }
      
      throw erroProcessamento
    }
    
  } catch (erro) {
    // Log de erro
    console.error("[PROCESSAR-PLANILHA] Erro ao processar planilha:", erro)
    
    return NextResponse.json(
      { 
        sucesso: false, 
        mensagem: erro instanceof Error ? erro.message : "Erro ao processar planilha" 
      },
      { status: 500 }
    )
  }
}

/**
 * Processa conciliação com duas planilhas
 */
async function processarConciliacao(extratoBancario: File, relatorioFinanceiro: File) {
  try {
    const nomeExtrato = extratoBancario.name
    const nomeRelatorio = relatorioFinanceiro.name
    
    console.log(`[PROCESSAR-PLANILHA] Iniciando conciliação:`)
    console.log(`[PROCESSAR-PLANILHA] Extrato bancário: ${nomeExtrato} (${extratoBancario.size} bytes)`)
    console.log(`[PROCESSAR-PLANILHA] Relatório financeiro: ${nomeRelatorio} (${relatorioFinanceiro.size} bytes)`)
    
    // Converte ambos os arquivos para buffer
    const bytesExtrato = await extratoBancario.arrayBuffer()
    const bufferExtrato = Buffer.from(bytesExtrato)
    
    const bytesRelatorio = await relatorioFinanceiro.arrayBuffer()
    const bufferRelatorio = Buffer.from(bytesRelatorio)
    
    // Cria arquivos temporários
    const caminhoExtrato = join(tmpdir(), `extrato-${Date.now()}-${nomeExtrato}`)
    const caminhoRelatorio = join(tmpdir(), `relatorio-${Date.now()}-${nomeRelatorio}`)
    
    try {
      // Salva arquivos temporários
      await writeFile(caminhoExtrato, bufferExtrato)
      await writeFile(caminhoRelatorio, bufferRelatorio)
      
      console.log(`[PROCESSAR-PLANILHA] Arquivos temporários criados`)
      
      // Lê ambas as planilhas
      const extensaoExtrato = nomeExtrato.toLowerCase().split('.').pop()
      const extensaoRelatorio = nomeRelatorio.toLowerCase().split('.').pop()
      
      console.log(`[PROCESSAR-PLANILHA] Tipo extrato: ${extensaoExtrato}`)
      console.log(`[PROCESSAR-PLANILHA] Primeiros bytes extrato (hex): ${bufferExtrato.slice(0, 8).toString('hex')}`)
      
      const workbookExtrato = XLSX.read(bufferExtrato, { 
        type: 'buffer',
        cellDates: true
      })
      
      // Tenta carregar instruções dos modelos (se existirem)
      let instrucoesExtrato = null
      let instrucoesRelatorio = null
      
      try {
        const nomeBaseExtrato = nomeExtrato.replace(/\.[^/.]+$/, "")
        const caminhoInstrucoesExtrato = join(process.cwd(), 'lib/scripts/detector-modelo', `instrucoes-${nomeBaseExtrato}.json`)
        const instrucoesExtratoStr = await readFile(caminhoInstrucoesExtrato, 'utf8').catch(() => null)
        if (instrucoesExtratoStr) {
          instrucoesExtrato = JSON.parse(instrucoesExtratoStr)
          console.log(`[PROCESSAR-PLANILHA] Instruções do extrato carregadas: ${caminhoInstrucoesExtrato}`)
        }
      } catch (erro) {
        console.log(`[PROCESSAR-PLANILHA] Instruções do extrato não encontradas, usando detecção automática`)
      }
      
      try {
        const nomeBaseRelatorio = nomeRelatorio.replace(/\.[^/.]+$/, "")
        const caminhoInstrucoesRelatorio = join(process.cwd(), 'lib/scripts/detector-modelo', `instrucoes-${nomeBaseRelatorio}.json`)
        const instrucoesRelatorioStr = await readFile(caminhoInstrucoesRelatorio, 'utf8').catch(() => null)
        if (instrucoesRelatorioStr) {
          instrucoesRelatorio = JSON.parse(instrucoesRelatorioStr)
          console.log(`[PROCESSAR-PLANILHA] Instruções do relatório carregadas: ${caminhoInstrucoesRelatorio}`)
        }
      } catch (erro) {
        console.log(`[PROCESSAR-PLANILHA] Instruções do relatório não encontradas, usando detecção automática`)
      }
      
      // Realiza a conciliação usando o script modular
      console.log(`[PROCESSAR-PLANILHA] Iniciando conciliação com script modular...`)
      const relatorioConciliacao = realizarConciliacao(
        bufferExtrato,
        bufferRelatorio,
        instrucoesExtrato,
        instrucoesRelatorio
      )
      
      // Log de sucesso
      const mensagemSucesso = `Conciliação concluída com sucesso. ` +
        `Encontrados: ${relatorioConciliacao.resumo.encontrados}, ` +
        `Não encontrados no extrato: ${relatorioConciliacao.resumo.naoEncontradosNoExtrato}, ` +
        `Não encontrados no relatório: ${relatorioConciliacao.resumo.naoEncontradosNoRelatorio}, ` +
        `Taxa de conciliação: ${relatorioConciliacao.resumo.taxaConciliacao}`
      
      console.log(`[PROCESSAR-PLANILHA] ${mensagemSucesso}`)
      
      // Exclui arquivos temporários
      await unlink(caminhoExtrato)
      await unlink(caminhoRelatorio)
      console.log(`[PROCESSAR-PLANILHA] Arquivos temporários excluídos com sucesso`)
      
      // Retorna resultado da conciliação
      return NextResponse.json({
        sucesso: true,
        tipo: 'conciliacao',
        mensagem: mensagemSucesso,
        relatorio: relatorioConciliacao
      }, { status: 200 })
      
    } catch (erroProcessamento) {
      // Tenta excluir arquivos temporários em caso de erro
      try {
        await unlink(caminhoExtrato).catch(() => {})
        await unlink(caminhoRelatorio).catch(() => {})
      } catch (erroExclusao) {
        console.error("[PROCESSAR-PLANILHA] Erro ao excluir arquivos temporários:", erroExclusao)
      }
      
      throw erroProcessamento
    }
    
  } catch (erro) {
    console.error("[PROCESSAR-PLANILHA] Erro ao processar conciliação:", erro)
    
    return NextResponse.json(
      { 
        sucesso: false, 
        mensagem: erro instanceof Error ? erro.message : "Erro ao processar conciliação" 
      },
      { status: 500 }
    )
  }
}

