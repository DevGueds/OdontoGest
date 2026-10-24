import React, { useState } from 'react';
import { UnidadeSaude, UserSistema, PerfilUsuario } from '../../types';
import { useSortableData } from '../../hooks/useSortableData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ConfirmDeleteDialog } from '../ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  UserPlus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Crown, 
  Stethoscope, 
  Wrench, 
  Shield, 
  Building2, 
  KeyRound, 
  Mail, 
  Briefcase, 
  FileText,
  Save,
  X
} from 'lucide-react';

interface Props {
  unidades: UnidadeSaude[];
  usuarios: UserSistema[];
  onAddUsuario: (dados: Omit<UserSistema, 'id'>) => void;
  onUpdateUsuario: (id: number, dados: Partial<UserSistema>) => void;
  onDeleteUsuario: (id: number) => void;
}

export const UsuariosTab: React.FC<Props> = ({
  unidades,
  usuarios,
  onAddUsuario,
  onUpdateUsuario,
  onDeleteUsuario
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<UserSistema | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSistema | null>(null);

  const { items: sortedUsuarios, requestSort, getSortIndicator } = useSortableData(usuarios, { key: 'nome', direction: 'asc' });

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState('');
  const [registro, setRegistro] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('SOLICITANTE');
  const [unidadeId, setUnidadeId] = useState<number>(unidades[0]?.id || 1);

  // Toggles de visibilidade de senha
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<number, boolean>>({});
  const [showModalSenha, setShowModalSenha] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);

  const toggleSenhaVisivel = (id: number) => {
    setSenhasVisiveis(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAbrirNovo = () => {
    setUsuarioEdicao(null);
    setNome('');
    setEmail('');
    setSenha('123456');
    setFuncao('Cirurgião Dentista');
    setRegistro('');
    setPerfil('SOLICITANTE');
    setUnidadeId(unidades[0]?.id || 1);
    setShowModalSenha(false);
    setShowSenhaAtual(false);
    setModalOpen(true);
  };

  const handleAbrirEditar = (u: UserSistema) => {
    setUsuarioEdicao(u);
    setNome(u.nome);
    setEmail(u.email);
    setSenha('');
    setFuncao(u.funcao || '');
    setRegistro(u.registro || '');
    setPerfil(u.perfil);
    setUnidadeId(u.unidade_id || 1);
    setShowModalSenha(false);
    setShowSenhaAtual(false);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    if (usuarioEdicao) {
      onUpdateUsuario(usuarioEdicao.id, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        ...(senha && { senha }),
        funcao: funcao.trim() || 'Profissional de Saúde',
        registro: registro.trim(),
        perfil,
        unidade_id: Number(unidadeId)
      });
    } else {
      onAddUsuario({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha || '123456',
        funcao: funcao.trim() || 'Profissional de Saúde',
        registro: registro.trim(),
        perfil,
        unidade_id: Number(unidadeId)
      });
    }

    setModalOpen(false);
  };

  const renderPerfilBadge = (p: PerfilUsuario) => {
    switch (p) {
      case 'ADMINISTRADOR':
        return (
          <Badge variant="purple" className="flex items-center gap-1 w-fit">
            <Crown className="w-3 h-3" /> Administrador
          </Badge>
        );
      case 'GESTOR':
        return (
          <Badge variant="info" className="flex items-center gap-1 w-fit">
            <Eye className="w-3 h-3" /> Gestor (Leitura)
          </Badge>
        );
      case 'SOLICITANTE':
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <Stethoscope className="w-3 h-3" /> Solicitante (PBS)
          </Badge>
        );
      case 'TECNICO':
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <Wrench className="w-3 h-3" /> Técnico Manutenção
          </Badge>
        );
      default:
        return <Badge variant="secondary">{p}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Gestão de Usuários & Controle de Acesso (RBAC)
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie usuários vinculando-os às Unidades de Saúde do banco de dados, CRO/Registro e Perfil de permissões.
            </CardDescription>
          </div>

          <Button onClick={handleAbrirNovo} className="gap-2 self-start sm:self-auto">
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort('id')} className="cursor-pointer select-none w-16">
                    <span className="flex items-center gap-1">ID {getSortIndicator('id')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSort('nome')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Nome Completo {getSortIndicator('nome')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSort('funcao')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Cargo / Função {getSortIndicator('funcao')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSort('email')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">E-mail Corporativo {getSortIndicator('email')}</span>
                  </TableHead>
                  <TableHead>Senha Cadastrada</TableHead>
                  <TableHead onClick={() => requestSort('registro')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Registro / CRO {getSortIndicator('registro')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSort('perfil')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Perfil de Acesso {getSortIndicator('perfil')}</span>
                  </TableHead>
                  <TableHead onClick={() => requestSort('unidade_id')} className="cursor-pointer select-none">
                    <span className="flex items-center gap-1">Unidade Alocada {getSortIndicator('unidade_id')}</span>
                  </TableHead>
                  <TableHead className="text-center w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Nenhum usuário cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsuarios.map(u => {
                    const uni = unidades.find(un => un.id === u.unidade_id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-semibold text-muted-foreground">#{u.id}</TableCell>
                        <TableCell className="font-semibold text-foreground">{u.nome}</TableCell>
                        <TableCell>
                          <Badge variant="purple">{u.funcao || 'Profissional de Saúde'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">{u.email}</TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-md">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {senhasVisiveis[u.id] ? (u.senha || '123456') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSenhaVisivel(u.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              title={senhasVisiveis[u.id] ? "Ocultar senha" : "Ver senha cadastrada"}
                            >
                              {senhasVisiveis[u.id] ? (
                                <EyeOff className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.registro ? (
                            <Badge variant="secondary">{u.registro}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell>{renderPerfilBadge(u.perfil)}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {uni ? uni.nome : `Unidade #${u.unidade_id}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAbrirEditar(u)}
                              title="Editar Usuário"
                              aria-label="Editar Usuário"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToDelete(u)}
                              title="Apagar Usuário"
                              aria-label="Apagar Usuário"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Novo/Editar Usuário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {usuarioEdicao ? (
                <>
                  <Pencil className="w-5 h-5 text-primary" />
                  Editar Usuário do Sistema
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-primary" />
                  Cadastrar Novo Usuário
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {usuarioEdicao 
                ? 'Atualize as credenciais, lotação ou nível de acesso do colaborador.' 
                : 'Defina os dados cadastrais e permissões de acesso do novo usuário.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="usr_nome" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nome Completo *
              </label>
              <Input
                type="text"
                id="usr_nome"
                placeholder="Ex: Dra. Ana Beatriz Ferreira"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="usr_email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  E-mail Corporativo *
                </label>
                <Input
                  type="email"
                  id="usr_email"
                  placeholder="usuario@saude.gov.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="usr_senha" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {usuarioEdicao ? 'Nova Senha' : 'Senha de Acesso *'}
                </label>
                {usuarioEdicao && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-0.5">
                    <span>Atual:</span>
                    <span className="font-mono font-semibold">
                      {showSenhaAtual ? (usuarioEdicao.senha || '123456') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                      className="text-primary hover:underline ml-1"
                      title={showSenhaAtual ? "Ocultar senha atual" : "Ver senha atual"}
                    >
                      {showSenhaAtual ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                <div className="relative">
                  <Input
                    type={showModalSenha ? 'text' : 'password'}
                    id="usr_senha"
                    placeholder={usuarioEdicao ? "Manter atual" : "••••••••"}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required={!usuarioEdicao}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalSenha(!showModalSenha)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    title={showModalSenha ? "Ocultar senha" : "Ver senha"}
                  >
                    {showModalSenha ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="usr_funcao" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Cargo / Função *
                </label>
                <Input
                  type="text"
                  id="usr_funcao"
                  placeholder="Ex: Cirurgião Dentista..."
                  value={funcao}
                  onChange={e => setFuncao(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="usr_registro" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Registro / CRO
                </label>
                <Input
                  type="text"
                  id="usr_registro"
                  placeholder="Ex: CRO/PA 0592"
                  value={registro}
                  onChange={e => setRegistro(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="usr_perfil" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Perfil de Acesso (RBAC) *
              </label>
              <Select value={perfil} onValueChange={(val) => setPerfil(val as PerfilUsuario)}>
                <SelectTrigger id="usr_perfil" className="h-10">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLICITANTE">Solicitante (Pedidos e Reparos)</SelectItem>
                  <SelectItem value="GESTOR">Gestor Executivo (Somente Leitura)</SelectItem>
                  <SelectItem value="ADMINISTRADOR">Administrador (Acesso Total)</SelectItem>
                  <SelectItem value="TECNICO">Técnico de Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="usr_unidade" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Unidade de Saúde Alocada *
              </label>
              <Select value={String(unidadeId)} onValueChange={(val) => setUnidadeId(Number(val))}>
                <SelectTrigger id="usr_unidade" className="h-10">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      #{u.id} — {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setModalOpen(false)}
                className="gap-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors"
                title="Cancelar e fechar formulário"
                aria-label="Cancelar"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="gap-2 hover:shadow-md transition-all"
                title={usuarioEdicao ? "Salvar alterações no usuário" : "Confirmar cadastro do novo usuário"}
                aria-label="Salvar Usuário"
              >
                <Save className="w-4 h-4" />
                Salvar Usuário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="Excluir Usuário"
        description={`Deseja realmente apagar o usuário "${userToDelete?.nome}" (${userToDelete?.email})? Esta ação revogará permanentemente o acesso deste profissional ao sistema.`}
        confirmLabel="Sim, Excluir Usuário"
        onConfirm={() => {
          if (userToDelete) {
            onDeleteUsuario(userToDelete.id);
            setUserToDelete(null);
          }
        }}
      />
    </div>
  );
};
