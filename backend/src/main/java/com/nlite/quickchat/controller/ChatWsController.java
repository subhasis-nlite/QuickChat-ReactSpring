package com.nlite.quickchat.controller;

import com.nlite.quickchat.dto.MessageDto;
import com.nlite.quickchat.entity.Chat;
import com.nlite.quickchat.entity.Message;
import com.nlite.quickchat.repository.ChatRepository;
import com.nlite.quickchat.repository.MessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Controller
public class ChatWsController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messaging;

    public ChatWsController(ChatRepository chatRepository,
                            MessageRepository messageRepository,
                            SimpMessagingTemplate messaging) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.messaging = messaging;
    }

    @MessageMapping("/chats/{chatId}/send")
    public void send(@DestinationVariable UUID chatId, WsSendMessage body) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found"));

        String content = body.content() == null ? "" : body.content().trim();
        String sender = body.sender() == null ? "anonymous" : body.sender().trim();
        if (content.isEmpty()) return;

        Message msg = new Message();
        msg.setChat(chat);
        msg.setSender(sender);
        msg.setContent(content);

        Message saved = messageRepository.save(msg);

        MessageDto out = new MessageDto(
                saved.getId(),
                saved.getContent(),
                saved.getSender(),
                saved.getCreatedAt()
        );

        messaging.convertAndSend("/topic/chats/" + chatId, out);
    }

    public record WsSendMessage(String content, String sender) {}
}
