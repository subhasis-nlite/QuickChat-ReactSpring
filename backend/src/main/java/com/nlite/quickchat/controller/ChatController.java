package com.nlite.quickchat.controller;

import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.entity.User;
import com.nlite.quickchat.repository.ChatParticipantRepository;
import com.nlite.quickchat.repository.UserRepository;
import com.nlite.quickchat.security.CurrentUser;
import com.nlite.quickchat.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final ChatParticipantRepository participants;

    public ChatController(
            ChatService chatService,
            UserRepository userRepository,
            ChatParticipantRepository participants
    ) {
        this.chatService = chatService;
        this.userRepository = userRepository;
        this.participants = participants;
    }

    @PostMapping
    public Chat create(
            @RequestBody CreateChatRequest body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt
    ) {
        String title = body.title() == null ? "" : body.title().trim();
        if (title.isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }

        UUID userId = CurrentUser.id(jwt);
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Convert usernames to UUIDs
        List<UUID> participantIds = new java.util.ArrayList<>();
        if (body.participantUsernames() != null) {
            for (String username : body.participantUsernames()) {
                User participant = userRepository.findByUsernameIgnoreCase(username.trim())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + username));
                participantIds.add(participant.getId());
            }
        }

        return chatService.create(title, owner, participantIds);
    }

    @GetMapping
    public List<Chat> list(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = CurrentUser.id(jwt);
        return chatService.listUserChats(userId);
    }

    @GetMapping("/{id}")
    public Chat get(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = CurrentUser.id(jwt);
        Chat chat = chatService.get(id);

        // Only participants can access
        if (!participants.existsByChatIdAndUserId(id, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return chat;
    }

    public record CreateChatRequest(String title, List<String> participantUsernames) {}
}
