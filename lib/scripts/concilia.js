/**
 * Script de Conciliação
 * 
 * Cruza duas planilhas:
 * 1. Instituição Financeira (Extrato Bancário)
 * 2. Relatório Planaltec
 * 
 * Critérios de cruzamento:
 * 1. Valor absoluto (ignora sinal)
 * 2. Match de palavras entre descrições (quem tiver mais palavras em comum ganha)
 */

const XLSX = require('xlsx')
const ExcelJS = require('exceljs')

/**
 * Normaliza valor ignorando sinal
 * "-123,00" = "123.00" = 123.00
 */
function normalizarValorAbsoluto(valor) {
  if (!valor || valor === '' || valor === null || valor === undefined) {
    return null
  }
  
  let valorStr = String(valor).trim()
  
  // Remove espaços e símbolos
  valorStr = valorStr.replace(/[R$\s]/g, '')
  
  // Remove sinal negativo
  valorStr = valorStr.replace(/^-/, '')
  
  // Detecta se usa ponto ou vírgula como decimal
  const temVirgula = valorStr.includes(',')
  const temPonto = valorStr.includes('.')
  
  // Se tem vírgula E ponto: ponto é milhares, vírgula é decimal
  // Ex: 1.234,56 -> 1234.56
  if (temVirgula && temPonto) {
    valorStr = valorStr.replace(/\./g, '').replace(',', '.')
  }
  // Se só tem vírgula: vírgula é decimal
  // Ex: 123,45 -> 123.45
  else if (temVirgula && !temPonto) {
    valorStr = valorStr.replace(',', '.')
  }
  // Se só tem ponto: pode ser decimal ou milhares
  // Se tiver 2 dígitos depois do ponto: é decimal (ex: 123.45)
  // Se tiver 3+ dígitos depois do ponto: é milhares (ex: 1.234)
  else if (temPonto && !temVirgula) {
    const partes = valorStr.split('.')
    if (partes.length === 2 && partes[1].length <= 2) {
      // É decimal: mantém o ponto
      // Ex: 123.45 -> 123.45
    } else {
      // É milhares: remove o ponto
      valorStr = valorStr.replace(/\./g, '')
    }
  }
  
  // Converte para número
  const numero = parseFloat(valorStr)
  
  if (isNaN(numero)) {
    return null
  }
  
  return Math.abs(numero) // Sempre retorna absoluto
}

/**
 * Conta quantas palavras em comum entre duas descrições
 * Ignora maiúsculas/minúsculas
 */
function contarPalavrasComuns(desc1, desc2) {
  if (!desc1 || !desc2) {
    return 0
  }
  
  // Normaliza para minúsculas e divide em palavras
  const palavras1 = String(desc1).toLowerCase().split(/\s+/).filter(p => p.length > 0)
  const palavras2 = String(desc2).toLowerCase().split(/\s+/).filter(p => p.length > 0)
  
  // Conta palavras em comum
  let comum = 0
  const palavras2Set = new Set(palavras2)
  
  palavras1.forEach(palavra => {
    if (palavras2Set.has(palavra)) {
      comum++
    }
  })
  
  return comum
}

/**
 * Converte nome de coluna (ex: "E") para índice (ex: 4)
 */
function colunaParaIndice(coluna) {
  let indice = 0
  for (let i = 0; i < coluna.length; i++) {
    indice = indice * 26 + (coluna.charCodeAt(i) - 64)
  }
  return indice - 1 // Ajusta para base 0
}

/**
 * Obtém valor da coluna por letra (ex: "E", "B")
 */
function obterValorColuna(linha, colunaLetra) {
  const indice = colunaParaIndice(colunaLetra)
  const chaves = Object.keys(linha)
  
  // XLSX usa __EMPTY, __EMPTY_1, __EMPTY_2, etc
  // A primeira coluna é índice 0, segunda é 1, etc
  if (indice < chaves.length) {
    return linha[chaves[indice]]
  }
  
  return null
}

/**
 * Processa planilha do extrato bancário (Instituição Financeira)
 * Coluna E: valores (formato "-123,00")
 * Coluna B: descrições
 */
function processarExtratoBancario(workbook) {
  console.log('[CONCILIA] Processando extrato bancário...')
  
  const planilha = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[planilha]
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    defval: null,
    raw: false 
  })
  
  const pagamentos = []
  
  dados.forEach((linha, index) => {
    // Ignora linhas vazias
    if (!linha || Object.keys(linha).length === 0) {
      return
    }
    
    // Coluna E: valor (formato "-123,00")
    const valorOriginal = obterValorColuna(linha, 'E')
    const valor = normalizarValorAbsoluto(valorOriginal)
    
    // Ignora se não tiver valor válido
    if (!valor || valor <= 0) {
      return
    }
    
    // Coluna B: descrição
    const descricao = obterValorColuna(linha, 'B') || ''
    
    const pagamento = {
      linhaOriginal: index + 1,
      valor: valor,
      valorOriginal: valorOriginal,
      descricao: String(descricao),
      tipo: 'extrato_bancario'
    }
    
    pagamentos.push(pagamento)
  })
  
  console.log(`[CONCILIA] ${pagamentos.length} pagamentos encontrados no extrato bancário`)
  
  return pagamentos
}

/**
 * Processa planilha do relatório Planaltec
 * Coluna I: valores (formato "123.00")
 * Coluna C: descrições
 */
function processarRelatorioPlanaltec(workbook) {
  console.log('[CONCILIA] Processando relatório Planaltec...')
  
  const planilha = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[planilha]
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    defval: null,
    raw: false 
  })
  
  const pagamentos = []
  
  dados.forEach((linha, index) => {
    // Ignora linhas vazias
    if (!linha || Object.keys(linha).length === 0) {
      return
    }
    
    // Coluna I: valor (formato "123.00")
    const valorOriginal = obterValorColuna(linha, 'I')
    const valor = normalizarValorAbsoluto(valorOriginal)
    
    // Ignora se não tiver valor válido
    if (!valor || valor <= 0) {
      return
    }
    
    // Coluna C: descrição
    const descricao = obterValorColuna(linha, 'C') || ''
    
    const pagamento = {
      linhaOriginal: index + 1,
      valor: valor,
      valorOriginal: valorOriginal,
      descricao: String(descricao),
      tipo: 'relatorio_planaltec'
    }
    
    pagamentos.push(pagamento)
  })
  
  console.log(`[CONCILIA] ${pagamentos.length} pagamentos encontrados no relatório Planaltec`)
  
  return pagamentos
}

/**
 * Cruza os pagamentos entre as duas planilhas
 * Critério 1: Valor absoluto
 * Critério 2: Quantidade de palavras em comum (desempate)
 */
function cruzarPagamentos(pagamentosExtrato, pagamentosRelatorio) {
  console.log('[CONCILIA] Cruzando pagamentos...')
  
  const resultados = {
    encontrados: [],
    naoEncontradosNoExtrato: [], // Está no relatório mas NÃO está no extrato
    naoEncontradosNoRelatorio: [] // Está no extrato mas NÃO está no relatório
  }
  
  // Cria índice do extrato por valor
  const indicesPorValor = new Map() // valor -> [pagamentos]
  
  pagamentosExtrato.forEach(pag => {
    if (!indicesPorValor.has(pag.valor)) {
      indicesPorValor.set(pag.valor, [])
    }
    indicesPorValor.get(pag.valor).push(pag)
  })
  
  console.log(`[CONCILIA] Índices criados: ${indicesPorValor.size} valores únicos no extrato`)
  
  // Marca quais do extrato foram encontrados
  const extratoEncontrados = new Set()
  
  // Para cada pagamento do relatório, busca no extrato
  pagamentosRelatorio.forEach(pagRelatorio => {
    let melhorMatch = null
    let melhorScore = -1
    let melhorPagExtrato = null
    
    // Busca pagamentos com mesmo valor
    const candidatos = indicesPorValor.get(pagRelatorio.valor) || []
    
    if (candidatos.length === 0) {
      // Não encontrou nenhum com mesmo valor
      resultados.naoEncontradosNoExtrato.push({
        ...pagRelatorio,
        motivo: 'Pagamento presente no Relatório Planaltec mas AUSENTE no Extrato Bancário',
        detalhes: `Valor: R$ ${pagRelatorio.valor.toFixed(2)}, Descrição: ${pagRelatorio.descricao}`
      })
      return
    }
    
    // Se encontrou candidatos com mesmo valor, usa descrição para desempatar
    candidatos.forEach(pagExtrato => {
      const chaveExtrato = `${pagExtrato.linhaOriginal}|${pagExtrato.valor}|${pagExtrato.descricao}`
      
      // Só considera se ainda não foi encontrado
      if (!extratoEncontrados.has(chaveExtrato)) {
        const palavrasComuns = contarPalavrasComuns(pagExtrato.descricao, pagRelatorio.descricao)
        
        // Se tiver mais palavras em comum, é o melhor match
        if (palavrasComuns > melhorScore) {
          melhorScore = palavrasComuns
          melhorMatch = pagExtrato
        }
      }
    })
    
    if (melhorMatch && melhorScore >= 0) {
      // Encontrou match
      const chaveExtrato = `${melhorMatch.linhaOriginal}|${melhorMatch.valor}|${melhorMatch.descricao}`
      extratoEncontrados.add(chaveExtrato)
      
      resultados.encontrados.push({
        extrato: melhorMatch,
        relatorio: pagRelatorio,
        palavrasComuns: melhorScore,
        metodo: melhorScore > 0 ? 'valor_descricao' : 'valor_apenas'
      })
    } else {
      // Não encontrou match mesmo com valor igual (todos já foram usados)
      resultados.naoEncontradosNoExtrato.push({
        ...pagRelatorio,
        motivo: 'Pagamento presente no Relatório Planaltec mas AUSENTE no Extrato Bancário',
        detalhes: `Valor: R$ ${pagRelatorio.valor.toFixed(2)}, Descrição: ${pagRelatorio.descricao}`
      })
    }
  })
  
  // Agora verifica pagamentos do extrato que NÃO foram encontrados
  pagamentosExtrato.forEach(pagExtrato => {
    const chaveExtrato = `${pagExtrato.linhaOriginal}|${pagExtrato.valor}|${pagExtrato.descricao}`
    
    if (!extratoEncontrados.has(chaveExtrato)) {
      resultados.naoEncontradosNoRelatorio.push({
        ...pagExtrato,
        motivo: 'Pagamento presente no Extrato Bancário mas AUSENTE no Relatório Planaltec',
        detalhes: `Valor: R$ ${pagExtrato.valor.toFixed(2)}, Descrição: ${pagExtrato.descricao}`
      })
    }
  })
  
  console.log(`[CONCILIA] Resultados do cruzamento:`)
  console.log(`[CONCILIA] - Encontrados (bateram): ${resultados.encontrados.length}`)
  console.log(`[CONCILIA] - NÃO encontrados no EXTRATO (está no relatório, falta no extrato): ${resultados.naoEncontradosNoExtrato.length}`)
  console.log(`[CONCILIA] - NÃO encontrados no RELATÓRIO (está no extrato, falta no relatório): ${resultados.naoEncontradosNoRelatorio.length}`)
  
  return resultados
}


/**
 * Gera planilha Excel formatada com os pagamentos irregulares (não encontrados)
 * Usa ExcelJS para formatação completa (cores zebra, larguras, bordas)
 * @param {Array} naoEncontradosNoExtrato - Pagamentos do relatório não encontrados no extrato
 * @param {Array} naoEncontradosNoRelatorio - Pagamentos do extrato não encontrados no relatório
 * @returns {Promise<Buffer>} Buffer da planilha Excel gerada
 */
async function gerarPlanilhaIrregulares(naoEncontradosNoExtrato, naoEncontradosNoRelatorio) {
  console.log('[CONCILIA] Gerando planilha de irregulares formatada com ExcelJS...')
  
  const workbook = new ExcelJS.Workbook()
  
  // Função auxiliar para criar worksheet formatado
  const criarAbaFormatada = async (dados, nomeAba) => {
    const worksheet = workbook.addWorksheet(nomeAba)
    
    // Define colunas e larguras
    const colunas = Object.keys(dados[0] || {})
    
    colunas.forEach((col, index) => {
      let largura = 15
      
      // Larguras específicas por coluna
      if (col === 'Linha') largura = 10
      if (col === 'Valor') largura = 20
      if (col === 'Valor Normalizado') largura = 18
      if (col === 'Descrição') largura = 60
      if (col === 'Motivo') largura = 70
      if (col === 'Detalhes') largura = 70
      
      worksheet.getColumn(index + 1).width = largura
      worksheet.getColumn(index + 1).alignment = { vertical: 'middle', wrapText: true }
    })
    
    // Adiciona cabeçalho
    const headerRow = worksheet.addRow(colunas)
    
    // Formata cabeçalho
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' } // Azul escuro
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 25
    
    // Adiciona bordas no cabeçalho
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    })
    
    // Adiciona dados com zebra (cores alternadas)
    dados.forEach((linha, index) => {
      const row = worksheet.addRow(colunas.map(col => linha[col] || ''))
      
      // Zebra: linhas pares = cinza claro, linhas ímpares = branco
      const corFundo = (index + 1) % 2 === 0 ? 'FFF2F2F2' : 'FFFFFFFF'
      
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: corFundo }
      }
      
      row.height = 35
      row.alignment = { vertical: 'middle', wrapText: true }
      
      // Adiciona bordas em todas as células
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        }
      })
    })
    
    // Congela primeira linha (cabeçalho)
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    
    return worksheet
  }
  
  // Aba 1: Pagamentos não encontrados no Extrato
  if (naoEncontradosNoExtrato.length > 0) {
    const dadosExtrato = naoEncontradosNoExtrato.map((pag, index) => ({
      'Linha': pag.linhaOriginal || index + 1,
      'Valor': pag.valorOriginal || pag.valor,
      'Valor Normalizado': `R$ ${pag.valor?.toFixed(2) || '0.00'}`,
      'Descrição': pag.descricao || '',
      'Motivo': pag.motivo || 'Pagamento presente no Relatório Planaltec mas AUSENTE no Extrato Bancário',
      'Detalhes': pag.detalhes || ''
    }))
    
    await criarAbaFormatada(dadosExtrato, 'Faltam no Extrato')
    console.log(`[CONCILIA] Aba "Faltam no Extrato": ${naoEncontradosNoExtrato.length} registros formatados`)
  }
  
  // Aba 2: Pagamentos não encontrados no Relatório
  if (naoEncontradosNoRelatorio.length > 0) {
    const dadosRelatorio = naoEncontradosNoRelatorio.map((pag, index) => ({
      'Linha': pag.linhaOriginal || index + 1,
      'Valor': pag.valorOriginal || pag.valor,
      'Valor Normalizado': `R$ ${pag.valor?.toFixed(2) || '0.00'}`,
      'Descrição': pag.descricao || '',
      'Motivo': pag.motivo || 'Pagamento presente no Extrato Bancário mas AUSENTE no Relatório Planaltec',
      'Detalhes': pag.detalhes || ''
    }))
    
    await criarAbaFormatada(dadosRelatorio, 'Faltam no Relatório')
    console.log(`[CONCILIA] Aba "Faltam no Relatório": ${naoEncontradosNoRelatorio.length} registros formatados`)
  }
  
  // Converte para buffer
  const buffer = await workbook.xlsx.writeBuffer()
  console.log(`[CONCILIA] Planilha de irregulares formatada gerada com sucesso`)
  
  return Buffer.from(buffer)
}

/**
 * Função principal de conciliação
 * @param {Buffer} bufferExtrato - Buffer do arquivo de extrato bancário
 * @param {Buffer} bufferRelatorio - Buffer do arquivo de relatório Planaltec
 */
async function realizarConciliacao(bufferExtrato, bufferRelatorio) {
  try {
    console.log('[CONCILIA] Iniciando conciliação...')
    
    // Lê as planilhas
    const workbookExtrato = XLSX.read(bufferExtrato, { 
      type: 'buffer',
      cellDates: true
    })
    
    const workbookRelatorio = XLSX.read(bufferRelatorio, { 
      type: 'buffer',
      cellDates: true
    })
    
    // Processa ambas as planilhas
    const pagamentosExtrato = processarExtratoBancario(workbookExtrato)
    const pagamentosRelatorio = processarRelatorioPlanaltec(workbookRelatorio)
    
    // Cruza os pagamentos
    const resultados = cruzarPagamentos(pagamentosExtrato, pagamentosRelatorio)
    
    // Calcula totais financeiros das divergências
    const valorTotalFaltanteNoExtrato = resultados.naoEncontradosNoExtrato.reduce(
      (soma, pag) => soma + (pag.valor || 0), 0
    )
    const valorTotalFaltanteNoRelatorio = resultados.naoEncontradosNoRelatorio.reduce(
      (soma, pag) => soma + (pag.valor || 0), 0
    )
    const valorTotalConciliado = resultados.encontrados.reduce(
      (soma, item) => soma + (item.relatorio.valor || 0), 0
    )
    
    // Gera relatório resumido e detalhado
    const relatorio = {
      dataConciliação: new Date().toISOString(),
      resumo: {
        // Totais de registros
        totalExtrato: pagamentosExtrato.length,
        totalRelatorio: pagamentosRelatorio.length,
        totalEncontrados: resultados.encontrados.length,
        
        // Divergências - o que NÃO está em cada planilha
        naoEncontradosNoExtrato: {
          quantidade: resultados.naoEncontradosNoExtrato.length,
          valorTotal: valorTotalFaltanteNoExtrato,
          descricao: 'Pagamentos presentes no RELATÓRIO PLANALTEC mas AUSENTES no EXTRATO BANCÁRIO'
        },
        naoEncontradosNoRelatorio: {
          quantidade: resultados.naoEncontradosNoRelatorio.length,
          valorTotal: valorTotalFaltanteNoRelatorio,
          descricao: 'Pagamentos presentes no EXTRATO BANCÁRIO mas AUSENTES no RELATÓRIO PLANALTEC'
        },
        
        // Valores financeiros
        valorTotalConciliado: valorTotalConciliado,
        valorTotalFaltanteNoExtrato: valorTotalFaltanteNoExtrato,
        valorTotalFaltanteNoRelatorio: valorTotalFaltanteNoRelatorio,
        
        // Taxa de conciliação
        taxaConciliacao: pagamentosRelatorio.length > 0 
          ? ((resultados.encontrados.length / pagamentosRelatorio.length) * 100).toFixed(2) + '%'
          : '0%',
        
        // Status geral
        status: resultados.naoEncontradosNoExtrato.length === 0 && 
                resultados.naoEncontradosNoRelatorio.length === 0 
          ? 'totalmente_conciliado' 
          : 'divergencias_encontradas'
      },
      detalhes: {
        encontrados: resultados.encontrados,
        naoEncontradosNoExtrato: resultados.naoEncontradosNoExtrato,
        naoEncontradosNoRelatorio: resultados.naoEncontradosNoRelatorio
      }
    }
    
    // Log do resumo detalhado
    console.log('[CONCILIA] ===== RESUMO DA CONCILIAÇÃO =====')
    console.log(`[CONCILIA] Total de pagamentos no EXTRATO: ${relatorio.resumo.totalExtrato}`)
    console.log(`[CONCILIA] Total de pagamentos no RELATÓRIO: ${relatorio.resumo.totalRelatorio}`)
    console.log(`[CONCILIA] Total CONCILIADOS (bateram): ${relatorio.resumo.totalEncontrados}`)
    console.log(`[CONCILIA]`)
    console.log(`[CONCILIA] ⚠️  DIVERGÊNCIAS ENCONTRADAS:`)
    console.log(`[CONCILIA] - Falta no EXTRATO: ${relatorio.resumo.naoEncontradosNoExtrato.quantidade} pagamentos (R$ ${relatorio.resumo.naoEncontradosNoExtrato.valorTotal.toFixed(2)})`)
    console.log(`[CONCILIA]   → Estão no Relatório Planaltec mas NÃO estão no Extrato Bancário`)
    console.log(`[CONCILIA] - Falta no RELATÓRIO: ${relatorio.resumo.naoEncontradosNoRelatorio.quantidade} pagamentos (R$ ${relatorio.resumo.naoEncontradosNoRelatorio.valorTotal.toFixed(2)})`)
    console.log(`[CONCILIA]   → Estão no Extrato Bancário mas NÃO estão no Relatório Planaltec`)
    console.log(`[CONCILIA]`)
    console.log(`[CONCILIA] Taxa de conciliação: ${relatorio.resumo.taxaConciliacao}`)
    console.log(`[CONCILIA] ==================================`)
    
    console.log('[CONCILIA] Conciliação concluída com sucesso')
    
    // Gera planilha de irregulares se houver divergências
    let planilhaIrregularesBuffer = null
    if (resultados.naoEncontradosNoExtrato.length > 0 || resultados.naoEncontradosNoRelatorio.length > 0) {
      planilhaIrregularesBuffer = await gerarPlanilhaIrregulares(
        resultados.naoEncontradosNoExtrato,
        resultados.naoEncontradosNoRelatorio
      )
    }
    
    return {
      ...relatorio,
      planilhaIrregulares: planilhaIrregularesBuffer ? planilhaIrregularesBuffer.toString('base64') : null
    }
    
  } catch (erro) {
    console.error('[CONCILIA] Erro ao realizar conciliação:', erro)
    throw erro
  }
}

// Exporta funções para uso em outros módulos
module.exports = {
  realizarConciliacao,
  gerarPlanilhaIrregulares,
  normalizarValorAbsoluto,
  contarPalavrasComuns,
  processarExtratoBancario,
  processarRelatorioPlanaltec,
  cruzarPagamentos
}
