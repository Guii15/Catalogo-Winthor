import XLSX from 'xlsx';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXCEL_PATH = './Corretos.xlsx';
const JSON_SAIDA = './src/produtos.json';
const PASTA_IMAGENS = './public/imagens';
const MARKUP = 1.30; // custo + 30%

// Produtos temporariamente excluídos do catálogo (aguardando foto/verificação com fornecedor)
const EXCLUIDOS_TEMP = [
  20420, // GARRAFA DE ACO INOX 400ML AK-4009 — sem foto, verificar com fornecedor
  20421, // GARRAFA DE ACO INOX 400ML AK-6021 — sem foto, verificar com fornecedor
];

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
// Tenta aba "Produtos Ordenados", senão usa a primeira
const nomesAbas = wb.SheetNames;
const abaAlvo = nomesAbas.includes('Produtos Ordenados') ? 'Produtos Ordenados' : nomesAbas[0];
const sheet = wb.Sheets[abaAlvo];

// Lê como array de arrays para pular título e usar header da linha 1
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
// Row 0 = título, Row 1 = cabeçalho, Row 2+ = dados
const headers = raw[1] || [];
const linhas = raw.slice(2).filter(r => r[0]);

let comFoto = 0;
let semFoto = 0;

const COL = {
  cod:     headers.indexOf('CODPROD'),
  nome:    headers.indexOf('DESCRICAO'),
  estoque: headers.indexOf('QTD_EM_ESTOQUE'),
  custo:   headers.indexOf('PRECO_CUSTO'),
  pvenda:  headers.indexOf('PRECO_VENDA'),
};

const produtos = linhas
  .map(row => {
    const cod = parseInt(row[COL.cod]);
    if (!cod || isNaN(cod)) return null;
    const nome = (row[COL.nome] || '').toString().trim();
    if (!nome) return null;
    const fotoNome = `${cod}.jpg`;
    const custo = parsarPreco(row[COL.custo]);
    const pvendaBruto = parsarPreco(row[COL.pvenda]);
    const pvenda = pvendaBruto > 0 ? pvendaBruto : parseFloat((custo * MARKUP).toFixed(2));
    const estoque = parseInt(row[COL.estoque]) || 0;

    const imgPath = join(PASTA_IMAGENS, fotoNome);
    const temImagem = existsSync(imgPath);
    if (temImagem) comFoto++; else semFoto++;

    return {
      codprod: cod,
      descricao: nome,
      pvenda,
      custo,
      estoque,
      categoria: classificar(nome),
      imagem: `/imagens/${fotoNome}`,
    };
  })
  .filter(Boolean);

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
