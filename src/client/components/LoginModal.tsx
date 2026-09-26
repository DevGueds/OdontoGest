import { Modal } from './Modal';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrivacyNotice } from './PrivacyNotice';

export const LoginModal: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showSenha, setShowSenha] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !senha) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      setBusy(true);
      await login(email, senha);
    } catch (err: any) {
      setErrorMsg(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal className="auth-overlay">
      <div className="modal-content" style={{ maxWidth: '460px', borderRadius: 'var(--radius-lg)' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--primary), var(--cyan))', color: '#fff', padding: '1.25rem 1.5rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-lock"></i> Autenticação de Usuário
          </h3>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <p className="text-muted text-sm margin-bottom-sm">
            Informe suas credenciais para acessar o sistema. O perfil <strong>Administrador</strong> permite cadastrar os demais usuários e unidades.
          </p>

          {errorMsg && (
            <div role="alert" className="notice notice-error margin-bottom-sm">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group margin-bottom-sm">
              <label htmlFor="loginEmail">Email *</label>
              <input 
                type="email"
                autoComplete="username"
                maxLength={150}
                id="loginEmail" 
                className="form-control"
                placeholder="exemplo@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group margin-bottom-md">
              <label htmlFor="loginSenha">Senha de Acesso *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showSenha ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={128}
                  id="loginSenha" 
                  className="form-control"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.95rem'
                  }}
                  title={showSenha ? "Ocultar senha" : "Ver senha"}
                >
                  <i className={`fa-solid ${showSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="form-actions margin-top-md">
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || busy}>
                {loading || busy ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Autenticando...</>
                ) : (
                  <><i className="fa-solid fa-right-to-bracket"></i> Entrar no Sistema</>
                )}
              </button>
            </div>
          </form>
          <div className="margin-top-md"><PrivacyNotice /></div>
        </div>
      </div>
    </Modal>
  );
};
