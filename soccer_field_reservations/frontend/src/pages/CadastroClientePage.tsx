import { useState } from 'react';
import { createCliente } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CadastroClientePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ nome: '', cpf: '', email: '', telefone: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCliente(form);
            alert('Cliente cadastrado com sucesso!');
            navigate('/');
        } catch (err: any) {
            setError('Erro ao cadastrar. Verifique os dados.');
        }
    };

    return (
        <div className="container">
            <h2>Cadastro de Cliente</h2>
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '500px' }}>
                <div>
                    <label>Nome</label>
                    <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div>
                    <label>CPF</label>
                    <input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} required placeholder="000.000.000-00" />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                    <label>Telefone</label>
                    <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary">Cadastrar</button>
            </form>
        </div>
    );
}
