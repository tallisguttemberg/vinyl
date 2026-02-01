package com.example.soccer.service

import com.example.soccer.model.*
import com.example.soccer.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@Service
class ClienteService(private val repository: ClienteRepository, private val reservaRepository: ReservaRepository) {
    
    @Transactional
    fun criar(cliente: Cliente): Cliente {
        validarCliente(cliente)
        if (repository.existsByCpf(cliente.cpf)) throw IllegalArgumentException("CPF já cadastrado")
        if (repository.existsByEmail(cliente.email)) throw IllegalArgumentException("Email já cadastrado")
        return repository.save(cliente)
    }

    @Transactional(readOnly = true)
    fun listar(): List<Cliente> = repository.findAll()

    @Transactional
    fun atualizar(id: UUID, dados: Cliente): Cliente {
        val existing = repository.findById(id).orElseThrow { IllegalArgumentException("Cliente não encontrado") }
        validarCliente(dados)
        
        // Check duplicates if changed
        if (dados.cpf != existing.cpf && repository.existsByCpf(dados.cpf)) throw IllegalArgumentException("CPF já cadastrado")
        if (dados.email != existing.email && repository.existsByEmail(dados.email)) throw IllegalArgumentException("Email já cadastrado")

        return repository.save(existing.copy(
            nome = dados.nome,
            cpf = dados.cpf,
            email = dados.email,
            telefone = dados.telefone
        ))
    }

    private fun validarCliente(c: Cliente) {
        if (!isValidCPF(c.cpf)) throw IllegalArgumentException("CPF inválido")
        if (c.telefone.isNullOrBlank()) throw IllegalArgumentException("WhatsApp é obrigatório")
    }

    private fun isValidCPF(cpf: String): Boolean {
        val cleanCpf = cpf.replace(Regex("[^0-9]"), "")
        if (cleanCpf.length != 11) return false
        if (cleanCpf.all { it == cleanCpf[0] }) return false
        
        val digits = cleanCpf.map { it.toString().toInt() }
        
        var sum = 0
        for (i in 0..8) sum += digits[i] * (10 - i)
        var remainder = sum * 10 % 11
        if (remainder == 10) remainder = 0
        if (remainder != digits[9]) return false
        
        sum = 0
        for (i in 0..9) sum += digits[i] * (11 - i)
        remainder = sum * 10 % 11
        if (remainder == 10) remainder = 0
        if (remainder != digits[10]) return false
        
        return true
    }

    /*
    // Deactivation logic (if we had a 'ativo' field, but schema didn't specify one for Client, assuming hard delete or external requirement)
    // Skill said: "Utilizar desativação lógica quando necessário". And "Não permitir desativação de clientes com reservas ativas"
    // Since schema.sql for backend didn't add 'ativo' to Cliente, I will verify if I can delete.
    */
    @Transactional
    fun deletar(id: UUID) {
       if (reservaRepository.existsByClienteIdAndStatusIn(id, listOf(StatusReserva.AGENDADA, StatusReserva.CONFIRMADA))) {
           throw IllegalStateException("Não é possível remover cliente com reservas ativas")
       }
       repository.deleteById(id)
    }
}

@Service
class CampoService(private val repository: CampoRepository) {
    fun listarAtivos(): List<Campo> = repository.findByAtivoTrue()
    fun listarTodos(): List<Campo> = repository.findAll() // Admin sees all
    fun buscarPorId(id: UUID): Campo = repository.findById(id).orElseThrow { IllegalArgumentException("Campo não encontrado") }

    @Transactional
    fun criar(campo: Campo): Campo {
        return repository.save(campo)
    }

    @Transactional
    fun atualizar(id: UUID, dados: Campo): Campo {
        val existing = buscarPorId(id)
        val update = existing.copy(
            nome = dados.nome,
            tipo = dados.tipo,
            valorHora = dados.valorHora,
            descricao = dados.descricao,
            ativo = dados.ativo
        )
        return repository.save(update)
    }
}

@Service
class ReservaService(
    private val reservaRepository: ReservaRepository,
    private val campoRepository: CampoRepository,
    private val bloqueioRepository: HorarioBloqueadoRepository
) {

    @Transactional
    fun criar(reserva: Reserva): Reserva {
        val campo = campoRepository.findById(reserva.campo.id!!).orElseThrow { IllegalArgumentException("Campo inválido") }
        if (!campo.ativo) throw IllegalStateException("Campo inativo")

        // Validate Duration
        if (reserva.horaInicio.plusHours(1).isAfter(reserva.horaFim)) {
            throw IllegalArgumentException("Reserva mínima de 1 hora")
        }

        // Validate Overlap with Reservations
        if (reservaRepository.existsOverlappingReserva(campo.id!!, reserva.dataReserva, reserva.horaInicio, reserva.horaFim)) {
            throw IllegalStateException("Horário já reservado")
        }

        // Validate Overlap with Blocks
        val startDateTime = java.time.LocalDateTime.of(reserva.dataReserva, reserva.horaInicio)
        val endDateTime = java.time.LocalDateTime.of(reserva.dataReserva, reserva.horaFim)
        if (bloqueioRepository.existsOverlappingBlock(campo.id, startDateTime, endDateTime)) {
             throw IllegalStateException("Horário bloqueado")
        }

        return reservaRepository.save(reserva.copy(status = StatusReserva.AGENDADA))
    }

    fun listarReservasDoDia(campoId: UUID, data: LocalDate): List<Reserva> {
        return reservaRepository.findByCampoIdAndDataReservaOrderByHoraInicioAsc(campoId, data)
    }

    fun listarTodas(): List<Reserva> = reservaRepository.findAll()
}
