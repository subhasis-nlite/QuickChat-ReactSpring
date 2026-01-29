package com.nlite.quickchat.controller;

import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.service.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

//@CrossOrigin(origins = "http://localhost:5173")
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public Chat create(@RequestBody Map<String, String> body) {
        String title = body.getOrDefault("title", "").trim();
        if (title.isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }
        return chatService.create(title);
    }

    @GetMapping
    public List<Chat> list() {
        return chatService.list();
    }

    @GetMapping("/{id}")
    public Chat get(@PathVariable UUID id) {
        return chatService.get(id);
    }
}
