package br.com.leadflow.service;

import br.com.leadflow.dao.UserBranchDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dao.UserInvitationDAO;
import br.com.leadflow.dto.InvitationDTOs.AcceptInvitationRequest;
import br.com.leadflow.dto.InvitationDTOs.AcceptInvitationResponse;
import br.com.leadflow.dto.InvitationDTOs.CreateInvitationRequest;
import br.com.leadflow.dto.InvitationDTOs.InvitationResponse;
import br.com.leadflow.dto.InvitationDTOs.ValidateInvitationResponse;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.DuplicateResourceException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.User;
import br.com.leadflow.model.UserBranch;
import br.com.leadflow.model.UserInvitation;
import br.com.leadflow.model.enums.InvitationStatus;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.utils.SecureTokenUtils;
import br.com.leadflow.utils.TextUtils;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationService {

    private final UserInvitationDAO invitationDAO;
    private final UserDAO userDAO;
    private final UserBranchDAO userBranchDAO;
    private final AccessService accessService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final long expirationSeconds;
    private final String frontendUrl;

    public InvitationService(
        UserInvitationDAO invitationDAO,
        UserDAO userDAO,
        UserBranchDAO userBranchDAO,
        AccessService accessService,
        EmailService emailService,
        PasswordEncoder passwordEncoder,
        @Value(
            "${leadflow.account.invitation-expiration-seconds:86400}"
        )
        long expirationSeconds,
        @Value(
            "${leadflow.account.frontend-url:http://localhost:5173}"
        )
        String frontendUrl
    ) {
        this.invitationDAO = invitationDAO;
        this.userDAO = userDAO;
        this.userBranchDAO = userBranchDAO;
        this.accessService = accessService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.expirationSeconds = expirationSeconds;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public InvitationResponse create(
        CreateInvitationRequest request
    ) {
        User actor =
            accessService.currentUser();

        assertCanInvite(
            actor,
            request.role()
        );

        String email =
            TextUtils.normalizedEmail(
                request.email()
            );

        if (
            userDAO.existsByEmailIgnoreCase(
                email
            )
        ) {
            throw new DuplicateResourceException(
                "Já existe um usuário com este e-mail."
            );
        }

        if (
            invitationDAO
                .existsByEmailIgnoreCaseAndStatus(
                    email,
                    InvitationStatus.PENDING
                )
        ) {
            throw new DuplicateResourceException(
                "Já existe um convite pendente para este e-mail."
            );
        }

        Branch primaryBranch =
            resolvePrimaryBranch(
                request,
                actor
            );

        User manager =
            resolveManager(
                request,
                actor
            );

        Set<Branch> authorizedBranches =
            resolveAuthorizedBranches(
                request,
                actor
            );

        String rawToken =
            SecureTokenUtils.generate();

        Instant now =
            Instant.now();

        UserInvitation invitation =
            new UserInvitation();

        invitation.setCompany(
            actor.getCompany()
        );

        invitation.setInvitedBy(
            actor
        );

        invitation.setName(
            request.name().trim()
        );

        invitation.setEmail(
            email
        );

        invitation.setRole(
            request.role()
        );

        invitation.setPrimaryBranch(
            primaryBranch
        );

        invitation.setManager(
            manager
        );

        invitation.setAuthorizedBranches(
            authorizedBranches
        );

        invitation.setTokenHash(
            SecureTokenUtils.hash(
                rawToken
            )
        );

        invitation.setStatus(
            InvitationStatus.PENDING
        );

        invitation.setExpiresAt(
            now.plusSeconds(
                expirationSeconds
            )
        );

        invitation =
            invitationDAO.save(
                invitation
            );

        String invitationUrl =
            frontendUrl
                + "/ativar-conta?token="
                + rawToken;

        emailService.sendUserInvitation(
            invitation,
            invitationUrl
        );

        return toResponse(
            invitation
        );
    }

    @Transactional(readOnly = true)
    public ValidateInvitationResponse validate(
        String rawToken
    ) {
        String tokenHash =
            SecureTokenUtils.hash(
                rawToken
            );

        UserInvitation invitation =
            invitationDAO
                .findByTokenHashAndStatus(
                    tokenHash,
                    InvitationStatus.PENDING
                )
                .orElseThrow(
                    () -> new BusinessException(
                        "INVALID_INVITATION",
                        "Este convite é inválido, já foi utilizado ou foi revogado."
                    )
                );

        Instant now =
            Instant.now();

        if (
            !invitation
                .getExpiresAt()
                .isAfter(now)
        ) {
            throw new BusinessException(
                "INVITATION_EXPIRED",
                "Este convite expirou."
            );
        }

        return new ValidateInvitationResponse(
            true,
            invitation.getName(),
            invitation.getEmail(),
            invitation
                .getCompany()
                .getName(),
            invitation.getRole(),
            invitation.getPrimaryBranch()
                == null
                    ? null
                    : invitation
                        .getPrimaryBranch()
                        .getName(),
            invitation.getExpiresAt()
        );
    }

    @Transactional
    public AcceptInvitationResponse accept(
        AcceptInvitationRequest request
    ) {
        if (
            !request
                .password()
                .equals(
                    request.confirmPassword()
                )
        ) {
            throw new BusinessException(
                "PASSWORDS_DO_NOT_MATCH",
                "As senhas informadas não coincidem."
            );
        }

        validatePassword(
            request.password()
        );

        String tokenHash =
            SecureTokenUtils.hash(
                request.token()
            );

        UserInvitation invitation =
            invitationDAO
                .findForUpdateByTokenHashAndStatus(
                    tokenHash,
                    InvitationStatus.PENDING
                )
                .orElseThrow(
                    () -> new BusinessException(
                        "INVALID_INVITATION",
                        "Este convite é inválido, já foi utilizado ou foi revogado."
                    )
                );

        Instant now =
            Instant.now();

        if (
            !invitation
                .getExpiresAt()
                .isAfter(now)
        ) {
            throw new BusinessException(
                "INVITATION_EXPIRED",
                "Este convite expirou."
            );
        }

        if (
            userDAO.existsByEmailIgnoreCase(
                invitation.getEmail()
            )
        ) {
            throw new DuplicateResourceException(
                "Já existe uma conta com este e-mail."
            );
        }

        User user =
            new User();

        user.setName(
            invitation.getName()
        );

        user.setEmail(
            invitation.getEmail()
        );

        user.setPasswordHash(
            passwordEncoder.encode(
                request.password()
            )
        );

        user.setRole(
            invitation.getRole()
        );

        user.setStatus(
            UserStatus.ACTIVE
        );

        user.setEmailVerifiedAt(
            now
        );

        user.setCompany(
            invitation.getCompany()
        );

        user.setPrimaryBranch(
            invitation.getPrimaryBranch()
        );

        user.setManager(
            invitation.getManager()
        );

        user =
            userDAO.save(
                user
            );

        if (
            invitation.getRole()
                == UserRole.MANAGER
        ) {
            for (
                Branch branch
                    : invitation.getAuthorizedBranches()
            ) {
                UserBranch userBranch =
                    new UserBranch();

                userBranch.setUser(
                    user
                );

                userBranch.setBranch(
                    branch
                );

                userBranchDAO.save(
                    userBranch
                );
            }
        }

        invitation.setStatus(
            InvitationStatus.ACCEPTED
        );

        invitation.setAcceptedAt(
            now
        );

        invitationDAO.save(
            invitation
        );

        return new AcceptInvitationResponse(
            "Conta ativada com sucesso. Você já pode fazer login.",
            user.getEmail()
        );
    }

    private void assertCanInvite(
        User actor,
        UserRole invitedRole
    ) {
        if (
            actor.getRole()
                == UserRole.SELLER
        ) {
            throw new AccessDeniedBusinessException(
                "Vendedores não podem convidar usuários."
            );
        }

        if (
            actor.getRole()
                == UserRole.MANAGER
            && invitedRole
                != UserRole.SELLER
        ) {
            throw new AccessDeniedBusinessException(
                "Gerentes podem convidar apenas vendedores."
            );
        }
    }

    private Branch resolvePrimaryBranch(
        CreateInvitationRequest request,
        User actor
    ) {
        if (
            request.role()
                == UserRole.SELLER
            && request.primaryBranchId()
                == null
        ) {
            throw new BusinessException(
                "BRANCH_REQUIRED",
                "Vendedores precisam de uma filial principal."
            );
        }

        if (
            request.primaryBranchId()
                == null
        ) {
            return null;
        }

        return accessService.requireBranch(
            request.primaryBranchId(),
            actor
        );
    }

    private User resolveManager(
        CreateInvitationRequest request,
        User actor
    ) {
        if (
            request.role()
                != UserRole.SELLER
        ) {
            return null;
        }

        if (
            actor.getRole()
                == UserRole.MANAGER
        ) {
            return actor;
        }

        if (
            request.managerId()
                == null
        ) {
            return null;
        }

        User manager =
            accessService.requireCompanyUser(
                request.managerId(),
                actor
            );

        if (
            manager.getRole()
                != UserRole.MANAGER
        ) {
            throw new BusinessException(
                "INVALID_MANAGER",
                "Selecione um gerente válido."
            );
        }

        return manager;
    }

    private Set<Branch> resolveAuthorizedBranches(
        CreateInvitationRequest request,
        User actor
    ) {
        if (
            request.role()
                != UserRole.MANAGER
        ) {
            return new HashSet<>();
        }

        if (
            request.authorizedBranchIds()
                == null
            || request.authorizedBranchIds()
                .isEmpty()
        ) {
            return new HashSet<>();
        }

        Set<Branch> branches =
            new HashSet<>();

        for (
            Long branchId
                : request.authorizedBranchIds()
        ) {
            branches.add(
                accessService.requireBranch(
                    branchId,
                    actor
                )
            );
        }

        return branches;
    }

    private InvitationResponse toResponse(
        UserInvitation invitation
    ) {
        List<Long> authorizedBranchIds =
            invitation
                .getAuthorizedBranches()
                .stream()
                .map(
                    Branch::getId
                )
                .toList();

        return new InvitationResponse(
            invitation.getId(),
            invitation.getName(),
            invitation.getEmail(),
            invitation.getRole(),
            invitation.getStatus(),

            invitation
                .getCompany()
                .getId(),

            invitation
                .getCompany()
                .getName(),

            invitation.getPrimaryBranch()
                == null
                    ? null
                    : invitation
                        .getPrimaryBranch()
                        .getId(),

            invitation.getPrimaryBranch()
                == null
                    ? null
                    : invitation
                        .getPrimaryBranch()
                        .getName(),

            invitation.getManager()
                == null
                    ? null
                    : invitation
                        .getManager()
                        .getId(),

            invitation.getManager()
                == null
                    ? null
                    : invitation
                        .getManager()
                        .getName(),

            authorizedBranchIds,
            invitation.getExpiresAt(),
            invitation.getCreatedAt()
        );
    }

    private void validatePassword(
        String password
    ) {
        boolean strong =
            password != null
                && password.length() >= 8
                && password
                    .chars()
                    .anyMatch(
                        Character::isUpperCase
                    )
                && password
                    .chars()
                    .anyMatch(
                        Character::isLowerCase
                    )
                && password
                    .chars()
                    .anyMatch(
                        Character::isDigit
                    )
                && password
                    .chars()
                    .anyMatch(
                        character ->
                            !Character.isLetterOrDigit(
                                character
                            )
                    );

        if (!strong) {
            throw new BusinessException(
                "WEAK_PASSWORD",
                "A senha deve ter ao menos 8 caracteres, maiúscula, minúscula, número e símbolo."
            );
        }
    }
}