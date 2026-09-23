import React, { useState } from 'react';
export function PrivacyNotice() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Privacidade</button>
    {open && <div className="modal active"><div className="modal-content"><div className="modal-header"><h3>Dados pessoais no OdontoGest</h3><button className="modal-close" onClick={() => setOpen(false)} aria-label="Fechar aviso">×</button></div>
      <div className="modal-body">
        <p>O sistema utiliza identificação profissional, e-mail, unidade de trabalho e registros de pedidos para gerenciar materiais e manutenção. Os perfis autorizados também acessam honorários e informações financeiras.</p>
        <p>As senhas são armazenadas como hashes. Cookies essenciais mantêm o acesso e protegem as operações; não há cookies de publicidade. Os registros de auditoria identificam a conta, a operação e seu resultado.</p>
        <p>Não inclua informações de pacientes, diagnósticos ou outros dados sensíveis nos campos de observação.</p>
        <p>Para conhecer o controlador, a base legal, os prazos de conservação e o canal para acesso ou correção dos seus dados, solicite essas informações ao administrador da organização. A eliminação depende das obrigações de conservação aplicáveis.</p>
      </div></div></div>}
  </>;
}
