import { useState } from 'react';
import { Modal } from './Modal';
export function PrivacyNotice() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Privacidade</button>
    {open && <Modal onClose={() => setOpen(false)}>
      <div className="modal-content privacy-dialog">
        <div className="modal-header">
          <div className="dialog-heading"><span className="dialog-icon"><i className="fa-solid fa-shield-halved" aria-hidden="true" /></span><div><h2>Sua privacidade</h2><p>Como seus dados são utilizados no OdontoGest</p></div></div>
          <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fechar aviso">×</button>
        </div>
        <div className="modal-body privacy-content">
          <section><h3>Dados e finalidade</h3><p>Utilizamos nome, e-mail, identificação profissional, unidade de trabalho e registros de pedidos para gerenciar materiais e manutenção. Perfis autorizados também acessam honorários e informações financeiras.</p></section>
          <section><h3>Acesso e proteção</h3><p>Senhas são armazenadas como hashes. Cookies essenciais mantêm sua sessão e protegem as operações. Não utilizamos cookies de publicidade. A auditoria registra a conta, a operação e seu resultado.</p></section>
          <div className="notice notice-info"><i className="fa-solid fa-circle-info" aria-hidden="true" /><p>Não inclua informações de pacientes, diagnósticos ou outros dados sensíveis nos campos de observação.</p></div>
          <section><h3>Seus direitos e contato</h3><p>Solicite ao administrador da organização as informações sobre o controlador, a base legal, os prazos de conservação e o canal para acesso ou correção dos seus dados. A eliminação depende das obrigações de conservação aplicáveis.</p></section>
        </div>
        <div className="modal-footer"><button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>Entendi</button></div>
      </div>
    </Modal>}
  </>;
}
