import React, { useState, useEffect, useCallback } from 'react';
import { 
  PerfilUsuario, 
  UnidadeSaude, 
  Material, 
  PedidoPBS, 
  ToastMessage,
  HonorarioOdontologo,
  Equipamento,
  ChamadoManutencao,
  StatusChamado,
  NaturezaDespesa,
  EntradaRecurso,
  UserSistema
} from './types';
import { dbService } from './services/db';
import { useAuth } from './context/AuthContext';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { LoginModal } from './components/LoginModal';

import { NovoPedidoTab } from './components/tabs/NovoPedidoTab';
import { TriagemTab } from './components/tabs/TriagemTab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { CatalogoTab } from './components/tabs/CatalogoTab';
import { HonorariosTab } from './components/tabs/HonorariosTab';
import { EquipamentosTab } from './components/tabs/EquipamentosTab';
import { OrcamentoTab } from './components/tabs/OrcamentoTab';
import { UsuariosTab } from './components/tabs/UsuariosTab';

import { ModalRecebimento } from './components/modals/ModalRecebimento';
import { ModalAtendimento } from './components/modals/ModalAtendimento';
import { ModalEnvio } from './components/modals/ModalEnvio';
import { ModalMaterial } from './components/modals/ModalMaterial';
import { ModalEditarMaterial } from './components/modals/ModalEditarMaterial';
import { ModalAjusteEstoque } from './components/modals/ModalAjusteEstoque';
import { ModalUnidade } from './components/modals/ModalUnidade';
import { ModalEditarUnidade } from './components/modals/ModalEditarUnidade';
import { ModalFichaPbs } from './components/modals/ModalFichaPbs';
import { ModalRelatorio } from './components/modals/ModalRelatorio';

export const AppContent: React.FC = () => {
  const { user, authenticated, loading: authLoading, csrfToken, login, logout } = useAuth();
  const perfilAtual: PerfilUsuario = user?.perfil || 'GESTOR';

  const [activeTab, setActiveTab] = useState<string>('novo-pedido');

  const [unidades, setUnidades] = useState<UnidadeSaude[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [pedidos, setPedidos] = useState<PedidoPBS[]>([]);
  const [honorarios, setHonorarios] = useState<HonorarioOdontologo[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [chamados, setChamados] = useState<ChamadoManutencao[]>([]);
  const [entradas, setEntradas] = useState<EntradaRecurso[]>([]);
  const [usuarios, setUsuarios] = useState<UserSistema[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Selected items for modals
  const [selectedPedido, setSelectedPedido] = useState<PedidoPBS | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedUnidade, setSelectedUnidade] = useState<UnidadeSaude | null>(null);

  // Modals visibility
  const [modalRecOpen, setModalRecOpen] = useState(false);
  const [modalAtendOpen, setModalAtendOpen] = useState(false);
  const [modalEnvioOpen, setModalEnvioOpen] = useState(false);
  const [modalMatOpen, setModalMatOpen] = useState(false);
  const [modalEditMatOpen, setModalEditMatOpen] = useState(false);
  const [modalAjusteEstOpen, setModalAjusteEstOpen] = useState(false);
  const [modalUniOpen, setModalUniOpen] = useState(false);
  const [modalEditUniOpen, setModalEditUniOpen] = useState(false);
  const [modalFichaOpen, setModalFichaOpen] = useState(false);
  const [modalRelatoriosOpen, setModalRelatoriosOpen] = useState(false);

  const reloadData = useCallback(async () => {
    if (!authenticated) return;
    try {
      const [u, m, p, h, eq, ch, ent, us] = await Promise.all([
        dbService.getUnidades(),
        dbService.getMateriais(),
        dbService.getPedidos(),
        dbService.getHonorarios(),
        dbService.getEquipamentos(),
        dbService.getChamados(),
        dbService.getEntradas(),
        dbService.getUsuarios().catch(() => [])
      ]);
      setUnidades(u);
      setMateriais(m);
      setPedidos(p);
      setHonorarios(h);
      setEquipamentos(eq);
      setChamados(ch);
      setEntradas(ent);
      setUsuarios(us);
    } catch (err) {
      console.error("Erro ao carregar dados do Fastify:", err);
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      reloadData();
    }
  }, [authenticated, reloadData]);

  useEffect(() => {
    if (perfilAtual === 'TECNICO' && activeTab !== 'equipamentos') {
      setActiveTab('equipamentos');
    } else if (perfilAtual === 'SOLICITANTE' && ['dashboard', 'orcamento', 'catalogo', 'honorarios'].includes(activeTab)) {
      setActiveTab('novo-pedido');
    }
  }, [perfilAtual, activeTab]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);



  const handleExportarSQL = async () => {
    try {
      const sqlText = await dbService.exportarSQL();
      const blob = new Blob([sqlText], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `almoxarifado_saude_dump_${new Date().toISOString().substring(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Script SQL MySQL baixado com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao exportar SQL', 'error');
    }
  };

  const handleSelectTab = (tabName: string) => {
    if (perfilAtual === 'SOLICITANTE' && (tabName === 'dashboard' || tabName === 'catalogo')) {
      showToast('Acesso restrito ao Perfil Gestor (Almoxarifado).', 'error');
      return;
    }
    setActiveTab(tabName);
  };

  // Modals Actions with CSRF validation
  const handleNovoPedidoSubmit = async (dados: any) => {
    try {
      const pedidoCriado = await dbService.salvarPedido(dados, csrfToken);
      showToast(`Solicitação ${pedidoCriado.numero_pbs} emitida com sucesso!`, 'success');
      await reloadData();
      setActiveTab('triagem');
    } catch (err: any) {
      showToast(err.message || 'Erro ao emitir pedido', 'error');
    }
  };

  const handleConfirmarRecebimento = async (pedidoId: number, apontador: string, dataRec: string) => {
    try {
      await dbService.confirmarRecebimento(pedidoId, apontador, dataRec, csrfToken);
      showToast('Pedido marcado como RECEBIDO pelo Almoxarifado!', 'success');
      setModalRecOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarAtendimento = async (pedidoId: number, itensAtendidos: any[]) => {
    try {
      await dbService.atenderPedido(pedidoId, itensAtendidos, csrfToken);
      showToast('Quantidades atendidas/liberadas com sucesso! Estoque atualizado.', 'success');
      setModalAtendOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarEnvio = async (pedidoId: number, apontador: string, dataEnv: string) => {
    try {
      await dbService.confirmarEnvio(pedidoId, apontador, dataEnv, csrfToken);
      showToast('Status do pedido atualizado para ENVIADO!', 'success');
      setModalEnvioOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancelarPedido = async (pedidoId: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) return;
    try {
      await dbService.cancelarPedido(pedidoId, csrfToken);
      showToast('Pedido cancelado com sucesso!', 'info');
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarMaterial = async (desc: string, un: string, val: number, est: number, limiteMax?: number | null, fornecedor?: string | null, natureza?: NaturezaDespesa) => {
    try {
      await dbService.addMaterial(desc, un, val, est, limiteMax ?? null, fornecedor ?? null, natureza || 'CUSTEIO', csrfToken);
      showToast(`Material "${desc}" cadastrado com sucesso!`, 'success');
      setModalMatOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarEdicaoMaterial = async (id: number, dados: Partial<Material>) => {
    try {
      const m = await dbService.updateMaterial(id, dados, csrfToken);
      showToast(`Insumo "${m.descricao}" atualizado com sucesso!`, 'success');
      setModalEditMatOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarAjusteEstoque = async (id: number, novaQtd: number) => {
    try {
      const m = await dbService.atualizarEstoqueMaterial(id, novaQtd, csrfToken);
      showToast(`Estoque de "${m.descricao}" atualizado para ${m.qtd_estoque} ${m.unidade_medida}!`, 'success');
      setModalAjusteEstOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarUnidade = async (nome: string, tipo?: string) => {
    try {
      await dbService.addUnidade(nome, tipo || 'UNIDADE', csrfToken);
      showToast(`Estabelecimento "${nome}" cadastrado com sucesso!`, 'success');
      setModalUniOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmarEdicaoUnidade = async (id: number, nome: string, tipo?: string) => {
    try {
      const u = await dbService.updateUnidade(id, nome, tipo || 'UNIDADE', csrfToken);
      showToast(`Estabelecimento "${u.nome}" atualizado com sucesso!`, 'success');
      setModalEditUniOpen(false);
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao editar estabelecimento', 'error');
    }
  };

  const handleDeletarUnidade = async (id: number) => {
    try {
      await dbService.deleteUnidade(id, csrfToken);
      showToast('Estabelecimento removido com sucesso!', 'info');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover estabelecimento', 'error');
    }
  };

  const handleAddHonorario = async (dados: Omit<HonorarioOdontologo, 'id'>) => {
    try {
      const novo = await dbService.addHonorario(dados, csrfToken);
      showToast(`Honorário de "${novo.nome_dentista}" registrado com sucesso!`, 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar honorário', 'error');
    }
  };

  const handleAddEquipamento = async (dados: Omit<Equipamento, 'id'>) => {
    try {
      const novo = await dbService.addEquipamento(dados, csrfToken);
      showToast(`Equipamento "${novo.nome}" cadastrado com sucesso!`, 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar equipamento', 'error');
    }
  };

  const handleAddChamado = async (dados: Omit<ChamadoManutencao, 'id'>) => {
    try {
      const novo = await dbService.addChamado(dados, csrfToken);
      showToast(`Chamado de manutenção #${novo.id} registrado com sucesso!`, 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao abrir chamado', 'error');
    }
  };

  const handleUpdateStatusChamado = async (chamadoId: number, status: StatusChamado, custoReparo?: number) => {
    try {
      await dbService.updateStatusChamado(chamadoId, status, custoReparo, csrfToken);
      showToast('Status do chamado atualizado com sucesso!', 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar status', 'error');
    }
  };

  const handleAprovarChamado = async (chamadoId: number, aprovar: boolean) => {
    try {
      await dbService.aprovarChamadoManutencao(chamadoId, aprovar, csrfToken);
      showToast(aprovar ? 'Manutenção aprovada e liberada para o Técnico!' : 'Manutenção recusada.', aprovar ? 'success' : 'info');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao aprovar chamado', 'error');
    }
  };

  const handleAddEntrada = async (dados: Omit<EntradaRecurso, 'id'>) => {
    try {
      await dbService.addEntrada(dados, csrfToken);
      showToast(`Aporte "${dados.descricao}" cadastrado com sucesso!`, 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar aporte', 'error');
    }
  };

  const handleAddUsuario = async (dados: Omit<UserSistema, 'id'>) => {
    try {
      const u = await dbService.addUsuario(dados, csrfToken);
      showToast(`Usuário "${u.nome}" (${u.email}) cadastrado com sucesso!`, 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar usuário', 'error');
    }
  };

  const handleUpdateUsuario = async (id: number, dados: Partial<UserSistema>) => {
    try {
      const u = await dbService.updateUsuario(id, dados, csrfToken);
      showToast(`Dados de "${u.nome}" atualizados com sucesso!`, 'success');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao editar usuário', 'error');
    }
  };

  const handleDeleteUsuario = async (id: number) => {
    try {
      await dbService.deleteUsuario(id, csrfToken);
      showToast('Usuário removido com sucesso!', 'info');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover usuário', 'error');
    }
  };

  const handleDeleteEntrada = async (id: number) => {
    try {
      await dbService.deleteEntrada(id, csrfToken);
      showToast('Aporte removido com sucesso!', 'info');
      await reloadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover aporte', 'error');
    }
  };

  const formatarMoeda = (valor: number) => {
    return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return 'N/D';
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-BR');
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-circle-notch fa-spin text-primary" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
          <h2>Validando Sessão HttpOnly & Tokens CSRF...</h2>
          <p className="text-muted text-sm">Conformidade OWASP Top 10</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginModal />;
  }

  const pendentesCount = pedidos.filter(p => p.status === 'SOLICITADO' || p.status === 'RECEBIDO').length;

  return (
    <div className="app-layout">
      <Header 
        perfilAtual={perfilAtual}
        onExportarSQL={handleExportarSQL}
        onAbrirModalRelatorios={() => setModalRelatoriosOpen(true)}
      />

      <div className="app-body">
        <Navigation 
          activeTab={activeTab}
          perfilAtual={perfilAtual}
          pendentesCount={pendentesCount}
          onSelectTab={handleSelectTab}
        />

        <main className="app-main">
        {activeTab === 'novo-pedido' && (
          <div className="tab-content active">
            <NovoPedidoTab 
              unidades={unidades}
              materiais={materiais}
              perfilAtual={perfilAtual}
              onSubmit={handleNovoPedidoSubmit}
              onCancel={() => handleSelectTab('triagem')}
              formatarMoeda={formatarMoeda}
              showToast={showToast}
            />
          </div>
        )}

        {activeTab === 'triagem' && (
          <div className="tab-content active">
            <TriagemTab 
              pedidos={pedidos}
              unidades={unidades}
              perfilAtual={perfilAtual}
              onAbrirFicha={(p) => { setSelectedPedido(p); setModalFichaOpen(true); }}
              onAbrirRecebimento={(p) => { setSelectedPedido(p); setModalRecOpen(true); }}
              onAbrirAtendimento={(p) => { setSelectedPedido(p); setModalAtendOpen(true); }}
              onAbrirEnvio={(p) => { setSelectedPedido(p); setModalEnvioOpen(true); }}
              onCancelarPedido={(p) => handleCancelarPedido(p.id)}
              formatarData={formatarData}
            />
          </div>
        )}

        {activeTab === 'equipamentos' && (
          <div className="tab-content active">
            <EquipamentosTab 
              unidades={unidades}
              equipamentos={equipamentos}
              chamados={chamados}
              perfilAtual={perfilAtual}
              onAddEquipamento={handleAddEquipamento}
              onAddChamado={handleAddChamado}
              onUpdateStatusChamado={handleUpdateStatusChamado}
              onAprovarChamado={handleAprovarChamado}
              formatarMoeda={formatarMoeda}
            />
          </div>
        )}

        {activeTab === 'honorarios' && (perfilAtual === 'GESTOR' || perfilAtual === 'ADMINISTRADOR') && (
          <div className="tab-content active">
            <HonorariosTab 
              unidades={unidades}
              honorarios={honorarios}
              perfilAtual={perfilAtual}
              onAddHonorario={handleAddHonorario}
              formatarMoeda={formatarMoeda}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (perfilAtual === 'GESTOR' || perfilAtual === 'ADMINISTRADOR') && (
          <div className="tab-content active">
            <DashboardTab 
              pedidos={pedidos}
              unidades={unidades}
              materiais={materiais}
              honorarios={honorarios}
              chamados={chamados}
              entradas={entradas}
              onSwitchTab={handleSelectTab}
              onAbrirFicha={(p) => { setSelectedPedido(p); setModalFichaOpen(true); }}
              onAbrirAjusteEstoque={(m) => { setSelectedMaterial(m); setModalAjusteEstOpen(true); }}
              onAbrirEditarMaterial={(m) => { setSelectedMaterial(m); setModalEditMatOpen(true); }}
              onAbrirModalRelatorios={() => setModalRelatoriosOpen(true)}
              formatarData={formatarData}
              formatarMoeda={formatarMoeda}
            />
          </div>
        )}

        {activeTab === 'orcamento' && (perfilAtual === 'GESTOR' || perfilAtual === 'ADMINISTRADOR') && (
          <div className="tab-content active">
            <OrcamentoTab 
              unidades={unidades}
              entradas={entradas}
              pedidos={pedidos}
              materiais={materiais}
              honorarios={honorarios}
              chamados={chamados}
              perfilAtual={perfilAtual}
              onAddEntrada={handleAddEntrada}
              onDeleteEntrada={handleDeleteEntrada}
              formatarData={formatarData}
              formatarMoeda={formatarMoeda}
            />
          </div>
        )}

        {activeTab === 'catalogo' && (perfilAtual === 'GESTOR' || perfilAtual === 'ADMINISTRADOR') && (
          <div className="tab-content active">
            <CatalogoTab 
              unidades={unidades}
              materiais={materiais}
              perfilAtual={perfilAtual}
              onAbrirModalUnidade={() => setModalUniOpen(true)}
              onAbrirEditarUnidade={(u) => { setSelectedUnidade(u); setModalEditUniOpen(true); }}
              onDeletarUnidade={handleDeletarUnidade}
              onAbrirModalMaterial={() => setModalMatOpen(true)}
              onAbrirEditarMaterial={(m) => { setSelectedMaterial(m); setModalEditMatOpen(true); }}
              onAbrirAjusteEstoque={(m) => { setSelectedMaterial(m); setModalAjusteEstOpen(true); }}
              formatarData={formatarData}
              formatarMoeda={formatarMoeda}
            />
          </div>
        )}

        {activeTab === 'usuarios' && perfilAtual === 'ADMINISTRADOR' && (
          <div className="tab-content active">
            <UsuariosTab 
              unidades={unidades}
              usuarios={usuarios}
              onAddUsuario={handleAddUsuario}
              onUpdateUsuario={handleUpdateUsuario}
              onDeleteUsuario={handleDeleteUsuario}
            />
          </div>
        )}
        </main>
      </div>

      <ModalRecebimento 
        pedido={selectedPedido}
        isOpen={modalRecOpen}
        onClose={() => setModalRecOpen(false)}
        onConfirm={handleConfirmarRecebimento}
      />

      <ModalAtendimento 
        pedido={selectedPedido}
        materiais={materiais}
        isOpen={modalAtendOpen}
        onClose={() => setModalAtendOpen(false)}
        onConfirm={handleConfirmarAtendimento}
        showToast={showToast}
      />

      <ModalEnvio 
        pedido={selectedPedido}
        isOpen={modalEnvioOpen}
        onClose={() => setModalEnvioOpen(false)}
        onConfirm={handleConfirmarEnvio}
      />

      <ModalMaterial 
        isOpen={modalMatOpen}
        onClose={() => setModalMatOpen(false)}
        onConfirm={handleConfirmarMaterial}
      />

      <ModalEditarMaterial 
        material={selectedMaterial}
        isOpen={modalEditMatOpen}
        onClose={() => setModalEditMatOpen(false)}
        onConfirm={handleConfirmarEdicaoMaterial}
      />

      <ModalAjusteEstoque 
        material={selectedMaterial}
        isOpen={modalAjusteEstOpen}
        onClose={() => setModalAjusteEstOpen(false)}
        onConfirm={handleConfirmarAjusteEstoque}
      />

      <ModalUnidade 
        isOpen={modalUniOpen}
        onClose={() => setModalUniOpen(false)}
        onConfirm={handleConfirmarUnidade}
      />

      <ModalEditarUnidade 
        unidade={selectedUnidade}
        isOpen={modalEditUniOpen}
        onClose={() => setModalEditUniOpen(false)}
        onConfirm={handleConfirmarEdicaoUnidade}
      />

      <ModalFichaPbs 
        pedido={selectedPedido}
        unidades={unidades}
        materiais={materiais}
        perfilAtual={user?.perfil || 'SOLICITANTE'}
        isOpen={modalFichaOpen}
        onClose={() => setModalFichaOpen(false)}
        formatarData={formatarData}
        formatarMoeda={formatarMoeda}
      />

      <ModalRelatorio 
        unidades={unidades}
        pedidos={pedidos}
        materiais={materiais}
        honorarios={honorarios}
        chamados={chamados}
        equipamentos={equipamentos}
        isOpen={modalRelatoriosOpen}
        onClose={() => setModalRelatoriosOpen(false)}
        formatarData={formatarData}
        formatarMoeda={formatarMoeda}
      />

      <Toast toasts={toasts} />
    </div>
  );
};
