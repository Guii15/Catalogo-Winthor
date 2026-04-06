import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import './App.css'
import produtos from './produtos.json'

function App() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  // --- LÓGICA DE CATEGORIAS ---
  // 1. Pega todas as categorias do JSON
  const todasCategorias = produtos.map(p => p.categoria);
  // 2. Remove duplicadas
  const categoriasUnicas = [...new Set(todasCategorias)];
  // 3. Filtra: Remove "Geral" da lista de botões (mas os produtos continuam existindo)
  //    e Remove "Todos" da lista gerada (já temos ele fixo se quiser)
  const categoriasParaMenu = categoriasUnicas.filter(c => c !== "Geral" && c !== "Todos").sort();

  // --- FILTROS ---
  const produtosFiltrados = produtos.filter(p => {
    // Se a categoria for "Todos", aceita qualquer coisa. 
    // Se não, tem que bater a categoria exata.
    const batendoCategoria = categoriaAtiva === "Todos" ? true : p.categoria === categoriaAtiva;
    
    // Busca por nome OU código
    const batendoBusca = p.descricao.toLowerCase().includes(busca.toLowerCase()) || 
                         p.codprod.toString().includes(busca);
                         
    return batendoCategoria && batendoBusca;
  });

  const toggleMenu = () => setMenuAberto(!menuAberto);

  // Função PDF
  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text(`Catálogo Binário - ${categoriaAtiva}`, 14, 20);
    const dados = produtosFiltrados.map(p => [
      p.codprod, 
      p.descricao, 
      `R$ ${p.pvenda > 1 ? p.pvenda.toFixed(2) : 'Consulte'}`
    ]);
    doc.autoTable({ startY: 30, head: [['Cód', 'Produto', 'Preço']], body: dados });
    doc.save("catalogo_binario.pdf");
  };

  // Função para carregar imagens da pasta assets dinamicamente (se estiver usando assets)
  // Se ainda estiver usando a pasta public, pode ignorar essa parte e usar direto no src
  const getImagem = (cod) => {
    return `/imagens/${cod}.jpg`; // Caminho da pasta public
  };

  return (
    <div className="container">
      
      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <div className={`sidebar ${menuAberto ? 'aberto' : ''}`}>
        <button className="fechar-menu" onClick={toggleMenu}>×</button>
        <div className="sidebar-content">
          <h3>Categorias</h3>
          
          {/* Botão para ver tudo */}
          <button 
              className={`btn-menu ${categoriaAtiva === "Todos" ? 'ativo' : ''}`}
              onClick={() => { setCategoriaAtiva("Todos"); setMenuAberto(false); }}
            >
              Ver Todos os Produtos
          </button>

          {/* Lista das outras categorias (Sem Geral) */}
          {categoriasParaMenu.map(cat => (
            <button 
              key={cat}
              className={`btn-menu ${categoriaAtiva === cat ? 'ativo' : ''}`}
              onClick={() => { setCategoriaAtiva(cat); setMenuAberto(false); }}
            >
              {cat}
            </button>
          ))}

          <hr />
          {produtosFiltrados.length > 0 && (
            <button onClick={gerarPDF} className="btn-pdf">
              📄 Baixar PDF desta lista
            </button>
          )}
        </div>
      </div>

      {/* --- CABEÇALHO --- */}
      <header>
        <div className="top-bar">
          {/* Botão Hambúrguer Aumentado */}
          <button className="btn-hamburguer" onClick={toggleMenu}>
            ☰
          </button>

          <div className="logo-area" onClick={() => setCategoriaAtiva("Todos")} style={{cursor: 'pointer'}}>
            <h1>BINÁRIO<span>.</span>TECH</h1>
          </div>
          
          <div className="espaco-vazio"></div>
        </div>

        {/* BUSCA + CONTADOR */}
        <div className="busca-wrapper">
           <input 
            type="text" 
            placeholder="🔍 Digite nome ou código..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {/* Contador de Itens Pequeno */}
          <p className="contador-itens">
            {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </p>
        </div>

        {/* Migalha (Opcional, mostra onde você está) */}
        {categoriaAtiva !== "Todos" && (
           <p className="migalha">Categoria: <strong>{categoriaAtiva}</strong></p>
        )}
      </header>

      {/* --- LISTA DE PRODUTOS --- */}
      <div className="grade-produtos">
        {produtosFiltrados.map((produto) => (
          <div key={produto.codprod} className="card">
            <div className="foto-container">
              <img 
                src={getImagem(produto.codprod)} 
                alt={produto.descricao} 
                className="foto"
                onError={(e) => {e.target.src = 'https://via.placeholder.com/400?text=Sem+Foto'}}
              />
            </div>
            <div className="info">
              <span className="cat-tag">{produto.categoria}</span>
              <h3>{produto.descricao}</h3>
              
              <p className="preco">
                {produto.pvenda > 1 
                  ? `R$ ${produto.pvenda.toFixed(2)}` 
                  : <span className="sob-consulta">SOB CONSULTA</span>
                }
              </p>
              
              <button className="btn-comprar">Ver Detalhes</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default App