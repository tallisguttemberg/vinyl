import { useEffect, useState } from 'react';
import { getMeusPedidos, getTodosPedidos } from '../services/barService';
import { Pedido } from '../types/bar';
import { useAuth } from '../context/AuthContext';

export default function HistoricoPedidosBarPage() {
    const { role } = useAuth();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    useEffect(() => {
        const fetch = role === 'ADMIN' ? getTodosPedidos() : getMeusPedidos();
        fetch.then(setPedidos).catch(console.error);
    }, [role]);

    return (
        <div className="container">
            <h1>Histórico de Pedidos do Bar {role === 'ADMIN' && '(Admin)'}</h1>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {pedidos.length === 0 ? (
                    <p className="card" style={{ padding: '2rem', textAlign: 'center' }}>Nenhum pedido encontrado.</p>
                ) : (
                    pedidos.map(pedido => (
                        <div key={pedido.id} className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Pedido #{pedido.id}</span>
                                    <span style={{ marginLeft: '1rem', color: '#666' }}>
                                        {new Date(pedido.criadoEm).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        backgroundColor: pedido.status === 'PAGO' ? '#dcfce7' : '#fee2e2',
                                        color: pedido.status === 'PAGO' ? '#166534' : '#991b1b',
                                        fontWeight: 'bold'
                                    }}>
                                        {pedido.status}
                                    </span>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb' }}>
                                        R$ {pedido.total.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {pedido.itens.map(item => (
                                        <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                                            <span>{item.quantidade}x {item.produto.nome}</span>
                                            <span style={{ color: '#666' }}>R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
