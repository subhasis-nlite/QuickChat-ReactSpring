package com.nlite.quickchat.repository;

import com.nlite.quickchat.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {
    List<ChatParticipant> findByUserId(UUID userId);
    Optional<ChatParticipant> findByChatIdAndUserId(UUID chatId, UUID userId);

    boolean existsByChatIdAndUserId(UUID chatId, UUID userId);

    @Query("SELECT DISTINCT cp.chat FROM ChatParticipant cp WHERE cp.user.id = :userId")
    List<com.nlite.quickchat.entity.Chat> findChatsForUser(@Param("userId") UUID userId);

    long countByChatId(UUID chatId);
}
