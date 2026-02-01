package com.example.soccer.controller

import com.example.soccer.dto.CreateUsuarioRequest
import com.example.soccer.dto.UpdateUsuarioRequest
import com.example.soccer.service.UsuarioService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/usuarios")
class UsuarioController(private val service: UsuarioService) {

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun criar(@RequestBody req: CreateUsuarioRequest): ResponseEntity<Any> {
        return try {
            val user = service.criarUsuario(req)
            ResponseEntity.ok(user)
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }

    @GetMapping
    fun listar(): ResponseEntity<Any> {
        return ResponseEntity.ok(service.listarUsuarios())
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun atualizar(@PathVariable id: UUID, @RequestBody req: UpdateUsuarioRequest): ResponseEntity<Any> {
        return try {
            val user = service.atualizarUsuario(id, req)
            ResponseEntity.ok(user)
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    fun alterarStatus(@PathVariable id: UUID, @RequestBody body: Map<String, Boolean>): ResponseEntity<Any> {
        val ativo = body["ativo"] ?: return ResponseEntity.badRequest().body("Campo 'ativo' obrigatório")
        return try {
            val user = service.alterarStatus(id, ativo)
            ResponseEntity.ok(user)
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }
}
