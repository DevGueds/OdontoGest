import { useId, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { PasswordInput } from './PasswordInput';
export function ChangePassword({ onClose }: { onClose?: () => void }) {
  const { changePassword, logout, user } = useAuth();
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const id = useId();
  const initial = user?.senha_requer_troca;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (next !== confirm) { setError('As novas senhas não coincidem. Confira a confirmação.'); return; }
    setBusy(true); setError('');
    try { await changePassword(current, next); onClose?.(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível alterar a senha.'); }
    finally { setBusy(false); }
  };
  return <Modal onClose={busy ? undefined : onClose} className={initial ? 'auth-overlay' : ''}>
    <div className="modal-content password-dialog">
      <div className="modal-header">
        <div className="dialog-heading"><span className="dialog-icon"><i className="fa-solid fa-key" aria-hidden="true" /></span><div><h2>{initial ? 'Defina sua nova senha' : 'Alterar senha'}</h2><p>{initial ? 'Primeiro acesso ao OdontoGest' : 'Mantenha seu acesso protegido'}</p></div></div>
        {onClose && <button type="button" className="modal-close" aria-label="Fechar alteração de senha" disabled={busy} onClick={onClose}>×</button>}
      </div>
      <div className="modal-body">
        <p className="dialog-intro">{initial ? 'Atualize sua senha para liberar o acesso ao sistema.' : 'Informe sua senha atual e escolha uma nova senha.'}</p>
        <form onSubmit={submit} className="password-form" aria-busy={busy}>
          <div className="form-group"><label htmlFor={`${id}-current`}>{initial ? 'Senha atual ou temporária' : 'Senha atual'}</label><PasswordInput id={`${id}-current`} autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required maxLength={128} /></div>
          <div className="form-group"><label htmlFor={`${id}-next`}>Nova senha</label><PasswordInput id={`${id}-next`} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} maxLength={128} aria-describedby={`${id}-hint`} /><small id={`${id}-hint`} className="form-hint">Use de 8 a 128 caracteres e evite sequências comuns.</small></div>
          <div className="form-group"><label htmlFor={`${id}-confirm`}>Confirmar nova senha</label><PasswordInput id={`${id}-confirm`} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} maxLength={128} /></div>
          {error && <div role="alert" className="notice notice-error"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><p>{error}</p></div>}
          <div className="form-actions"><button type="button" className="btn btn-outline" disabled={busy} onClick={onClose || logout}>{onClose ? 'Cancelar' : 'Sair'}</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Salvando…' : initial ? 'Salvar e continuar' : 'Salvar senha'}</button></div>
        </form>
      </div>
    </div>
  </Modal>;
}
