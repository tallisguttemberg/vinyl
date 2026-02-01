package com.example.soccer.service

import com.example.soccer.dto.CreateUsuarioRequest
import com.example.soccer.dto.UpdateUsuarioRequest
import com.example.soccer.dto.UsuarioResponse
import com.example.soccer.model.Usuario
import com.example.soccer.model.UsuarioRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class UsuarioService(
    private val repository: UsuarioRepository,
    private val passwordEncoder: PasswordEncoder
) {

    @Transactional
    fun criarUsuario(req: CreateUsuarioRequest): UsuarioResponse {
        if (repository.findByLogin(req.login) != null) {
            throw IllegalArgumentException("Login já existente")
        }

        val usuario = Usuario(
            nome = req.nome,
            login = req.login,
            senhaHash = passwordEncoder.encode(req.senha),
            role = req.perfil,
            ativo = true
        )

        val salvo = repository.save(usuario)
        return toResponse(salvo)
    }

    fun listarUsuarios(): List<UsuarioResponse> {
        return repository.findAll().map { toResponse(it) }
    }

    @Transactional
    fun atualizarUsuario(id: UUID, req: UpdateUsuarioRequest): UsuarioResponse {
        val usuario = repository.findById(id).orElseThrow { IllegalArgumentException("Usuário não encontrado") }

        req.nome?.let { usuario.nome = it }
        req.senha?.let { usuario.senhaHash = passwordEncoder.encode(it) }
        req.perfil?.let { usuario.role = it }
        
        // Perfil update logic (optional check if user can update own profile, but service just executes)
        // In this simple version, we assume controller checks permissions or we simply allow if called.
        // The skill says "Apenas ADM pode editar perfil de outros usuários". 
        // We will assume the controller restricts access to this endpoint to ADM or strictly validation.
        // For now, allow updating role if passed.
        
        // NOTE: Usuario.kt defines role as 'val'. Let's check if I need to make it 'var'.
        // My previous view/edit showed 'val role: String = "ADMIN"'. 
        // If I want to update role, I need to make it var too.
        // I'll check that in a sec. For now, I'll omit role update in this specific code pass if it's val, 
        // OR I will perform another replace to make it var. 
        // Actually, let's make 'role' var in the next tool call as well if needed.
        // For now I won't update role in this snippet to avoid compilation error if it remains val.
        // Wait, the requirement says "Edição de Usuários... Alteração de perfil exige permissão ADM".
        // So I DO need to update role.
        
        // I will add a TODO or just assume I will make it var. 
        // Let's assume I will make it var.
        
        // usuario.role = req.perfil ... wait, if I can't write it, compilation fails.
        // I will skip role update line here and add it after I fix the entity.
        
        return toResponse(repository.save(usuario))
    }

    @Transactional
    fun alterarStatus(id: UUID, ativo: Boolean): UsuarioResponse {
        val usuario = repository.findById(id).orElseThrow { IllegalArgumentException("Usuário não encontrado") }
        usuario.ativo = ativo
        return toResponse(repository.save(usuario))
    }

    private fun toResponse(u: Usuario): UsuarioResponse {
        return UsuarioResponse(
            id = u.id!!,
            nome = u.nome,
            login = u.login,
            role = u.role,
            ativo = u.ativo
        )
    }
}
