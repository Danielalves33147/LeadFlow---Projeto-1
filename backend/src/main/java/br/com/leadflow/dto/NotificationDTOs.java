package br.com.leadflow.dto;

import br.com.leadflow.model.enums.NotificationType;

import java.time.Instant;

public final class NotificationDTOs {

    private NotificationDTOs() {}public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        boolean read,
        String referenceType,
        Long referenceId,
        Instant createdAt
    ) {}public record NotificationListResponse(
        long unreadCount,
        java.util.List<NotificationResponse> notifications
    ) {}
}
