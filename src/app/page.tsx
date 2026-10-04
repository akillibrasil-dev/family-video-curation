import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell home-shell">
      <div className="brand-mark">BF</div>
      <span className="eyebrow">MVP · nome provisório</span>
      <h1>Biblioteca da Família</h1>
      <p className="hero-copy">
        O YouTube fornece o vídeo. A família decide o catálogo. Sem busca externa para a criança,
        sem feed infinito e sem recomendação algorítmica como mecanismo de descoberta.
      </p>

      <div className="mode-grid">
        <Link className="mode-card parent" href="/responsavel">
          <span className="mode-icon">🛡️</span>
          <h2>Modo Responsável</h2>
          <p>Adicionar, revisar, aprovar e organizar vídeos.</p>
          <span className="mode-link">Abrir painel →</span>
        </Link>

        <Link className="mode-card child" href="/crianca">
          <span className="mode-icon">🚀</span>
          <h2>Modo Criança</h2>
          <p>Explorar e pesquisar somente dentro da biblioteca aprovada.</p>
          <span className="mode-link">Abrir biblioteca →</span>
        </Link>
      </div>

      <div className="principles">
        <span>Curadoria humana</span>
        <span>Busca fechada</span>
        <span>Privacy Enhanced Mode</span>
        <span>Sem Shorts</span>
      </div>
    </main>
  );
}
