import React, { useState, useEffect } from 'react';
import ReservationModal from './ReservationModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getCampos, getReservas, createReserva } from '../services/api'; // Ensure getReservas is added to api.ts
import { Campo, Reserva, ReservaRequest } from '../types';

const CalendarInterface: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<Partial<ReservaRequest>>({});
    const [events, setEvents] = useState<any[]>([]);
    const [selectedCampo, setSelectedCampo] = useState<string>('');
    const [campos, setCampos] = useState<Campo[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const camposData = await getCampos();
            setCampos(camposData);
            const reservasData: Reserva[] = await getReservas();
            const formattedEvents = reservasData.map((res) => ({
                id: res.id,
                title: `${res.cliente?.nome || 'Cliente'} (${res.campo?.nome || 'Campo'})`,
                start: `${res.dataReserva}T${res.horaInicio}`,
                end: `${res.dataReserva}T${res.horaFim}`,
                backgroundColor: getEventColor(res.campo?.tipo || ''),
                extendedProps: { reserva: res }
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    };

    const getEventColor = (tipoCampo: string) => {
        const colors: { [key: string]: string } = {
            'Grama Sintética': '#2e7d32', 'Areia': '#fbc02d', 'Futevôlei': '#fbc02d',
            'Beach Tennis': '#0288d1', 'Vôlei': '#f57c00', 'Society': '#2e7d32'
        };
        for (const key in colors) {
            if (tipoCampo.includes(key)) return colors[key];
        }
        return '#9e9e9e';
    };

    const handleDateSelect = (selectInfo: any) => {
        // if (!selectedCampo) { alert('Selecione um campo...'); return; } // Removed restriction to allow modal field selection

        const start = new Date(selectInfo.start);
        const end = new Date(selectInfo.end);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const formatTime = (date: Date) => date.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

        setModalData({
            dataReserva: formatDate(start),
            horaInicio: formatTime(start),
            horaFim: formatTime(end),
            campoId: selectedCampo || (campos.length > 0 ? campos[0].id : '')
        });
        setIsModalOpen(true);
        selectInfo.view.calendar.unselect();
    };

    const handleModalSubmit = async (data: ReservaRequest) => {
        try {
            await createReserva(data);
            setIsModalOpen(false);
            fetchData(); // Refresh
            alert('Reserva criada com sucesso!');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.erro || "Erro ao salvar reserva. Verifique conflitos.";
            alert(msg);
        }
    };

    const filteredEvents = selectedCampo
        ? events.filter(e => e.extendedProps.reserva.campo.id === selectedCampo)
        : events;

    return (
        <div className="p-4 bg-white rounded-lg shadow h-screen flex flex-col">
            <div className="mb-4 flex gap-4 items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Mapa de Reservas</h2>
                <div className="flex items-center gap-2">
                    <label className="font-medium text-gray-700">Filtrar por Campo:</label>
                    <select
                        className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={selectedCampo}
                        onChange={(e) => setSelectedCampo(e.target.value)}
                    >
                        <option value="">Todos os Campos</option>
                        {campos.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome} - {c.tipo}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-grow">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="timeGridWeek"
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={filteredEvents}
                    select={handleDateSelect}
                    locale="pt-br"
                    slotMinTime="06:00:00"
                    slotMaxTime="23:00:00"
                    allDaySlot={false}
                    height="100%"
                />
            </div>

            <ReservationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={modalData}
                campos={campos}
            />
        </div>
    );
};

export default CalendarInterface;
