package br.com.football.auth.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7);

            try {
                Claims claims = jwtService.extrairClaims(token);

                String username = claims.getSubject();
                String role = String.valueOf(claims.get("role"));
                System.out.println("JWT Debug -> User: " + username + " | Role: " + role);

                // Ensure proper ROLE_ prefix for Spring Security
                String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority(authority))
                        );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);

            } catch (Exception e) {
                System.out.println("JWT Debug -> Error: " + e.getMessage());
                // Token inválido ou expirado → não autentica
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
