package com.nlite.quickchat.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Collections;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    public WebSocketAuthChannelInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(acc.getCommand())) {
            String auth = acc.getFirstNativeHeader("Authorization");
            if (auth == null || !auth.startsWith("Bearer ")) {
                // no token => anonymous websocket
                return message;
            }

            String token = auth.substring("Bearer ".length()).trim();
            Jwt jwt = jwtDecoder.decode(token);

            // Principal name = userId (subject)
            Principal principal = new StompPrincipal(jwt.getSubject());

            // Also attach an Authentication (useful later if needed)
            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());

            acc.setUser(authentication);
        }

        return message;
    }

    // Simple Principal implementation
    static class StompPrincipal implements Principal {
        private final String name;
        StompPrincipal(String name) { this.name = name; }
        @Override public String getName() { return name; }
    }
}
