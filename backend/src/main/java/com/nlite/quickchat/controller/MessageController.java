package com.nlite.quickchat.controller;

import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.entity.Message;
import com.nlite.quickchat.repository.ChatRepository;
import com.nlite.quickchat.repository.MessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

//@CrossOrigin(origins = "http://localhost:5173")
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/chats")
public class MessageController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    public MessageController(ChatRepository chatRepository, MessageRepository messageRepository) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
    }

    // POST /api/chats/{chatId}/messages  body: { "content": "Hello", "sender": "Amit" }
    @PostMapping("/{chatId}/messages")
    public MessageOut createMessage(@PathVariable UUID chatId, @RequestBody CreateMessageRequest body) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found"));

        String content = body.content() == null ? "" : body.content().trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }

        String sender = body.sender() == null ? "anonymous" : body.sender().trim();
        if (sender.isEmpty()) sender = "anonymous";

        Message msg = new Message();
        msg.setChat(chat);
        msg.setContent(content);
        msg.setSender(sender);

        Message saved = messageRepository.save(msg);

        return new MessageOut(saved.getId(), saved.getContent(), saved.getSender(), saved.getCreatedAt());
    }

    // GET /api/chats/{chatId}/messages
    @GetMapping("/{chatId}/messages")
    public List<MessageOut> listMessages(@PathVariable UUID chatId) {
        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId)
                .stream()
                .map(m -> new MessageOut(m.getId(), m.getContent(), m.getSender(), m.getCreatedAt()))
                .toList();
    }

    public record CreateMessageRequest(String content, String sender) {}
    public record MessageOut(UUID id, String content, String sender, Instant createdAt) {}
}
