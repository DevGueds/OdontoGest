import React, { useState, useEffect } from 'react';
import { UnidadeSaude, Material, PerfilUsuario } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell 
} from '../ui/table';
import {
  FilePlus2,
  Building2,
  Calendar,
  User,
  Plus,
  Trash2,
  Send,
  Lock,
  ShieldCheck,
  AlertCircle,
  Boxes,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FormItem {
  id: number;
  material_id: number | '';
  unidade_medida: string;
  qtd_pedida: number;
  valor_unitario: number;
  valor_total: number;
}

interface Props {
  unidades: UnidadeSaude[];
  materiais: Material[];
  perfilAtual: PerfilUsuario;
  onSubmit: (dados: {
    unidade_emitente_id: number;
    data_pedido: string;
    responsavel_nome: string;
    responsavel_funcao?: string;
    responsavel_registro?: string;
    atividade_programa?: string;
    elemento_despesa?: string;
    observacoes?: string;
    itens: { material_id: number; qtd_pedida: number; valor_unitario: number }[];
  }) => void;
  onCancel: () => void;
  formatarMoeda: (v: number) => string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const NovoPedidoTab: React.FC<Props> = ({
  unidades,
  materiais,
  perfilAtual,
  onSubmit,
  onCancel,
  formatarMoeda,
  showToast
}) => {
  const { user } = useAuth();
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';
  const isSolicitante = perfilAtual === 'SOLICITANTE' || (!isAdmin && !isGestor);
  const [showEdicaoSolicitante, setShowEdicaoSolicitante] = useState(false);

  const [unidadeId, setUnidadeId] = useState<number | ''>(unidades[0]?.id || '');
  const [dataPedido, setDataPedido] = useState(new Date().toISOString().substring(0, 10));
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelFuncao, setResponsavelFuncao] = useState('');
  const [responsavelRegistro, setResponsavelRegistro] = useState('');

  useEffect(() => {
    if (user) {
      if (user.unidade_id && unidades.some(u => u.id === user.unidade_id)) {
        setUnidadeId(user.unidade_id);
      }
      if (user.nome) {
        setResponsavelNome(user.nome);
      }
      if (user.funcao) {
        setResponsavelFuncao(user.funcao);
      }
      if (user.registro) {
        setResponsavelRegistro(user.registro);
      }
    }
  }, [user, unidades]);

  const [itens, setItens] = useState<FormItem[]>([
    { id: 1, material_id: '', unidade_medida: '', qtd_pedida: 1, valor_unitario: 0, valor_total: 0 }
  ]);

  const handleAddLinha = () => {
    setItens(prev => [
      ...prev,
      { id: Date.now(), material_id: '', unidade_medida: '', qtd_pedida: 1, valor_unitario: 0, valor_total: 0 }
    ]);
  };

  const handleRemoveLinha = (id: number) => {
    if (itens.length <= 1) {
      showToast("O pedido deve ter no mínimo 1 item solicitado.", "error");
      return;
    }
    setItens(prev => prev.filter(item => item.id !== id));
  };

  const handleMaterialChange = (id: number, matIdStr: string) => {
    const matId = parseInt(matIdStr);
    const mat = materiais.find(m => m.id === matId);

    setItens(prev => prev.map(item => {
      if (item.id === id) {
        const vUnit = mat ? mat.valor_estimado : 0;
        const un = mat ? mat.unidade_medida : '';
        let novaQtd = item.qtd_pedida || 1;

        if (mat?.limite_max_pedido && novaQtd > mat.limite_max_pedido) {
          novaQtd = mat.limite_max_pedido;
          showToast(`Quantidade ajustada para o limite de ${mat.limite_max_pedido} ${mat.unidade_medida} em "${mat.descricao}".`, 'info');
        }

        return {
          ...item,
          material_id: isNaN(matId) ? '' : matId,
          unidade_medida: un,
          valor_unitario: vUnit,
          qtd_pedida: novaQtd,
          valor_total: novaQtd * vUnit
        };
      }
      return item;
    }));
  };

  const handleQtdChange = (id: number, qtd: number) => {
    const itemAtual = itens.find(i => i.id === id);
    if (!itemAtual) return;

    let finalQtd = isNaN(qtd) || qtd < 1 ? 1 : qtd;
    const mat = materiais.find(m => m.id === itemAtual.material_id);

    if (mat?.limite_max_pedido && finalQtd > mat.limite_max_pedido) {
      finalQtd = mat.limite_max_pedido;
      showToast(`Atenção: A quantidade máxima permitida para "${mat.descricao}" é ${mat.limite_max_pedido} ${mat.unidade_medida}.`, 'error');
    }

    setItens(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          qtd_pedida: finalQtd,
          valor_total: finalQtd * item.valor_unitario
        };
      }
      return item;
    }));
  };

  const handleValorUnitChange = (id: number, valor: number) => {
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        const v = isNaN(valor) || valor < 0 ? 0 : valor;
        return {
          ...item,
          valor_unitario: v,
          valor_total: item.qtd_pedida * v
        };
      }
      return item;
    }));
  };

  const totalEstimado = itens.reduce((acc, curr) => acc + curr.valor_total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeId) {
      showToast("Selecione o estabelecimento emitente.", "error");
      return;
    }

    const validItens = itens.filter(item => typeof item.material_id === 'number' && item.material_id > 0);
    if (validItens.length === 0) {
      showToast("Por favor, selecione os materiais do catálogo para o pedido.", "error");
      return;
    }

    for (const item of validItens) {
      const mat = materiais.find(m => m.id === Number(item.material_id));
      if (mat?.limite_max_pedido && item.qtd_pedida > mat.limite_max_pedido) {
        showToast(`O item "${mat.descricao}" excede o limite máximo permitido de ${mat.limite_max_pedido} ${mat.unidade_medida}.`, "error");
        return;
      }
    }

    onSubmit({
      unidade_emitente_id: Number(unidadeId),
      data_pedido: dataPedido,
      responsavel_nome: responsavelNome,
      responsavel_funcao: responsavelFuncao,
      responsavel_registro: responsavelRegistro,
      atividade_programa: '',
      elemento_despesa: '',
      observacoes: '',
      itens: validItens.map(i => ({
        material_id: Number(i.material_id),
        qtd_pedida: i.qtd_pedida,
        valor_unitario: i.valor_unitario
      }))
    });

    // Reset
    setResponsavelNome(user?.nome || '');
    setResponsavelFuncao(user?.funcao || '');
    setResponsavelRegistro(user?.registro || '');

    if (user?.unidade_id && unidades.some(u => u.id === user.unidade_id)) {
      setUnidadeId(user.unidade_id);
    }
    setItens([{ id: Date.now(), material_id: '', unidade_medida: '', qtd_pedida: 1, valor_unitario: 0, valor_total: 0 }]);
  };

  const listaMateriaisOpcoes = React.useMemo(() => {
    if (isGestor) {
      return materiais
        .filter(m => (m.qtd_estoque ?? 0) > 0)
        .map(m => ({
          id: m.id,
          descricaoLabel: m.fornecedor ? `${m.descricao} (${m.fornecedor})` : m.descricao,
          material: m,
          txtComplemento: ` [Estoque: ${m.qtd_estoque} ${m.unidade_medida}${m.limite_max_pedido ? ` | Limite: ${m.limite_max_pedido} ${m.unidade_medida}` : ''}]`
        }));
    } else {
      const agrupadosMap = new Map<string, Material[]>();
      materiais.forEach(m => {
        const chave = `${m.descricao.trim().toLowerCase()}___${m.unidade_medida.trim().toLowerCase()}`;
        if (!agrupadosMap.has(chave)) {
          agrupadosMap.set(chave, []);
        }
        agrupadosMap.get(chave)!.push(m);
      });

      const resultado = [];
      for (const [, lista] of agrupadosMap.entries()) {
        const principal = lista.find(m => (m.qtd_estoque ?? 0) > 0) || lista[0];
        const estoqueTotal = lista.reduce((acc, curr) => acc + (curr.qtd_estoque ?? 0), 0);
        if (estoqueTotal <= 0) continue;

        const limite = principal.limite_max_pedido;
        let txtComplemento = '';
        if (limite) {
          txtComplemento = ` [Limite máx: ${limite} ${principal.unidade_medida}]`;
        }

        resultado.push({
          id: principal.id,
          descricaoLabel: principal.descricao,
          material: principal,
          txtComplemento
        });
      }
      return resultado;
    }
  }, [materiais, isGestor]);

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E8EC] dark:border-zinc-800 pb-5">
        <div>
          <CardTitle className="text-lg font-bold">
            <FilePlus2 className="h-5 w-5 text-[#2563EB]" />
            Formular Novo Pedido de Bens e Serviços (PBS)
          </CardTitle>
          <CardDescription>
            Preencha os dados da solicitação para emissão pelo posto de saúde.
          </CardDescription>
        </div>

        <Badge variant="info">
          <User className="h-3 w-3" />
          Perfil: {isGestor ? 'Gestor (Almoxarifado)' : isAdmin ? 'Administrador' : 'Solicitante (USF)'}
        </Badge>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Identificação */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] dark:text-zinc-400 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#2563EB]" />
                1. Identificação do Estabelecimento de Saúde e Responsável
              </h4>
              {isSolicitante && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEdicaoSolicitante(!showEdicaoSolicitante)}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:bg-[#2563EB]/5 gap-1.5 h-7"
                >
                  <Edit3 className="h-3 w-3" />
                  {showEdicaoSolicitante ? 'Ocultar Detalhes' : 'Alterar Dados'}
                </Button>
              )}
            </div>

            {isSolicitante && !showEdicaoSolicitante ? (
              <div className="rounded-[8px] border border-[#E8E8EC] dark:border-zinc-800 bg-[#F9FAFB] dark:bg-zinc-900/40 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#2563EB]/10 text-[#2563EB]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#0A0A0A] dark:text-zinc-100">
                          {unidades.find(u => u.id === Number(unidadeId))?.nome || 'Unidade de Saúde'}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-[#2563EB] border-[#2563EB]/30">
                          Unidade Vinculada
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6B6B6B] dark:text-zinc-400 mt-1">
                        Solicitante: <span className="font-medium text-[#0A0A0A] dark:text-zinc-200">{responsavelNome || user?.nome || 'Não informado'}</span>
                        {(responsavelFuncao || user?.funcao) && ` • ${responsavelFuncao || user?.funcao}`}
                        {(responsavelRegistro || user?.registro) && ` (${responsavelRegistro || user?.registro})`}
                      </p>
                    </div>
                  </div>
                  <div className="sm:border-l sm:border-[#E8E8EC] dark:sm:border-zinc-800 sm:pl-4 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-semibold text-[#9C9C9C] block">Data da Solicitação</span>
                    <span className="text-xs font-mono font-medium text-[#0A0A0A] dark:text-zinc-200">
                      {new Date(dataPedido + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 rounded-[8px] border border-[#E8E8EC] dark:border-zinc-800 p-4 bg-white dark:bg-[#121215]">
                <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                  <label htmlFor="unidade_emitente_id" className="text-xs font-medium text-[#0A0A0A] dark:text-zinc-300">
                    Unidade Emitente / Posto de Saúde *
                  </label>
                  <select 
                    id="unidade_emitente_id" 
                    className="flex h-[38px] w-full rounded-[6px] border border-[#E8E8EC] bg-white px-3 py-1 text-xs text-[#0A0A0A] transition-all duration-150 focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-100"
                    value={unidadeId}
                    onChange={(e) => setUnidadeId(Number(e.target.value))}
                    disabled={!isAdmin && Boolean(user?.unidade_id)}
                    required
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                  {!isAdmin && Boolean(user?.unidade_id) ? (
                    <p className="text-[11px] text-[#9C9C9C] flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Unidade fixada conforme seu cadastro.
                    </p>
                  ) : isAdmin ? (
                    <p className="text-[11px] text-[#9C9C9C] flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-[#2563EB]" /> Admin: alteração livre.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="data_pedido" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Data da Solicitação *
                  </label>
                  <Input 
                    type="date" 
                    id="data_pedido" 
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    required 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="responsavel_nome" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome do Responsável *
                  </label>
                  <Input 
                    type="text" 
                    id="responsavel_nome" 
                    placeholder="Ex: Dra. Maria Fernanda Silva" 
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    required 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="responsavel_funcao" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Função / Cargo
                  </label>
                  <Input 
                    type="text" 
                    id="responsavel_funcao" 
                    placeholder="Ex: Cirurgiã Dentista"
                    value={responsavelFuncao}
                    onChange={(e) => setResponsavelFuncao(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="responsavel_registro" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Registro Profissional
                  </label>
                  <Input 
                    type="text" 
                    id="responsavel_registro" 
                    placeholder="Ex: CRO/PA 0592"
                    value={responsavelRegistro}
                    onChange={(e) => setResponsavelRegistro(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Insumos Solicitados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] dark:text-zinc-400 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#2563EB]" />
                2. Materiais / Insumos Solicitados
              </h4>
              <Badge variant="outline" className="font-mono text-[11px] text-[#6B6B6B] dark:text-zinc-400">
                {itens.filter(i => Boolean(i.material_id)).length} de {itens.length} {itens.length === 1 ? 'item preenchido' : 'itens preenchidos'}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Material / Descrição do Catálogo</TableHead>
                  <TableHead className="w-24">Unidade</TableHead>
                  <TableHead className="w-32">Qtd. Pedida</TableHead>
                  {isGestor && <TableHead className="w-32">Val. Unit. (Est.)</TableHead>}
                  {isGestor && <TableHead className="w-32">Val. Total (Est.)</TableHead>}
                  <TableHead className="w-16 text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, index) => {
                  const selectedMat = materiais.find(m => m.id === item.material_id);
                  const limiteItem = selectedMat?.limite_max_pedido;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#6B6B6B]">{index + 1}</TableCell>
                      <TableCell>
                        <select 
                          className="flex h-[38px] w-full rounded-[6px] border border-[#E8E8EC] bg-white px-2.5 py-1 text-xs text-[#0A0A0A] transition-all duration-150 focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-100"
                          value={item.material_id}
                          onChange={(e) => handleMaterialChange(item.id, e.target.value)}
                          required
                        >
                          <option value="">-- Selecione o Material --</option>
                          {listaMateriaisOpcoes.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {opt.descricaoLabel}{opt.txtComplemento}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input type="text" readOnly value={item.unidade_medida} placeholder="-" className="h-8 text-xs bg-zinc-50 dark:bg-zinc-800/50 text-center" />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1"
                          max={limiteItem || undefined} 
                          value={item.qtd_pedida}
                          onChange={(e) => handleQtdChange(item.id, parseInt(e.target.value) || 1)}
                          required 
                          className="h-8 text-xs font-semibold"
                        />
                        {limiteItem && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-1">
                            Máx: {limiteItem} {selectedMat?.unidade_medida}
                          </span>
                        )}
                      </TableCell>
                      {isGestor && (
                        <TableCell>
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={item.valor_unitario}
                            onChange={(e) => handleValorUnitChange(item.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                      )}
                      {isGestor && (
                        <TableCell className="font-mono text-xs font-semibold">
                          {formatarMoeda(item.valor_total)}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="iconSm" 
                          className="text-[#EF4444] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={() => handleRemoveLinha(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              {isGestor && (
                <TableFooter>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-800/40 font-bold">
                    <TableCell colSpan={5} className="text-right text-xs uppercase tracking-wider text-[#6B6B6B]">VALOR TOTAL ESTIMADO:</TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-[#2563EB]">
                      {formatarMoeda(totalEstimado)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>

            {/* Botão Adicionar Insumo diretamente abaixo da última linha da tabela */}
            <div className="mt-3 flex items-center justify-between">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddLinha}
                className="text-xs gap-1.5 border-dashed border-[#E8E8EC] dark:border-zinc-800 hover:border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/5"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Insumo
              </Button>
              <span className="text-xs text-[#9C9C9C]">
                Total: {itens.length} {itens.length === 1 ? 'linha de item' : 'linhas de itens'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8EC] dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" size="default" className="font-medium text-sm">
              <Send className="h-4 w-4 mr-1.5" /> Emitir Solicitação de PBS
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
