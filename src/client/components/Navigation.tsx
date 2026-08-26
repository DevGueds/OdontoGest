import React from 'react';
import { PerfilUsuario } from '../types';

interface NavigationProps {
  activeTab: string;
  perfilAtual: PerfilUsuario;
  pendentesCount: number;
  onSelectTab: (tabName: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  perfilAtual,
  pendentesCount,
  onSelectTab
}) => {
  const isSolicitante = perfilAtual === 'SOLICITANTE';
  const isTecnico = perfilAtual === 'TECNICO';
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';

  const podeVerGestaoCompleta = isGestor || isAdmin;

  return (
    <aside className="app-sidebar" aria-label="Navegação Lateral">
      <nav className="sidebar-nav">
        {podeVerGestaoCompleta && (
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
            title="Consolidação Financeira & Dashboard"
          >
            <i className="fa-solid fa-chart-pie nav-icon"></i>
            <span className="nav-label">Dashboard & Indicadores</span>
          </button>
        )}

        {!isTecnico && (
          <button 
            className={`nav-tab ${activeTab === 'triagem' ? 'active' : ''}`}
            onClick={() => onSelectTab('triagem')}
            title={podeVerGestaoCompleta ? 'Central de Atendimento' : 'Meus Pedidos & Status'}
          >
            <i className="fa-solid fa-clipboard-list nav-icon"></i>
            <span className="nav-label">{podeVerGestaoCompleta ? 'Central de Atendimento' : 'Meus Pedidos & Status'}</span>
            {pendentesCount > 0 && (
              <span className="badge badge-amber nav-badge">{pendentesCount}</span>
            )}
          </button>
        )}

        {!isTecnico && (
          <button 
            className={`nav-tab ${activeTab === 'novo-pedido' ? 'active' : ''}`}
            onClick={() => onSelectTab('novo-pedido')}
            title="Novo Pedido (PBS)"
          >
            <i className="fa-solid fa-file-circle-plus nav-icon"></i>
            <span className="nav-label">Novo Pedido (PBS)</span>
          </button>
        )}

        <button 
          className={`nav-tab ${activeTab === 'equipamentos' ? 'active' : ''}`}
          onClick={() => onSelectTab('equipamentos')}
          title={isTecnico ? 'Atendimento de Manutenção' : 'Equipamentos & Manutenção'}
        >
          <i className="fa-solid fa-wrench nav-icon"></i>
          <span className="nav-label">{isTecnico ? 'Atendimento Técnico' : 'Equipamentos & Manutenção'}</span>
        </button>

        {podeVerGestaoCompleta && (
          <>
            <button 
              className={`nav-tab ${activeTab === 'orcamento' ? 'active' : ''}`}
              onClick={() => onSelectTab('orcamento')}
              title="Aportes & Gestão Orçamentária"
            >
              <i className="fa-solid fa-sack-dollar nav-icon"></i>
              <span className="nav-label">Aportes & Orçamento</span>
            </button>

            <button 
              className={`nav-tab ${activeTab === 'honorarios' ? 'active' : ''}`}
              onClick={() => onSelectTab('honorarios')}
              title="Honorários & Salários"
            >
              <i className="fa-solid fa-user-doctor nav-icon"></i>
              <span className="nav-label">Honorários & Salários</span>
            </button>

            <button 
              className={`nav-tab ${activeTab === 'catalogo' ? 'active' : ''}`}
              onClick={() => onSelectTab('catalogo')}
              title="Cadastro de Materiais & Unidades"
            >
              <i className="fa-solid fa-boxes-stacked nav-icon"></i>
              <span className="nav-label">Materiais & Unidades</span>
            </button>

            {isAdmin && (
              <button 
                className={`nav-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => onSelectTab('usuarios')}
                title="Gestão de Usuários & Acessos"
              >
                <i className="fa-solid fa-users-gear nav-icon"></i>
                <span className="nav-label">Usuários & Acessos</span>
              </button>
            )}
          </>
        )}
      </nav>
    </aside>
  );
};

