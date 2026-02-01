import { useEffect, useState } from 'react';
import { getProdutosDisponiveis, criarPedido } from '../services/barService';
import { getClientes } from '../services/api';
import { ProdutoBar, ItemPedidoRequest } from '../types/bar';
import { Cliente } from '../types';
import { useNavigate } from 'react-router-dom';

interface CartItem extends ProdutoBar {
    quantidadeSelecionada: number;
}

export default function BarVendaPage() {
    const [produtos, setProdutos] = useState<ProdutoBar[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [carrinho, setCarrinho] = useState<CartItem[]>([]);
    const [view, setView] = useState<'produtos' | 'carrinho'>('produtos');
    const [clienteId, setClienteId] = useState<string | ''>('');
    const navigate = useNavigate();

    useEffect(() => {
        getProdutosDisponiveis().then(setProdutos).catch(console.error);
        getClientes().then(setClientes).catch(console.error);
    }, []);

    const adicionarAoCarrinho = (produto: ProdutoBar) => {
        setCarrinho(prev => {
            const itemExistente = prev.find(i => i.id === produto.id);
            if (itemExistente) {
                if (itemExistente.quantidadeSelecionada + 1 > produto.estoque) {
                    alert('Estoque insuficiente!');
                    return prev;
                }
                return prev.map(i => i.id === produto.id
                    ? { ...i, quantidadeSelecionada: i.quantidadeSelecionada + 1 }
                    : i
                );
            }
            return [...prev, { ...produto, quantidadeSelecionada: 1 }];
        });
    };

    const atualizarQuantidade = (id: number, delta: number) => {
        setCarrinho(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const novaQuantidade = item.quantidadeSelecionada + delta;
                    if (novaQuantidade <= 0) return null;
                    if (novaQuantidade > item.estoque) {
                        alert('Estoque insuficiente!');
                        return item;
                    }
                    return { ...item, quantidadeSelecionada: novaQuantidade };
                }
                return item;
            }).filter(Boolean) as CartItem[];
        });
    };

    const removerDoCarrinho = (id: number) => {
        setCarrinho(prev => prev.filter(i => i.id !== id));
    };

    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidadeSelecionada), 0);

    const handleFinalizar = async () => {
        if (carrinho.length === 0) return;
        if (!clienteId) {
            alert('Por favor, selecione um cliente!');
            return;
        }

        try {
            const itens: ItemPedidoRequest[] = carrinho.map(i => ({
                produtoId: i.id!,
                quantidade: i.quantidadeSelecionada
            }));

            await criarPedido({
                itens,
                clienteId: clienteId as string
            });

            alert('Pedido realizado com sucesso!');
            setCarrinho([]);
            navigate('/bar/historico');
        } catch (error: any) {
            alert('Erro ao realizar pedido: ' + (error.response?.data || error.message));
        }
    };

    if (view === 'carrinho') {
        return (
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Carrinho de Compras</h1>
                    <button className="btn btn-secondary" onClick={() => setView('produtos')}>Voltar aos Produtos</button>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    {carrinho.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>Seu carrinho está vazio.</p>
                            <button className="btn btn-primary" onClick={() => setView('produtos')}>Ir para Produtos</button>
                        </div>
                    ) : (
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Produto</th>
                                        <th style={{ padding: '1rem' }}>Preço</th>
                                        <th style={{ padding: '1rem' }}>Quantidade</th>
                                        <th style={{ padding: '1rem' }}>Subtotal</th>
                                        <th style={{ padding: '1rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carrinho.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem' }}>{item.nome}</td>
                                            <td style={{ padding: '1rem' }}>R$ {item.preco.toFixed(2)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '2px 8px' }} onClick={() => atualizarQuantidade(item.id!, -1)}>-</button>
                                                    <span style={{ width: '30px', textAlign: 'center' }}>{item.quantidadeSelecionada}</span>
                                                    <button className="btn btn-secondary" style={{ padding: '2px 8px' }} onClick={() => atualizarQuantidade(item.id!, 1)}>+</button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>R$ {(item.preco * item.quantidadeSelecionada).toFixed(2)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button onClick={() => removerDoCarrinho(item.id!)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Selecionar Cliente:</label>
                                    <select
                                        value={clienteId}
                                        onChange={e => setClienteId(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        required
                                    >
                                        <option value="">-- Selecione um cliente --</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                                        <span>Total:</span>
                                        <span style={{ color: '#2563eb' }}>R$ {total.toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                        onClick={handleFinalizar}
                                    >
                                        Confirmar e Fechar Pedido
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Produtos do Bar</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{carrinho.length} itens no carrinho</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Total: R$ {total.toFixed(2)}</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setView('carrinho')}
                        style={{ padding: '0.8rem 1.5rem' }}
                    >
                        🛒 Ver Carrinho
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {produtos.map(p => (
                    <div key={p.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0' }}>{p.nome}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2563eb' }}>R$ {p.preco.toFixed(2)}</span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                                    Estoque: {p.estoque}
                                </span>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => adicionarAoCarrinho(p)}
                            disabled={p.estoque === 0}
                        >
                            {p.estoque > 0 ? 'Adicionar ao Carrinho' : 'Esgotado'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
