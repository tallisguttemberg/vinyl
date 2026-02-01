import axios from 'axios';
import { ProdutoBar, Pedido, PedidoRequest } from '../types/bar';

const API_URL = 'http://localhost:8082/api/bar';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Produtos
export const getProdutos = async (): Promise<ProdutoBar[]> => {
    const response = await axios.get(`${API_URL}/produtos`, { headers: getAuthHeader() });
    return response.data;
};

export const getProdutosDisponiveis = async (): Promise<ProdutoBar[]> => {
    const response = await axios.get(`${API_URL}/produtos/disponiveis`, { headers: getAuthHeader() });
    return response.data;
};

export const saveProduto = async (produto: ProdutoBar): Promise<ProdutoBar> => {
    if (produto.id) {
        const response = await axios.put(`${API_URL}/produtos/${produto.id}`, produto, { headers: getAuthHeader() });
        return response.data;
    } else {
        const response = await axios.post(`${API_URL}/produtos`, produto, { headers: getAuthHeader() });
        return response.data;
    }
};

export const deleteProduto = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/produtos/${id}`, { headers: getAuthHeader() });
};

// Pedidos
export const criarPedido = async (pedido: PedidoRequest): Promise<Pedido> => {
    const response = await axios.post(`${API_URL}/pedidos`, pedido, { headers: getAuthHeader() });
    return response.data;
};

export const getMeusPedidos = async (): Promise<Pedido[]> => {
    const response = await axios.get(`${API_URL}/pedidos`, { headers: getAuthHeader() });
    return response.data;
};

export const getTodosPedidos = async (): Promise<Pedido[]> => {
    const response = await axios.get(`${API_URL}/pedidos/admin/todos`, { headers: getAuthHeader() });
    return response.data;
};
