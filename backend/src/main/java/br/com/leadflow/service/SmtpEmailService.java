package br.com.leadflow.service;

import br.com.leadflow.model.User;
import br.com.leadflow.model.UserInvitation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(
    name = "leadflow.email.mode",
    havingValue = "smtp"
)
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpEmailService(
        JavaMailSender mailSender,
        @Value("${leadflow.email.from}")
        String from
    ) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void sendEmailVerification(
        User user,
        String verificationUrl
    ) {
        SimpleMailMessage message =
            new SimpleMailMessage();

        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject(
            "Confirme sua conta no LeadFlow"
        );

        message.setText(
            "Olá, "
                + user.getName()
                + "!\n\n"
                + "Seu cadastro no LeadFlow foi realizado.\n\n"
                + "Clique no link abaixo para confirmar "
                + "seu e-mail e ativar sua conta:\n\n"
                + verificationUrl
                + "\n\n"
                + "Se você não realizou este cadastro, "
                + "ignore esta mensagem.\n\n"
                + "Equipe LeadFlow"
        );

        mailSender.send(message);
    }

    @Override
    public void sendUserInvitation(
        UserInvitation invitation,
        String invitationUrl
    ) {
        SimpleMailMessage message =
            new SimpleMailMessage();

        message.setFrom(from);
        message.setTo(
            invitation.getEmail()
        );

        message.setSubject(
            "Você foi convidado para o LeadFlow"
        );

        message.setText(
            "Olá, "
                + invitation.getName()
                + "!\n\n"
                + "Você foi convidado para atuar como "
                + invitation.getRole()
                + " na empresa "
                + invitation.getCompany().getName()
                + ".\n\n"
                + "Clique no link abaixo para iniciar "
                + "a validação da sua conta:\n\n"
                + invitationUrl
                + "\n\n"
                + "Equipe LeadFlow"
        );

        mailSender.send(message);
    }

    @Override
    public void sendPasswordChangeCode(
        User user,
        String code
    ) {
        SimpleMailMessage message =
            new SimpleMailMessage();

        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject(
            "Código de segurança da sua senha no LeadFlow"
        );

        message.setText(
            "Olá, "
                + user.getName()
                + "!\n\n"
                + "Use o código abaixo para confirmar sua solicitação de senha:\n\n"
                + code
                + "\n\n"
                + "O código expira em poucos minutos. Se você não solicitou alteração ou recuperação de senha, ignore esta mensagem.\n\n"
                + "Equipe LeadFlow"
        );

        mailSender.send(message);
    }
}