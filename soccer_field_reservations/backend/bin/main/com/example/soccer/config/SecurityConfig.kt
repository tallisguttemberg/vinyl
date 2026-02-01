package com.example.soccer.config

import com.example.soccer.security.JwtTokenProvider
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.stereotype.Component
import com.example.soccer.model.UsuarioRepository
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.cors.CorsConfigurationSource

@Component
class JwtAuthenticationFilter(
    private val tokenProvider: JwtTokenProvider,
    private val userDetailsService: UserDetailsService
) : OncePerRequestFilter() {

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val token = getJwtFromRequest(request)

        if (token != null && tokenProvider.validateToken(token)) {
            val username = tokenProvider.getUsernameFromJWT(token)
            val userDetails = userDetailsService.loadUserByUsername(username)
            val authentication = UsernamePasswordAuthenticationToken(userDetails, null, userDetails.authorities)
            SecurityContextHolder.getContext().authentication = authentication
        }

        filterChain.doFilter(request, response)
    }

    private fun getJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            bearerToken.substring(7)
        } else null
    }
}

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val usuarioRepository: UsuarioRepository
) {

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    @Bean
    fun userDetailsService(): UserDetailsService {
        return UserDetailsService { username ->
            val user = usuarioRepository.findByLogin(username) 
                ?: throw org.springframework.security.core.userdetails.UsernameNotFoundException("User not found")
            User.builder()
                .username(user.login)
                .password(user.senhaHash)
                .roles(user.role)
                .build()
        }
    }

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/auth/**").permitAll()
                it.requestMatchers("/api/clientes").permitAll() // Allow registration
                it.requestMatchers("/api/campos").permitAll() // Allow public access to view fields
                it.requestMatchers("/api/reservas").authenticated() // Explicitly require login
                it.requestMatchers("/api/admin/**").hasRole("ADMIN")
                it.anyRequest().authenticated()
            }
            .addFilterBefore(
                JwtAuthenticationFilter(jwtTokenProvider, userDetailsService()),
                UsernamePasswordAuthenticationFilter::class.java
            )
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = listOf("*")
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        configuration.allowedHeaders = listOf("Authorization", "Content-Type", "X-Requested-With")
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }
}
