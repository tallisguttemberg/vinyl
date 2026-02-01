package com.example.soccer.dto

import java.util.UUID

data class CreateUsuarioRequest(
    val nome: String,
    val login: String,
    val senha: String,
    val perfil: String // "ADMIN" or "USER"
)

data class UpdateUsuarioRequest(
    val nome: String?,
    val senha: String?,
    val perfil: String?
)

data class UsuarioResponse(
    val id: UUID,
    val nome: String,
    val login: String,
    val role: String,
    val ativo: Boolean
)
