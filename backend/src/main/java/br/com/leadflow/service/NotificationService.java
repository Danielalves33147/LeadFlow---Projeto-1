package br.com.leadflow.service;

import br.com.leadflow.dao.NotificationDAO;
import br.com.leadflow.dto.NotificationDTOs.NotificationListResponse;
import br.com.leadflow.dto.NotificationDTOs.NotificationResponse;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.Notification;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.NotificationType;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private final NotificationDAO notificationDAO;
    private final AccessService accessService;
    public NotificationService(NotificationDAO notificationDAO, AccessService accessService) {
        this.notificationDAO = notificationDAO;
        this.accessService = accessService;
    }

    public void create(User user, NotificationType type, String title, String message, String referenceType, Long referenceId) {
        Notification n = new Notification();
        n.setUser(user); n.setType(type); n.setTitle(title); n.setMessage(message);
        n.setReferenceType(referenceType); n.setReferenceId(referenceId); n.setRead(false);
        notificationDAO.save(n);
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list() {
        User user = accessService.currentUser();
        List<NotificationResponse> items = notificationDAO.findTop50ByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toResponse).toList();
        return new NotificationListResponse(notificationDAO.countByUserIdAndReadFalse(user.getId()), items);
    }

    @Transactional
    public void markRead(Long id) {
        User user = accessService.currentUser();
        Notification n = notificationDAO.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada."));
        n.setRead(true);
    }

    @Transactional
    public void markAllRead() {
        User user = accessService.currentUser();
        notificationDAO.markAllReadByUserId(user.getId());
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(), n.isRead(), n.getReferenceType(), n.getReferenceId(), n.getCreatedAt());
    }
}
