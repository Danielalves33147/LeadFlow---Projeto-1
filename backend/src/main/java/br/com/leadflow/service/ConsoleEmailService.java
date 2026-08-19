package br.com.leadflow.service;

import br.com.leadflow.model.User;
import br.com.leadflow.model.UserInvitation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(
    name = "leadflow.email.mode",
    havingValue = "console",
    matchIfMissing = true
)
public class ConsoleEmailService implements EmailService {

    private static final Logger log =
        LoggerFactory.getLogger(
            ConsoleEmailService.class
        );

    @Override
    public void sendEmailVerification(
        User user,
        String verificationUrl
    ) {
        log.info(
            "=========================================="
        );

        log.info(
            "LEADFLOW - CONFIRMAÇÃO DE E-MAIL"
        );

        log.info(
            "Destinatário: {}",
            user.getEmail()
        );

        log.info(
            "Link: {}",
            verificationUrl
        );

        log.info(
            "=========================================="
        );
    }

    @Override
    public void sendUserInvitation(
        UserInvitation invitation,
        String invitationUrl
    ) {
        log.info(
            "=========================================="
        );

        log.info(
            "LEADFLOW - CONVITE"
        );

        log.info(
            "Destinatário: {}",
            invitation.getEmail()
        );

        log.info(
            "Link: {}",
            invitationUrl
        );

        log.info(
            "=========================================="
        );
    }
}