package br.com.football.auth.api;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/util")
public class PasswordUtilController {

    private final PasswordEncoder passwordEncoder;

    public PasswordUtilController(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Endpoint temporário para gerar hash BCrypt de senhas
     * USE APENAS EM DESENVOLVIMENTO!
     * Remova este endpoint em produção.
     */
    @GetMapping("/hash")
    public String generateHash(@RequestParam String password) {
        return passwordEncoder.encode(password);
    }
}
