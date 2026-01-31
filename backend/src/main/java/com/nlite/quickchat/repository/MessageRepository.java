package com.nlite.quickchat.repository;

import com.nlite.quickchat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    // existing (works, but not user-scoped)
    List<Message> findByChatIdOrderByCreatedAtAsc(UUID chatId);

    // new: user-scoped (use this after adding Chat.owner)
    List<Message> findByChatIdAndChatOwnerIdOrderByCreatedAtAsc(UUID chatId, UUID ownerId);
}
