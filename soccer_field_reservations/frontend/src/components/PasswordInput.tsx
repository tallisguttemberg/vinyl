import { useState } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function PasswordInput({ label, style, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            {label && <label style={{ display: 'block', marginBottom: '0.5rem' }}>{label}</label>}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ ...style, width: '100%', paddingRight: '2.5rem' }}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: 'absolute',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666'
                    }}
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                    {showPassword ? (
                        // Eye Slash Icon (Hide)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    ) : (
                        // Eye Icon (Show)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
