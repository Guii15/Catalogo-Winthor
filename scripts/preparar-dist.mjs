import { readFileSync, copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

const produtos = JSON.parse(readFileSync('./src/produtos.json', 'utf8'));
const ORIGEM = './public/imagens';
const DESTINO = './dist/imagens';

// Limpa e recria a pasta de imagens no dist
if (existsSync(DESTINO)) rmSync(DESTINO, { recursive: true });
mkdirSync(DESTINO, { recursive: true });

let copiadas = 0;
let faltando = [];

for (const p of produtos) {
  const nomeArq = p.imagem.replace('/imagens/', '');
  const origem = join(ORIGEM, nomeArq);
  const destino = join(DESTINO, nomeArq);

  if (existsSync(origem)) {
    copyFileSync(origem, destino);
    copiadas++;
  } else {
    faltando.push(`${p.codprod} - ${p.descricao}`);
  }
}

console.log(`✅ ${copiadas} imagens copiadas para dist/imagens`);
if (faltando.length > 0) {
  console.log(`⚠️  ${faltando.length} produtos sem foto:`);
  faltando.forEach(f => console.log(`   - ${f}`));
}
