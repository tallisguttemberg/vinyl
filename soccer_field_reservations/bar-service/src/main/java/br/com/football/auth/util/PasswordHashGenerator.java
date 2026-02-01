package br.com.football.auth.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "123456";
        String hashedPassword = encoder.encode(rawPassword);
        
        System.out.println("Raw Password: " + rawPassword);
        System.out.println("BCrypt Hash: " + hashedPassword);
    }
}
