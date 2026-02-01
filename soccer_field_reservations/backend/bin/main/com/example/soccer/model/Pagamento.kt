package com.example.soccer.model

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull
import org.hibernate.annotations.GenericGenerator
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "pagamentos")
data class Pagamento(
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    val id: UUID? = null,

    @ManyToOne(optional = false)
    @JoinColumn(name = "reserva_id")
    val reserva: Reserva,

    @field:NotNull
    val valor: BigDecimal,

    @Column(name = "data_pagamento")
    val dataPagamento: LocalDateTime = LocalDateTime.now(),

    @Column(name = "metodo_pagamento")
    val metodoPagamento: String? = null,

    val status: String = "APROVADO"
)
