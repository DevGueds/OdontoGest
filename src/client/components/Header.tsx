import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChangePassword } from './ChangePassword';
import { PrivacyNotice } from './PrivacyNotice';
import { PerfilUsuario } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  perfilAtual: PerfilUsuario;
  onExportarSQL: () => void;
  onAbrirModalRelatorios?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ perfilAtual, onExportarSQL, onAbrirModalRelatorios }) => {
  const { user, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current!;
    const observer = new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`));
    observer.observe(header);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--header-height'); };
  }, []);

  return (
    <header className="app-header" ref={headerRef}>
      {passwordOpen && <ChangePassword onClose={() => setPasswordOpen(false)} />}
      <div className="header-container">
        <div className="brand">
          <div className="brand-icon">
            <i className="fa-solid fa-hospital-user"></i>
          </div>
          <div className="brand-text">
            <h1>ODONTOGEST</h1>
            <span>Sistema de Gestão Odontológica</span>
          </div>
        </div>

        <button type="button" className="btn btn-secondary btn-sm header-menu-toggle" aria-expanded={toolsOpen} aria-controls="header-tools" onClick={() => setToolsOpen(open => !open)}>
          <i className="fa-solid fa-ellipsis" aria-hidden="true" /> Opções
        </button>
        <div id="header-tools" className={`header-controls ${toolsOpen ? 'is-open' : ''}`} style={{ gap: '0.85rem' }}>
          {/* User Profile Badge Pill */}
          <div className="user-profile" style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: perfilAtual === 'GESTOR' ? 'var(--cyan)' : 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="user-profile-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                {user?.nome || 'Usuário'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {perfilAtual === 'ADMINISTRADOR' && (
                  <><i className="fa-solid fa-crown" style={{ color: '#f59e0b' }}></i> Administrador (Total)</>
                )}
                {perfilAtual === 'GESTOR' && (
                  <><i className="fa-solid fa-eye" style={{ color: '#38bdf8' }}></i> Gestor (Somente Leitura)</>
                )}
                {perfilAtual === 'SOLICITANTE' && (
                  <><i className="fa-solid fa-user-doctor" style={{ color: '#4ade80' }}></i> Solicitante ({user?.funcao || 'USF'})</>
                )}
                {perfilAtual === 'TECNICO' && (
                  <><i className="fa-solid fa-wrench" style={{ color: '#c084fc' }}></i> Técnico de Manutenção</>
                )}
              </span>
            </div>
          </div>

          {onAbrirModalRelatorios && (
            <button 
              className="btn btn-emerald btn-sm" 
              onClick={onAbrirModalRelatorios} 
              title="Gerar e Exportar Relatórios PDF e Excel"
              style={{ borderRadius: '9999px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              <i className="fa-solid fa-file-excel"></i> Relatórios PDF/Excel
            </button>
          )}

          {perfilAtual === 'ADMINISTRADOR' && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onExportarSQL} 
              title="Exportar dados operacionais em SQL"
              style={{ borderRadius: '9999px', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
            >
              <i className="fa-solid fa-database"></i> Exportar SQL
            </button>
          )}

          <button className="btn btn-secondary btn-sm" onClick={() => setPasswordOpen(true)}>Alterar senha</button>
          <PrivacyNotice />
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={logout} 
            title="Encerrar Sessão"
            style={{ 
              borderRadius: '9999px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Sair
          </button>
        </div>
      </div>
    </header>
  );
};
