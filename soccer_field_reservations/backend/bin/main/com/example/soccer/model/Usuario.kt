package com.example.soccer.model

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Entity
@Table(name = "usuarios")
data class Usuario(
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Column(unique = true, nullable = false)
    val login: String,

    @Column(nullable = false)
    var senhaHash: String,

    @Column(nullable = false)
    var nome: String,

    @Column(nullable = false)
    var role: String = "ADMIN",

    @Column(nullable = false)
    var ativo: Boolean = true
)

@Repository
interface UsuarioRepository : JpaRepository<Usuario, UUID> {
    fun findByLogin(login: String): Usuario?
}
