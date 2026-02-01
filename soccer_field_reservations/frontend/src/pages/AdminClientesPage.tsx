import React, { useEffect, useState } from 'react';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/api';
import { Cliente } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function AdminClientesPage() {
    const { role } = useAuth();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nome: '',
        cpf: '',
        email: '',
        telefone: ''
    });

    const loadClientes = () => {
        getClientes().then(setClientes).catch(err => console.error("Erro ao carregar clientes", err));
    };

    useEffect(() => {
        loadClientes();
    }, []);

    const handleNew = () => {
        setEditingId(null);
        setForm({ nome: '', cpf: '', email: '', telefone: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (cliente: Cliente) => {
        setEditingId(cliente.id!);
        setForm({
            nome: cliente.nome,
            cpf: cliente.cpf,
            email: cliente.email,
            telefone: cliente.telefone
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (cliente: Cliente) => {
        if (confirm(`Deseja realmente excluir o cliente ${cliente.nome}?`)) {
            try {
                await deleteCliente(cliente.id!);
                loadClientes();
            } catch (error: any) {
                alert(error.response?.data?.message || 'Erro ao excluir cliente. Verifique se existem reservas vinculadas.');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form };

            if (editingId) {
                await updateCliente(editingId, payload);
            } else {
                await createCliente(payload);
            }
            setIsModalOpen(false);
            loadClientes();
            alert('Cliente salvo com sucesso!');
        } catch (error: any) {
            // Backend usually returns explicit message in error body (e.g., CPF inválido)
            // Need to check how generic exception handler works or if service throws explicitly
            const msg = error.response?.data?.message || error.response?.data?.erro || 'Erro ao salvar cliente';
            alert(msg);
        }
    };

    if (role !== 'ADMIN') return <div className="container">Acesso negado.</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gestão de Clientes</h1>
                <button className="btn btn-primary" onClick={handleNew}>+ Novo Cliente</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }} className="card">
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '0.5rem' }}>Nome</th>
                        <th style={{ padding: '0.5rem' }}>CPF</th>
                        <th style={{ padding: '0.5rem' }}>Email</th>
                        <th style={{ padding: '0.5rem' }}>WhatsApp</th>
                        <th style={{ padding: '0.5rem' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.map(cliente => (
                        <tr key={cliente.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>{cliente.nome}</td>
                            <td style={{ padding: '0.5rem' }}>{cliente.cpf}</td>
                            <td style={{ padding: '0.5rem' }}>{cliente.email}</td>
                            <td style={{ padding: '0.5rem' }}>{cliente.telefone}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <button className="btn btn-secondary" style={{ marginRight: '0.5rem' }} onClick={() => handleEdit(cliente)}>Editar</button>
                                <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={() => handleDelete(cliente)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
            >
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Nome Completo</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                    </div>
                    <div>
                        <label>CPF (apenas números)</label>
                        <input
                            value={form.cpf}
                            onChange={e => setForm({ ...form, cpf: e.target.value })}
                            required
                            maxLength={11}
                            placeholder="00011122233"
                        />
                    </div>
                    <div>
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                        <label>WhatsApp</label>
                        <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} required placeholder="(00) 00000-0000" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar</button>
                </form>
            </Modal>
        </div>
    );
}
