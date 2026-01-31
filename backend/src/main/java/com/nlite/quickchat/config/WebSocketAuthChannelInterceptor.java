package com.nlite.quickchat.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final String AUTH_ATTR = "WS_AUTH";

    private final JwtDecoder jwtDecoder;

    public WebSocketAuthChannelInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null) return message;

        // 1) On CONNECT, authenticate and store in session
        if (StompCommand.CONNECT.equals(acc.getCommand())) {
            Authentication auth = authenticateFromHeader(acc);
            if (auth != null) {
                // principal must be stable for Spring messaging
                acc.setUser(auth);

                // store auth in session so later frames can reuse it
                Map<String, Object> sessionAttrs = acc.getSessionAttributes();
                if (sessionAttrs != null) {
                    sessionAttrs.put(AUTH_ATTR, auth);
                }
            }
            return message;
        }

        // 2) On other frames (SEND/SUBSCRIBE), re-attach auth from session if missing
        if (acc.getUser() == null) {
            Map<String, Object> sessionAttrs = acc.getSessionAttributes();
            if (sessionAttrs != null) {
                Object saved = sessionAttrs.get(AUTH_ATTR);
                if (saved instanceof Authentication authentication) {
                    acc.setUser(authentication);
                }
            }
        }

        return message;
    }

    private Authentication authenticateFromHeader(StompHeaderAccessor acc) {
        String header = acc.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }

        String token = header.substring("Bearer ".length()).trim();
        Jwt jwt = jwtDecoder.decode(token);

        // Use subject as principal name (your current choice)
        Principal principal = new StompPrincipal(jwt.getSubject());

        // Authentication also implements Principal; good for Spring security checks in handlers
        return new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
    }

    // Simple Principal implementation
    static class StompPrincipal implements Principal {
        private final String name;
        StompPrincipal(String name) { this.name = name; }
        @Override public String getName() { return name; }
    }
}
