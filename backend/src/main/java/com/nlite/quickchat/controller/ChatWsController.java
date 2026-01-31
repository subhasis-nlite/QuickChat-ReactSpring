package com.nlite.quickchat.controller;

import com.nlite.quickchat.dto.MessageDto;
import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.entity.Message;
import com.nlite.quickchat.entity.User;
import com.nlite.quickchat.repository.ChatParticipantRepository;
import com.nlite.quickchat.repository.ChatRepository;
import com.nlite.quickchat.repository.MessageRepository;
import com.nlite.quickchat.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWsController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final ChatParticipantRepository participants;
    private final UserRepository users;
    private final SimpMessagingTemplate messaging;

    public ChatWsController(ChatRepository chatRepository,
                            MessageRepository messageRepository,
                            ChatParticipantRepository participants,
                            UserRepository users,
                            SimpMessagingTemplate messaging) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.participants = participants;
        this.users = users;
        this.messaging = messaging;
    }

    // client sends: /app/chats/{chatId}/send  body: { "content": "hi" }
    // server broadcasts: /topic/chats/{chatId}
    @MessageMapping("/chats/{chatId}/send")
    public void send(@DestinationVariable UUID chatId, WsSendMessage body, Principal principal) {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        UUID meId = UUID.fromString(principal.getName());

        // only participants can send
        if (!participants.existsByChatIdAndUserId(chatId, meId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant");
        }

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found"));

        String content = body.content() == null ? "" : body.content().trim();
        if (content.isEmpty()) return;

        User senderUser = users.findById(meId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Message msg = new Message();
        msg.setChat(chat);
        msg.setSender(senderUser);
        msg.setContent(content);

        Message saved = messageRepository.save(msg);

        MessageDto out = new MessageDto(
                saved.getId(),
                saved.getContent(),
                saved.getSender().getUsername(),
                saved.getCreatedAt()
        );

        messaging.convertAndSend("/topic/chats/" + chatId, out);
    }

    public record WsSendMessage(String content) {}
}
