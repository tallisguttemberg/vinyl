import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
import PasswordInput from '../components/PasswordInput';

export default function ChangePasswordPage() {
    const { logout } = useAuth();
    const [form, setForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
    const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        if (form.newPass !== form.confirmPass) {
            setStatus({ type: 'error', msg: 'A nova senha e a confirmação não coincidem.' });
            return;
        }

        try {
            await changePassword(form.oldPass, form.newPass);
            setStatus({ type: 'success', msg: 'Senha alterada com sucesso! Você será deslogado em 3 segundos.' });
            setTimeout(logout, 3000);
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Erro ao alterar senha.' });
        }
    };

    return (
        <div className="container">
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h2>Alterar Senha</h2>
                {status && (
                    <div style={{
                        padding: '1rem', marginBottom: '1rem', borderRadius: '4px',
                        backgroundColor: status.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: status.type === 'error' ? '#991b1b' : '#166534'
                    }}>
                        {status.msg}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div>
                        <PasswordInput label="Senha Atual" value={form.oldPass} onChange={e => setForm({ ...form, oldPass: e.target.value })} required />
                    </div>
                    <div>
                        <PasswordInput label="Nova Senha" value={form.newPass} onChange={e => setForm({ ...form, newPass: e.target.value })} required />
                    </div>
                    <div>
                        <PasswordInput label="Confirmar Nova Senha" value={form.confirmPass} onChange={e => setForm({ ...form, confirmPass: e.target.value })} required />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Salvar Nova Senha</button>
                </form>
            </div>
        </div>
    );
}
