package br.com.leadflow.service;

import br.com.leadflow.dao.TaskDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dto.CommonDTOs.PageResponse;
import br.com.leadflow.dto.TaskDTOs.CancelTaskRequest;
import br.com.leadflow.dto.TaskDTOs.CreateTaskRequest;
import br.com.leadflow.dto.TaskDTOs.RescheduleTaskRequest;
import br.com.leadflow.dto.TaskDTOs.TaskResponse;
import br.com.leadflow.dto.TaskDTOs.UpdateTaskRequest;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.Task;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.HistoryEventType;
import br.com.leadflow.model.enums.NotificationType;
import br.com.leadflow.model.enums.TaskStatus;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.specification.TaskSpecifications;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
public class TaskService {

    private final TaskDAO taskDAO;
    private final UserDAO userDAO;
    private final LeadService leadService;
    private final AccessService accessService;
    private final HistoryService historyService;
    private final NotificationService notificationService;

    public TaskService(
        TaskDAO taskDAO,
        UserDAO userDAO,
        LeadService leadService,
        AccessService accessService,
        HistoryService historyService,
        NotificationService notificationService
    ) {
        this.taskDAO = taskDAO;
        this.userDAO = userDAO;
        this.leadService = leadService;
        this.accessService = accessService;
        this.historyService = historyService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> list(
        Long branchId,
        Long leadId,
        Long responsibleId,
        TaskStatus status,
        Instant from,
        Instant to,
        Pageable pageable
    ) {
        User actor = accessService.currentUser();

        Specification<Task> spec = Specification
            .where(
                TaskSpecifications.company(
                    actor.getCompany().getId()
                )
            )
            .and(scopeSpecification(actor));

        if (branchId != null) {
            accessService.requireBranch(
                branchId,
                actor
            );
        }

        spec = spec
            .and(TaskSpecifications.branch(branchId))
            .and(TaskSpecifications.lead(leadId))
            .and(TaskSpecifications.responsible(responsibleId))
            .and(TaskSpecifications.status(status))
            .and(TaskSpecifications.from(from))
            .and(TaskSpecifications.to(to));

        Page<TaskResponse> page = taskDAO
            .findAll(spec, pageable)
            .map(this::toResponse);

        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> byLead(Long leadId) {
        User actor = accessService.currentUser();

        leadService.requireLead(
            leadId,
            actor
        );

        Specification<Task> spec = Specification
            .where(
                TaskSpecifications.company(
                    actor.getCompany().getId()
                )
            )
            .and(
                TaskSpecifications.lead(leadId)
            )
            .and(
                scopeSpecification(actor)
            );

        return taskDAO
            .findAll(
                spec,
                Sort.by(
                    Sort.Direction.ASC,
                    "dueAt"
                )
            )
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TaskResponse create(
        CreateTaskRequest request
    ) {
        User actor =
            accessService.currentUser();

        Lead lead =
            leadService.requireLead(
                request.leadId(),
                actor
            );

        User responsible =
            resolveResponsible(
                request.responsibleUserId(),
                lead,
                actor
            );

        if (
            request.dueAt()
                .isBefore(
                    Instant.now()
                        .minusSeconds(60)
                )
        ) {
            throw new BusinessException(
                "INVALID_DUE_DATE",
                "A data da tarefa não pode estar no passado."
            );
        }

        Task task = new Task();

        task.setTitle(
            request.title().trim()
        );

        task.setDescription(
            request.description()
        );

        task.setLead(lead);
        task.setResponsibleUser(responsible);
        task.setDueAt(request.dueAt());
        task.setStatus(TaskStatus.PENDING);

        task = taskDAO.save(task);

        historyService.record(
            lead,
            actor,
            HistoryEventType.TASK_CREATED,
            null,
            task.getTitle(),
            "Tarefa criada para "
                + responsible.getName()
                + "."
        );

        if (
            !responsible.getId()
                .equals(actor.getId())
        ) {
            notificationService.create(
                responsible,
                NotificationType.TASK_DUE_SOON,
                "Nova tarefa atribuída",
                task.getTitle(),
                "TASK",
                task.getId()
            );
        }

        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(
        Long id,
        UpdateTaskRequest request
    ) {
        User actor =
            accessService.currentUser();

        Task task =
            requireTask(
                id,
                actor
            );

        ensureEditable(task);

        task.setTitle(
            request.title().trim()
        );

        task.setDescription(
            request.description()
        );

        task.setDueAt(
            request.dueAt()
        );

        if (
            request.responsibleUserId()
                != null
        ) {
            task.setResponsibleUser(
                resolveResponsible(
                    request.responsibleUserId(),
                    task.getLead(),
                    actor
                )
            );
        }

        if (
            task.getStatus()
                == TaskStatus.OVERDUE
            && task.getDueAt()
                .isAfter(Instant.now())
        ) {
            task.setStatus(
                TaskStatus.PENDING
            );
        }

        return toResponse(task);
    }

    @Transactional
    public TaskResponse complete(
        Long id
    ) {
        User actor =
            accessService.currentUser();

        Task task =
            requireTask(
                id,
                actor
            );

        ensureEditable(task);

        task.setStatus(
            TaskStatus.COMPLETED
        );

        task.setCompletedAt(
            Instant.now()
        );

        return toResponse(task);
    }

    @Transactional
    public TaskResponse cancel(
        Long id,
        CancelTaskRequest request
    ) {
        User actor =
            accessService.currentUser();

        Task task =
            requireTask(
                id,
                actor
            );

        ensureEditable(task);

        task.setStatus(
            TaskStatus.CANCELLED
        );

        task.setCancelReason(
            request.reason()
        );

        return toResponse(task);
    }

    @Transactional
    public TaskResponse reschedule(
        Long id,
        RescheduleTaskRequest request
    ) {
        User actor =
            accessService.currentUser();

        Task task =
            requireTask(
                id,
                actor
            );

        ensureEditable(task);

        if (
            request.dueAt()
                .isBefore(Instant.now())
        ) {
            throw new BusinessException(
                "INVALID_DUE_DATE",
                "Escolha uma data futura para reagendar."
            );
        }

        task.setDueAt(
            request.dueAt()
        );

        task.setStatus(
            TaskStatus.PENDING
        );

        return toResponse(task);
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void updateOverdueTasks() {
        List<Task> overdue =
            taskDAO.findByStatusAndDueAtBefore(
                TaskStatus.PENDING,
                Instant.now()
            );

        for (Task task : overdue) {
            task.setStatus(
                TaskStatus.OVERDUE
            );

            notificationService.create(
                task.getResponsibleUser(),
                NotificationType.TASK_OVERDUE,
                "Tarefa atrasada",
                task.getTitle(),
                "TASK",
                task.getId()
            );
        }
    }

    /*
     * Define quais tarefas cada perfil pode visualizar.
     *
     * SELLER:
     * somente as próprias tarefas.
     *
     * MANAGER:
     * tarefas próprias + tarefas dos vendedores
     * que possuem manager_id apontando para ele.
     *
     * ADMIN:
     * todas as tarefas da empresa.
     */
    private Specification<Task> scopeSpecification(
        User actor
    ) {
        if (
            actor.getRole()
                == UserRole.ADMIN
        ) {
            return Specification.unrestricted();
        }

        if (
            actor.getRole()
                == UserRole.SELLER
        ) {
            return TaskSpecifications.responsible(
                actor.getId()
            );
        }

        if (
            actor.getRole()
                == UserRole.MANAGER
        ) {
            return TaskSpecifications.responsibleIn(
                managedTaskUserIds(actor)
            );
        }

        return (
            root,
            query,
            criteriaBuilder
        ) -> criteriaBuilder.disjunction();
    }

    /*
     * IDs permitidos para um gerente:
     *
     * - o próprio gerente
     * - vendedores gerenciados por ele
     */
    private List<Long> managedTaskUserIds(
        User manager
    ) {
        List<Long> ids =
            new ArrayList<>();

        ids.add(
            manager.getId()
        );

        userDAO
            .findByManagerIdOrderByNameAsc(
                manager.getId()
            )
            .stream()
            .filter(
                user ->
                    user.getRole()
                        == UserRole.SELLER
            )
            .map(User::getId)
            .forEach(ids::add);

        return ids;
    }

    /*
     * Busca a tarefa e, antes de devolvê-la,
     * valida se o usuário atual possui acesso.
     *
     * Essa proteção é usada por:
     *
     * update
     * complete
     * cancel
     * reschedule
     */
    private Task requireTask(
        Long id,
        User actor
    ) {
        Task task =
            taskDAO
                .findById(id)
                .orElseThrow(
                    () ->
                        new ResourceNotFoundException(
                            "Tarefa não encontrada."
                        )
                );

        assertTaskAccess(
            task,
            actor
        );

        return task;
    }

    private void assertTaskAccess(
        Task task,
        User actor
    ) {
        Long taskCompanyId =
            task
                .getLead()
                .getBranch()
                .getCompany()
                .getId();

        if (
            !taskCompanyId.equals(
                actor
                    .getCompany()
                    .getId()
            )
        ) {
            throw new AccessDeniedBusinessException(
                "Tarefa fora do contexto da sua empresa."
            );
        }

        /*
         * ADMIN:
         * qualquer tarefa da própria empresa.
         */
        if (
            actor.getRole()
                == UserRole.ADMIN
        ) {
            return;
        }

        Long responsibleId =
            task
                .getResponsibleUser()
                .getId();

        /*
         * SELLER:
         * somente tarefas próprias.
         */
        if (
            actor.getRole()
                == UserRole.SELLER
            && responsibleId.equals(
                actor.getId()
            )
        ) {
            return;
        }

        /*
         * MANAGER:
         * próprias tarefas ou tarefas da equipe.
         */
        if (
            actor.getRole()
                == UserRole.MANAGER
            && managedTaskUserIds(actor)
                .contains(responsibleId)
        ) {
            return;
        }

        throw new AccessDeniedBusinessException(
            "Você não possui acesso a esta tarefa."
        );
    }

    private void ensureEditable(
        Task task
    ) {
        if (
            task.getStatus()
                == TaskStatus.COMPLETED
            || task.getStatus()
                == TaskStatus.CANCELLED
        ) {
            throw new BusinessException(
                "TASK_CLOSED",
                "Esta tarefa já foi encerrada."
            );
        }
    }

    /*
     * Define quem pode receber uma tarefa.
     */
    private User resolveResponsible(
        Long id,
        Lead lead,
        User actor
    ) {
        /*
         * Vendedor nunca pode atribuir
         * tarefa para outro usuário.
         */
        if (
            actor.getRole()
                == UserRole.SELLER
        ) {
            return actor;
        }

        User target =
            id == null
                ? lead.getResponsibleUser()
                : accessService.requireCompanyUser(
                    id,
                    actor
                );

        if (
            target.getStatus()
                != UserStatus.ACTIVE
        ) {
            throw new BusinessException(
                "USER_INACTIVE",
                "Usuário inativo não pode receber tarefas."
            );
        }

        /*
         * Gerente pode atribuir:
         *
         * - para ele mesmo;
         * - para vendedores diretamente gerenciados por ele.
         */
        if (
            actor.getRole()
                == UserRole.MANAGER
        ) {
            boolean isSelf =
                target
                    .getId()
                    .equals(
                        actor.getId()
                    );

            boolean isManagedSeller =
                target.getRole()
                    == UserRole.SELLER
                && target.getManager()
                    != null
                && target
                    .getManager()
                    .getId()
                    .equals(
                        actor.getId()
                    );

            if (
                !isSelf
                && !isManagedSeller
            ) {
                throw new AccessDeniedBusinessException(
                    "Gerentes podem atribuir tarefas apenas para si ou para vendedores da própria equipe."
                );
            }
        }

        /*
         * Vendedor precisa pertencer à filial
         * do Lead para receber a tarefa.
         */
        if (
            target.getRole()
                == UserRole.SELLER
            && target.getPrimaryBranch()
                != null
            && !target
                .getPrimaryBranch()
                .getId()
                .equals(
                    lead
                        .getBranch()
                        .getId()
                )
        ) {
            throw new BusinessException(
                "BRANCH_MISMATCH",
                "O responsável deve pertencer à filial do Lead."
            );
        }

        return target;
    }

    private TaskResponse toResponse(
        Task task
    ) {
        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),

            task
                .getLead()
                .getId(),

            task
                .getLead()
                .getName(),

            task
                .getResponsibleUser()
                .getId(),

            task
                .getResponsibleUser()
                .getName(),

            task
                .getLead()
                .getBranch()
                .getId(),

            task
                .getLead()
                .getBranch()
                .getName(),

            task.getDueAt(),
            task.getStatus(),
            task.getCompletedAt(),
            task.getCreatedAt()
        );
    }
}