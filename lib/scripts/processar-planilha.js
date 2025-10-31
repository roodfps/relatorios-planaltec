/**
 * Script para Processar Planilha
 * 
 * Funcionalidade:
 * - Lê um arquivo de planilha Excel (.xlsx ou .xls)
 * - Registra logs durante a execução
 * - Exclui o arquivo após processamento
 * 
 * Dependências:
 * - xlsx: npm install xlsx
 * - fs (nativo do Node.js)
 * - path (nativo do Node.js)
 * 
 * Uso:
 * - node lib/scripts/processar-planilha.js <caminho-do-arquivo>
 * - Ou via API route: POST /api/processar-planilha
 */

const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

/**
 * Função principal para processar a planilha
 * @param {string} caminhoArquivo - Caminho completo do arquivo de planilha
 */
async function processarPlanilha(caminhoArquivo) {
  try {
    // Log inicial
    console.log('Hello World')
    
    // Valida se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`)
    }
    
    // Obtém informações do arquivo
    const nomeArquivo = path.basename(caminhoArquivo)
    const estatisticas = fs.statSync(caminhoArquivo)
    
    console.log(`[PROCESSAR-PLANILHA] Iniciando processamento do arquivo: ${nomeArquivo}`)
    console.log(`[PROCESSAR-PLANILHA] Tamanho do arquivo: ${estatisticas.size} bytes`)
    
    // Lê o arquivo Excel
    const workbook = XLSX.readFile(caminhoArquivo, { 
      type: 'file',
      cellDates: true 
    })
    
    // Obtém informações sobre as planilhas
    const nomeDasPlanilhas = workbook.SheetNames
    console.log(`[PROCESSAR-PLANILHA] Planilhas encontradas: ${nomeDasPlanilhas.length}`)
    
    // Processa cada planilha
    nomeDasPlanilhas.forEach((nomePlanilha, index) => {
      const worksheet = workbook.Sheets[nomePlanilha]
      const dados = XLSX.utils.sheet_to_json(worksheet)
      
      console.log(`[PROCESSAR-PLANILHA] Planilha "${nomePlanilha}": ${dados.length} linhas de dados`)
      
      // Aqui você pode processar os dados conforme necessário
      // Por enquanto apenas registra informações básicas
    })
    
    // Log de sucesso com informações do arquivo
    const mensagemSucesso = `Execução concluída com sucesso, arquivo lido: ${nomeArquivo}, ` +
      `contendo ${nomeDasPlanilhas.length} planilha(s), ` +
      `totalizando ${workbook.SheetNames.reduce((total, nome) => {
        const sheet = workbook.Sheets[nome]
        const dados = XLSX.utils.sheet_to_json(sheet)
        return total + dados.length
      }, 0)} linhas de dados processadas.`
    
    console.log(`[PROCESSAR-PLANILHA] ${mensagemSucesso}`)
    
    // Exclui o arquivo após processamento
    fs.unlinkSync(caminhoArquivo)
    console.log(`[PROCESSAR-PLANILHA] Arquivo excluído com sucesso: ${nomeArquivo}`)
    
    return {
      sucesso: true,
      nomeArquivo,
      mensagem: mensagemSucesso,
      totalPlanilhas: nomeDasPlanilhas.length
    }
    
  } catch (erro) {
    console.error(`[PROCESSAR-PLANILHA] Erro ao processar planilha:`, erro)
    throw erro
  }
}

// Executa se chamado diretamente via linha de comando
if (require.main === module) {
  const caminhoArquivo = process.argv[2]
  
  if (!caminhoArquivo) {
    console.error('[PROCESSAR-PLANILHA] Erro: Caminho do arquivo não fornecido')
    console.error('[PROCESSAR-PLANILHA] Uso: node lib/scripts/processar-planilha.js <caminho-do-arquivo>')
    process.exit(1)
  }
  
  processarPlanilha(caminhoArquivo)
    .then((resultado) => {
      console.log('[PROCESSAR-PLANILHA] Processamento finalizado')
      process.exit(0)
    })
    .catch((erro) => {
      console.error('[PROCESSAR-PLANILHA] Falha no processamento:', erro.message)
      process.exit(1)
    })
}

// Exporta a função para uso em outros módulos
module.exports = { processarPlanilha }

