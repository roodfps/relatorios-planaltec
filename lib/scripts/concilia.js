/**
 * Script Modular de Conciliação Bancária
 * 
 * Funcionalidade:
 * - Compara duas planilhas (Extrato Bancário vs Relatório Financeiro)
 * - Identifica pagamentos presentes em um e ausentes no outro (e vice-versa)
 * - Gera relatório de incongruências
 * 
 * Estratégias de Cruzamento:
 * 1. Por Identificador Único (Documento vs Identificador)
 * 2. Por Valor + Data (tolerância para valores monetários)
 * 3. Por CPF/CNPJ + Valor + Data
 * 
 * Uso:
 * - Via API route: POST /api/processar-planilha (modo conciliação)
 * - Importado em outros módulos
 */

const XLSX = require('xlsx')

/**
 * Normaliza um valor monetário para comparação
 * Remove pontos, vírgulas e espaços, converte para número
 */
function normalizarValor(valor) {
  if (!valor || valor === '' || valor === null || valor === undefined) {
    return null
  }
  
  // Converte para string e remove espaços
  let valorStr = String(valor).trim()
  
  // Remove texto como "R$", "Débito", "Crédito", etc
  valorStr = valorStr.replace(/[R$\s]/g, '')
  
  // Remove pontos (milhares) e substitui vírgula por ponto (decimal)
  valorStr = valorStr.replace(/\./g, '').replace(',', '.')
  
  // Remove sinal de negativo e guarda
  const negativo = valorStr.startsWith('-')
  valorStr = valorStr.replace(/^-/, '')
  
  // Tenta converter para número
  const numero = parseFloat(valorStr)
  
  if (isNaN(numero)) {
    return null
  }
  
  return negativo ? -numero : numero
}

/**
 * Normaliza data para comparação
 * Aceita vários formatos e converte para timestamp
 */
function normalizarData(data) {
  if (!data || data === '' || data === null || data === undefined) {
    return null
  }
  
  const dataStr = String(data).trim()
  
  // Tenta diferentes formatos de data
  // Formato: DD/MM/YYYY
  const match1 = dataStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (match1) {
    const dia = parseInt(match1[1])
    const mes = parseInt(match1[2]) - 1 // Mês em JS é 0-indexed
    const ano = parseInt(match1[3]) < 100 ? 2000 + parseInt(match1[3]) : parseInt(match1[3])
    const dataObj = new Date(ano, mes, dia)
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toISOString().split('T')[0] // Retorna YYYY-MM-DD
    }
  }
  
  // Formato: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return dataStr
  }
  
  // Se for um número (serial do Excel)
  const numero = parseFloat(dataStr)
  if (!isNaN(numero)) {
    // Converte serial do Excel para data (1 = 1900-01-01)
    const dataObj = XLSX.SSF.parse_date_code(numero)
    if (dataObj) {
      const ano = dataObj.y
      const mes = String(dataObj.m).padStart(2, '0')
      const dia = String(dataObj.d).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    }
  }
  
  return null
}

/**
 * Normaliza CPF/CNPJ para comparação
 * Remove pontos, traços e barras
 */
function normalizarCPFCNPJ(cpfCnpj) {
  if (!cpfCnpj || cpfCnpj === '' || cpfCnpj === null || cpfCnpj === undefined) {
    return null
  }
  
  return String(cpfCnpj).replace(/[.\-\/\s]/g, '').trim()
}

/**
 * Normaliza documento/identificador para comparação
 */
function normalizarDocumento(doc) {
  if (!doc || doc === '' || doc === null || doc === undefined) {
    return null
  }
  
  return String(doc).trim().toUpperCase()
}

/**
 * Encontra a coluna correta baseado nos tipos detectados
 * Usa os arquivos de instruções para mapear as colunas
 * Também procura por palavras-chave nos exemplos
 */
function encontrarColuna(instrucoes, tiposEsperados, palavrasChave = []) {
  if (!instrucoes || !instrucoes.planilhas || instrucoes.planilhas.length === 0) {
    return null
  }
  
  const planilha = instrucoes.planilhas[0]
  if (!planilha.colunas) {
    return null
  }
  
  // Primeiro, procura por palavras-chave nos exemplos
  if (palavrasChave.length > 0) {
    for (const coluna of planilha.colunas) {
      if (coluna.exemplos && coluna.exemplos.length > 0) {
        const exemplosTexto = coluna.exemplos.join(' ').toLowerCase()
        if (palavrasChave.some(palavra => exemplosTexto.includes(palavra.toLowerCase()))) {
          console.log(`[CONCILIA] Coluna "${coluna.nome}" encontrada por palavra-chave: ${palavrasChave.join(', ')}`)
          return coluna.nome
        }
      }
    }
  }
  
  // Depois, procura por tipos
  for (const coluna of planilha.colunas) {
    if (tiposEsperados.some(tipo => coluna.tipo === tipo || coluna.formato === tipo)) {
      console.log(`[CONCILIA] Coluna "${coluna.nome}" encontrada por tipo: ${tiposEsperados.join(', ')}`)
      return coluna.nome
    }
  }
  
  return null
}

/**
 * Processa planilha do extrato bancário
 * Extrai pagamentos (débitos) e identifica campos relevantes
 */
function processarExtratoBancario(workbook, instrucoes) {
  console.log('[CONCILIA] Processando extrato bancário...')
  
  const planilha = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[planilha]
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    defval: null,
    raw: false 
  })
  
  // Tenta identificar colunas automaticamente baseado nas instruções
  // Usa palavras-chave dos exemplos para melhor detecção
  const colData = encontrarColuna(instrucoes, ['data_texto', 'data'], ['data', '28/10/2025', '29/10/2025']) || 
                  dados[0] ? Object.keys(dados[0]).find(key => 
                    dados[0][key] && /data/i.test(String(dados[0][key])) && 
                    /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(String(dados[0][key]))
                  ) : null
  
  const colDocumento = encontrarColuna(instrucoes, ['numero_texto', 'codigo'], ['dcto', '1614494', '1100590']) ||
                       (dados[0] ? Object.keys(dados[0]).find(key => {
                         const valor = String(dados[0][key] || '')
                         return (/dcto|documento|id/i.test(valor) || /^\d{6,}$/.test(valor)) &&
                                !/data|data pagamento/i.test(valor)
                       }) : null)
  
  const colDescricao = encontrarColuna(instrucoes, ['texto'], ['lançamento', 'bradesco', 'transferencia', 'devolucao']) ||
                       (dados[0] ? Object.keys(dados[0]).find(key => {
                         const valor = String(dados[0][key] || '')
                         return /lancamento|descricao/i.test(valor) &&
                                !/dcto|documento|cr[ée]dito|d[ée]bito|saldo/i.test(valor)
                       }) : null)
  
  const colDebito = encontrarColuna(instrucoes, ['texto'], ['débito', '-150,00', '-129,94', '-177,00']) ||
                    (dados[0] ? Object.keys(dados[0]).find(key => {
                      const valor = String(dados[0][key] || '')
                      return /d[ée]bito/i.test(valor) && /-?\d+[,.]?\d*/.test(valor)
                    }) : null)
  
  const colCredito = dados[0] ? Object.keys(dados[0]).find(key => {
    const valor = String(dados[0][key] || '')
    return /cr[ée]dito/i.test(valor)
  }) : null
  
  console.log('[CONCILIA] Colunas detectadas no extrato:', {
    data: colData,
    documento: colDocumento,
    descricao: colDescricao,
    debito: colDebito,
    credito: colCredito
  })
  
  // Filtra apenas linhas com débito (pagamentos)
  const pagamentos = []
  
  dados.forEach((linha, index) => {
    // Ignora cabeçalhos e linhas vazias
    if (!linha || Object.keys(linha).length === 0) {
      return
    }
    
    const valorDebito = normalizarValor(linha[colDebito])
    const valorCredito = normalizarValor(linha[colCredito])
    
    // Considera apenas débitos (valores negativos ou presentes em débito)
    if (!valorDebito || valorDebito >= 0) {
      return
    }
    
    // Converte valor negativo para positivo para comparação
    const valorAbsoluto = Math.abs(valorDebito)
    
    const pagamento = {
      linhaOriginal: index + 1,
      data: normalizarData(linha[colData]),
      dataOriginal: linha[colData],
      documento: normalizarDocumento(linha[colDocumento]),
      documentoOriginal: linha[colDocumento],
      descricao: linha[colDescricao] || '',
      valor: valorAbsoluto,
      valorOriginal: linha[colDebito],
      tipo: 'extrato_bancario'
    }
    
    pagamentos.push(pagamento)
  })
  
  console.log(`[CONCILIA] ${pagamentos.length} pagamentos encontrados no extrato bancário`)
  
  return {
    totalLinhas: dados.length,
    pagamentos: pagamentos,
    colunas: {
      data: colData,
      documento: colDocumento,
      descricao: colDescricao,
      debito: colDebito
    }
  }
}

/**
 * Processa planilha do relatório financeiro
 * Extrai pagamentos identificados e campos relevantes
 */
function processarRelatorioFinanceiro(workbook, instrucoes) {
  console.log('[CONCILIA] Processando relatório financeiro...')
  
  const planilha = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[planilha]
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    defval: null,
    raw: false 
  })
  
  // Tenta identificar colunas automaticamente usando instruções e palavras-chave
  const colData = encontrarColuna(instrucoes, ['data_texto', 'data'], ['data pagamento', '29/10/2025']) ||
                  (dados[0] ? Object.keys(dados[0]).find(key => {
                    const valor = String(dados[0][key] || '')
                    return /data/i.test(valor) && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(valor)
                  }) : null)
  
  const colIdentificador = encontrarColuna(instrucoes, ['codigo'], ['identificador', '25319034769011f39cc095']) ||
                           (dados[0] ? Object.keys(dados[0]).find(key => {
                             const valor = String(dados[0][key] || '')
                             return /identificador|id/i.test(valor) || /^[a-f0-9]{20,}$/i.test(valor)
                           }) : null)
  
  const colCPFCNPJ = encontrarColuna(instrucoes, ['cpf', 'cnpj'], ['cpf/cnpj', '975.205.787-04', '94.311.315/104']) ||
                     (dados[0] ? Object.keys(dados[0]).find(key => {
                       const valor = String(dados[0][key] || '')
                       return (/cpf|cnpj/i.test(valor) || /\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/.test(valor))
                     }) : null)
  
  const colValor = encontrarColuna(instrucoes, ['numero_texto'], ['valor pago', '380.00', '534.44', '150.00']) ||
                  (dados[0] ? Object.keys(dados[0]).find(key => {
                    const valor = String(dados[0][key] || '')
                    return /valor/i.test(valor) && /\d+\.?\d{0,2}/.test(valor) && !/mensalidade/i.test(valor)
                  }) : null)
  
  const colFavorecido = dados[0] ? Object.keys(dados[0]).find(key => {
    const valor = String(dados[0][key] || '')
    return /favorecido/i.test(valor) && !/cpf|cnpj|tecnico/i.test(valor)
  }) : null
  
  const colNomeTecnico = dados[0] ? Object.keys(dados[0]).find(key => {
    const valor = String(dados[0][key] || '')
    return /tecnico/i.test(valor) && !/cpf|cnpj|favorecido/i.test(valor)
  }) : null
  
  console.log('[CONCILIA] Colunas detectadas no relatório:', {
    data: colData,
    identificador: colIdentificador,
    cpfCnpj: colCPFCNPJ,
    valor: colValor,
    favorecido: colFavorecido,
    nomeTecnico: colNomeTecnico
  })
  
  // Extrai pagamentos
  const pagamentos = []
  
  dados.forEach((linha, index) => {
    // Ignora cabeçalhos e linhas vazias
    if (!linha || Object.keys(linha).length === 0) {
      return
    }
    
    // Ignora linhas de cabeçalho
    if (colNomeTecnico && linha[colNomeTecnico] && 
        /nome|tecnico/i.test(String(linha[colNomeTecnico]))) {
      return
    }
    
    const valor = normalizarValor(linha[colValor])
    
    // Ignora valores zero ou inválidos
    if (!valor || valor <= 0) {
      return
    }
    
    const pagamento = {
      linhaOriginal: index + 1,
      data: normalizarData(linha[colData]),
      dataOriginal: linha[colData],
      identificador: normalizarDocumento(linha[colIdentificador]),
      identificadorOriginal: linha[colIdentificador],
      cpfCnpj: normalizarCPFCNPJ(linha[colCPFCNPJ]),
      cpfCnpjOriginal: linha[colCPFCNPJ],
      favorecido: linha[colFavorecido] || '',
      nomeTecnico: linha[colNomeTecnico] || '',
      valor: valor,
      valorOriginal: linha[colValor],
      tipo: 'relatorio_financeiro'
    }
    
    pagamentos.push(pagamento)
  })
  
  console.log(`[CONCILIA] ${pagamentos.length} pagamentos encontrados no relatório financeiro`)
  
  return {
    totalLinhas: dados.length,
    pagamentos: pagamentos,
    colunas: {
      data: colData,
      identificador: colIdentificador,
      cpfCnpj: colCPFCNPJ,
      valor: colValor,
      favorecido: colFavorecido
    }
  }
}

/**
 * Cruza os pagamentos entre as duas planilhas de forma eficiente
 * Identifica claramente o que NÃO está em cada planilha
 */
function cruzarPagamentos(extrato, relatorio, toleranciaValor = 0.01) {
  console.log('[CONCILIA] Cruzando pagamentos...')
  
  const resultados = {
    encontrados: [],
    naoEncontradosNoExtrato: [], // Está no relatório mas NÃO está no extrato
    naoEncontradosNoRelatorio: [], // Está no extrato mas NÃO está no relatório
    possiveisDivergencias: []
  }
  
  // Cria índices para busca rápida no extrato
  const indicesExtrato = {
    porDocumento: new Map(), // documento -> pagamento
    porValorData: new Map(), // "valor|data" -> [pagamentos]
    porValor: new Map(), // valor -> [pagamentos]
    todos: new Set() // Set de chaves únicas para marcar como encontrados
  }
  
  // Indexa pagamentos do extrato
  extrato.pagamentos.forEach(pag => {
    // Índice por documento
    if (pag.documento) {
      indicesExtrato.porDocumento.set(pag.documento, pag)
    }
    
    // Índice por valor + data (chave única)
    if (pag.valor && pag.data) {
      const chaveValorData = `${pag.valor.toFixed(2)}|${pag.data}`
      if (!indicesExtrato.porValorData.has(chaveValorData)) {
        indicesExtrato.porValorData.set(chaveValorData, [])
      }
      indicesExtrato.porValorData.get(chaveValorData).push(pag)
      
      // Índice por valor apenas (para busca aproximada)
      const chaveValor = pag.valor.toFixed(2)
      if (!indicesExtrato.porValor.has(chaveValor)) {
        indicesExtrato.porValor.set(chaveValor, [])
      }
      indicesExtrato.porValor.get(chaveValor).push(pag)
    }
    
    // Chave única para marcar como encontrado
    const chaveUnica = `${pag.documento || 'N/A'}|${pag.valor}|${pag.data}`
    indicesExtrato.todos.add(chaveUnica)
  })
  
  console.log(`[CONCILIA] Índices criados: ${indicesExtrato.porDocumento.size} documentos, ${indicesExtrato.porValorData.size} combinações valor+data`)
  
  // Conjunto para marcar pagamentos do relatório que foram encontrados
  const relatoriosEncontrados = new Set()
  
  // Verifica cada pagamento do relatório contra o extrato
  relatorio.pagamentos.forEach((pagRelatorio, index) => {
    let encontrado = false
    let metodoEncontrado = null
    let pagExtratoCorrespondente = null
    
    // Estratégia 1: Por identificador/documento (mais confiável)
    if (pagRelatorio.identificador) {
      // Tenta match exato primeiro
      if (indicesExtrato.porDocumento.has(pagRelatorio.identificador)) {
        encontrado = true
        metodoEncontrado = 'identificador_exato'
        pagExtratoCorrespondente = indicesExtrato.porDocumento.get(pagRelatorio.identificador)
      } else {
        // Tenta match parcial (substring)
        for (const [doc, pagExtrato] of indicesExtrato.porDocumento.entries()) {
          if (doc && pagRelatorio.identificador &&
              (doc.includes(pagRelatorio.identificador) || 
               pagRelatorio.identificador.includes(doc))) {
            encontrado = true
            metodoEncontrado = 'identificador_parcial'
            pagExtratoCorrespondente = pagExtrato
            break
          }
        }
      }
    }
    
    // Estratégia 2: Por valor + data exato (com tolerância)
    if (!encontrado && pagRelatorio.valor && pagRelatorio.data) {
      const chaveExata = `${pagRelatorio.valor.toFixed(2)}|${pagRelatorio.data}`
      const pagamentosCombinacao = indicesExtrato.porValorData.get(chaveExata)
      
      if (pagamentosCombinacao && pagamentosCombinacao.length > 0) {
        encontrado = true
        metodoEncontrado = 'valor_data_exato'
        pagExtratoCorrespondente = pagamentosCombinacao[0] // Pega o primeiro
        
        // Se houver múltiplos, remove do índice para não reutilizar
        if (pagamentosCombinacao.length > 1) {
          indicesExtrato.porValorData.set(chaveExata, pagamentosCombinacao.slice(1))
        } else {
          indicesExtrato.porValorData.delete(chaveExata)
        }
      }
    }
    
    // Estratégia 3: Por valor + data com tolerância (busca aproximada)
    if (!encontrado && pagRelatorio.valor && pagRelatorio.data) {
      const valorMin = pagRelatorio.valor - toleranciaValor
      const valorMax = pagRelatorio.valor + toleranciaValor
      
      // Busca na mesma data com valor próximo
      for (const pagExtrato of extrato.pagamentos) {
        if (pagExtrato.data === pagRelatorio.data &&
            pagExtrato.valor >= valorMin && pagExtrato.valor <= valorMax &&
            !relatoriosEncontrados.has(`${pagExtrato.documento || 'N/A'}|${pagExtrato.valor}|${pagExtrato.data}`)) {
          encontrado = true
          metodoEncontrado = 'valor_data_tolerancia'
          pagExtratoCorrespondente = pagExtrato
          break
        }
      }
    }
    
    // Estratégia 4: Por CPF/CNPJ + valor + data
    if (!encontrado && pagRelatorio.cpfCnpj && pagRelatorio.valor && pagRelatorio.data) {
      const cpfLimpo = pagRelatorio.cpfCnpj.replace(/[.\-\/]/g, '')
      const nomeFavorecido = String(pagRelatorio.favorecido || '').toLowerCase().split(' ')[0]
      
      for (const pagExtrato of extrato.pagamentos) {
        const descricao = String(pagExtrato.descricao || '').toLowerCase()
        const chaveUnica = `${pagExtrato.documento || 'N/A'}|${pagExtrato.valor}|${pagExtrato.data}`
        
        if (pagExtrato.data === pagRelatorio.data &&
            Math.abs(pagExtrato.valor - pagRelatorio.valor) <= toleranciaValor &&
            !relatoriosEncontrados.has(chaveUnica) &&
            (descricao.includes(cpfLimpo) || 
             (nomeFavorecido && nomeFavorecido.length > 2 && descricao.includes(nomeFavorecido)))) {
          encontrado = true
          metodoEncontrado = 'cpf_nome_valor_data'
          pagExtratoCorrespondente = pagExtrato
          break
        }
      }
    }
    
    if (encontrado) {
      resultados.encontrados.push({
        relatorio: pagRelatorio,
        extrato: pagExtratoCorrespondente,
        metodo: metodoEncontrado,
        confianca: metodoEncontrado.includes('exato') ? 'alta' : 
                   metodoEncontrado.includes('parcial') ? 'media' : 'baixa'
      })
      
      // Marca como encontrado (remove dos índices)
      const chaveUnica = `${pagExtratoCorrespondente.documento || 'N/A'}|${pagExtratoCorrespondente.valor}|${pagExtratoCorrespondente.data}`
      relatoriosEncontrados.add(chaveUnica)
      indicesExtrato.todos.delete(chaveUnica)
      
      if (pagExtratoCorrespondente.documento) {
        indicesExtrato.porDocumento.delete(pagExtratoCorrespondente.documento)
      }
    } else {
      // NÃO encontrado no extrato - adiciona detalhes claros
      resultados.naoEncontradosNoExtrato.push({
        ...pagRelatorio,
        motivo: 'Pagamento presente no Relatório Financeiro mas AUSENTE no Extrato Bancário',
        detalhes: `Valor: R$ ${pagRelatorio.valor.toFixed(2)}, Data: ${pagRelatorio.dataOriginal || pagRelatorio.data}, ${pagRelatorio.favorecido || pagRelatorio.nomeTecnico || ''}`
      })
    }
  })
  
  // Agora verifica pagamentos do extrato que NÃO foram encontrados no relatório
  extrato.pagamentos.forEach(pagExtrato => {
    const chaveUnica = `${pagExtrato.documento || 'N/A'}|${pagExtrato.valor}|${pagExtrato.data}`
    
    if (indicesExtrato.todos.has(chaveUnica)) {
      // NÃO foi encontrado no relatório
      resultados.naoEncontradosNoRelatorio.push({
        ...pagExtrato,
        motivo: 'Pagamento presente no Extrato Bancário mas AUSENTE no Relatório Financeiro',
        detalhes: `Valor: R$ ${pagExtrato.valor.toFixed(2)}, Data: ${pagExtrato.dataOriginal || pagExtrato.data}, Descrição: ${pagExtrato.descricao || ''}`
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
 * Função principal de conciliação
 * @param {Buffer} bufferExtrato - Buffer do arquivo de extrato bancário
 * @param {Buffer} bufferRelatorio - Buffer do arquivo de relatório financeiro
 * @param {Object} instrucoesExtrato - Instruções do modelo do extrato (opcional)
 * @param {Object} instrucoesRelatorio - Instruções do modelo do relatório (opcional)
 */
function realizarConciliacao(bufferExtrato, bufferRelatorio, instrucoesExtrato = null, instrucoesRelatorio = null) {
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
    const extratoProcessado = processarExtratoBancario(workbookExtrato, instrucoesExtrato)
    const relatorioProcessado = processarRelatorioFinanceiro(workbookRelatorio, instrucoesRelatorio)
    
    // Cruza os pagamentos
    const resultados = cruzarPagamentos(extratoProcessado, relatorioProcessado)
    
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
        totalExtrato: extratoProcessado.pagamentos.length,
        totalRelatorio: relatorioProcessado.pagamentos.length,
        totalEncontrados: resultados.encontrados.length,
        
        // Divergências - o que NÃO está em cada planilha
        naoEncontradosNoExtrato: {
          quantidade: resultados.naoEncontradosNoExtrato.length,
          valorTotal: valorTotalFaltanteNoExtrato,
          descricao: 'Pagamentos presentes no RELATÓRIO FINANCEIRO mas AUSENTES no EXTRATO BANCÁRIO'
        },
        naoEncontradosNoRelatorio: {
          quantidade: resultados.naoEncontradosNoRelatorio.length,
          valorTotal: valorTotalFaltanteNoRelatorio,
          descricao: 'Pagamentos presentes no EXTRATO BANCÁRIO mas AUSENTES no RELATÓRIO FINANCEIRO'
        },
        
        // Valores financeiros
        valorTotalConciliado: valorTotalConciliado,
        valorTotalFaltanteNoExtrato: valorTotalFaltanteNoExtrato,
        valorTotalFaltanteNoRelatorio: valorTotalFaltanteNoRelatorio,
        
        // Taxa de conciliação
        taxaConciliacao: relatorioProcessado.pagamentos.length > 0 
          ? ((resultados.encontrados.length / relatorioProcessado.pagamentos.length) * 100).toFixed(2) + '%'
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
    console.log(`[CONCILIA]   → Estão no Relatório Financeiro mas NÃO estão no Extrato Bancário`)
    console.log(`[CONCILIA] - Falta no RELATÓRIO: ${relatorio.resumo.naoEncontradosNoRelatorio.quantidade} pagamentos (R$ ${relatorio.resumo.naoEncontradosNoRelatorio.valorTotal.toFixed(2)})`)
    console.log(`[CONCILIA]   → Estão no Extrato Bancário mas NÃO estão no Relatório Financeiro`)
    console.log(`[CONCILIA]`)
    console.log(`[CONCILIA] Taxa de conciliação: ${relatorio.resumo.taxaConciliacao}`)
    console.log(`[CONCILIA] ==================================`)
    
    console.log('[CONCILIA] Conciliação concluída com sucesso')
    
    return relatorio
    
  } catch (erro) {
    console.error('[CONCILIA] Erro ao realizar conciliação:', erro)
    throw erro
  }
}

// Exporta funções para uso em outros módulos
module.exports = {
  realizarConciliacao,
  processarExtratoBancario,
  processarRelatorioFinanceiro,
  cruzarPagamentos,
  normalizarValor,
  normalizarData,
  normalizarCPFCNPJ,
  normalizarDocumento
}

