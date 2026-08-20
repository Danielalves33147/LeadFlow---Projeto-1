package br.com.leadflow.dao;

import br.com.leadflow.model.PasswordChangeToken;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordChangeTokenDAO extends JpaRepository<PasswordChangeToken, Long> {

    Optional<PasswordChangeToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    List<PasswordChangeToken> findByUserIdAndUsedAtIsNull(Long userId);

    boolean existsByTokenHash(String tokenHash);
}
