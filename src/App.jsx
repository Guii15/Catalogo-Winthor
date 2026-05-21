import { useState, useCallback, useRef } from 'react'
import jsPDF from 'jspdf'
import './App.css'
import produtos from './produtos.json'
import LoadingScreen from './LoadingScreen'

const VENDEDORES = [
  { nome: 'Patrícia',  tel: '553599463434' },
  { nome: 'Isaac',     tel: '553591836566' },
  { nome: 'Osmar',    tel: '553599182934' },
  { nome: 'Yhan',     tel: '553599432108' },
  { nome: 'Guilherme', tel: '553598350670' },
];

function CardProduto({ produto }) {
  const [seletorAberto, setSeletorAberto] = useState(false);

  const abrirWhatsApp = (vendedor) => {
    const msg = encodeURIComponent(
      `Olá ${vendedor.nome}! Tenho interesse no produto:\n\n*${produto.descricao}*\nCód: ${produto.codprod}\nPreço: R$ ${produto.pvenda.toFixed(2)}\n\nPoderia me ajudar?`
    );
    window.open(`https://wa.me/${vendedor.tel}?text=${msg}`, '_blank');
    setSeletorAberto(false);
  };

  return (
    <div className="card">
      <div className="foto-container">
        <img
          src={`/imagens/${produto.codprod}.jpg`}
          alt={produto.descricao}
          className="foto"
          onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Sem+Foto'; }}
        />
      </div>
      <div className="info">
        <p className="cod-tag">Cód: {produto.codprod}</p>
        <h3>{produto.descricao}</h3>

        <p className="preco">
          {produto.pvenda > 0
            ? `R$ ${produto.pvenda.toFixed(2)}`
            : <span className="sob-consulta">SOB CONSULTA</span>
          }
        </p>


        <div className="botoes-card">
          <div className="whatsapp-wrapper">
            <button className="btn-whatsapp" onClick={() => setSeletorAberto(!seletorAberto)}>
              💬 Falar com Vendedor
            </button>
            {seletorAberto && (
              <div className="seletor-vendedor">
                <p>Escolha o vendedor:</p>
                {VENDEDORES.map(v => (
                  <button key={v.nome} onClick={() => abrirWhatsApp(v)}>
                    {v.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [gerandoPDF, setGerandoPDF] = useState('');
  const pdfLock = useRef(false);
  const handleLoadingComplete = useCallback(() => setLoading(false), []);

  const produtosFiltrados = produtos.filter(p =>
    p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    p.codprod.toString().includes(busca)
  );

  const gerarPDF = async () => {
    if (pdfLock.current) return;
    pdfLock.current = true;
    const yield_ = () => new Promise(r => setTimeout(r, 0));
    setGerandoPDF('Carregando...');
    await yield_();

    const MAX = 600;
    const imageMap = {};
    const LOTE = 20;

    // Carrega logo para o cabeçalho do PDF
    let logoData = null, logoAspect = 4.5;
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 3000);
      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        try {
          logoAspect = img.naturalWidth / img.naturalHeight;
          const H = 120, W = Math.round(H * logoAspect);
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          c.getContext('2d').drawImage(img, 0, 0, W, H);
          logoData = c.toDataURL('image/png');
        } catch {}
        resolve();
      };
      img.onerror = () => { clearTimeout(timer); resolve(); };
      img.src = '/logo.png';
    });

    for (let i = 0; i < produtosFiltrados.length; i += LOTE) {
      const lote = produtosFiltrados.slice(i, i + LOTE);
      await Promise.all(lote.map(p =>
        new Promise(resolve => {
          const timer = setTimeout(resolve, 4000);
          const img = new Image();
          img.onload = () => {
            clearTimeout(timer);
            try {
              const scale = Math.min(1, MAX / Math.max(img.naturalWidth || MAX, img.naturalHeight || MAX));
              const c = document.createElement('canvas');
              c.width = Math.round((img.naturalWidth || MAX) * scale);
              c.height = Math.round((img.naturalHeight || MAX) * scale);
              c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
              imageMap[p.codprod] = c.toDataURL('image/jpeg', 0.88);
            } catch {}
            resolve();
          };
          img.onerror = () => { clearTimeout(timer); resolve(); };
          img.src = `/imagens/${p.codprod}.jpg`;
        })
      ));
      setGerandoPDF(`Imagens ${Math.min(i + LOTE, produtosFiltrados.length)}/${produtosFiltrados.length}`);
      await yield_();
    }

    setGerandoPDF('Montando PDF...');
    await yield_();

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const PW = 210, M = 10, GAP = 6, COLS = 2;
      const cardW = (PW - M * 2 - GAP * (COLS - 1)) / COLS;
      const HEADER_H = 16;
      const imgH = 62, textH = 22, cardH = imgH + textH;
      const startY = HEADER_H + 3;
      const rowH = cardH + 5;
      const ROWS = Math.floor((297 - startY - M) / rowH);
      const perPage = ROWS * COLS;

      const addHeader = (pg) => {
        if (logoData) {
          const lh = 14, lw = lh * logoAspect;
          doc.addImage(logoData, 'PNG', M, (HEADER_H - lh) / 2, lw, lh);
        } else {
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Catálogo Binário Tecnologia', M, HEADER_H / 2 + 2);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `${new Date().toLocaleDateString('pt-BR')} · ${produtosFiltrados.length} produtos · pág. ${pg}`,
          PW - M, HEADER_H / 2 + 2, { align: 'right' }
        );
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.3);
        doc.line(0, HEADER_H, PW, HEADER_H);
      };

      let page = 1;
      addHeader(page);

      for (let i = 0; i < produtosFiltrados.length; i++) {
        if (i > 0 && i % 10 === 0) await yield_();
        const pos = i % perPage;
        if (i > 0 && pos === 0) { doc.addPage(); page++; addHeader(page); }
        const row = Math.floor(pos / COLS);
        const col = pos % COLS;
        const x = M + col * (cardW + GAP);
        const y = startY + row * rowH;
        const p = produtosFiltrados[i];

        // Card: fundo cinza claro na área de texto
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'F');
        // Área branca para a foto
        doc.setFillColor(255, 255, 255);
        doc.rect(x + 0.3, y + 0.3, cardW - 0.6, imgH - 0.3, 'F');

        const imgData = imageMap[p.codprod];
        if (imgData) {
          doc.addImage(imgData, 'JPEG', x + 1, y + 1, cardW - 2, imgH - 2, '', 'FAST');
        } else {
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7);
          doc.text('Sem foto', x + cardW / 2, y + imgH / 2, { align: 'center', baseline: 'middle' });
        }

        // Faixa separadora azul entre foto e texto
        doc.setFillColor(30, 64, 175);
        doc.rect(x, y + imgH, cardW, 1, 'F');

        // Código e descrição
        const ty = y + imgH + 1;
        doc.setTextColor(120, 130, 150);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cód: ${p.codprod}`, x + 2, ty + 3.5);
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(p.descricao, cardW - 4).slice(0, 2), x + 2, ty + 9);

        // Faixa de preço no rodapé do card
        const STRIP_H = 7;
        doc.setFillColor(30, 64, 175);
        doc.rect(x, y + cardH - STRIP_H, cardW, STRIP_H, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const priceText = p.pvenda > 0 ? `R$ ${p.pvenda.toFixed(2)}` : 'SOB CONSULTA';
        doc.text(priceText, x + cardW / 2, y + cardH - STRIP_H + 4.8, { align: 'center' });

        // Borda externa do card
        doc.setDrawColor(200, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'S');
      }

      doc.save('catalogo_binario.pdf');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }

    pdfLock.current = false;
    setGerandoPDF('');
  };

  if (loading) return <LoadingScreen onComplete={handleLoadingComplete} />;

  return (
    <div className="container">

      {/* CABEÇALHO */}
      <header>
        <div className="top-bar">
          <div className="logo-area">
            <img src="/logo.png" alt="Binário Tecnologia" className="logo-img" />
          </div>

          <button onClick={gerarPDF} className="btn-pdf-header" disabled={gerandoPDF !== ''}>
            {gerandoPDF ? `⏳ ${gerandoPDF}` : '📄 Exportar PDF'}
          </button>
        </div>

        <div className="busca-wrapper">
          <input
            type="text"
            placeholder="🔍 Digite nome ou código do produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <p className="contador-itens">
            {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </p>
        </div>
      </header>

      {/* GRADE DE PRODUTOS */}
      <div className="grade-produtos">
        {produtosFiltrados.map(produto => (
          <CardProduto key={produto.codprod} produto={produto} />
        ))}
      </div>

    </div>
  );
}

export default App
