/**
 * Script Interativo de Detecção de Modelo de Planilha
 * 
 * Funcionalidade:
 * - Menu interativo para selecionar planilha
 * - Detecção automática de colunas e tipos de dados
 * - Geração de arquivo JSON com instruções do modelo
 * 
 * Uso:
 * - node lib/scripts/detector-modelo/detectar-modelo.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const XLSX = require('xlsx')

/**
 * Cria interface readline para entrada do usuário
 */
function criarInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

/**
 * Pergunta ao usuário e retorna a resposta
 */
function perguntar(pergunta) {
  const rl = criarInterface()
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      rl.close()
      resolve(resposta)
    })
  })
}

/**
 * Detecta o tipo de dado de uma célula
 */
function detectarTipo(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 'vazio'
  }
  
  // Verifica se é número
  if (typeof valor === 'number') {
    // Verifica se é data (número serial do Excel)
    if (valor > 1 && valor < 100000 && valor % 1 !== 0) {
      return 'data_serial'
    }
    // Verifica se é número inteiro ou decimal
    return valor % 1 === 0 ? 'numero_inteiro' : 'numero_decimal'
  }
  
  // Verifica se é string
  if (typeof valor === 'string') {
    // Verifica se parece ser uma data
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(valor) || 
        /^\d{4}-\d{2}-\d{2}$/.test(valor) ||
        /^\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}/.test(valor)) {
      return 'data_texto'
    }
    
    // Verifica se parece ser um número
    if (/^-?\d+\.?\d*$/.test(valor.trim())) {
      return 'numero_texto'
    }
    
    // Verifica se parece ser CPF
    if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(valor)) {
      return 'cpf'
    }
    
    // Verifica se parece ser CNPJ
    if (/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(valor)) {
      return 'cnpj'
    }
    
    // Verifica se parece ser email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      return 'email'
    }
    
    // Verifica se parece ser telefone
    if (/^[\d\s\(\)\-]+$/.test(valor) && valor.length >= 8) {
      return 'telefone'
    }
    
    // Verifica se parece ser código/ID
    if (/^[A-Z0-9\-_]+$/i.test(valor) && valor.length <= 50) {
      return 'codigo'
    }
    
    // String genérica
    return 'texto'
  }
  
  // Verifica se é boolean
  if (typeof valor === 'boolean') {
    return 'booleano'
  }
  
  // Verifica se é Date
  if (valor instanceof Date) {
    return 'data'
  }
  
  return 'desconhecido'
}

/**
 * Analisa uma coluna e retorna suas características
 */
function analisarColuna(dados, nomeColuna) {
  const valores = dados
    .map(linha => linha[nomeColuna])
    .filter(valor => valor !== null && valor !== undefined && valor !== '')
  
  if (valores.length === 0) {
    return {
      nome: nomeColuna,
      tipo: 'vazio',
      formato: null,
      totalValores: 0,
      valoresUnicos: 0,
      exemplos: []
    }
  }
  
  // Detecta tipos
  const tipos = valores.map(detectarTipo)
  const tipoPrincipal = tipos.reduce((acc, tipo) => {
    acc[tipo] = (acc[tipo] || 0) + 1
    return acc
  }, {})
  
  const tipoMaisFrequente = Object.keys(tipoPrincipal).reduce((a, b) => 
    tipoPrincipal[a] > tipoPrincipal[b] ? a : b
  )
  
  // Estatísticas
  const valoresUnicos = new Set(valores).size
  const exemplos = Array.from(new Set(valores)).slice(0, 5)
  
  // Detecta formato específico
  let formato = null
  if (tipoMaisFrequente.includes('data')) {
    formato = 'data'
  } else if (tipoMaisFrequente.includes('numero')) {
    const numeros = valores.filter(v => !isNaN(v)).map(Number)
    if (numeros.length > 0) {
      const min = Math.min(...numeros)
      const max = Math.max(...numeros)
      formato = `numero: ${min} a ${max}`
    }
  } else if (tipoMaisFrequente === 'cpf') {
    formato = 'cpf'
  } else if (tipoMaisFrequente === 'cnpj') {
    formato = 'cnpj'
  } else if (tipoMaisFrequente === 'email') {
    formato = 'email'
  } else if (tipoMaisFrequente === 'telefone') {
    formato = 'telefone'
  }
  
  return {
    nome: nomeColuna,
    tipo: tipoMaisFrequente,
    formato: formato,
    totalValores: valores.length,
    valoresUnicos: valoresUnicos,
    exemplos: exemplos.map(v => String(v).substring(0, 50)), // Limita tamanho
    distribuicaoTipos: tipoPrincipal
  }
}

/**
 * Detecta modelo da planilha
 */
function detectarModeloPlanilha(caminhoArquivo) {
  console.log(`\n[INFO] Lendo arquivo: ${caminhoArquivo}`)
  
  try {
    // Lê o arquivo
    const workbook = XLSX.readFile(caminhoArquivo)
    
    // Obtém todas as planilhas
    const planilhas = workbook.SheetNames.map(nomePlanilha => {
      console.log(`[INFO] Analisando planilha: ${nomePlanilha}`)
      
      const worksheet = workbook.Sheets[nomePlanilha]
      const dados = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false 
      })
      
      if (dados.length === 0) {
        return {
          nome: nomePlanilha,
          totalLinhas: 0,
          colunas: []
        }
      }
      
      // Obtém nomes das colunas
      const nomesColunas = Object.keys(dados[0])
      
      console.log(`[INFO] Encontradas ${nomesColunas.length} colunas: ${nomesColunas.join(', ')}`)
      console.log(`[INFO] Total de linhas: ${dados.length}`)
      
      // Analisa cada coluna
      const colunas = nomesColunas.map(nomeColuna => 
        analisarColuna(dados, nomeColuna)
      )
      
      return {
        nome: nomePlanilha,
        totalLinhas: dados.length,
        totalColunas: nomesColunas.length,
        colunas: colunas
      }
    })
    
    return {
      arquivo: path.basename(caminhoArquivo),
      dataDetecao: new Date().toISOString(),
      totalPlanilhas: planilhas.length,
      planilhas: planilhas
    }
    
  } catch (erro) {
    console.error(`[ERRO] Erro ao processar arquivo:`, erro.message)
    throw erro
  }
}

/**
 * Salva modelo em arquivo JSON
 */
function salvarModelo(modelo, caminhoSaida) {
  try {
    const conteudo = JSON.stringify(modelo, null, 2)
    fs.writeFileSync(caminhoSaida, conteudo, 'utf8')
    console.log(`\n[SUCESSO] Modelo salvo em: ${caminhoSaida}`)
    return true
  } catch (erro) {
    console.error(`[ERRO] Erro ao salvar arquivo:`, erro.message)
    return false
  }
}

/**
 * Lista arquivos na pasta atual
 */
function listarArquivos(diretorio) {
  try {
    const arquivos = fs.readdirSync(diretorio)
      .filter(arquivo => {
        const extensao = path.extname(arquivo).toLowerCase()
        return ['.xlsx', '.xls'].includes(extensao)
      })
      .map((arquivo, index) => ({
        index: index + 1,
        nome: arquivo,
        caminho: path.join(diretorio, arquivo)
      }))
    
    return arquivos
  } catch (erro) {
    console.error(`[ERRO] Erro ao listar arquivos:`, erro.message)
    return []
  }
}

/**
 * Menu principal
 */
async function menuPrincipal() {
  console.log('\n' + '='.repeat(60))
  console.log('  DETECTOR DE MODELO DE PLANILHA')
  console.log('='.repeat(60))
  console.log('\nOpções:')
  console.log('1. Escanear planilha na pasta atual')
  console.log('2. Escanear planilha por caminho completo')
  console.log('0. Sair')
  
  const opcao = await perguntar('\nEscolha uma opção: ')
  
  switch (opcao) {
    case '1':
      await escanearPastaAtual()
      break
    case '2':
      await escanearPorCaminho()
      break
    case '0':
      console.log('\nEncerrando...')
      process.exit(0)
      break
    default:
      console.log('\n[ERRO] Opção inválida!')
      await menuPrincipal()
  }
}

/**
 * Escaneia planilhas na pasta atual
 */
async function escanearPastaAtual() {
  const diretorioAtual = __dirname
  console.log(`\n[INFO] Buscando planilhas em: ${diretorioAtual}`)
  
  const arquivos = listarArquivos(diretorioAtual)
  
  if (arquivos.length === 0) {
    console.log('[AVISO] Nenhuma planilha encontrada na pasta atual!')
    await menuPrincipal()
    return
  }
  
  console.log('\nPlanilhas encontradas:')
  arquivos.forEach(arquivo => {
    console.log(`  ${arquivo.index}. ${arquivo.nome}`)
  })
  
  const escolha = await perguntar('\nEscolha o número da planilha: ')
  const indice = parseInt(escolha) - 1
  
  if (indice < 0 || indice >= arquivos.length) {
    console.log('[ERRO] Opção inválida!')
    await menuPrincipal()
    return
  }
  
  const arquivoEscolhido = arquivos[indice]
  await processarArquivo(arquivoEscolhido.caminho)
}

/**
 * Escaneia planilha por caminho completo
 */
async function escanearPorCaminho() {
  const caminho = await perguntar('\nDigite o caminho completo do arquivo: ')
  
  if (!fs.existsSync(caminho)) {
    console.log('[ERRO] Arquivo não encontrado!')
    await menuPrincipal()
    return
  }
  
  await processarArquivo(caminho)
}

/**
 * Processa o arquivo escolhido
 */
async function processarArquivo(caminhoArquivo) {
  try {
    console.log(`\n[INFO] Processando arquivo...`)
    
    // Detecta modelo
    const modelo = detectarModeloPlanilha(caminhoArquivo)
    
    // Mostra resumo
    console.log('\n' + '-'.repeat(60))
    console.log('RESUMO DA DETECÇÃO')
    console.log('-'.repeat(60))
    console.log(`Arquivo: ${modelo.arquivo}`)
    console.log(`Total de planilhas: ${modelo.totalPlanilhas}`)
    
    modelo.planilhas.forEach((planilha, index) => {
      console.log(`\nPlanilha ${index + 1}: ${planilha.nome}`)
      console.log(`  Linhas: ${planilha.totalLinhas}`)
      console.log(`  Colunas: ${planilha.totalColunas}`)
      console.log(`  Colunas detectadas:`)
      
      planilha.colunas.forEach(coluna => {
        console.log(`    - ${coluna.nome}`)
        console.log(`      Tipo: ${coluna.tipo}`)
        if (coluna.formato) {
          console.log(`      Formato: ${coluna.formato}`)
        }
        console.log(`      Valores: ${coluna.totalValores} (${coluna.valoresUnicos} únicos)`)
        if (coluna.exemplos.length > 0) {
          console.log(`      Exemplos: ${coluna.exemplos.slice(0, 3).join(', ')}`)
        }
      })
    })
    
    // Salva arquivo JSON
    const nomeBase = path.basename(caminhoArquivo, path.extname(caminhoArquivo))
    const nomeArquivoJson = `instrucoes-${nomeBase}.json`
    const caminhoJson = path.join(__dirname, nomeArquivoJson)
    
    const confirmar = await perguntar(`\nSalvar modelo em ${nomeArquivoJson}? (s/n): `)
    
    if (confirmar.toLowerCase() === 's' || confirmar.toLowerCase() === 'sim') {
      salvarModelo(modelo, caminhoJson)
    } else {
      console.log('[INFO] Modelo não salvo.')
    }
    
    // Volta ao menu
    await menuPrincipal()
    
  } catch (erro) {
    console.error(`[ERRO] Erro ao processar:`, erro.message)
    await menuPrincipal()
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    await menuPrincipal()
  } catch (erro) {
    console.error('[ERRO FATAL]', erro)
    process.exit(1)
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = { detectarModeloPlanilha, analisarColuna, detectarTipo }

