package com.nlite.quickchat.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_participants",
        uniqueConstraints = @UniqueConstraint(columnNames = {"chat_id","user_id"}))
public class ChatParticipant {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name="chat_id", nullable=false)
    private Chat chat;

    @ManyToOne(optional = false)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false)
    private Instant joinedAt = Instant.now();

    public UUID getId() { return id; }
    public Chat getChat() { return chat; }
    public User getUser() { return user; }
    public Instant getJoinedAt() { return joinedAt; }

    public void setChat(Chat chat) { this.chat = chat; }
    public void setUser(User user) { this.user = user; }
}
