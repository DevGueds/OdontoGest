export type StatusPedido = 
  | 'SOLICITADO' 
  | 'RECEBIDO' 
  | 'ENVIADO' 
  | 'ATENDIDO_PARCIAL' 
  | 'ATENDIDO_TOTAL' 
  | 'CANCELADO';

export type PerfilUsuario = 'SOLICITANTE' | 'GESTOR' | 'ADMINISTRADOR' | 'TECNICO';

export interface UserSistema {
  id: number;
  email: string;
  senha?: string;
  nome: string;
  funcao?: string;
  registro?: string;
  perfil: PerfilUsuario;
  unidade_id: number;
}

export type NaturezaDespesa = 'CUSTEIO' | 'INVESTIMENTO';

export interface UnidadeSaude {
  id: number;
  nome: string;
  tipo: string; // Ex: 'USF', 'PAM', 'SMS', 'UBS'
  orcamento_custeio?: number;
  orcamento_investimento?: number;
  criado_em?: string;
}

export interface Material {
  id: number;
  descricao: string;
  unidade_medida: string;
  valor_estimado: number;
  qtd_estoque: number;
  limite_max_pedido?: number | null;
  fornecedor?: string | null;
  natureza?: NaturezaDespesa;
  criado_em?: string;
}

export interface ItemPedido {
  id: number;
  pedido_id: number;
  numero_item: number;
  material_id: number;
  qtd_pedida: number;
  qtd_atendida: number;
  valor_unitario: number;
  valor_total: number;
  natureza?: NaturezaDespesa;
}

export interface PedidoPBS {
  id: number;
  numero_pbs: string;
  unidade_emitente_id: number;
  data_pedido: string;
  responsavel_nome: string;
  responsavel_funcao?: string;
  responsavel_registro?: string;
  atividade_programa?: string;
  elemento_despesa?: string;
  observacoes?: string;
  status: StatusPedido;
  valor_total_estimado: number;
  apontador_envio_nome?: string | null;
  data_envio?: string | null;
  apontador_recebimento_nome?: string | null;
  data_recebimento?: string | null;
  criado_em?: string;
  atualizado_em?: string;
  itens: ItemPedido[];
}

export interface UnidadeStats {
  unidadeId: number;
  nome: string;
  tipo: string;
  totalPedidos: number;
  pendentes: number;
  atendidos: number;
  cancelados: number;
  totalSolicitado: number;
  totalAtendido: number;
}

export interface EstatisticasGerais {
  unidadesStats: UnidadeStats[];
  geral: {
    totalSolicitadoGeral: number;
    totalAtendidoGeral: number;
    totalPedidosGeral: number;
    totalPendentesGeral: number;
    totalAtendidosGeral: number;
    totalUnidades: number;
  };
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type TipoContratoOdontologo = 'FOLHA_FIXA' | 'COMISSAO' | 'PLANTAO' | 'PJ_RPA';

export interface HonorarioOdontologo {
  id: number;
  unidade_id: number;
  nome_dentista: string;
  cro: string;
  tipo_contrato?: TipoContratoOdontologo;
  mes_referencia: string;
  valor_fixo: number;
  valor_comissao: number;
  valor_total: number;
  observacoes?: string;
  criado_em?: string;
}

export interface Equipamento {
  id: number;
  unidade_id: number;
  nome: string;
  numero_serie: string;
  categoria?: string;
  data_ultima_preventiva?: string | null;
  criado_em?: string;
}

export type StatusChamado = 'ABERTO' | 'APROVADO_ADM' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'RECUSADO';
export type TipoChamado = 'CORRETIVA' | 'PREVENTIVA';

export interface ChamadoManutencao {
  id: number;
  unidade_id: number;
  equipamento_id: number;
  tipo: TipoChamado;
  descricao_defeito: string;
  custo_reparo: number;
  status: StatusChamado;
  aprovado_adm?: boolean;
  data_abertura: string;
  data_aprovacao?: string | null;
  data_conclusao?: string | null;
  observacoes?: string;
  criado_em?: string;
}

export interface UnidadeConsolidacaoFinanceira {
  unidadeId: number;
  nome: string;
  tipo: string;
  custoInsumosAtendidos: number;
  custoHonorariosDentistas: number;
  custoManutencaoEquipamentos: number;
  custoTotalGeral: number;
}

export interface SaldosNaturezaRecursos {
  orcamentoCusteioTotal: number;
  gastoCusteioTotal: number;
  saldoCusteioDisponivel: number;
  percentualCusteioComprometido: number;

  orcamentoInvestimentoTotal: number;
  gastoInvestimentoTotal: number;
  saldoInvestimentoDisponivel: number;
  percentualInvestimentoComprometido: number;

  detalhamentoCusteio: {
    insumos: number;
    rhHonorarios: number;
    manutencao: number;
  };
  detalhamentoInvestimento: {
    equipamentosPermanentes: number;
  };
}

export type TipoRecorrencia = 'RECORRENTE' | 'PARCELA_UNICA';

export interface EntradaRecurso {
  id: number;
  unidade_id?: number | null;
  natureza: NaturezaDespesa;
  tipo_recorrencia: TipoRecorrencia;
  descricao: string;
  valor: number;
  data_credito: string;
  mes_referencia: string;
  observacoes?: string;
  criado_em?: string;
}
