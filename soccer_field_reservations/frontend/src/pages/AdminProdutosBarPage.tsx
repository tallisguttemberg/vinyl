import React, { useEffect, useState } from 'react';
import { getProdutos, saveProduto, deleteProduto } from '../services/barService';
import { ProdutoBar } from '../types/bar';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function AdminProdutosBarPage() {
    const { role } = useAuth();
    const [produtos, setProdutos] = useState<ProdutoBar[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState<ProdutoBar>({
        nome: '',
        preco: 0,
        estoque: 0,
        ativo: true
    });

    const loadProdutos = async () => {
        try {
            const data = await getProdutos();
            setProdutos(data);
        } catch (error) {
            console.error('Erro ao carregar produtos', error);
        }
    };

    useEffect(() => {
        loadProdutos();
    }, []);

    const handleEdit = (produto: ProdutoBar) => {
        setEditingId(produto.id || null);
        setForm({ ...produto });
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingId(null);
        setForm({ nome: '', preco: 0, estoque: 0, ativo: true });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Deseja realmente excluir este produto?')) {
            try {
                await deleteProduto(id);
                loadProdutos();
            } catch (error) {
                alert('Erro ao excluir produto');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveProduto(form);
            setIsModalOpen(false);
            loadProdutos();
            alert('Produto salvo com sucesso!');
        } catch (error) {
            alert('Erro ao salvar produto');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gerenciar Produtos do Bar {role === 'ADMIN' ? '(Admin)' : '(Visualização)'}</h1>
                {role === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={handleNew}>+ Novo Produto</button>
                )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }} className="card">
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '1rem' }}>Nome</th>
                        <th style={{ padding: '1rem' }}>Preço</th>
                        <th style={{ padding: '1rem' }}>Estoque</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        {role === 'ADMIN' && <th style={{ padding: '1rem' }}>Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {produtos.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '1rem' }}>{p.nome}</td>
                            <td style={{ padding: '1rem' }}>R$ {p.preco.toFixed(2)}</td>
                            <td style={{ padding: '1rem' }}>{p.estoque}</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ color: p.ativo ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                    {p.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            {role === 'ADMIN' && (
                                <td style={{ padding: '1rem' }}>
                                    <button className="btn btn-secondary" style={{ marginRight: '0.5rem' }} onClick={() => handleEdit(p)}>Editar</button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(p.id!)}>Excluir</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Produto' : 'Novo Produto'}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Nome</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Preço</label>
                        <input type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: parseFloat(e.target.value) })} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Estoque Inicial</label>
                        <input type="number" value={form.estoque} onChange={e => setForm({ ...form, estoque: parseInt(e.target.value) })} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>
                            <input
                                type="checkbox"
                                style={{ width: 'auto', marginRight: '0.5rem' }}
                                checked={form.ativo}
                                onChange={e => setForm({ ...form, ativo: e.target.checked })}
                            />
                            Ativo
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar</button>
                </form>
            </Modal>
        </div>
    );
}
