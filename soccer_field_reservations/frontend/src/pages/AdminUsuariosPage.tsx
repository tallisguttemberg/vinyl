import React, { useEffect, useState } from 'react';
import { getUsuarios, createUsuario, updateUsuario, toggleUsuarioStatus } from '../services/api';
import { Usuario } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function AdminUsuariosPage() {
    const { role } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nome: '',
        login: '',
        senha: '',
        perfil: 'USER' // Default
    });

    const loadUsuarios = () => {
        getUsuarios().then(setUsuarios).catch(err => console.error("Erro ao carregar usuários", err));
    };

    useEffect(() => {
        loadUsuarios();
    }, []);

    const handleNew = () => {
        setEditingId(null);
        setForm({ nome: '', login: '', senha: '', perfil: 'USER' });
        setIsModalOpen(true);
    };

    const handleEdit = (user: Usuario) => {
        setEditingId(user.id);
        setForm({
            nome: user.nome,
            login: user.login,
            senha: '', // Don't show password
            perfil: user.role
        });
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (user: Usuario) => {
        if (confirm(`Deseja realmente ${user.ativo ? 'desativar' : 'ativar'} o usuário ${user.nome}?`)) {
            try {
                await toggleUsuarioStatus(user.id, !user.ativo);
                loadUsuarios();
            } catch (error) {
                alert('Erro ao alterar status');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                nome: form.nome,
                perfil: form.perfil
            };

            if (form.senha) { // Only send password if updated
                payload.senha = form.senha;
            }

            if (editingId) {
                await updateUsuario(editingId, payload);
            } else {
                payload.login = form.login; // Login is usually fixed or only set on create
                payload.senha = form.senha; // Required on create
                await createUsuario(payload);
            }
            setIsModalOpen(false);
            loadUsuarios();
            alert('Usuário salvo com sucesso!');
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Erro ao salvar usuário';
            alert(msg);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gerenciamento de Usuários</h1>
                {role === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={handleNew}>+ Novo Usuário</button>
                )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }} className="card">
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '0.5rem' }}>Nome</th>
                        <th style={{ padding: '0.5rem' }}>Login</th>
                        <th style={{ padding: '0.5rem' }}>Perfil</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        {role === 'ADMIN' && <th style={{ padding: '0.5rem' }}>Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>{user.nome}</td>
                            <td style={{ padding: '0.5rem' }}>{user.login}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: user.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                                    color: user.role === 'ADMIN' ? '#1e40af' : '#374151',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    {user.role}
                                </span>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{ color: user.ativo ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {user.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            {role === 'ADMIN' && (
                                <td style={{ padding: '0.5rem' }}>
                                    <button className="btn btn-secondary" style={{ marginRight: '0.5rem' }} onClick={() => handleEdit(user)}>Editar</button>
                                    {user.login !== 'admin' && ( // Prevent disabling the main admin
                                        <button
                                            className="btn"
                                            style={{ backgroundColor: user.ativo ? '#ef4444' : '#10b981', color: 'white' }}
                                            onClick={() => handleToggleStatus(user)}
                                        >
                                            {user.ativo ? 'Desativar' : 'Ativar'}
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Usuário' : 'Novo Usuário'}
            >
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Nome</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                    </div>
                    <div>
                        <label>Login</label>
                        <input
                            value={form.login}
                            onChange={e => setForm({ ...form, login: e.target.value })}
                            required
                            disabled={!!editingId} // Login cannot be changed
                            style={editingId ? { backgroundColor: '#f3f4f6' } : {}}
                        />
                    </div>
                    <div>
                        <label>{editingId ? 'Nova Senha (opcional)' : 'Senha'}</label>
                        <input
                            type="password"
                            value={form.senha}
                            onChange={e => setForm({ ...form, senha: e.target.value })}
                            required={!editingId} // Required only on creation
                        />
                    </div>
                    <div>
                        <label>Perfil</label>
                        <select
                            value={form.perfil}
                            onChange={e => setForm({ ...form, perfil: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.2rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="USER">Usuário Comum</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar</button>
                </form>
            </Modal>
        </div>
    );
}
