package com.nlite.quickchat.service;

import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.repository.ChatRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository chatRepository;

    public ChatService(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    public Chat create(String title) {
        Chat chat = new Chat();
        chat.setTitle(title);
        return chatRepository.save(chat);
    }

    public List<Chat> list() {
        return chatRepository.findAll();
    }

    public Chat get(UUID id) {
        return chatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Chat not found: " + id));
    }
}
