export interface ProdutoBar {
    id?: number;
    nome: string;
    preco: number;
    estoque: number;
    ativo: boolean;
    criadoEm?: string;
    atualizadoEm?: string;
}

export interface ItemPedido {
    id?: number;
    produto: ProdutoBar;
    quantidade: number;
    precoUnitario: number;
}

export interface Pedido {
    id?: number;
    usuarioId: number;
    total: number;
    status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
    itens: ItemPedido[];
    criadoEm: string;
}

export interface ItemPedidoRequest {
    produtoId: number;
    quantidade: number;
}

export interface PedidoRequest {
    itens: ItemPedidoRequest[];
    clienteId: string;
}
