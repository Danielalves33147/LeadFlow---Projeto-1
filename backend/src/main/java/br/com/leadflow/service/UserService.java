package br.com.leadflow.service;

import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dao.TaskDAO;
import br.com.leadflow.dao.UserBranchDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dto.UserDTOs.CreateUserRequest;
import br.com.leadflow.dto.UserDTOs.DeactivationImpact;
import br.com.leadflow.dto.UserDTOs.UpdateUserRequest;
import br.com.leadflow.dto.UserDTOs.UserResponse;
import br.com.leadflow.dto.UserDTOs.UserStatusRequest;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.User;
import br.com.leadflow.model.UserBranch;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.NotificationType;
import br.com.leadflow.model.enums.TaskStatus;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserDAO userDAO;
    private final UserBranchDAO userBranchDAO;
    private final LeadDAO leadDAO;
    private final TaskDAO taskDAO;
    private final AccessService accessService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserService(
        UserDAO userDAO,
        UserBranchDAO userBranchDAO,
        LeadDAO leadDAO,
        TaskDAO taskDAO,
        AccessService accessService,
        PasswordEncoder passwordEncoder,
        NotificationService notificationService
    ) {
        this.userDAO = userDAO;
        this.userBranchDAO = userBranchDAO;
        this.leadDAO = leadDAO;
        this.taskDAO = taskDAO;
        this.accessService = accessService;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list(
        Long branchId,
        UserRole role,
        UserStatus status
    ) {
        User actor =
            accessService.currentUser();

        if (
            actor.getRole()
                == UserRole.SELLER
        ) {
            throw new AccessDeniedBusinessException(
                "Vendedores não acessam a gestão de equipe."
            );
        }

        List<User> users;

        if (
            actor.getRole()
                == UserRole.ADMIN
        ) {
            users =
                userDAO.findByCompanyIdOrderByNameAsc(
                    actor
                        .getCompany()
                        .getId()
                );
        } else {
            users =
                userDAO.findByManagerIdOrderByNameAsc(
                    actor.getId()
                );
        }

        return users
            .stream()
            .filter(
                user ->
                    role == null
                        || user.getRole() == role
            )
            .filter(
                user ->
                    status == null
                        || user.getStatus() == status
            )
            .filter(
                user ->
                    branchId == null
                        || (
                            user.getPrimaryBranch() != null
                                && user
                                    .getPrimaryBranch()
                                    .getId()
                                    .equals(branchId)
                        )
            )
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(
        Long id
    ) {
        User actor =
            accessService.currentUser();

        User user =
            accessService.requireCompanyUser(
                id,
                actor
            );

        assertManageScope(
            actor,
            user
        );

        return toResponse(user);
    }

    /*
     * A criação direta de usuários foi desativada.
     *
     * Novos usuários devem ser criados exclusivamente
     * pelo fluxo de convite:
     *
     * POST /api/v1/users/invitations
     */
    @Transactional
    public UserResponse create(
        CreateUserRequest request
    ) {
        throw new BusinessException(
            "DIRECT_USER_CREATION_DISABLED",
            "A criação direta de usuários foi desativada. Envie um convite para o novo usuário."
        );
    }

    @Transactional
    public UserResponse update(
        Long id,
        UpdateUserRequest request
    ) {
        User actor =
            accessService.currentUser();

        requireManager(actor);

        User user =
            accessService.requireCompanyUser(
                id,
                actor
            );

        assertManageScope(
            actor,
            user
        );

        if (
            actor.getRole()
                == UserRole.MANAGER
            && request.role()
                != UserRole.SELLER
        ) {
            throw new AccessDeniedBusinessException(
                "Gerentes podem gerenciar apenas vendedores."
            );
        }

        user.setName(
            request.name().trim()
        );

        user.setRole(
            request.role()
        );

        configureRelations(
            user,
            request.primaryBranchId(),
            request.managerId(),
            request.authorizedBranchIds(),
            actor
        );

        saveBranchAuthorizations(
            user,
            request.authorizedBranchIds(),
            actor
        );

        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public DeactivationImpact impact(
        Long id
    ) {
        User actor =
            accessService.currentUser();

        requireManager(actor);

        User user =
            accessService.requireCompanyUser(
                id,
                actor
            );

        assertManageScope(
            actor,
            user
        );

        long leads =
            leadDAO
                .countByResponsibleUserIdAndStageNotIn(
                    id,
                    List.of(
                        LeadStage.CUSTOMER,
                        LeadStage.LOST
                    )
                );

        long tasks =
            taskDAO
                .countByResponsibleUserIdAndStatusIn(
                    id,
                    List.of(
                        TaskStatus.PENDING,
                        TaskStatus.OVERDUE
                    )
                );

        return new DeactivationImpact(
            leads,
            tasks,
            leads == 0 && tasks == 0
        );
    }

    @Transactional
    public UserResponse changeStatus(
        Long id,
        UserStatusRequest request
    ) {
        User actor =
            accessService.currentUser();

        requireManager(actor);

        User user =
            accessService.requireCompanyUser(
                id,
                actor
            );

        assertManageScope(
            actor,
            user
        );

        if (
            user.getId()
                .equals(actor.getId())
            && request.status()
                == UserStatus.INACTIVE
        ) {
            throw new BusinessException(
                "SELF_DEACTIVATION",
                "Você não pode desativar sua própria conta."
            );
        }

        if (
            request.status()
                == UserStatus.INACTIVE
        ) {
            DeactivationImpact impact =
                impact(id);

            if (!impact.canDeactivate()) {
                throw new BusinessException(
                    "USER_HAS_DEPENDENCIES",
                    "Redistribua os Leads ativos e tarefas pendentes antes de desativar este usuário."
                );
            }
        }

        user.setStatus(
            request.status()
        );

        notificationService.create(
            user,
            NotificationType.USER_STATUS_CHANGED,
            "Status da conta alterado",
            "Sua conta agora está "
                + request.status().name()
                + ".",
            "USER",
            user.getId()
        );

        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> activeSellers(
        Long branchId
    ) {
        User actor =
            accessService.currentUser();

        Branch branch =
            accessService.requireBranch(
                branchId,
                actor
            );

        return userDAO
            .findByPrimaryBranchIdAndStatusOrderByNameAsc(
                branch.getId(),
                UserStatus.ACTIVE
            )
            .stream()
            .filter(
                user ->
                    user.getRole()
                        == UserRole.SELLER
            )
            .map(this::toResponse)
            .toList();
    }

    private void configureRelations(
        User user,
        Long primaryBranchId,
        Long managerId,
        List<Long> authorizedBranchIds,
        User actor
    ) {
        if (
            user.getRole()
                == UserRole.SELLER
            && primaryBranchId == null
        ) {
            throw new BusinessException(
                "BRANCH_REQUIRED",
                "Vendedores precisam de uma filial principal."
            );
        }

        user.setPrimaryBranch(
            primaryBranchId == null
                ? null
                : accessService.requireBranch(
                    primaryBranchId,
                    actor
                )
        );

        if (
            user.getRole()
                == UserRole.SELLER
        ) {
            User manager;

            if (managerId == null) {
                manager =
                    actor.getRole()
                        == UserRole.MANAGER
                            ? actor
                            : null;
            } else {
                manager =
                    accessService.requireCompanyUser(
                        managerId,
                        actor
                    );
            }

            if (
                manager != null
                && manager.getRole()
                    != UserRole.MANAGER
            ) {
                throw new BusinessException(
                    "INVALID_MANAGER",
                    "Selecione um gerente válido."
                );
            }

            user.setManager(manager);
        } else {
            user.setManager(null);
        }

        if (
            actor.getRole()
                == UserRole.MANAGER
            && primaryBranchId != null
            && !accessService
                .authorizedBranchIds(actor)
                .contains(primaryBranchId)
        ) {
            throw new AccessDeniedBusinessException(
                "Filial fora do seu escopo."
            );
        }
    }

    private void saveBranchAuthorizations(
        User user,
        List<Long> ids,
        User actor
    ) {
        userBranchDAO.deleteByUserId(
            user.getId()
        );

        userBranchDAO.flush();

        if (
            user.getRole()
                != UserRole.MANAGER
            || ids == null
        ) {
            return;
        }

        for (Long id : ids) {
            Branch branch =
                accessService.requireBranch(
                    id,
                    actor
                );

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

    private void assertManageScope(
        User actor,
        User target
    ) {
        if (
            actor.getRole()
                == UserRole.ADMIN
        ) {
            return;
        }

        if (
            target.getManager() == null
            || !target
                .getManager()
                .getId()
                .equals(
                    actor.getId()
                )
        ) {
            throw new AccessDeniedBusinessException(
                "Usuário fora da sua equipe."
            );
        }
    }

    private void requireManager(
        User actor
    ) {
        if (
            actor.getRole()
                == UserRole.SELLER
        ) {
            throw new AccessDeniedBusinessException(
                "Vendedores não gerenciam usuários."
            );
        }
    }

    private UserResponse toResponse(
        User user
    ) {
        List<Long> branches =
            userBranchDAO
                .findByUserId(
                    user.getId()
                )
                .stream()
                .map(
                    userBranch ->
                        userBranch
                            .getBranch()
                            .getId()
                )
                .toList();

        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),

            user.getPrimaryBranch()
                == null
                    ? null
                    : user
                        .getPrimaryBranch()
                        .getId(),

            user.getPrimaryBranch()
                == null
                    ? null
                    : user
                        .getPrimaryBranch()
                        .getName(),

            user.getManager()
                == null
                    ? null
                    : user
                        .getManager()
                        .getId(),

            user.getManager()
                == null
                    ? null
                    : user
                        .getManager()
                        .getName(),

            branches,

            leadDAO
                .countByResponsibleUserIdAndStageNotIn(
                    user.getId(),
                    List.of(
                        LeadStage.CUSTOMER,
                        LeadStage.LOST
                    )
                ),

            user.getLastLoginAt(),
            user.getCreatedAt()
        );
    }
}