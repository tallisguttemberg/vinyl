import React from 'react';

interface CalendarProps {
    onDateClick: (date: string) => void;
}

export default function Calendar({ onDateClick }: CalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
    const [currentYear, setCurrentYear] = React.useState(today.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

    const handlePrev = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNext = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const formatDate = (day: number) => {
        const m = currentMonth + 1;
        return `${currentYear}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button className="btn btn-secondary" onClick={handlePrev}>&lt;</button>
                <h3 style={{ margin: 0 }}>
                    {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button className="btn btn-secondary" onClick={handleNext}>&gt;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
                    <div key={d} style={{ fontWeight: 'bold', padding: '0.5rem' }}>{d}</div>
                ))}

                {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}

                {range(daysInMonth).map(day => (
                    <button
                        key={day}
                        className="btn"
                        style={{
                            background: '#f1f5f9', height: '60px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        onClick={() => onDateClick(formatDate(day))}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}
