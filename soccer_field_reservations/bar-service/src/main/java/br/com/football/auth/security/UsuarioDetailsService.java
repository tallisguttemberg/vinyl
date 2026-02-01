package br.com.football.auth.security;

import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import br.com.football.auth.domain.repository.UsuarioRepository;
import br.com.football.auth.domain.entity.Usuario;

@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository repository;

    public UsuarioDetailsService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        Usuario usuario = repository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        return User.builder()
            .username(usuario.getUsername())
            .password(usuario.getPassword())
            .roles(usuario.getRole().name())
            .build();
    }
}
