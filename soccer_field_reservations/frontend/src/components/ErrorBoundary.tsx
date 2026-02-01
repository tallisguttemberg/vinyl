import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#dc2626' }}>
                    <h1>Algo deu errado.</h1>
                    <p>Ocorreu um erro ao renderizar a aplicação.</p>
                    <pre style={{ background: '#fbec', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                    >
                        Recarregar Página
                    </button>
                    <br />
                    <button
                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', marginLeft: '1rem' }}
                    >
                        Limpar Cache e Recarregar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
