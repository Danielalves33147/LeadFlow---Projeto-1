package br.com.leadflow.service;

import br.com.leadflow.dao.EmailVerificationTokenDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.model.EmailVerificationToken;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.utils.SecureTokenUtils;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailVerificationService {

    private final EmailVerificationTokenDAO tokenDAO;
    private final UserDAO userDAO;
    private final EmailService emailService;

    private final long expirationSeconds;
    private final String frontendUrl;

    public EmailVerificationService(
        EmailVerificationTokenDAO tokenDAO,
        UserDAO userDAO,
        EmailService emailService,
        @Value(
            "${leadflow.account.email-verification-expiration-seconds:86400}"
        )
        long expirationSeconds,
        @Value(
            "${leadflow.account.frontend-url:http://localhost:5173}"
        )
        String frontendUrl
    ) {
        this.tokenDAO = tokenDAO;
        this.userDAO = userDAO;
        this.emailService = emailService;
        this.expirationSeconds = expirationSeconds;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void createVerification(
        User user
    ) {
        Instant now = Instant.now();

        var previousTokens =
            tokenDAO.findByUserIdAndUsedAtIsNull(
                user.getId()
            );

        for (
            EmailVerificationToken previous
                : previousTokens
        ) {
            previous.setUsedAt(now);
        }

        if (!previousTokens.isEmpty()) {
            tokenDAO.saveAll(previousTokens);
        }

        String rawToken =
            SecureTokenUtils.generate();

        EmailVerificationToken token =
            new EmailVerificationToken();

        token.setUser(user);

        token.setTokenHash(
            SecureTokenUtils.hash(rawToken)
        );

        token.setExpiresAt(
            now.plusSeconds(
                expirationSeconds
            )
        );

        tokenDAO.save(token);

        String confirmationUrl =
            frontendUrl
                + "/confirmar-email?token="
                + rawToken;

        emailService.sendEmailVerification(
            user,
            confirmationUrl
        );
    }

    @Transactional
    public void verify(
        String rawToken
    ) {
        String tokenHash =
            SecureTokenUtils.hash(
                rawToken
            );

        EmailVerificationToken token =
            tokenDAO
                .findByTokenHashAndUsedAtIsNull(
                    tokenHash
                )
                .orElseThrow(
                    () ->
                        new BusinessException(
                            "INVALID_VERIFICATION_TOKEN",
                            "O link de confirmação é inválido ou já foi utilizado."
                        )
                );

        Instant now = Instant.now();

        if (!token.getExpiresAt().isAfter(now)) {
            token.setUsedAt(now);
            tokenDAO.save(token);

            throw new BusinessException(
                "VERIFICATION_TOKEN_EXPIRED",
                "O link de confirmação expirou."
            );
        }

        User user = token.getUser();

        if (user.getStatus() == UserStatus.ACTIVE) {
            token.setUsedAt(now);
            tokenDAO.save(token);

            throw new BusinessException(
                "EMAIL_ALREADY_VERIFIED",
                "Este e-mail já foi confirmado."
            );
        }

        if (
            user.getStatus()
                != UserStatus.PENDING_EMAIL_VERIFICATION
        ) {
            throw new BusinessException(
                "INVALID_ACCOUNT_STATUS",
                "Esta conta não pode ser confirmada."
            );
        }

        user.setEmailVerifiedAt(now);

        user.setStatus(
            UserStatus.ACTIVE
        );

        token.setUsedAt(now);

        userDAO.save(user);
        tokenDAO.save(token);
    }
}