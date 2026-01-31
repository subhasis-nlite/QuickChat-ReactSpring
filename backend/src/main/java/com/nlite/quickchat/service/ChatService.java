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
        if (participantIds == null || participantIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one participant required");
        }

        if (!participantIds.contains(owner.getId())) {
            participantIds.add(owner.getId());
        }

        participantIds = participantIds.stream().distinct().toList();

        if (participantIds.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chat requires at least 2 participants (1-to-1)");
        }

        Chat chat = new Chat();
        chat.setTitle(title);
        chat.setOwner(owner);
        Chat savedChat = chatRepository.save(chat);

        for (UUID participantId : participantIds) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Participant not found: " + participantId
                    ));

            ChatParticipant cp = new ChatParticipant();
            cp.setChat(savedChat);
            cp.setUser(participant);
            participantRepository.save(cp);
        }

        return savedChat;
    }

    public List<Chat> listUserChats(UUID userId) {
        // Repo returns ChatParticipant rows -> map to Chat list
        return participantRepository.findByUserId(userId).stream()
                .map(ChatParticipant::getChat)
                .distinct()
                .toList();
    }

    public Chat get(UUID id) {
        return chatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Chat not found: " + id));
    }
}
