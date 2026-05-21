import { useState, useCallback } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
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
  const handleLoadingComplete = useCallback(() => setLoading(false), []);

  const produtosFiltrados = produtos.filter(p =>
    p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    p.codprod.toString().includes(busca)
  );

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Catálogo Binário Tecnologia', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
    const dados = produtosFiltrados.map(p => [
      p.codprod,
      p.descricao,
      `${p.estoque} un.`,
      `R$ ${p.pvenda.toFixed(2)}`,
    ]);
    doc.autoTable({
      startY: 35,
      head: [['Cód', 'Produto', 'Estoque', 'Preço']],
      body: dados,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [56, 189, 248] },
    });
    doc.save('catalogo_binario.pdf');
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

          <button onClick={gerarPDF} className="btn-pdf-header">
            📄 Exportar PDF
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
