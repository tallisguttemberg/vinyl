import React, { useState, useEffect } from 'react';
import { Campo, ReservaRequest } from '../types';

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ReservaRequest) => void;
    initialData: Partial<ReservaRequest>;
    campos: Campo[];
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSubmit, initialData, campos }) => {
    const [clienteId, setClienteId] = useState('');
    const [campoId, setCampoId] = useState('');
    const [dataReserva, setDataReserva] = useState('');
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFim, setHoraFim] = useState('');
    const [clientes, setClientes] = useState<any[]>([]); // Use simplified type or import Cliente
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCampoId(initialData.campoId || (campos.length > 0 ? campos[0].id : ''));
            setDataReserva(initialData.dataReserva || '');
            setHoraInicio(initialData.horaInicio || '');
            setHoraFim(initialData.horaFim || '');
            setClienteId(initialData.clienteId || '');
            fetchClientes();
        }
    }, [isOpen, initialData, campos]);

    const fetchClientes = async () => {
        setLoading(true);
        try {
            // Dynamically import to avoid circular dependencies if any, or just standard import
            const { getClientes } = await import('../services/api');
            const data = await getClientes();
            setClientes(data);
            if (data.length > 0 && !initialData.clienteId) {
                setClienteId(data[0].id || '');
            }
        } catch (error) {
            console.error("Eror ao buscar clientes", error);
            // Fallback or alert?
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            clienteId,
            campoId,
            dataReserva,
            horaInicio,
            horaFim
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Nova Reserva</h3>
                    <form onSubmit={handleSubmit} className="mt-2 text-left">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Cliente</label>
                            {loading ? (
                                <p className="text-sm text-gray-500">Carregando clientes...</p>
                            ) : (
                                <select
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione um Cliente</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Campo</label>
                            <select
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={campoId}
                                onChange={(e) => setCampoId(e.target.value)}
                                required
                            >
                                {campos.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Data</label>
                            <input
                                type="date"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={dataReserva}
                                onChange={(e) => setDataReserva(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-2 mb-4">
                            <div className="w-1/2">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Início</label>
                                <input
                                    type="time"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={horaInicio}
                                    onChange={(e) => setHoraInicio(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Fim</label>
                                <input
                                    type="time"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={horaFim}
                                    onChange={(e) => setHoraFim(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <button
                                type="button"
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReservationModal;
