package com.nlite.quickchat.controller;

import com.nlite.quickchat.entity.User;
import com.nlite.quickchat.repository.UserRepository;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository users;
    private final JwtEncoder jwtEncoder;

    public AuthController(UserRepository users, JwtEncoder jwtEncoder) {
        this.users = users;
        this.jwtEncoder = jwtEncoder;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        if (username.isEmpty()) throw new IllegalArgumentException("username is required");

        User user = users.findByUsernameIgnoreCase(username)
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername(username);
                    return users.save(u);
                });

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("quickchat")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60 * 60 * 24 * 7)) // 7 days
                .subject(user.getId().toString())
                .claim("username", user.getUsername())
                .build();

        JwsHeader header = JwsHeader.with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256)
                .type("JWT")
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();


        return Map.of(
                "token", token,
                "user", Map.of("id", user.getId(), "username", user.getUsername())
        );
    }
}
