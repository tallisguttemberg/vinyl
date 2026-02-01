package com.example.soccer.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @org.springframework.beans.factory.annotation.Value("\${jwt.secret}")
    private val jwtSecretString: String,
    
    @org.springframework.beans.factory.annotation.Value("\${jwt.expiration}")
    private val jwtExpirationInMs: Long
) {
    private val jwtSecret: SecretKey get() = Keys.hmacShaKeyFor(jwtSecretString.toByteArray())

    fun generateToken(username: String, role: String, userId: String): String {
        val now = Date()
        val expiryDate = Date(now.time + jwtExpirationInMs)

        return Jwts.builder()
            .setSubject(username)
            .claim("role", role)
            .claim("userId", userId)
            .setIssuedAt(Date())
            .setExpiration(expiryDate)
            .signWith(jwtSecret)
            .compact()
    }

    fun getUsernameFromJWT(token: String): String {
        val claims = Jwts.parserBuilder()
            .setSigningKey(jwtSecret)
            .build()
            .parseClaimsJws(token)
            .body
        return claims.subject
    }

    fun validateToken(authToken: String): Boolean {
        try {
            Jwts.parserBuilder().setSigningKey(jwtSecret).build().parseClaimsJws(authToken)
            return true
        } catch (ex: Exception) {
            return false
        }
    }
}
