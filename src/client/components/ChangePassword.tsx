import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
export function ChangePassword({ onClose }: { onClose?: () => void }) {
  const { changePassword, logout, user } = useAuth();
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (next !== confirm) { setError('As novas senhas não coincidem.'); return; }
    setBusy(true); setError('');
    try { await changePassword(current, next); onClose?.(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível alterar a senha.'); }
    finally { setBusy(false); }
  };
  return <div className="modal active"><div className="modal-content" style={{ maxWidth: 460 }}>
    <div className="modal-header"><h3>Alterar senha</h3></div><div className="modal-body">
      {user?.senha_requer_troca && <p>Atualize sua senha para liberar o acesso ao sistema.</p>}
      <form onSubmit={submit}>
        <label>Senha atual<input className="form-control" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required maxLength={128} /></label>
        <label>Nova senha (mínimo 12 caracteres)<input className="form-control" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} required minLength={12} maxLength={128} /></label>
        <label>Confirmar nova senha<input className="form-control" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={12} maxLength={128} /></label>
        {error && <p role="alert" className="text-rose">{error}</p>}
        <div className="form-actions margin-top-md"><button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button>
          <button type="button" className="btn btn-secondary" onClick={onClose || logout}>{onClose ? 'Cancelar' : 'Sair'}</button></div>
      </form>
    </div></div></div>;
}
