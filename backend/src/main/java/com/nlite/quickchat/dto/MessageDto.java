package com.nlite.quickchat.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageDto(UUID id, String content, String sender, Instant createdAt) {}
