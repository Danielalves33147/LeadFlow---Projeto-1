package br.com.leadflow.service;

import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dao.LeadHistoryDAO;
import br.com.leadflow.dao.TaskDAO;
import br.com.leadflow.dao.UserDAO;
import br.com.leadflow.dto.CommonDTOs.PageResponse;
import br.com.leadflow.dto.LeadDTOs.ChangeStageRequest;
import br.com.leadflow.dto.LeadDTOs.CreateLeadRequest;
import br.com.leadflow.dto.LeadDTOs.HistoryResponse;
import br.com.leadflow.dto.LeadDTOs.LeadResponse;
import br.com.leadflow.dto.LeadDTOs.LeadSummary;
import br.com.leadflow.dto.LeadDTOs.ReassignLeadRequest;
import br.com.leadflow.dto.LeadDTOs.UpdateLeadRequest;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.Branch;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.HistoryEventType;
import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.model.enums.NotificationType;
import br.com.leadflow.model.enums.TaskStatus;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.specification.LeadSpecifications;
import br.com.leadflow.utils.TextUtils;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadService {

    private final LeadDAO leadDAO;
    private final LeadHistoryDAO historyDAO;
    private final TaskDAO taskDAO;
    private final UserDAO userDAO;
    private final AccessService accessService;
    private final HistoryService historyService;
    private final NotificationService notificationService;

    public LeadService(
        LeadDAO leadDAO,
        LeadHistoryDAO historyDAO,
        TaskDAO taskDAO,
        UserDAO userDAO,
        AccessService accessService,
        HistoryService historyService,
        NotificationService notificationService
    ) {
        this.leadDAO = leadDAO;
        this.historyDAO = historyDAO;
        this.taskDAO = taskDAO;
        this.userDAO = userDAO;
        this.accessService = accessService;
        this.historyService = historyService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<LeadSummary> list(
        String search,
        Long branchId,
        LeadStage stage,
        Long responsibleId,
        LeadOrigin origin,
        Integer minScore,
        Integer maxScore,
        Instant createdFrom,
        Instant createdTo,
        Pageable pageable
    ) {
        User actor = accessService.currentUser();
        Specification<Lead> spec = Specification.where(LeadSpecifications.company(actor.getCompany()
            .getId()));
        if (actor.getRole() == UserRole.SELLER) spec = spec.and(LeadSpecifications.responsible(actor.getId()));
        else if (actor.getRole() == UserRole.MANAGER) spec = spec.and(LeadSpecifications.branchIds(accessService.authorizedBranchIds(actor)));
        if (branchId != null) {
            accessService.requireBranch(branchId, actor);
            spec = spec.and(LeadSpecifications.branch(branchId));
        }
        if (responsibleId != null) spec = spec.and(LeadSpecifications.responsible(responsibleId));
        spec = spec
            .and(LeadSpecifications.search(search))
            .and(LeadSpecifications.stage(stage))
            .and(LeadSpecifications.origin(origin))
            .and(LeadSpecifications.scoreMin(minScore))
            .and(LeadSpecifications.scoreMax(maxScore))
            .and(LeadSpecifications.createdFrom(createdFrom))
            .and(LeadSpecifications.createdTo(createdTo));
        Page<LeadSummary> page = leadDAO.findAll(spec, pageable).map(this::toSummary);

            return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
            page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public LeadResponse get(Long id) {
        return toResponse(requireLead(id, accessService.currentUser()));
    }

    @Transactional
    public LeadResponse create(CreateLeadRequest request) {
        User actor = accessService.currentUser();
        Branch branch = accessService.requireBranch(request.branchId(), actor);
        User responsible = resolveResponsible(request.responsibleUserId(), branch, actor);
        Lead lead = new Lead();
        lead.setName(request.name().trim());
        lead.setPhone(TextUtils.digits(request.phone()));
        lead.setEmail(TextUtils.trimToNull(request.email()) == null ? null : TextUtils.normalizedEmail(request.email()));
        lead.setOrigin(request.origin());
        lead.setCep(TextUtils.digits(request.cep()));
        lead.setBranch(branch);
        lead.setResponsibleUser(responsible);
        lead.setStage(LeadStage.NEW);
        lead.setScore(0);
        lead = leadDAO.save(lead);
        historyService.record(lead, actor, HistoryEventType.CREATED, null, lead.getName(), "Lead criado.");
        if (!responsible.getId()
            .equals(actor.getId())) notificationService
            .create(responsible, NotificationType
            .LEAD_ASSIGNED, "Novo Lead atribuído", lead
            .getName() + " foi atribuído a você.", "LEAD", lead
            .getId());
        return toResponse(lead);
    }

    @Transactional
    public LeadResponse update(Long id, UpdateLeadRequest request) {
        User actor = accessService.currentUser();
        Lead lead = requireLead(id, actor);
        lead.setName(request.name().trim());
        lead.setPhone(TextUtils.digits(request.phone()));
        lead.setEmail(TextUtils.trimToNull(request.email()) == null ? null : TextUtils.normalizedEmail(request.email()));
        lead.setOrigin(request.origin());
        lead.setCep(TextUtils.digits(request.cep()));
        historyService.record(lead, actor, HistoryEventType.UPDATED, null, null, "Dados do Lead atualizados.");
        return toResponse(lead);
    }

    @Transactional
    public LeadResponse changeStage(Long id, ChangeStageRequest request) {
        User actor = accessService.currentUser();
        Lead lead = requireLead(id, actor);
        LeadStage previous = lead.getStage();
        if (previous == request.stage()) return toResponse(lead);
        if (request.stage() == LeadStage.LOST && taskDAO.countByLeadIdAndStatusIn(id, List.of(TaskStatus.PENDING,
                TaskStatus.OVERDUE)) > 0 && (request.reason() == null || request.reason()
            .isBlank())) {

                    throw new BusinessException("LOST_REASON_REQUIRED", "Informe o motivo antes de mover um Lead com tarefas pendentes para Perdido.");
            }
        lead
            .setStage(request
            .stage());
        String description = request
            .stage() == LeadStage
            .LOST && request
            .reason() != null ? "Etapa alterada. Motivo: " + request
            .reason()
            .trim() : "Etapa alterada.";
        historyService
            .record(lead, actor, HistoryEventType.STAGE_CHANGED, previous.name(), request.stage()
            .name(), description);
        if (!lead.getResponsibleUser()
            .getId()
            .equals(actor.getId())) notificationService
            .create(lead
            .getResponsibleUser(), NotificationType
            .STAGE_CHANGED, "Etapa do Lead alterada", lead
            .getName() + " agora está em " + request
            .stage()
            .name() + ".", "LEAD", lead
            .getId());
        return toResponse(lead);
    }

    @Transactional
    public LeadResponse reassign(Long id, ReassignLeadRequest request) {
        User actor = accessService.currentUser();
        if (actor.getRole() == UserRole.SELLER)
            throw new AccessDeniedBusinessException("Vendedores não podem reatribuir Leads.");
        Lead lead = requireLead(id, actor);
        User target = accessService.requireCompanyUser(request.responsibleUserId(), actor);
        if (target.getRole() != UserRole.SELLER || target.getStatus() != UserStatus.ACTIVE)
            throw new BusinessException("INVALID_RESPONSIBLE", "O novo responsável deve ser um vendedor ativo.");
        if (target.getPrimaryBranch() == null || !target.getPrimaryBranch()
            .getId()
            .equals(lead.getBranch()
            .getId()))
            throw new BusinessException("BRANCH_MISMATCH", "O responsável deve pertencer à mesma filial do Lead.");
        User previous = lead.getResponsibleUser();
        if (previous.getId()
            .equals(target.getId())) return toResponse(lead);
        lead.setResponsibleUser(target);
        historyService
            .record(lead, actor, HistoryEventType.RESPONSIBLE_CHANGED, previous.getName(), target.getName(),
            "Responsável reatribuído.");
        notificationService
            .create(target, NotificationType.LEAD_ASSIGNED, "Lead reatribuído", lead.getName() + " foi reatribuído a você.",
            "LEAD", lead.getId());
        return toResponse(lead);
    }

    @Transactional(readOnly = true)
    public List<HistoryResponse> history(Long id) {
        User actor = accessService.currentUser();
        requireLead(id, actor);

            return historyDAO
            .findByLeadIdOrderByCreatedAtDesc(id)
            .stream()
            .map(h -> new HistoryResponse(h.getId(), h.getEventType(), h.getPreviousValue(), h.getNewValue(),
                h.getPerformedBy()
            .getId(), h.getPerformedBy()
            .getName(), h.getDescription(), h.getCreatedAt()))
            .toList();
    }

    @Transactional(readOnly = true)
    public String exportCsv(
        String search,
        Long branchId,
        LeadStage stage,
        Long responsibleId,
        LeadOrigin origin,
        Integer minScore,
        Integer maxScore,
        Instant createdFrom,
        Instant createdTo
    ) {
        PageResponse<LeadSummary> results = list(search, branchId, stage, responsibleId, origin, minScore,
            maxScore, createdFrom, createdTo, Pageable.ofSize(10000));
        StringBuilder csv = new StringBuilder("id,nome,email,telefone,filial,responsavel,origem,etapa,pontuacao,criado_em\n");
        for (LeadSummary l : results.content()) {
            csv.append(l.id())
                .append(',')
                .append(quote(l.name()))
                .append(',')
                .append(quote(l.email()))
                .append(',')
                .append(quote(l.phone()))
                .append(',')
                .append(quote(l.branchName()))
                .append(',')
                .append(quote(l.responsibleUserName()))
                .append(',')
                .append(l.origin())
                .append(',')
                .append(l.stage())
                .append(',')
                .append(l.score())
                .append(',')
                .append(l.createdAt())
                .append('\n');
        }
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public Lead requireLead(Long id, User actor) {
        Lead lead = leadDAO
            .findByIdAndBranchCompanyId(id, actor.getCompany()
            .getId())
            .orElseThrow(() -> new ResourceNotFoundException("Lead não encontrado."));
        accessService.assertLeadAccess(lead, actor);
        return lead;
    }

    public LeadSummary toSummary(Lead lead) {
        long overdue = taskDAO.countByLeadIdAndStatusIn(lead.getId(), List.of(TaskStatus.OVERDUE));

            return new LeadSummary(lead.getId(), lead.getName(), lead.getPhone(), lead.getEmail(), lead.getOrigin(),
            lead.getStage(), lead.getScore(), lead.getBranch()
            .getId(), lead
            .getBranch()
            .getName(), lead
            .getResponsibleUser()
            .getId(), lead
            .getResponsibleUser()
            .getName(), lead
            .getLastInteractionAt(), lead
            .getCreatedAt(), overdue);
    }

    public LeadResponse toResponse(Lead lead) {
        long pending = taskDAO.countByLeadIdAndStatusIn(lead.getId(), List.of(TaskStatus.PENDING, TaskStatus.OVERDUE));
        long overdue = taskDAO.countByLeadIdAndStatusIn(lead.getId(), List.of(TaskStatus.OVERDUE));

            return new LeadResponse(lead.getId(), lead.getName(), lead.getPhone(), lead.getEmail(), lead.getOrigin(),
            lead.getCep(), lead.getStage(), lead.getScore(), lead.getBranch()
            .getId(), lead
            .getBranch()
            .getName(), lead
            .getResponsibleUser()
            .getId(), lead
            .getResponsibleUser()
            .getName(), lead
            .getLastInteractionAt(), lead
            .getCreatedAt(), lead
            .getUpdatedAt(), pending, overdue);
    }

    private User resolveResponsible(Long requested, Branch branch, User actor) {
        if (actor.getRole() == UserRole.SELLER) return actor;
        User user;
        if (requested != null) {
            user = accessService.requireCompanyUser(requested, actor);
        } else {
            user = userDAO
                .findByPrimaryBranchIdAndStatusOrderByNameAsc(branch.getId(), UserStatus.ACTIVE)
                .stream()
                .filter(candidate -> candidate.getRole() == UserRole.SELLER)
                .findFirst()
                .orElseThrow(() -> new BusinessException("RESPONSIBLE_REQUIRED", "A filial não possui vendedor ativo para receber o Lead."));
        }
        if (user.getRole() != UserRole.SELLER || user.getStatus() != UserStatus.ACTIVE)
            throw new BusinessException("INVALID_RESPONSIBLE", "Selecione um vendedor ativo como responsável.");
        if (user.getPrimaryBranch() == null || !user.getPrimaryBranch()
            .getId()
            .equals(branch.getId()))
            throw new BusinessException("BRANCH_MISMATCH", "O responsável deve pertencer à filial selecionada.");
        return user;
    }

    private String quote(String value) {
        return value == null ? "" : '"' + value.replace("\"", "\"\"") + '"';
    }
}
