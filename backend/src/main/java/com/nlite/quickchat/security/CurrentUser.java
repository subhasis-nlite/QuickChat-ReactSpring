package com.nlite.quickchat.security;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public final class CurrentUser {
    private CurrentUser() {}

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject()); // subject = userId (you set this)
    }

    public static String username(Jwt jwt) {
        Object u = jwt.getClaims().get("username");
        return u == null ? "unknown" : u.toString();
    }
}
