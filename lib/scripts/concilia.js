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
 * Normaliza data no formato dd/mm/aaaa
 * Retorna objeto Date ou null se inválido
 */
function normalizarData(data) {
  if (!data || data === '' || data === null || data === undefined) {
    return null
  }
  
  // Se já é um objeto Date, retorna
  if (data instanceof Date) {
    return isNaN(data.getTime()) ? null : data
  }
  
  const dataStr = String(data).trim()
  
  // Tenta parsear formato dd/mm/aaaa ou dd-mm-aaaa
  const partes = dataStr.split(/[\/\-]/)
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10)
    const mesOriginal = parseInt(partes[1], 10)
    const mes = mesOriginal - 1 // JavaScript Date usa 0-11 para meses
    const ano = parseInt(partes[2], 10)
    
    // Valida valores: dia entre 1-31, mês original entre 1-12, ano > 1900
    if (!isNaN(dia) && !isNaN(mesOriginal) && !isNaN(ano) && 
        dia > 0 && dia <= 31 && 
        mesOriginal >= 1 && mesOriginal <= 12 && 
        ano > 1900 && ano < 2100) {
      const dataObj = new Date(ano, mes, dia)
      // Verifica se a data é válida (ex: não permite 32/01/2024)
      if (dataObj.getDate() === dia && dataObj.getMonth() === mes && dataObj.getFullYear() === ano) {
        return dataObj
      }
    }
  }
  
  // Tenta parsear como ISO ou outros formatos
  const dataParsed = new Date(dataStr)
  if (!isNaN(dataParsed.getTime())) {
    return dataParsed
  }
  
  return null
}

/**
 * Compara duas datas ignorando hora/minuto/segundo
 * Retorna true se forem a mesma data (mesmo dia/mês/ano)
 */
function compararDatas(data1, data2) {
  if (!data1 || !data2) {
    return false
  }
  
  const d1 = normalizarData(data1)
  const d2 = normalizarData(data2)
  
  if (!d1 || !d2) {
    return false
  }
  
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear()
}

/**
 * Remove acentos de uma string
 * Ex: "Antônio" -> "Antonio", "José" -> "Jose"
 */
function removerAcentos(texto) {
  if (!texto) return ''
  
  return String(texto)
    .normalize('NFD') // Normaliza para NFD (Normalization Form Decomposed)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
}

/**
 * Conta quantas palavras em comum entre duas descrições
 * Ignora maiúsculas/minúsculas e acentos
 */
function contarPalavrasComuns(desc1, desc2) {
  if (!desc1 || !desc2) {
    return 0
  }
  
  // Normaliza: remove acentos, converte para minúsculas e divide em palavras
  const palavras1 = removerAcentos(desc1).toLowerCase().split(/\s+/).filter(p => p.length > 0)
  const palavras2 = removerAcentos(desc2).toLowerCase().split(/\s+/).filter(p => p.length > 0)
  
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
 * Coluna A: data (formato dd/mm/aaaa)
 */
function processarExtratoBancario(workbook) {
  console.log('[CONCILIA] Processando extrato bancário...')
  
  const planilha = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[planilha]
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    defval: null,
    raw: false,
    cellDates: true // Permite parsear datas automaticamente
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
      // Log de debug para valores inválidos
      if (valorOriginal !== null && valorOriginal !== undefined && valorOriginal !== '') {
        console.log(`[CONCILIA DEBUG] Valor inválido no EXTRATO linha ${index + 1}: "${valorOriginal}" -> normalizado: ${valor}`)
      }
      return
    }
    
    // Coluna B: descrição
    const descricao = obterValorColuna(linha, 'B') || ''
    
    // Coluna A: data (formato dd/mm/aaaa)
    const dataOriginal = obterValorColuna(linha, 'A')
    const data = normalizarData(dataOriginal)
    
    const pagamento = {
      linhaOriginal: index + 1,
      valor: valor,
      valorOriginal: valorOriginal,
      descricao: String(descricao),
      data: data,
      dataOriginal: dataOriginal,
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
 * Coluna J: data (formato dd/mm/aaaa)
 */
function processarRelatorioPlanaltec(workbook) {
  console.log('[CONCILIA] Processando relatório Planaltec...')
  
  const planilha = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[planilha]
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    defval: null,
    raw: false,
    cellDates: true // Permite parsear datas automaticamente
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
      // Log de debug para valores inválidos
      if (valorOriginal !== null && valorOriginal !== undefined && valorOriginal !== '') {
        console.log(`[CONCILIA DEBUG] Valor inválido no RELATÓRIO linha ${index + 1}: "${valorOriginal}" -> normalizado: ${valor}`)
      }
      return
    }
    
    // Coluna C: descrição
    const descricao = obterValorColuna(linha, 'C') || ''
    
    // Coluna J: data (formato dd/mm/aaaa)
    const dataOriginal = obterValorColuna(linha, 'J')
    const data = normalizarData(dataOriginal)
    
    const pagamento = {
      linhaOriginal: index + 1,
      valor: valor,
      valorOriginal: valorOriginal,
      descricao: String(descricao),
      data: data,
      dataOriginal: dataOriginal,
      tipo: 'relatorio_planaltec'
    }
    
    pagamentos.push(pagamento)
  })
  
  console.log(`[CONCILIA] ${pagamentos.length} pagamentos encontrados no relatório Planaltec`)
  
  return pagamentos
}

/**
 * Cruza os pagamentos entre as duas planilhas
 * NOVA LÓGICA: Avalia TODOS os matches possíveis primeiro, depois escolhe os melhores
 * Critério 1: Valor absoluto (obrigatório)
 * Critério 2: Data (match exato)
 * Critério 3: Quantidade de palavras em comum (desempate)
 */
function cruzarPagamentos(pagamentosExtrato, pagamentosRelatorio) {
  console.log('[CONCILIA] Cruzando pagamentos com nova lógica (avalia todos os matches primeiro)...')
  
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
  
  // NOVA ABORDAGEM: Cria lista de TODOS os matches possíveis primeiro
  const todosMatchesPossiveis = []
  
  pagamentosRelatorio.forEach(pagRelatorio => {
    const candidatos = indicesPorValor.get(pagRelatorio.valor) || []
    
    if (candidatos.length === 0) {
      // Não tem candidatos com mesmo valor - será tratado depois como não encontrado
      return
    }
    
    // Para cada candidato, calcula o score
    candidatos.forEach(pagExtrato => {
      const palavrasComuns = contarPalavrasComuns(pagExtrato.descricao, pagRelatorio.descricao)
      const dataMatch = compararDatas(pagExtrato.data, pagRelatorio.data)
      
      // Calcula score composto: data match tem peso maior
      // Score: (dataMatch ? 10000 : 0) + palavrasComuns
      // Isso garante que quem tem data match sempre fica na frente
      const score = (dataMatch ? 10000 : 0) + palavrasComuns
      
      todosMatchesPossiveis.push({
        relatorio: pagRelatorio,
        extrato: pagExtrato,
        palavrasComuns: palavrasComuns,
        dataMatch: dataMatch,
        score: score,
        chaveExtrato: `${pagExtrato.linhaOriginal}|${pagExtrato.valor}|${pagExtrato.descricao}`,
        chaveRelatorio: `${pagRelatorio.linhaOriginal}|${pagRelatorio.valor}|${pagRelatorio.descricao}`
      })
    })
  })
  
  console.log(`[CONCILIA] Total de matches possíveis encontrados: ${todosMatchesPossiveis.length}`)
  
  // Ordena matches por qualidade (melhor primeiro)
  // Primeiro por score (decrescente), depois por linha do relatório (crescente) para manter ordem original em caso de empate
  todosMatchesPossiveis.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score // Maior score primeiro
    }
    // Se empate no score, mantém ordem original do relatório
    return a.relatorio.linhaOriginal - b.relatorio.linhaOriginal
  })
  
  // Processa matches na ordem de qualidade, garantindo que cada item seja usado apenas uma vez
  const extratoUsados = new Set()
  const relatorioUsados = new Set()
  const matchesAplicados = []
  
  todosMatchesPossiveis.forEach(match => {
    // Só aplica se nem extrato nem relatório foram usados ainda
    if (!extratoUsados.has(match.chaveExtrato) && !relatorioUsados.has(match.chaveRelatorio)) {
      extratoUsados.add(match.chaveExtrato)
      relatorioUsados.add(match.chaveRelatorio)
      matchesAplicados.push(match)
      
      resultados.encontrados.push({
        extrato: match.extrato,
        relatorio: match.relatorio,
        palavrasComuns: match.palavrasComuns,
        dataMatch: match.dataMatch,
        metodo: match.dataMatch 
          ? (match.palavrasComuns > 0 ? 'valor_data_descricao' : 'valor_data') 
          : (match.palavrasComuns > 0 ? 'valor_descricao' : 'valor_apenas')
      })
    }
  })
  
  console.log(`[CONCILIA] Matches aplicados: ${matchesAplicados.length}`)
  
  // Agora identifica os que NÃO foram encontrados
  // Relatórios não encontrados
  pagamentosRelatorio.forEach(pagRelatorio => {
    const chaveRelatorio = `${pagRelatorio.linhaOriginal}|${pagRelatorio.valor}|${pagRelatorio.descricao}`
    
    if (!relatorioUsados.has(chaveRelatorio)) {
      const candidatos = indicesPorValor.get(pagRelatorio.valor) || []
      
      if (candidatos.length === 0) {
        // Não encontrou nenhum com mesmo valor
        const valoresProximos = []
        const todosValores = Array.from(indicesPorValor.keys()).sort((a, b) => a - b)
        const tolerancia = pagRelatorio.valor * 0.01
        todosValores.forEach(val => {
          const diff = Math.abs(val - pagRelatorio.valor)
          if (diff <= tolerancia && diff > 0) {
            valoresProximos.push({
              valor: val,
              diferenca: diff,
              diferencaPercentual: ((diff / pagRelatorio.valor) * 100).toFixed(2) + '%'
            })
          }
        })
        
        const detalhesDebug = valoresProximos.length > 0
          ? `Valor procurado: R$ ${pagRelatorio.valor.toFixed(2)} | Valores próximos encontrados: ${valoresProximos.slice(0, 3).map(v => `R$ ${v.valor.toFixed(2)} (dif: ${v.diferencaPercentual})`).join(', ')}`
          : `Valor: R$ ${pagRelatorio.valor.toFixed(2)}, Descrição: ${pagRelatorio.descricao}`
        
        console.log(`[CONCILIA DEBUG] Não encontrado no EXTRATO: Linha ${pagRelatorio.linhaOriginal} | Valor: R$ ${pagRelatorio.valor.toFixed(2)} | Descrição: "${pagRelatorio.descricao}"`)
        
        resultados.naoEncontradosNoExtrato.push({
          ...pagRelatorio,
          motivo: 'Pagamento presente no Relatório Planaltec mas AUSENTE no Extrato Bancário - Valor não encontrado',
          detalhes: detalhesDebug,
          debug: {
            valorProcurado: pagRelatorio.valor,
            valorOriginal: pagRelatorio.valorOriginal,
            valoresProximos: valoresProximos.slice(0, 5)
          }
        })
      } else {
        // Tem candidatos mas nenhum deu match (provavelmente já foram usados por outros do relatório)
        let candidatosAnalisados = candidatos.map(pagExtrato => {
          const chaveExtrato = `${pagExtrato.linhaOriginal}|${pagExtrato.valor}|${pagExtrato.descricao}`
          const jaFoiUsado = extratoUsados.has(chaveExtrato)
          const palavrasComuns = contarPalavrasComuns(pagExtrato.descricao, pagRelatorio.descricao)
          const dataMatch = compararDatas(pagExtrato.data, pagRelatorio.data)
          
          return {
            pagamento: pagExtrato,
            jaFoiUsado,
            palavrasComuns,
            dataMatch
          }
        })
        
        console.log(`[CONCILIA DEBUG] Não encontrado no EXTRATO (valor existe mas sem match): Linha ${pagRelatorio.linhaOriginal}`)
        console.log(`[CONCILIA DEBUG]   → Valor: R$ ${pagRelatorio.valor.toFixed(2)}`)
        console.log(`[CONCILIA DEBUG]   → Data: ${pagRelatorio.dataOriginal || 'N/A'} (${pagRelatorio.data ? pagRelatorio.data.toLocaleDateString('pt-BR') : 'inválida'})`)
        console.log(`[CONCILIA DEBUG]   → Descrição Relatório: "${pagRelatorio.descricao}"`)
        console.log(`[CONCILIA DEBUG]   → Candidatos encontrados: ${candidatosAnalisados.length}`)
        candidatosAnalisados.forEach((cand, idx) => {
          const dataStr = cand.pagamento.dataOriginal || (cand.pagamento.data ? cand.pagamento.data.toLocaleDateString('pt-BR') : 'N/A')
          console.log(`[CONCILIA DEBUG]     ${idx + 1}. Linha ${cand.pagamento.linhaOriginal} | Data: ${dataStr} | Data match: ${cand.dataMatch ? 'SIM' : 'NÃO'} | Já usado: ${cand.jaFoiUsado} | Palavras comuns: ${cand.palavrasComuns} | "${cand.pagamento.descricao}"`)
        })
        
        resultados.naoEncontradosNoExtrato.push({
          ...pagRelatorio,
          motivo: 'Pagamento presente no Relatório Planaltec mas AUSENTE no Extrato Bancário - Todos os candidatos com mesmo valor já foram usados',
          detalhes: `Valor: R$ ${pagRelatorio.valor.toFixed(2)}, Descrição: ${pagRelatorio.descricao}`,
          debug: {
            valorProcurado: pagRelatorio.valor,
            candidatosEncontrados: candidatosAnalisados.length,
            candidatos: candidatosAnalisados.map(c => ({
              linha: c.pagamento.linhaOriginal,
              descricao: c.pagamento.descricao,
              jaFoiUsado: c.jaFoiUsado,
              palavrasComuns: c.palavrasComuns,
              dataMatch: c.dataMatch
            }))
          }
        })
      }
    }
  })
  
  // Cria índice do relatório por valor para buscar valores próximos
  const indicesRelatorioPorValor = new Map() // valor -> [pagamentos]
  pagamentosRelatorio.forEach(pag => {
    if (!indicesRelatorioPorValor.has(pag.valor)) {
      indicesRelatorioPorValor.set(pag.valor, [])
    }
    indicesRelatorioPorValor.get(pag.valor).push(pag)
  })
  
  // Agora verifica pagamentos do extrato que NÃO foram encontrados
  pagamentosExtrato.forEach(pagExtrato => {
    // Ignora se descrição for null, undefined ou vazia
    const descricaoValida = pagExtrato.descricao && String(pagExtrato.descricao).trim().length > 0
    if (!descricaoValida) {
      // Registro sem descrição válida - ignora e não adiciona aos não encontrados
      return
    }
    
    const chaveExtrato = `${pagExtrato.linhaOriginal}|${pagExtrato.valor}|${pagExtrato.descricao}`
    
    if (!extratoUsados.has(chaveExtrato)) {
      // Busca valores próximos no relatório
      const valoresProximos = []
      const todosValoresRelatorio = Array.from(indicesRelatorioPorValor.keys()).sort((a, b) => a - b)
      
      // Busca valores próximos (dentro de 1% de diferença)
      const tolerancia = pagExtrato.valor * 0.01
      todosValoresRelatorio.forEach(val => {
        const diff = Math.abs(val - pagExtrato.valor)
        if (diff <= tolerancia && diff > 0) {
          valoresProximos.push({
            valor: val,
            diferenca: diff,
            diferencaPercentual: ((diff / pagExtrato.valor) * 100).toFixed(2) + '%'
          })
        }
      })
      
      const detalhesDebug = valoresProximos.length > 0
        ? `Valor procurado: R$ ${pagExtrato.valor.toFixed(2)} | Valores próximos encontrados no relatório: ${valoresProximos.slice(0, 3).map(v => `R$ ${v.valor.toFixed(2)} (dif: ${v.diferencaPercentual})`).join(', ')}`
        : `Valor: R$ ${pagExtrato.valor.toFixed(2)}, Descrição: ${pagExtrato.descricao}`
      
      console.log(`[CONCILIA DEBUG] Não encontrado no RELATÓRIO: Linha ${pagExtrato.linhaOriginal} | Valor: R$ ${pagExtrato.valor.toFixed(2)} | Descrição: "${pagExtrato.descricao}"`)
      if (valoresProximos.length > 0) {
        console.log(`[CONCILIA DEBUG]   → Valores próximos no relatório: ${valoresProximos.slice(0, 3).map(v => `R$ ${v.valor.toFixed(2)}`).join(', ')}`)
      }
      
      resultados.naoEncontradosNoRelatorio.push({
        ...pagExtrato,
        motivo: 'Pagamento presente no Extrato Bancário mas AUSENTE no Relatório Planaltec',
        detalhes: detalhesDebug,
        debug: {
          valorProcurado: pagExtrato.valor,
          valorOriginal: pagExtrato.valorOriginal,
          valoresProximos: valoresProximos.slice(0, 5)
        }
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
  const criarAbaFormatada = async (dados, nomeAba, tipoPlanilha) => {
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
    
    // Adiciona cabeçalho com tipo de planilha dentro da célula "Linha"
    // Encontra o índice da coluna "Linha"
    const indiceLinha = colunas.indexOf('Linha')
    
    // Cria cabeçalho modificando apenas a coluna "Linha" para incluir o tipo de planilha
    const headerValues = colunas.map((col, index) => {
      // Se for a coluna "Linha", adiciona quebra de linha e tipo de planilha
      if (index === indiceLinha) {
        return `Linha\n${tipoPlanilha}`
      }
      return col
    })
    
    const headerRow = worksheet.addRow(headerValues)
    
    // Formata cabeçalho
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' } // Azul escuro
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    headerRow.height = 35 // Altura maior para acomodar duas linhas de texto
    
    // Adiciona bordas no cabeçalho e garante wrapText
    headerRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
      // Garante wrapText para que a quebra de linha funcione
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
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
  
  // Aba 1: Pagamentos não encontrados no Extrato (estão no Relatório, faltam no Extrato)
  if (naoEncontradosNoExtrato.length > 0) {
    const dadosExtrato = naoEncontradosNoExtrato.map((pag, index) => ({
      'Linha': pag.linhaOriginal || index + 1,
      'Valor': pag.valorOriginal || pag.valor,
      'Valor Normalizado': `R$ ${pag.valor?.toFixed(2) || '0.00'}`,
      'Descrição': pag.descricao || '',
      'Motivo': pag.motivo || 'Pagamento presente no Relatório Planaltec mas AUSENTE no Extrato Bancário',
      'Detalhes': pag.detalhes || ''
    }))
    
    await criarAbaFormatada(dadosExtrato, 'Faltam no Extrato', 'Relatorio')
    console.log(`[CONCILIA] Aba "Faltam no Extrato": ${naoEncontradosNoExtrato.length} registros formatados`)
  }
  
  // Aba 2: Pagamentos não encontrados no Relatório (estão no Extrato, faltam no Relatório)
  if (naoEncontradosNoRelatorio.length > 0) {
    const dadosRelatorio = naoEncontradosNoRelatorio.map((pag, index) => ({
      'Linha': pag.linhaOriginal || index + 1,
      'Valor': pag.valorOriginal || pag.valor,
      'Valor Normalizado': `R$ ${pag.valor?.toFixed(2) || '0.00'}`,
      'Descrição': pag.descricao || '',
      'Motivo': pag.motivo || 'Pagamento presente no Extrato Bancário mas AUSENTE no Relatório Planaltec',
      'Detalhes': pag.detalhes || ''
    }))
    
    await criarAbaFormatada(dadosRelatorio, 'Faltam no Relatório', 'Extrato')
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

/**
 * Função auxiliar para debugar casos específicos
 * Permite investigar por que um pagamento específico não foi encontrado
 * @param {Array} pagamentosExtrato - Lista de pagamentos do extrato
 * @param {Array} pagamentosRelatorio - Lista de pagamentos do relatório
 * @param {Object} caso - Caso a investigar: { tipo: 'extrato'|'relatorio', linha: número, valor?: número, descricao?: string }
 */
function investigarCaso(pagamentosExtrato, pagamentosRelatorio, caso) {
  console.log(`[CONCILIA INVESTIGAÇÃO] ====================================`)
  console.log(`[CONCILIA INVESTIGAÇÃO] Investigando caso específico:`)
  console.log(`[CONCILIA INVESTIGAÇÃO] Tipo: ${caso.tipo}`)
  console.log(`[CONCILIA INVESTIGAÇÃO] Linha: ${caso.linha}`)
  
  let pagamentoEncontrado = null
  
  if (caso.tipo === 'extrato') {
    pagamentoEncontrado = pagamentosExtrato.find(p => p.linhaOriginal === caso.linha)
    if (!pagamentoEncontrado) {
      console.log(`[CONCILIA INVESTIGAÇÃO] ❌ Pagamento não encontrado no EXTRATO (linha ${caso.linha})`)
      return
    }
    
    console.log(`[CONCILIA INVESTIGAÇÃO] Pagamento encontrado no EXTRATO:`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Linha: ${pagamentoEncontrado.linhaOriginal}`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Valor Original: ${pagamentoEncontrado.valorOriginal}`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Valor Normalizado: R$ ${pagamentoEncontrado.valor.toFixed(2)}`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Descrição: "${pagamentoEncontrado.descricao}"`)
    
    // Busca no relatório
    const candidatosNoRelatorio = pagamentosRelatorio.filter(p => p.valor === pagamentoEncontrado.valor)
    console.log(`[CONCILIA INVESTIGAÇÃO]`)
    console.log(`[CONCILIA INVESTIGAÇÃO] Candidatos no RELATÓRIO com mesmo valor (R$ ${pagamentoEncontrado.valor.toFixed(2)}): ${candidatosNoRelatorio.length}`)
    
    candidatosNoRelatorio.forEach((cand, idx) => {
      const palavrasComuns = contarPalavrasComuns(pagamentoEncontrado.descricao, cand.descricao)
      console.log(`[CONCILIA INVESTIGAÇÃO]   ${idx + 1}. Linha ${cand.linhaOriginal} | Palavras comuns: ${palavrasComuns}`)
      console.log(`[CONCILIA INVESTIGAÇÃO]      Descrição: "${cand.descricao}"`)
      console.log(`[CONCILIA INVESTIGAÇÃO]      Valor Original: ${cand.valorOriginal}`)
    })
    
    if (candidatosNoRelatorio.length === 0) {
      // Busca valores próximos
      const valoresProximos = pagamentosRelatorio
        .map(p => ({ pag: p, diff: Math.abs(p.valor - pagamentoEncontrado.valor) }))
        .filter(v => v.diff > 0)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5)
      
      console.log(`[CONCILIA INVESTIGAÇÃO]`)
      console.log(`[CONCILIA INVESTIGAÇÃO] Valores próximos no RELATÓRIO:`)
      valoresProximos.forEach((v, idx) => {
        const diffPerc = ((v.diff / pagamentoEncontrado.valor) * 100).toFixed(2)
        console.log(`[CONCILIA INVESTIGAÇÃO]   ${idx + 1}. Linha ${v.pag.linhaOriginal} | Valor: R$ ${v.pag.valor.toFixed(2)} | Diferença: R$ ${v.diff.toFixed(2)} (${diffPerc}%)`)
        console.log(`[CONCILIA INVESTIGAÇÃO]      Descrição: "${v.pag.descricao}"`)
      })
    }
    
  } else if (caso.tipo === 'relatorio') {
    pagamentoEncontrado = pagamentosRelatorio.find(p => p.linhaOriginal === caso.linha)
    if (!pagamentoEncontrado) {
      console.log(`[CONCILIA INVESTIGAÇÃO] ❌ Pagamento não encontrado no RELATÓRIO (linha ${caso.linha})`)
      return
    }
    
    console.log(`[CONCILIA INVESTIGAÇÃO] Pagamento encontrado no RELATÓRIO:`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Linha: ${pagamentoEncontrado.linhaOriginal}`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Valor Original: ${pagamentoEncontrado.valorOriginal}`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Valor Normalizado: R$ ${pagamentoEncontrado.valor.toFixed(2)}`)
    console.log(`[CONCILIA INVESTIGAÇÃO]   Descrição: "${pagamentoEncontrado.descricao}"`)
    
    // Busca no extrato
    const candidatosNoExtrato = pagamentosExtrato.filter(p => p.valor === pagamentoEncontrado.valor)
    console.log(`[CONCILIA INVESTIGAÇÃO]`)
    console.log(`[CONCILIA INVESTIGAÇÃO] Candidatos no EXTRATO com mesmo valor (R$ ${pagamentoEncontrado.valor.toFixed(2)}): ${candidatosNoExtrato.length}`)
    
    candidatosNoExtrato.forEach((cand, idx) => {
      const palavrasComuns = contarPalavrasComuns(pagamentoEncontrado.descricao, cand.descricao)
      console.log(`[CONCILIA INVESTIGAÇÃO]   ${idx + 1}. Linha ${cand.linhaOriginal} | Palavras comuns: ${palavrasComuns}`)
      console.log(`[CONCILIA INVESTIGAÇÃO]      Descrição: "${cand.descricao}"`)
      console.log(`[CONCILIA INVESTIGAÇÃO]      Valor Original: ${cand.valorOriginal}`)
    })
    
    if (candidatosNoExtrato.length === 0) {
      // Busca valores próximos
      const valoresProximos = pagamentosExtrato
        .map(p => ({ pag: p, diff: Math.abs(p.valor - pagamentoEncontrado.valor) }))
        .filter(v => v.diff > 0)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5)
      
      console.log(`[CONCILIA INVESTIGAÇÃO]`)
      console.log(`[CONCILIA INVESTIGAÇÃO] Valores próximos no EXTRATO:`)
      valoresProximos.forEach((v, idx) => {
        const diffPerc = ((v.diff / pagamentoEncontrado.valor) * 100).toFixed(2)
        console.log(`[CONCILIA INVESTIGAÇÃO]   ${idx + 1}. Linha ${v.pag.linhaOriginal} | Valor: R$ ${v.pag.valor.toFixed(2)} | Diferença: R$ ${v.diff.toFixed(2)} (${diffPerc}%)`)
        console.log(`[CONCILIA INVESTIGAÇÃO]      Descrição: "${v.pag.descricao}"`)
      })
    }
  }
  
  console.log(`[CONCILIA INVESTIGAÇÃO] ====================================`)
}

// Exporta funções para uso em outros módulos
module.exports = {
  realizarConciliacao,
  gerarPlanilhaIrregulares,
  normalizarValorAbsoluto,
  normalizarData,
  compararDatas,
  removerAcentos,
  contarPalavrasComuns,
  processarExtratoBancario,
  processarRelatorioPlanaltec,
  cruzarPagamentos,
  investigarCaso
}
