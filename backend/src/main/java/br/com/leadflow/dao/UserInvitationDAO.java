package br.com.leadflow.dao;

import br.com.leadflow.model.UserInvitation;
import br.com.leadflow.model.enums.InvitationStatus;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserInvitationDAO
    extends JpaRepository<UserInvitation, Long> {

    Optional<UserInvitation>
        findByTokenHash(
            String tokenHash
        );

    Optional<UserInvitation>
        findByTokenHashAndStatus(
            String tokenHash,
            InvitationStatus status
        );

    boolean existsByEmailIgnoreCaseAndStatus(
        String email,
        InvitationStatus status
    );

    List<UserInvitation>
        findByCompanyIdOrderByCreatedAtDesc(
            Long companyId
        );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select invitation
        from UserInvitation invitation
        where invitation.tokenHash = :tokenHash
          and invitation.status = :status
        """)
    Optional<UserInvitation>
        findForUpdateByTokenHashAndStatus(
            @Param("tokenHash")
            String tokenHash,

            @Param("status")
            InvitationStatus status
        );
}