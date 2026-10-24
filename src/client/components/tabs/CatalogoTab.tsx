import React from 'react';
import { UnidadeSaude, Material, PerfilUsuario } from '../../types';
import { useSortableData } from '../../hooks/useSortableData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ConfirmDeleteDialog } from '../ui/confirm-dialog';
import { 
  Building2, 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Lock, 
  Boxes, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Landmark, 
  Receipt, 
  Truck,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface Props {
  unidades: UnidadeSaude[];
  materiais: Material[];
  perfilAtual?: PerfilUsuario;
  onAbrirModalUnidade: () => void;
  onAbrirEditarUnidade: (u: UnidadeSaude) => void;
  onDeletarUnidade: (id: number) => void;
  onAbrirModalMaterial: () => void;
  onAbrirEditarMaterial: (m: Material) => void;
  onAbrirAjusteEstoque: (m: Material) => void;
  onDeletarMaterial: (id: number) => void;
  formatarData: (d?: string | null) => string;
  formatarMoeda: (v: number) => string;
}

export const CatalogoTab: React.FC<Props> = ({
  unidades,
  materiais,
  perfilAtual = 'ADMINISTRADOR',
  onAbrirModalUnidade,
  onAbrirEditarUnidade,
  onDeletarUnidade,
  onAbrirModalMaterial,
  onAbrirEditarMaterial,
  onAbrirAjusteEstoque,
  onDeletarMaterial,
  formatarData,
  formatarMoeda
}) => {
  const isReadOnly = perfilAtual === 'GESTOR';
  const [unidadeToDelete, setUnidadeToDelete] = React.useState<UnidadeSaude | null>(null);
  const [materialToDelete, setMaterialToDelete] = React.useState<Material | null>(null);

  const { items: sortedUnidades, requestSort: requestSortUnidades, getSortIndicator: getSortUnidades } = useSortableData(unidades, { key: 'id', direction: 'asc' });
  const { items: sortedMateriais, requestSort: requestSortMateriais, getSortIndicator: getSortMateriais } = useSortableData(materiais, { key: 'descricao', direction: 'asc' });

  return (
    <div className="space-y-8">
      {/* Unidades / Estabelecimentos de Saúde */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E8EC] dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#2563EB]" />
              Estabelecimentos / Postos de Saúde
            </CardTitle>
            <CardDescription>
              {isReadOnly ? 'Visualização em Modo Somente Leitura (Gestor)' : 'Gerenciamento dos postos e unidades de atendimento cadastradas'}
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Button size="sm" onClick={onAbrirModalUnidade} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Estabelecimento
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSortUnidades('id')} className="cursor-pointer select-none w-20">
                    <span className="flex items-center gap-1">ID {getSortUnidades('id')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortUnidades('nome')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Nome do Estabelecimento {getSortUnidades('nome')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortUnidades('criado_em')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Data Cadastro {getSortUnidades('criado_em')}</span>
                  </TableHead>
                  <TableHead className="text-center w-36">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUnidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum estabelecimento cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUnidades.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-semibold text-muted-foreground">#{u.id}</TableCell>
                      <TableCell className="font-semibold text-foreground">{u.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatarData(u.criado_em)}</TableCell>
                      <TableCell className="text-center">
                        {!isReadOnly ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onAbrirEditarUnidade(u)}
                              title="Editar Estabelecimento"
                              className="h-8 gap-1 text-[#2563EB] hover:text-[#1D4ED8] hover:bg-[#2563EB]/10"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-xs">Editar</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setUnidadeToDelete(u)}
                              title="Apagar Estabelecimento"
                              className="h-8 gap-1 text-[#EF4444] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-xs">Apagar</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Somente Leitura
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Catálogo de Materiais / Insumos */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E8EC] dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#2563EB]" />
              Catálogo de Materiais & Insumos
            </CardTitle>
            <CardDescription>
              Insumos odontológicos e clínicos disponíveis para requisições
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Button size="sm" onClick={onAbrirModalMaterial} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Insumo/Material
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSortMateriais('descricao')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Descrição do Material / Insumo {getSortMateriais('descricao')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortMateriais('natureza')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Natureza {getSortMateriais('natureza')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortMateriais('fornecedor')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Fornecedor {getSortMateriais('fornecedor')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortMateriais('unidade_medida')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Unid. {getSortMateriais('unidade_medida')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortMateriais('valor_estimado')} className="cursor-pointer select-none text-right">
                    <span className="flex items-center justify-end gap-1">Val. Estimado {getSortMateriais('valor_estimado')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortMateriais('qtd_estoque')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Estoque {getSortMateriais('qtd_estoque')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSortMateriais('limite_max_pedido')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Limite Máx. {getSortMateriais('limite_max_pedido')}</span>
                  </TableHead>
                  <TableHead className="text-center w-56">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMateriais.map(m => {
                  const est = m.qtd_estoque ?? 0;
                  let badgeEstoque = (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {est} {m.unidade_medida}
                    </Badge>
                  );
                  if (est <= 0) {
                    badgeEstoque = (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> 0 {m.unidade_medida} (Esgotado)
                      </Badge>
                    );
                  } else if (est < 20) {
                    badgeEstoque = (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> {est} {m.unidade_medida} (Baixo)
                      </Badge>
                    );
                  }

                  const txtLimite = m.limite_max_pedido ? (
                    <Badge variant="warning" className="gap-1">
                      Máx. {m.limite_max_pedido} {m.unidade_medida}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Sem limite</span>
                  );

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-foreground">{m.descricao}</TableCell>
                      <TableCell>
                        {m.natureza === 'INVESTIMENTO' ? (
                          <Badge variant="purple" className="flex items-center gap-1 w-fit">
                            <Landmark className="w-3 h-3" /> Investimento
                          </Badge>
                        ) : (
                          <Badge variant="info" className="flex items-center gap-1 w-fit">
                            <Receipt className="w-3 h-3" /> Custeio
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.fornecedor ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Truck className="w-3 h-3 text-muted-foreground" /> {m.fornecedor}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Padrão / Não inf.</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.unidade_medida}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatarMoeda(m.valor_estimado || 0)}
                      </TableCell>
                      <TableCell>{badgeEstoque}</TableCell>
                      <TableCell>{txtLimite}</TableCell>
                      <TableCell className="text-center">
                        {!isReadOnly ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onAbrirEditarMaterial(m)}
                              title="Editar Insumo"
                              className="h-8 px-2 text-[#2563EB] hover:text-[#1D4ED8] hover:bg-[#2563EB]/10 text-xs gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Editar</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => onAbrirAjusteEstoque(m)}
                              title="Repor Estoque"
                              className="h-8 px-2 text-xs gap-1"
                            >
                              <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="hidden xl:inline">Estoque</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setMaterialToDelete(m)}
                              title="Excluir Insumo"
                              className="h-8 px-2 text-[#EF4444] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Somente Leitura
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(unidadeToDelete)}
        onOpenChange={(open) => !open && setUnidadeToDelete(null)}
        title="Excluir Estabelecimento"
        description={`Deseja realmente apagar o estabelecimento "${unidadeToDelete?.nome}"? Pedidos vinculados a esta unidade podem ser impactados.`}
        confirmLabel="Sim, Excluir Unidade"
        onConfirm={() => {
          if (unidadeToDelete) {
            onDeletarUnidade(unidadeToDelete.id);
            setUnidadeToDelete(null);
          }
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(materialToDelete)}
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
        title="Excluir Insumo"
        description={`Deseja realmente excluir o insumo "${materialToDelete?.descricao}" do catálogo? O histórico de pedidos anteriores será preservado.`}
        confirmLabel="Sim, Excluir Insumo"
        onConfirm={() => {
          if (materialToDelete) {
            onDeletarMaterial(materialToDelete.id);
            setMaterialToDelete(null);
          }
        }}
      />
    </div>
  );
};
