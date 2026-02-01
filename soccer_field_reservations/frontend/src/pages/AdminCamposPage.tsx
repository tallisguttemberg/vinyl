import React, { useEffect, useState } from 'react';
import { getTodosCampos, createCampo, updateCampo } from '../services/api';
import { Campo } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function AdminCamposPage() {
    const { role } = useAuth();
    const [campos, setCampos] = useState<Campo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nome: '',
        tipo: '',
        valorHora: '',
        descricao: '',
        ativo: true
    });

    const loadCampos = () => {
        getTodosCampos().then(setCampos);
    };

    useEffect(() => {
        loadCampos();
    }, []);

    const handleEdit = (campo: Campo) => {
        setEditingId(campo.id);
        setForm({
            nome: campo.nome,
            tipo: campo.tipo,
            valorHora: campo.valorHora.toString(),
            descricao: campo.descricao || '',
            ativo: campo.ativo
        });
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingId(null);
        setForm({ nome: '', tipo: '', valorHora: '', descricao: '', ativo: true });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                valorHora: parseFloat(form.valorHora)
            };

            if (editingId) {
                await updateCampo(editingId, payload);
            } else {
                await createCampo(payload);
            }
            setIsModalOpen(false);
            loadCampos();
            alert('Campo salvo com sucesso!');
        } catch (error) {
            alert('Erro ao salvar campo');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gerenciar Campos {role === 'ADMIN' ? '(Admin)' : '(Visualização)'}</h1>
                {role === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={handleNew}>+ Novo Campo</button>
                )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }} className="card">
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '0.5rem' }}>Nome</th>
                        <th style={{ padding: '0.5rem' }}>Tipo</th>
                        <th style={{ padding: '0.5rem' }}>Valor/h</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        {role === 'ADMIN' && <th style={{ padding: '0.5rem' }}>Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {campos.map(campo => (
                        <tr key={campo.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>{campo.nome}</td>
                            <td style={{ padding: '0.5rem' }}>{campo.tipo}</td>
                            <td style={{ padding: '0.5rem' }}>R$ {campo.valorHora.toFixed(2)}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{ color: campo.ativo ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {campo.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            {role === 'ADMIN' && (
                                <td style={{ padding: '0.5rem' }}>
                                    <button className="btn btn-secondary" onClick={() => handleEdit(campo)}>Editar</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Campo' : 'Novo Campo'}
            >
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Nome</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                    </div>
                    <div>
                        <label>Tipo (Ex: Grama Sintética)</label>
                        <input value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} required />
                    </div>
                    <div>
                        <label>Valor por Hora</label>
                        <input type="number" step="0.01" value={form.valorHora} onChange={e => setForm({ ...form, valorHora: e.target.value })} required />
                    </div>
                    <div>
                        <label>Descrição</label>
                        <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
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
