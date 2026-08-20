package br.com.leadflow.service;

import br.com.leadflow.model.User;
import br.com.leadflow.model.UserInvitation;

public interface EmailService {

    void sendEmailVerification(
        User user,
        String verificationUrl
    );

    void sendUserInvitation(
        UserInvitation invitation,
        String invitationUrl
    );

    void sendPasswordChangeCode(
        User user,
        String code
    );
}
