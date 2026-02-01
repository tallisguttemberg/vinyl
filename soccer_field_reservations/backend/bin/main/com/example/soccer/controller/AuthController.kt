package com.example.soccer.controller

import com.example.soccer.service.AuthService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

data class LoginRequest(val login: String, val senha: String)
data class ChangePasswordRequest(val oldPass: String, val newPass: String)

@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/login")
    fun login(@RequestBody req: LoginRequest): ResponseEntity<Any> {
        return try {
            val token = authService.login(req.login, req.senha)
            ResponseEntity.ok(mapOf("token" to token, "success" to true))
        } catch (e: Exception) {
            ResponseEntity.status(401).body(mapOf("success" to false, "message" to e.message))
        }
    }

    @PostMapping("/change-password")
    fun changePassword(@RequestBody req: ChangePasswordRequest): ResponseEntity<Any> {
        return try {
            val principal = SecurityContextHolder.getContext().authentication.principal as UserDetails
            authService.changePassword(principal.username, req.oldPass, req.newPass)
            ResponseEntity.ok(mapOf("success" to true, "message" to "Senha alterada com sucesso"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to e.message))
        }
    }
}
