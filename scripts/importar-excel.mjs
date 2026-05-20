import XLSX from 'xlsx';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXCEL_PATH = './Corretos.xlsx';
const JSON_SAIDA = './src/produtos.json';
const PASTA_IMAGENS = './public/imagens';
const MARKUP = 1.30; // custo + 30%

// Dicionário de categorias (mesma lógica do atualizar.js, mas com encoding correto)
const REGRAS_CATEGORIA = {
  'GAMER':         ['GAMER', 'RGB', 'MECHANICAL', 'HEADSET', 'LED'],
  'SEGURANÇA':     ['CAMERA', 'CÂMERA', 'DVR', 'CCTV', 'DOME', 'BULLET', 'MONITORAMENTO', 'ALARM'],
  'ENERGIA':       ['BATERIA', 'PILHA', 'NOBREAK', 'FONTE', 'ESTABILIZADOR', 'TOMADA', 'FILTRO', 'CUBO', 'FUSIVEL'],
  'CONECTIVIDADE': ['CABO', 'CONECTOR', 'PLUG', 'RJ45', 'PATCH', 'HDMI', 'VGA', 'USB', 'ADAPTADOR', 'CONVERSOR'],
  'FERRAMENTAS':   ['ALICATE', 'CHAVE', 'TESTADOR', 'PARAFUSADEIRA', 'ABRACADEIRA', 'ABRAÇADEIRA', 'ORGANIZADOR', 'FITA'],
  'PERIFÉRICOS':   ['MOUSE', 'TECLADO', 'WEBCAM', 'FONE', 'MICROFONE', 'MOUSEPAD', 'CAIXA DE SOM', 'SPEAKER', 'JBL'],
  'REDE':          ['ROTEADOR', 'SWITCH', 'WIFI', 'WIRELESS', 'ANTENA', 'MERCUSYS', 'TP-LINK'],
  'IMPRESSÃO':     ['TINTA', 'CARTUCHO', 'TONER', 'IMPRESSORA', 'PAPEL'],
  'ILUMINAÇÃO':    ['LAMPADA', 'LÂMPADA', 'REFLETOR', 'ABAJUR', 'LUMINÁRIA'],
};

function classificar(nome) {
  const upper = nome.toUpperCase();
  for (const [cat, palavras] of Object.entries(REGRAS_CATEGORIA)) {
    if (palavras.some(p => upper.includes(p))) return cat;
  }
  return 'OUTROS';
}

function parsarPreco(valor) {
  if (!valor) return 0;
  if (typeof valor === 'number') return parseFloat(valor.toFixed(2));
  // "R$ 19,90" → 19.90
  const limpo = valor.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(limpo) || 0;
}

const wb = XLSX.readFile(EXCEL_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const linhas = XLSX.utils.sheet_to_json(sheet);

let comFoto = 0;
let semFoto = 0;

const produtos = linhas
  .filter(row => row['Código'] && row['Produto'])
  .map(row => {
    const cod = parseInt(row['Código']);
    const nome = row['Produto'].toString().trim();
    const fotoNome = `${cod}.jpg`;
    const custo = parsarPreco(row['Custo (R$)']);
    const estoque = parseInt(row['Qtd. Estoque']) || 0;

    // Preço = custo + 30%
    const preco = custo > 0 ? parseFloat((custo * MARKUP).toFixed(2)) : 0;

    // Verifica se a imagem existe na pasta public/imagens
    const imgPath = join(PASTA_IMAGENS, fotoNome);
    const temImagem = existsSync(imgPath);
    if (temImagem) comFoto++; else semFoto++;

    return {
      codprod: cod,
      descricao: nome,
      pvenda: preco,
      custo,
      estoque,
      categoria: classificar(nome),
      imagem: `/imagens/${fotoNome}`,
    };
  });

writeFileSync(JSON_SAIDA, JSON.stringify(produtos, null, 2), 'utf8');

console.log(`✅ Importação concluída!`);
console.log(`   Total de produtos: ${produtos.length}`);
console.log(`   Com foto na pasta: ${comFoto}`);
console.log(`   Sem foto (placeholder): ${semFoto}`);
console.log(`   Preço zero (SOB CONSULTA): ${produtos.filter(p => p.pvenda === 0).length}`);
console.log(`\n   Categorias encontradas:`);
const cats = {};
produtos.forEach(p => { cats[p.categoria] = (cats[p.categoria] || 0) + 1; });
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`     ${c}: ${n}`));
