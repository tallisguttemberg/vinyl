package com.example.soccer.model

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull
import org.hibernate.annotations.GenericGenerator
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "horarios_bloqueados")
data class HorarioBloqueado(
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    val id: UUID? = null,

    @ManyToOne(optional = false)
    @JoinColumn(name = "campo_id")
    val campo: Campo,

    @field:NotNull
    @Column(name = "data_inicio")
    val dataInicio: LocalDateTime,

    @field:NotNull
    @Column(name = "data_fim")
    val dataFim: LocalDateTime,

    val motivo: String? = null
)
