import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createReserva, getCampos, getClientes } from '../services/api';
import { Campo, Cliente } from '../types';
import Calendar from '../components/Calendar';
import Modal from '../components/Modal';

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ReservaPage() {
    const { campoId } = useParams();
    const { role } = useAuth();

    if (role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    const [campo, setCampo] = useState<Campo | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    // Form State
    const [form, setForm] = useState({
        clienteId: '',
        horaInicio: '',
        horaFim: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        getCampos().then(campos => {
            const found = campos.find(c => c.id === campoId);
            if (found) setCampo(found);
        });
        getClientes().then(setClientes);
    }, [campoId]);

    const handleDateClick = (date: string) => {
        setSelectedDate(date);
        setIsModalOpen(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createReserva({
                campoId: campoId!,
                clienteId: form.clienteId,
                dataReserva: selectedDate,
                horaInicio: form.horaInicio + ':00',
                horaFim: form.horaFim + ':00'
            });
            alert('Reserva realizada com sucesso para ' + selectedDate + '!');
            setIsModalOpen(false);
            // Optional: Refresh calendar data if we were showing bookings
        } catch (err: any) {
            const backendError = err.response?.data?.erro || err.response?.data?.message;
            setError(backendError || err.message || 'Erro desconhecido ao realizar reserva.');
        }
    };

    if (!campo) return <div>Carregando...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Reservar: {campo.nome}</h2>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>R$ {campo.valorHora.toFixed(2)}/h</span>
            </div>

            <p>Selecione uma data no calendário abaixo para agendar:</p>

            <Calendar onDateClick={handleDateClick} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Nova Reserva: ${selectedDate}`}
            >
                {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '4px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Cliente</label>
                        <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} required>
                            <option value="">Selecione...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label>Hora Início</label>
                            <input type="time" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Hora Fim</label>
                            <input type="time" value={form.horaFim} onChange={e => setForm({ ...form, horaFim: e.target.value })} required />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Confirmar Reserva</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
