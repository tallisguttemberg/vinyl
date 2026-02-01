package com.example.soccer.service

import com.example.soccer.model.Usuario
import com.example.soccer.model.UsuarioRepository
import com.example.soccer.security.JwtTokenProvider
import jakarta.annotation.PostConstruct
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val repository: UsuarioRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenProvider: JwtTokenProvider
) {

    @PostConstruct
    fun seedAdminUser() {
        val tallis = repository.findByLogin("tallis")
        if (tallis == null) {
            val newUser = Usuario(
                login = "tallis",
                senhaHash = passwordEncoder.encode("Joaquim#19"),
                nome = "Tallis Guttemberg",
                role = "ADMIN",
                ativo = true
            )
            repository.save(newUser)
            println("Admin user 'tallis' created successfully.")
        }

        val admin = repository.findByLogin("admin")
        if (admin == null) {
            val newUser = Usuario(
                login = "admin",
                senhaHash = passwordEncoder.encode("123456"),
                nome = "Administrador",
                role = "ADMIN",
                ativo = true
            )
            repository.save(newUser)
            println("Admin user 'admin' created successfully.")
        } else {
            // Força a senha para 123456 para garantir o acesso do usuário
            admin.senhaHash = passwordEncoder.encode("123456")
            repository.save(admin)
            println("Admin user 'admin' password reset to '123456' successfully.")
        }
    }

    fun login(login: String, pass: String): String {
        val user = repository.findByLogin(login) ?: throw IllegalArgumentException("Login inválido")
        if (!passwordEncoder.matches(pass, user.senhaHash)) {
            throw IllegalArgumentException("Senha inválida")
        }
        return tokenProvider.generateToken(user.login, user.role, user.id.toString())
    }

    @Transactional
    fun changePassword(login: String, oldPass: String, newPass: String) {
        val user = repository.findByLogin(login) ?: throw IllegalArgumentException("Usuário não encontrado")
        if (!passwordEncoder.matches(oldPass, user.senhaHash)) {
            throw IllegalArgumentException("Senha atual incorreta")
        }
        user.senhaHash = passwordEncoder.encode(newPass)
        repository.save(user)
    }
}
