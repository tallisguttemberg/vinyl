package br.com.football.auth.api;

import br.com.football.auth.domain.entity.Usuario;
import br.com.football.auth.domain.repository.UsuarioRepository;
import br.com.football.auth.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UsuarioRepository usuarioRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Optional<Usuario> optionalUsuario =
                usuarioRepository.findByUsername(request.username());

        if (optionalUsuario.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuário ou senha inválidos"));
        }

        Usuario usuario = optionalUsuario.get();

        // Validação segura com BCrypt
        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuário ou senha inválidos"));
        }

        String token = jwtService.gerarToken(
                String.valueOf(usuario.getId()),
                usuario.getUsername(),
                usuario.getRole().name()
        );

        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "role", usuario.getRole().name()
                )
        );
    }

    // =========================
    // DTO interno simples
    // =========================
    public record LoginRequest(
            String username,
            String password
    ) {}
}

