package com.nlite.quickchat.repository;

import com.nlite.quickchat.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Chat, UUID> {
    List<Chat> findByOwnerId(UUID ownerId);

    @Query("SELECT c FROM Chat c WHERE c.owner.id = :userId OR EXISTS (SELECT 1 FROM ChatParticipant cp WHERE cp.chat = c AND cp.user.id = :userId)")
    List<Chat> findUserChats(@Param("userId") UUID userId);
}
