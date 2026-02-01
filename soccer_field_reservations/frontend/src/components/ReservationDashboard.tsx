import { useState, useEffect } from 'react';
import { Campo, Reserva } from '../types';
import { getCampos, getReservasDia } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReservationDashboard() {
    const { user } = useAuth();
    const [campos, setCampos] = useState<Campo[]>([]);
    const [selectedCampo, setSelectedCampo] = useState<Campo | null>(null);
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReservas, setLoadingReservas] = useState(false);

    // Initialize with Local Date
    const getLocalDate = (date: Date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [currentDate, setCurrentDate] = useState(getLocalDate());

    useEffect(() => {
        getCampos()
            .then(data => {
                const ativos = data.filter(c => c.ativo);
                setCampos(ativos);
                if (ativos.length > 0) {
                    setSelectedCampo(ativos[0]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao carregar campos", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (selectedCampo) {
            setLoadingReservas(true);
            getReservasDia(selectedCampo.id, currentDate)
                .then(data => {
                    setReservas(data);
                    setLoadingReservas(false);
                })
                .catch(err => {
                    console.error("Erro ao carregar reservas", err);
                    setLoadingReservas(false);
                });
        }
    }, [selectedCampo, currentDate]);

    const handlePrevDay = () => {
        // const date = new Date(currentDate + 'T00:00:00'); // Unused 
        // Safer to parsing components:
        const [y, m, d] = currentDate.split('-').map(Number);
        const newDate = new Date(y, m - 1, d - 1);
        setCurrentDate(getLocalDate(newDate));
    };

    const handleNextDay = () => {
        const [y, m, d] = currentDate.split('-').map(Number);
        const newDate = new Date(y, m - 1, d + 1);
        setCurrentDate(getLocalDate(newDate));
    };

    if (loading) return <div>Carregando ambientes...</div>;
    if (campos.length === 0) return <div>Nenhum ambiente disponível.</div>;

    // Generate hours for the day (00:00 to 23:00)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const isReserved = (hour: number) => {
        return reservas.find(r => {
            let h: number;
            // Handle LocalTime as array [hour, minute] or string "HH:mm:ss"
            if (Array.isArray(r.horaInicio)) {
                h = r.horaInicio[0];
            } else if (typeof r.horaInicio === 'string') {
                h = parseInt(r.horaInicio.split(':')[0]);
            } else {
                return false; // Unknown format
            }
            return h === hour && r.status !== 'CANCELADA';
        });
    };

    return (
        <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Visão Geral de Reservas</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={handlePrevDay} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>&lt;</button>
                    <span style={{ fontWeight: 'bold' }}>{currentDate.split('-').reverse().join('/')}</span>
                    <button onClick={handleNextDay} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>&gt;</button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '1rem', overflowX: 'auto' }}>
                {campos.map(campo => (
                    <button
                        key={campo.id}
                        onClick={() => setSelectedCampo(campo)}
                        style={{
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            border: 'none',
                            background: selectedCampo?.id === campo.id ? '#fff' : 'transparent',
                            borderBottom: selectedCampo?.id === campo.id ? '2px solid #007bff' : 'none',
                            fontWeight: selectedCampo?.id === campo.id ? 'bold' : 'normal',
                            color: selectedCampo?.id === campo.id ? '#007bff' : '#495057'
                        }}
                    >
                        {campo.nome}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loadingReservas ? (
                <div>Carregando reservas...</div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Horário</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Responsável</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Obs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map(hour => {
                            const reserva = isReserved(hour);
                            const hourString = `${hour.toString().padStart(2, '0')}:00`;

                            // Check if the reservation belongs to the current user (by matching login/email)
                            // user from AuthContext is the login string.
                            // We assume user login might match cliente.email or we simply don't have enough info to link perfectly without ID.
                            // Heuristic: check if user string is contained in client email or name (case insensitive) as a best effort
                            const isMyReservation = reserva && user && (
                                reserva.cliente.email === user ||
                                reserva.cliente.cpf === user // In case login is CPF
                            );

                            return (
                                <tr key={hour} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '0.75rem' }}>{hourString}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {reserva ? (
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                backgroundColor: isMyReservation ? '#d4edda' : '#f8d7da',
                                                color: isMyReservation ? '#155724' : '#721c24',
                                                fontWeight: 'bold'
                                            }}>
                                                Reservado
                                            </span>
                                        ) : (
                                            <span style={{ color: '#28a745' }}>Disponível</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {reserva ? reserva.cliente.nome : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {/* Obs logic if needed, currently empty in generic implementation */}
                                        -
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
