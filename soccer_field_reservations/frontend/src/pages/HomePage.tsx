import { useEffect, useState } from 'react';
import { getCampos } from '../services/api';
import { Campo } from '../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReservationDashboard from '../components/ReservationDashboard';

export default function HomePage() {
    const { role } = useAuth();
    const [campos, setCampos] = useState<Campo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getCampos()
            .then(data => {
                setCampos(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load campos", err);
                setError("O sistema está indisponível no momento. Tente novamente mais tarde.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="container">Carregando campos...</div>;
    if (error) return <div className="container"><div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>{error}</div></div>;

    return (
        <div className="container">
            <h1>Campos Disponíveis</h1>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {campos.map(campo => (
                    <div key={campo.id} className="card">
                        <h3>{campo.nome}</h3>
                        <p>{campo.tipo}</p>
                        <p><strong>R$ {campo.valorHora.toFixed(2)}/h</strong></p>
                        <p>{campo.descricao}</p>
                        {campo.ativo ? (
                            role === 'ADMIN' ? (
                                <Link to={`/reservar/${campo.id}`} className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                                    Reservar Agora
                                </Link>
                            ) : (
                                <span style={{ color: 'gray', fontStyle: 'italic' }}>Somente administradores podem reservar.</span>
                            )
                        ) : (
                            <span style={{ color: 'red' }}>Indisponível</span>
                        )}
                    </div>
                ))}
            </div>



            <ReservationDashboard />
        </div>
    );
}
