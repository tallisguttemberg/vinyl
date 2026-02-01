import axios from 'axios';
import { Campo, Cliente, Reserva, ReservaRequest } from '../types';

const api = axios.create({
    baseURL: '/api'
});

export { api };

export const getCampos = async () => {
    const response = await api.get<Campo[]>('/campos');
    return response.data;
};

export const createCliente = async (cliente: any) => {
    const response = await api.post('/clientes', cliente);
    return response.data;
};

export const getClientes = async () => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
};

export const updateCliente = async (id: string, cliente: any) => {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
};

export const deleteCliente = async (id: string) => {
    await api.delete(`/clientes/${id}`);
};

// Admin Functions
export const getTodosCampos = async () => {
    const response = await api.get<Campo[]>('/campos/admin');
    return response.data;
};

export const createCampo = async (campo: Partial<Campo>) => {
    const response = await api.post<Campo>('/campos', campo);
    return response.data;
};

export const updateCampo = async (id: string, campo: Partial<Campo>) => {
    const response = await api.put<Campo>(`/campos/${id}`, campo);
    return response.data;
};

// Auth Functions
export const login = async (login: string, senha: string) => {
    const response = await api.post('/auth/login', { login, senha });
    return response.data; // Expected { token: "...", success: true }
};

export const changePassword = async (oldPass: string, newPass: string) => {
    const response = await api.post('/auth/change-password', { oldPass, newPass });
    return response.data;
};

// User Management Functions
export const getUsuarios = async () => {
    const response = await api.get('/v1/usuarios');
    return response.data;
};

export const createUsuario = async (usuario: any) => {
    const response = await api.post('/v1/usuarios', usuario);
    return response.data;
};

export const updateUsuario = async (id: string, usuario: any) => {
    const response = await api.put(`/v1/usuarios/${id}`, usuario);
    return response.data;
};

export const toggleUsuarioStatus = async (id: string, ativo: boolean) => {
    const response = await api.patch(`/v1/usuarios/${id}/status`, { ativo });
    return response.data;
};

// Reservation Functions
export const createReserva = async (reserva: ReservaRequest) => {
    const response = await api.post<Reserva>('/reservas', reserva);
    return response.data;
};

export const getReservasDia = async (campoId: string, data: string) => {
    const response = await api.get<Reserva[]>('/reservas', {
        params: { data, ambiente: campoId }
    });
    return response.data;
};
export const getReservas = async () => {
    const response = await api.get<Reserva[]>('/reservas');
    return response.data;
};
