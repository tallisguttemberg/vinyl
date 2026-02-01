package com.example.soccer.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.util.UUID

@Entity
@Table(name = "campos")
data class Campo(
    @Id
    @GeneratedValue
    val id: UUID? = null,

    @Column(nullable = false)
    val nome: String,

    @Column(nullable = false)
    val tipo: String,

    @Column(nullable = false, name = "valor_hora")
    val valorHora: BigDecimal,

    @Column
    val descricao: String? = null,

    @Column
    val ativo: Boolean = true
)
