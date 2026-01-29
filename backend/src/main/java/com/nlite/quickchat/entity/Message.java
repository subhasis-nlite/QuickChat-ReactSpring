package com.nlite.quickchat.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "chat_id", nullable = false)
    @JsonIgnore
    private Chat chat;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false, length = 80)
    private String sender;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public Chat getChat() { return chat; }
    public String getContent() { return content; }
    public String getSender() { return sender; }
    public Instant getCreatedAt() { return createdAt; }

    public void setChat(Chat chat) { this.chat = chat; }
    public void setContent(String content) { this.content = content; }
    public void setSender(String sender) { this.sender = sender; }
}
