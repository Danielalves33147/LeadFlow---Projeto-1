package br.com.leadflow.dao;

import br.com.leadflow.model.EmailVerificationToken;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenDAO
    extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken>
        findByTokenHashAndUsedAtIsNull(
            String tokenHash
        );

    List<EmailVerificationToken>
        findByUserIdAndUsedAtIsNull(
            Long userId
        );
}