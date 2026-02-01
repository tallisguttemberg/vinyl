package com.example.soccer.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "reservas")
data class Reserva(
    @Id
    @GeneratedValue
    val id: UUID? = null,

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    val cliente: Cliente,

    @ManyToOne
    @JoinColumn(name = "campo_id", nullable = false)
    val campo: Campo,

    @Column(name = "data_reserva", nullable = false)
    val dataReserva: LocalDate,

    @Column(name = "hora_inicio", nullable = false)
    val horaInicio: LocalTime,

    @Column(name = "hora_fim", nullable = false)
    val horaFim: LocalTime,

    @Column(nullable = false)
    val valor: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column
    val status: StatusReserva = StatusReserva.AGENDADA,

    @Column(name = "criado_em")
    val criadoEm: LocalDateTime = LocalDateTime.now(),

    @Column(name = "atualizado_em")
    val atualizadoEm: LocalDateTime = LocalDateTime.now()
)
