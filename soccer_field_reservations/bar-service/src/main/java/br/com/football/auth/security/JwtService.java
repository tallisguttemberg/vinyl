package br.com.football.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expiracaoMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration:86400000}") long expiration
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMs = expiration;
    }

    public String gerarToken(String id, String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("userId", id)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiracaoMs))
                .signWith(secretKey)
                .compact();
    }

    public String extractUsuarioId(String token) {
        Claims claims = extrairClaims(token);
        return String.valueOf(claims.get("userId"));
    }

    public String extractEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    public Claims extrairClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}

