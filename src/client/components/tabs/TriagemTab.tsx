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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
  Hourglass,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';
  const isSolicitante = perfilAtual === 'SOLICITANTE';
  const isPrivilegiado = isGestor || isAdmin;
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterUnidade, setFilterUnidade] = useState<string>('TODAS');
  const [search, setSearch] = useState<string>('');

  const userUnidade = unidades.find(u => u.id === user?.unidade_id);

  const renderBadgeStatus = (status: StatusPedido) => {
    switch (status) {
      case 'SOLICITADO':
        return <Badge variant="warning"><Clock className="h-3 w-3" /> Solicitado</Badge>;
      case 'RECEBIDO':
        return <Badge variant="info"><PackageCheck className="h-3 w-3" /> Recebido</Badge>;
      case 'ATENDIDO_PARCIAL':
        return <Badge variant="purple"><Boxes className="h-3 w-3" /> Parcial</Badge>;
      case 'ATENDIDO_TOTAL':
        return <Badge variant="success"><Check className="h-3 w-3" /> Atendido</Badge>;
      case 'ENVIADO':
        return <Badge variant="default"><Truck className="h-3 w-3" /> Enviado</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive"><Ban className="h-3 w-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtrados = pedidos.filter(p => {
    // Regra de Isolamento por Unidade de Saúde:
    // Usuários com perfil SOLICITANTE visualizam estritamente os pedidos de sua própria unidade
    if (isSolicitante) {
      if (!user?.unidade_id || p.unidade_emitente_id !== user.unidade_id) {
        return false;
      }
    } else if (isPrivilegiado && filterUnidade !== 'TODAS') {
      if (p.unidade_emitente_id !== Number(filterUnidade)) {
        return false;
      }
    }

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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E8EC] dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#2563EB]" />
              {isPrivilegiado ? 'Central de Atendimento & Triagem de Pedidos' : 'Meus Pedidos & Acompanhamento'}
            </CardTitle>
            {isSolicitante && userUnidade && (
              <Badge variant="outline" className="bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[11px] font-semibold flex items-center">
                <Building2 className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
                {userUnidade.nome}
              </Badge>
            )}
          </div>
          <CardDescription>
            {isPrivilegiado 
              ? 'Receba solicitações das USFs, faça a conferência de itens e confirme o envio.' 
              : isGestor
              ? 'Acompanhe as solicitações das USFs e visualize o status de atendimento.'
              : userUnidade
              ? `Exibindo exclusivamente as solicitações emitidas para sua unidade (${userUnidade.nome}).`
              : 'Acompanhe a situação dos pedidos emitidos pela sua unidade de saúde.'}
          </CardDescription>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isPrivilegiado && (
            <div className="w-56">
              <Select value={filterUnidade} onValueChange={(val) => setFilterUnidade(val)}>
                <SelectTrigger className="h-[38px] text-xs font-medium">
                  <SelectValue placeholder="Todas as Unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Unidades</SelectItem>
                  {unidades.map(uni => (
                    <SelectItem key={uni.id} value={String(uni.id)}>
                      {uni.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-52">
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
              <SelectTrigger className="h-[38px] text-xs font-medium">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Status</SelectItem>
                <SelectItem value="SOLICITADO">Solicitado (Pendente)</SelectItem>
                <SelectItem value="RECEBIDO">Recebido (Em Separação)</SelectItem>
                <SelectItem value="ATENDIDO_PARCIAL">Atendido Parcial</SelectItem>
                <SelectItem value="ATENDIDO_TOTAL">Atendido Total</SelectItem>
                <SelectItem value="ENVIADO">Enviado (Despachado)</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-52">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-[#9C9C9C]" />
            <Input 
              type="text" 
              placeholder="Buscar Nº PBS, USF..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
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
                  {isSolicitante 
                    ? 'Nenhuma solicitação localizada para a sua unidade de saúde.' 
                    : 'Nenhuma solicitação localizada com os filtros atuais.'}
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
                          title="Visualizar Ficha PBS"
                          aria-label="Visualizar Ficha PBS"
                          className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-border text-foreground hover:bg-muted transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Ficha
                        </Button>

                        {isPrivilegiado ? (
                          <>
                            {(p.status === 'SOLICITADO' || p.status === 'RECEBIDO') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onCancelarPedido(p)}
                                title="Cancelar Solicitação"
                                aria-label="Cancelar Solicitação"
                                className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Ban className="h-3.5 w-3.5" /> Cancelar
                              </Button>
                            )}
                            {p.status === 'SOLICITADO' && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => onAbrirRecebimento(p)}
                                title="Confirmar Recebimento"
                                aria-label="Confirmar Recebimento"
                                className="h-7.5 px-2.5 text-xs font-medium gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-colors"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" /> 1. Receber
                              </Button>
                            )}

                            {p.status === 'RECEBIDO' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onAbrirAtendimento(p)}
                                  title="Atender Itens Solicitados"
                                  aria-label="Atender Itens Solicitados"
                                  className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Boxes className="h-3.5 w-3.5" /> 2. Atender
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => onAbrirEnvio(p)}
                                  title="Despachar Pedido"
                                  aria-label="Despachar Pedido"
                                  className="h-7.5 px-2.5 text-xs font-medium gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-colors"
                                >
                                  <Truck className="h-3.5 w-3.5" /> 3. Enviar
                                </Button>
                              </>
                            )}

                            {(p.status === 'ATENDIDO_PARCIAL' || p.status === 'ATENDIDO_TOTAL') && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onAbrirAtendimento(p)}
                                  title="Editar Quantidades Atendidas"
                                  aria-label="Editar Quantidades Atendidas"
                                  className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Boxes className="h-3.5 w-3.5" /> Qtds
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => onAbrirEnvio(p)}
                                  title="Despachar Pedido"
                                  aria-label="Despachar Pedido"
                                  className="h-7.5 px-2.5 text-xs font-medium gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-colors"
                                >
                                  <Truck className="h-3.5 w-3.5" /> 3. Enviar
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
