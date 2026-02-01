import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [creds, setCreds] = useState({ login: '', senha: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await loginApi(creds.login, creds.senha);
            login(data.token, creds.login);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao fazer login');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center' }}>Login</h2>
                {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Usuário</label>
                        <input value={creds.login} onChange={e => setCreds({ ...creds, login: e.target.value })} required autoFocus />
                    </div>
                    <div>
                        <PasswordInput label="Senha" value={creds.senha} onChange={e => setCreds({ ...creds, senha: e.target.value })} required />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
                </form>
            </div>
        </div>
    );
}
