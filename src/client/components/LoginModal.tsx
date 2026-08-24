import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showSenha, setShowSenha] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !senha) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      await login(email, senha);
    } catch (err: any) {
      setErrorMsg(err.message || 'E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="modal active" style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)' }}>
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
            <div style={{ background: 'var(--rose-light)', color: 'var(--rose)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group margin-bottom-sm">
              <label htmlFor="loginEmail">Email *</label>
              <input 
                type="email"
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
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Autenticando...</>
                ) : (
                  <><i className="fa-solid fa-right-to-bracket"></i> Entrar no Sistema</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
