package br.com.football.auth.config;

import br.com.football.auth.domain.entity.Usuario;
import br.com.football.auth.domain.enums.Role;
import br.com.football.auth.domain.repository.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void seedAdmin() {
        Optional<Usuario> optionalAdmin = usuarioRepository.findByUsername("admin");
        if (optionalAdmin.isEmpty()) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setRole(Role.ADMIN);
            usuarioRepository.save(admin);
            System.out.println("Admin user 'admin' seeded in Bar Service");
        } else {
            Usuario admin = optionalAdmin.get();
            admin.setPassword(passwordEncoder.encode("123456"));
            usuarioRepository.save(admin);
            System.out.println("Admin user 'admin' password reset in Bar Service");
        }
    }
}
