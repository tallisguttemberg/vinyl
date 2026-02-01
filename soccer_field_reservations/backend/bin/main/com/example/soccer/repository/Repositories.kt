package com.example.soccer.repository

import com.example.soccer.model.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

@Repository
interface ClienteRepository : JpaRepository<Cliente, UUID> {
    fun existsByCpf(cpf: String): Boolean
    fun existsByEmail(email: String): Boolean
}

@Repository
interface CampoRepository : JpaRepository<Campo, UUID> {
    fun findByAtivoTrue(): List<Campo>
}

@Repository
interface ReservaRepository : JpaRepository<Reserva, UUID> {
    @Query("SELECT COUNT(r) > 0 FROM Reserva r WHERE r.campo.id = :campoId AND r.dataReserva = :dataReserva AND r.status <> 'CANCELADA' AND ((r.horaInicio < :horaFim AND r.horaFim > :horaInicio))")
    fun existsOverlappingReserva(campoId: UUID, dataReserva: LocalDate, horaInicio: java.time.LocalTime, horaFim: java.time.LocalTime): Boolean
    
    fun findByClienteId(clienteId: UUID): List<Reserva>
    fun existsByClienteIdAndStatusIn(clienteId: UUID, statuses: List<StatusReserva>): Boolean
    fun findByCampoIdAndDataReservaOrderByHoraInicioAsc(campoId: UUID, dataReserva: LocalDate): List<Reserva>
}

@Repository
interface PagamentoRepository : JpaRepository<Pagamento, UUID>

@Repository
interface HorarioBloqueadoRepository : JpaRepository<HorarioBloqueado, UUID> {
    @Query("SELECT COUNT(h) > 0 FROM HorarioBloqueado h WHERE h.campo.id = :campoId AND ((h.dataInicio < :dataFim AND h.dataFim > :dataInicio))")
    fun existsOverlappingBlock(campoId: UUID, dataInicio: LocalDateTime, dataFim: LocalDateTime): Boolean
}
