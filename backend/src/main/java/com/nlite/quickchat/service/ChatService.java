package com.nlite.quickchat.service;

import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.entity.ChatParticipant;
import com.nlite.quickchat.entity.User;
import com.nlite.quickchat.repository.ChatParticipantRepository;
import com.nlite.quickchat.repository.ChatRepository;
import com.nlite.quickchat.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository participantRepository;
    private final UserRepository userRepository;

    public ChatService(
            ChatRepository chatRepository,
            ChatParticipantRepository participantRepository,
            UserRepository userRepository
    ) {
        this.chatRepository = chatRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
    }

    public Chat create(String title, User owner, List<UUID> participantIds) {
        // Validate: must have at least owner + 1 other person = 2 for 1-to-1, or N for group
        if (participantIds == null || participantIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one participant required");
        }

        // Ensure owner is in the participant list
        if (!participantIds.contains(owner.getId())) {
            participantIds.add(owner.getId());
        }

        // Remove duplicates
        participantIds = participantIds.stream().distinct().toList();

        // Validate participant count
        if (participantIds.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chat requires at least 2 participants (1-to-1)");
        }

        // Create the chat
        Chat chat = new Chat();
        chat.setTitle(title);
        chat.setOwner(owner);
        Chat savedChat = chatRepository.save(chat);

        // Add all participants
        for (UUID participantId : participantIds) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found: " + participantId));

            ChatParticipant cp = new ChatParticipant();
            cp.setChat(savedChat);
            cp.setUser(participant);
            participantRepository.save(cp);
        }

        return savedChat;
    }

    public List<Chat> listUserChats(UUID userId) {
        // Only return chats where user is a participant
        return participantRepository.findChatsForUser(userId);
    }

    public Chat get(UUID id) {
        return chatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Chat not found: " + id));
    }
}
