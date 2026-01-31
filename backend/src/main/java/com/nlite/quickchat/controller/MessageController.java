package com.nlite.quickchat.controller;

import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.entity.Message;
import com.nlite.quickchat.entity.User;
import com.nlite.quickchat.repository.ChatParticipantRepository;
import com.nlite.quickchat.repository.ChatRepository;
import com.nlite.quickchat.repository.MessageRepository;
import com.nlite.quickchat.repository.UserRepository;
import com.nlite.quickchat.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/chats")
public class MessageController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final ChatParticipantRepository participants;
    private final UserRepository userRepository;

    public MessageController(
            ChatRepository chatRepository,
            MessageRepository messageRepository,
            ChatParticipantRepository participants,
            UserRepository userRepository
    ) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.participants = participants;
        this.userRepository = userRepository;
    }

    // POST /api/chats/{chatId}/messages  body: { "content": "Hello" }
    @PostMapping("/{chatId}/messages")
    public MessageOut createMessage(
            @PathVariable UUID chatId,
            @RequestBody CreateMessageRequest body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt
    ) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found"));

        UUID meId = CurrentUser.id(jwt);
        String meUsername = CurrentUser.username(jwt);

        // ✅ WhatsApp rule: only participants can send
        if (!participants.existsByChatIdAndUserId(chatId, meId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this chat");
        }

        String content = body.content() == null ? "" : body.content().trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }

        User senderUser = userRepository.findById(meId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Message msg = new Message();
        msg.setChat(chat);
        msg.setContent(content);
        msg.setSender(senderUser); // ✅ server sets sender as User object

        Message saved = messageRepository.save(msg);

        return new MessageOut(saved);
    }

    // GET /api/chats/{chatId}/messages
    @GetMapping("/{chatId}/messages")
    public List<MessageOut> listMessages(
            @PathVariable UUID chatId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt
    ) {
        UUID meId = CurrentUser.id(jwt);

        // ✅ WhatsApp rule: only participants can read
        if (!participants.existsByChatIdAndUserId(chatId, meId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this chat");
        }

        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId)
                .stream()
                .map(MessageOut::new)
                .toList();
    }

    public record CreateMessageRequest(String content) {}
    public record MessageOut(UUID id, String content, String sender, Instant createdAt) {
        public MessageOut(Message msg) {
            this(msg.getId(), msg.getContent(), msg.getSender().getUsername(), msg.getCreatedAt());
        }
    }
}
