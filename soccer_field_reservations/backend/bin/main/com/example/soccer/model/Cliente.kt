package com.example.soccer.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "clientes")
data class Cliente(
    @Id
    @GeneratedValue
    val id: UUID? = null,

    @Column(unique = true, nullable = false)
    val cpf: String,

    @Column(unique = true, nullable = false)
    val email: String,

    @Column(nullable = false)
    val nome: String,

    @Column
    val telefone: String? = null,

    @Column(name = "data_cadastro")
    val dataCadastro: LocalDateTime = LocalDateTime.now()
)
