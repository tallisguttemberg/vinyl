import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CadastroClientePage from './pages/CadastroClientePage';
import ReservaPage from './pages/ReservaPage';
import AdminCamposPage from './pages/AdminCamposPage';
import AdminClientesPage from './pages/AdminClientesPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminProdutosBarPage from './pages/AdminProdutosBarPage';
import BarVendaPage from './pages/BarVendaPage';
import HistoricoPedidosBarPage from './pages/HistoricoPedidosBarPage';
import CalendarInterface from './components/CalendarInterface';
import PrivateRoute from './components/PrivateRoute';

const Header = () => {
    const { user, role, logout, isAuthenticated } = useAuth();
    return (
        <div style={{ backgroundColor: '#1e293b', padding: '1rem', color: 'white', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="container" style={{ margin: '0 auto', padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚽</span>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Arena Soccer</h1>
                </Link>
                <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/admin/campos" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Gerenciar Campos</Link>
                            <Link to="/reservas" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>📅 Mapa de Reservas</Link>

                            {/* Menu Bar */}
                            <div style={{ display: 'flex', gap: '1rem', borderLeft: '1px solid #475569', paddingLeft: '1rem' }}>
                                <Link to="/bar/venda" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold' }}>🛒 Bar (PDV)</Link>
                                <Link to="/bar/historico" style={{ color: 'white', textDecoration: 'none' }}>Pedidos</Link>
                                {role === 'ADMIN' && (
                                    <Link to="/admin/bar/produtos" style={{ color: 'white', textDecoration: 'none' }}>Estoque</Link>
                                )}
                            </div>

                            {role === 'ADMIN' && (
                                <div style={{ display: 'flex', gap: '1rem', borderLeft: '1px solid #475569', paddingLeft: '1rem' }}>
                                    <Link to="/admin/clientes" style={{ color: 'white', textDecoration: 'none' }}>Clientes</Link>
                                    <Link to="/admin/usuarios" style={{ color: 'white', textDecoration: 'none' }}>Usuários</Link>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{user}</span>
                                <Link to="/alterar-senha" title="Alterar Senha" style={{ color: 'white', textDecoration: 'none' }}>⚙️</Link>
                                <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Sair</button>
                            </div>
                        </>
                    ) : (
                        <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Entrar</Link>
                    )}
                </nav>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/cadastro-cliente" element={<CadastroClientePage />} />

                    {/* Protected Routes */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/reservas" element={<CalendarInterface />} />
                        <Route path="/reservar/:campoId" element={<ReservaPage />} />
                        <Route path="/admin/campos" element={<AdminCamposPage />} />
                        <Route path="/admin/clientes" element={<AdminClientesPage />} />
                        <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />

                        {/* Bar Routes */}
                        <Route path="/bar/venda" element={<BarVendaPage />} />
                        <Route path="/bar/historico" element={<HistoricoPedidosBarPage />} />
                        <Route path="/admin/bar/produtos" element={<AdminProdutosBarPage />} />

                        <Route path="/alterar-senha" element={<ChangePasswordPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
