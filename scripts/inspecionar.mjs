import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const arquivos = [
  'C:/Users/Administrador/Desktop/Corretos.xlsx',
  'C:/Users/Administrador/Desktop/Site/Excel.xlsx',
  'C:/Users/Administrador/Desktop/Site/Cruzamento_Estoque.xlsx',
];

for (const caminho of arquivos) {
  try {
    const wb = XLSX.readFile(caminho);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n=== ${caminho.split('/').pop()} ===`);
    console.log('Abas:', wb.SheetNames.join(', '));
    console.log('Total linhas:', dados.length);
    if (dados.length > 0) {
      console.log('Colunas:', Object.keys(dados[0]).join(' | '));
      console.log('Linha 1:', JSON.stringify(dados[0]));
      console.log('Linha 2:', JSON.stringify(dados[1]));
    }
  } catch (e) {
    console.log(`ERRO em ${caminho}: ${e.message}`);
  }
}
