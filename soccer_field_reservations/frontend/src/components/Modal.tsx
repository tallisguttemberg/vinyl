import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '8px',
                width: '90%', maxWidth: '500px', position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}
