const fs = require('fs');
const csv = require('csv-parser');

const CAMINHO_CSV = './src/dados.csv';
const CAMINHO_JSON = './src/produtos.json';

const produtos = [];

// --- SUPER DICIONÁRIO DE CATEGORIAS ---
// O robô vai procurar essas palavras no nome do produto
const REGRAS_CATEGORIA = {
    'GAMER': ['GAMER', 'RGB', 'MECHANICAL', 'MECÂNICO', 'HEADSET', 'LED'],
    'SEGURANÇA': ['CAMERA', 'CÂMERA', 'DVR', 'CCTV', 'DOME', 'BULLET', 'MONITORAMENTO', 'ALARM'],
    'ENERGIA': ['BATERIA', 'PILHA', 'NOBREAK', 'FONTE', 'ESTABILIZADOR', 'TOMADA', 'FILTRO', 'CUBO', 'FUSIVEL'],
    'CONECTIVIDADE': ['CABO', 'CONECTOR', 'PLUG', 'RJ45', 'PATCH', 'HDMI', 'VGA', 'USB', 'ADAPTADOR', 'CONVERSOR'],
    'FERRAMENTAS': ['ALICATE', 'CHAVE', 'TESTADOR', 'PARAFUSADEIRA', 'ABRACADEIRA', 'ABRAÇADEIRA', 'ORGANIZADOR', 'FITA'],
    'PERIFÉRICOS': ['MOUSE', 'TECLADO', 'WEBCAM', 'FONE', 'MICROFONE', 'MOUSEPAD', 'CAIXA DE SOM', 'SPEAKER', 'JBL'],
    'REDE': ['ROTEADOR', 'SWITCH', 'WIFI', 'WIRELESS', 'ANTENA', 'MERCUSYS', 'TP-LINK'],
    'IMPRESSÃO': ['TINTA', 'CARTUCHO', 'TONER', 'IMPRESSORA', 'PAPEL'],
    'ILUMINAÇÃO': ['LAMPADA', 'LÂMPADA', 'REFLETOR', 'LED', 'ABAJUR', 'LUMINÁRIA']
};

console.log('🧠 Iniciando Classificação Inteligente 2.0...');

if (!fs.existsSync(CAMINHO_CSV)) {
    console.error('❌ ERRO: O arquivo dados.csv não está na pasta src!');
    process.exit(1);
}

fs.createReadStream(CAMINHO_CSV)
  .pipe(csv({ separator: ',' })) // Usa vírgula (ajuste para ';' se precisar)
  .on('data', (row) => {
    // 1. Limpa os nomes das colunas
    const chaves = Object.keys(row).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = row[key];
        return acc;
    }, {});

    // 2. Acha os dados (tenta vários nomes comuns)
    const cod = chaves['codprod'] || chaves['cod'] || chaves['id'];
    const desc = chaves['descricao'] || chaves['produto'] || chaves['nome'];
    let categoriaOriginal = chaves['categoria'] || chaves['seção'] || 'Geral';
    let preco = chaves['preco'] || chaves['pvenda'] || chaves['valor'] || '0';
    let estoque = chaves['estoque'] || '10';

    if (cod && desc) {
        let precoLimpo = parseFloat(preco.toString().replace('R$', '').replace(',', '.')) || 0;
        
        // --- LÓGICA INTELIGENTE ---
        let categoriaFinal = categoriaOriginal; // Começa com o que veio do CSV (ex: "Caixa de som")
        
        const nomeMaiusculo = desc.toUpperCase();

        // O Robô tenta achar uma categoria MELHOR
        for (const [categoria, palavras] of Object.entries(REGRAS_CATEGORIA)) {
            // Se encontrar alguma das palavras chaves no nome...
            if (palavras.some(palavra => nomeMaiusculo.includes(palavra))) {
                categoriaFinal = categoria; // ...Muda para a categoria padronizada!
                break; 
            }
        }
        
        // Se no final ainda for "Geral" ou vazio, tenta limpar
        if (!categoriaFinal || categoriaFinal === "") categoriaFinal = "Outros";

        produtos.push({
            codprod: parseInt(cod),
            descricao: desc.trim(),
            pvenda: precoLimpo, 
            estoque: parseInt(estoque),
            categoria: categoriaFinal, 
            imagem: `/imagens/${cod}.jpg` 
        });
    }
  })
  .on('end', () => {
    fs.writeFileSync(CAMINHO_JSON, JSON.stringify(produtos, null, 2));
    console.log(`✅ SUCESSO! ${produtos.length} produtos classificados.`);
    console.log('👀 Exemplo: "ABRACADEIRA" agora deve ser "FERRAMENTAS".');
    console.log('🚀 Rode o site para ver as mudanças!');
  });