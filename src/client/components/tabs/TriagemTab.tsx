import React, { useState } from 'react';
import { PedidoPBS, UnidadeSaude, PerfilUsuario, StatusPedido } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '../ui/table';
import {
  Boxes,
  Search,
  FileText,
  Clock,
  PackageCheck,
  Check,
  Truck,
  Ban,
  Calendar,
  ClipboardCheck,
  Edit,
  Hourglass
} from 'lucide-react';

interface Props {
  pedidos: PedidoPBS[];
  unidades: UnidadeSaude[];
  perfilAtual: PerfilUsuario;
  onAbrirFicha: (pedido: PedidoPBS) => void;
  onAbrirRecebimento: (pedido: PedidoPBS) => void;
  onAbrirAtendimento: (pedido: PedidoPBS) => void;
  onAbrirEnvio: (pedido: PedidoPBS) => void;
  onCancelarPedido: (pedido: PedidoPBS) => void;
  formatarData: (d?: string | null) => string;
}

export const TriagemTab: React.FC<Props> = ({
  pedidos,
  unidades,
  perfilAtual,
  onAbrirFicha,
  onAbrirRecebimento,
  onAbrirAtendimento,
  onAbrirEnvio,
  onCancelarPedido,
  formatarData
}) => {
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';
  const isPrivilegiado = isGestor || isAdmin;
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');

  const renderBadgeStatus = (status: StatusPedido) => {
    switch (status) {
      case 'SOLICITADO':
        return <Badge variant="warning"><Clock className="h-3 w-3" /> SOLICITADO</Badge>;
      case 'RECEBIDO':
        return <Badge variant="info"><PackageCheck className="h-3 w-3" /> RECEBIDO</Badge>;
      case 'ATENDIDO_PARCIAL':
        return <Badge variant="purple"><Boxes className="h-3 w-3" /> PARCIAL</Badge>;
      case 'ATENDIDO_TOTAL':
        return <Badge variant="success"><Check className="h-3 w-3" /> ATENDIDO</Badge>;
      case 'ENVIADO':
        return <Badge variant="default"><Truck className="h-3 w-3" /> ENVIADO</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive"><Ban className="h-3 w-3" /> CANCELADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtrados = pedidos.filter(p => {
    if (filterStatus !== 'TODOS' && p.status !== filterStatus) return false;
    const u = unidades.find(uni => uni.id === p.unidade_emitente_id);
    const nomeUnidade = u ? u.nome.toLowerCase() : '';

    if (search) {
      const query = search.toLowerCase();
      const numPbs = p.numero_pbs.toLowerCase();
      const resp = p.responsavel_nome.toLowerCase();
      return numPbs.includes(query) || nomeUnidade.includes(query) || resp.includes(query);
    }
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold">
            <Boxes className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            {isPrivilegiado ? 'Central de Atendimento & Triagem de Pedidos' : 'Meus Pedidos & Acompanhamento'}
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Receba solicitações das USFs, faça a conferência de itens e confirme o envio.' 
              : isGestor
              ? 'Acompanhe as solicitações das USFs e visualize o status de atendimento.'
              : 'Acompanhe a situação dos pedidos emitidos pela sua unidade de saúde.'}
          </CardDescription>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select 
            className="flex h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="SOLICITADO">SOLICITADO (Pendente)</option>
            <option value="RECEBIDO">RECEBIDO (Em Separação)</option>
            <option value="ATENDIDO_PARCIAL">ATENDIDO PARCIAL</option>
            <option value="ATENDIDO_TOTAL">ATENDIDO TOTAL</option>
            <option value="ENVIADO">ENVIADO (Despachado)</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Buscar Nº PBS, USF..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº PBS</TableHead>
              <TableHead>Unidade Emitente</TableHead>
              <TableHead>Data Pedido</TableHead>
              <TableHead>Responsável USF</TableHead>
              <TableHead>Status Atual</TableHead>
              <TableHead>Recepção Almox.</TableHead>
              <TableHead>Envio / Despacho</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  Nenhuma solicitação localizada com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map(p => {
                const u = unidades.find(uni => uni.id === p.unidade_emitente_id);
                const nomeUnidade = u ? u.nome : `Unidade #${p.unidade_emitente_id}`;

                const recInfo = p.apontador_recebimento_nome ? (
                  <div className="text-xs">
                    <strong className="text-slate-800 dark:text-slate-200">{p.apontador_recebimento_nome}</strong>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> {formatarData(p.data_recebimento)}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Não recebido</span>
                );

                const envInfo = p.apontador_envio_nome ? (
                  <div className="text-xs">
                    <strong className="text-slate-800 dark:text-slate-200">{p.apontador_envio_nome}</strong>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> {formatarData(p.data_envio)}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Não enviado</span>
                );

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {p.numero_pbs}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{nomeUnidade}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatarData(p.data_pedido)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{p.responsavel_nome}</div>
                      {p.responsavel_registro && (
                        <div className="text-[10px] text-slate-400">{p.responsavel_registro}</div>
                      )}
                    </TableCell>
                    <TableCell>{renderBadgeStatus(p.status)}</TableCell>
                    <TableCell>{recInfo}</TableCell>
                    <TableCell>{envInfo}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onAbrirFicha(p)}
                          className="h-7 text-xs"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" /> Ficha
                        </Button>

                        {isAdmin ? (
                          <>
                            {(p.status === 'SOLICITADO' || p.status === 'RECEBIDO') && (
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => onCancelarPedido(p)}
                                className="h-7 text-xs"
                              >
                                <Ban className="h-3 w-3 mr-1" /> Cancelar
                              </Button>
                            )}
                            {p.status === 'SOLICITADO' && (
                              <Button 
                                variant="emerald" 
                                size="sm" 
                                onClick={() => onAbrirRecebimento(p)}
                                className="h-7 text-xs"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> 1. Receber
                              </Button>
                            )}

                            {p.status === 'RECEBIDO' && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => onAbrirAtendimento(p)}
                                  className="h-7 text-xs"
                                >
                                  <Boxes className="h-3.5 w-3.5 mr-1" /> 2. Atender
                                </Button>
                                <Button 
                                  variant="emerald" 
                                  size="sm" 
                                  onClick={() => onAbrirEnvio(p)}
                                  className="h-7 text-xs"
                                >
                                  <Truck className="h-3.5 w-3.5 mr-1" /> 3. Enviar
                                </Button>
                              </>
                            )}

                            {(p.status === 'ATENDIDO_PARCIAL' || p.status === 'ATENDIDO_TOTAL') && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onAbrirAtendimento(p)}
                                  className="h-7 text-xs"
                                >
                                  <Edit className="h-3 w-3 mr-1" /> Qtds
                                </Button>
                                <Button 
                                  variant="emerald" 
                                  size="sm" 
                                  onClick={() => onAbrirEnvio(p)}
                                  className="h-7 text-xs"
                                >
                                  <Truck className="h-3.5 w-3.5 mr-1" /> 3. Enviar
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {p.status === 'SOLICITADO' && (
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => onCancelarPedido(p)}
                                className="h-7 text-xs"
                              >
                                <Ban className="h-3 w-3 mr-1" /> Cancelar
                              </Button>
                            )}
                            {p.status === 'SOLICITADO' && (
                              <Badge variant="warning"><Hourglass className="h-3 w-3" /> Aguardando</Badge>
                            )}
                            {(p.status === 'RECEBIDO' || p.status === 'ATENDIDO_PARCIAL' || p.status === 'ATENDIDO_TOTAL') && (
                              <Badge variant="info"><Boxes className="h-3 w-3" /> Em Separação</Badge>
                            )}
                            {p.status === 'ENVIADO' && (
                              <Badge variant="success"><Check className="h-3 w-3" /> Despachado</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
