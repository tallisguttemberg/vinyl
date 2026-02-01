export interface Cliente {
    id?: string;
    cpf: string;
    email: string;
    nome: string;
    telefone: string;
}

export interface Campo {
    id: string;
    nome: string;
    tipo: string;
    valorHora: number;
    descricao?: string;
    ativo: boolean;
}

export interface Reserva {
    id?: string;
    cliente: Cliente;
    campo: Campo;
    dataReserva: string;
    horaInicio: string;
    horaFim: string;
    valor: number;
    status: string;
}

export interface ReservaRequest {
    clienteId: string;
    campoId: string;
    dataReserva: string;
    horaInicio: string;
    horaFim: string;
}

export interface Usuario {
    id: string;
    nome: string;
    login: string;
    role: string;
    ativo: boolean;
}
