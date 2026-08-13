package br.com.leadflow.dao;

import br.com.leadflow.model.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationDAO extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndReadFalse(Long userId);
    @Modifying
    @Query("update Notification n set n.read = true where n.user.id = :userId and n.read = false")
    int markAllReadByUserId(@Param("userId") Long userId);
}
