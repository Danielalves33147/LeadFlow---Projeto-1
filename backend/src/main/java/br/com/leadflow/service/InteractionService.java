package br.com.leadflow.service;

import br.com.leadflow.dao.InteractionDAO;
import br.com.leadflow.dao.LeadDAO;
import br.com.leadflow.dao.ScoreRuleDAO;
import br.com.leadflow.dto.CommonDTOs.PageResponse;
import br.com.leadflow.dto.InteractionDTOs.CreateInteractionRequest;
import br.com.leadflow.dto.InteractionDTOs.InteractionResponse;
import br.com.leadflow.dto.InteractionDTOs.ScorePreviewResponse;
import br.com.leadflow.model.Interaction;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.ScoreRule;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.HistoryEventType;
import br.com.leadflow.model.enums.InteractionChannel;
import br.com.leadflow.model.enums.InteractionType;
import br.com.leadflow.model.enums.NotificationType;
import br.com.leadflow.model.enums.ScoreOperation;
import br.com.leadflow.model.enums.ScoreRuleStatus;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.specification.InteractionSpecifications;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionService {
    private final InteractionDAO interactionDAO;
    private final ScoreRuleDAO scoreRuleDAO;
    private final LeadDAO leadDAO;
    private final LeadService leadService;
    private final AccessService accessService;
    private final HistoryService historyService;
    private final NotificationService notificationService;

    public InteractionService(InteractionDAO interactionDAO, ScoreRuleDAO scoreRuleDAO, LeadDAO leadDAO, LeadService leadService,
                              AccessService accessService, HistoryService historyService, NotificationService notificationService) {
        this.interactionDAO=interactionDAO; this.scoreRuleDAO=scoreRuleDAO; this.leadDAO=leadDAO; this.leadService=leadService;
        this.accessService=accessService; this.historyService=historyService; this.notificationService=notificationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<InteractionResponse> list(Long branchId, Long leadId, Long responsibleId, InteractionChannel channel,
                                                   InteractionType type, Instant from, Instant to, Pageable pageable) {
        User actor=accessService.currentUser();
        Specification<Interaction> spec=Specification.where(InteractionSpecifications.company(actor.getCompany().getId()));
        if(actor.getRole()==UserRole.SELLER) spec=spec.and(InteractionSpecifications.responsible(actor.getId()));
        else if(actor.getRole()==UserRole.MANAGER) spec=spec.and(InteractionSpecifications.branches(accessService.authorizedBranchIds(actor)));
        if(branchId!=null) accessService.requireBranch(branchId,actor);
        spec=spec.and(InteractionSpecifications.branch(branchId)).and(InteractionSpecifications.lead(leadId))
            .and(InteractionSpecifications.responsible(responsibleId)).and(InteractionSpecifications.channel(channel))
            .and(InteractionSpecifications.type(type)).and(InteractionSpecifications.from(from)).and(InteractionSpecifications.to(to));
        Page<InteractionResponse> page=interactionDAO.findAll(spec,pageable).map(this::toResponse);
        return new PageResponse<>(page.getContent(),page.getNumber(),page.getSize(),page.getTotalElements(),page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<InteractionResponse> byLead(Long leadId) {
        User actor=accessService.currentUser(); leadService.requireLead(leadId,actor);
        return interactionDAO.findByLeadIdOrderByCreatedAtDesc(leadId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ScorePreviewResponse preview(Long leadId, InteractionType type) {
        User actor=accessService.currentUser(); Lead lead=leadService.requireLead(leadId,actor);
        ScoreRule rule=scoreRuleDAO.findFirstByCompanyIdAndInteractionTypeAndStatus(actor.getCompany().getId(),type,ScoreRuleStatus.ACTIVE).orElse(null);
        int projected=lead.getScore(); Integer value=null; ScoreOperation op=null; String name=null;
        if(rule!=null){ value=rule.getValue(); op=rule.getOperation(); name=rule.getName(); projected=apply(lead.getScore(),rule); }
        return new ScorePreviewResponse(leadId,lead.getScore(),type,op,value,name,projected,projected-lead.getScore());
    }

    @Transactional
    public InteractionResponse create(CreateInteractionRequest request) {
        User actor=accessService.currentUser(); Lead lead=leadService.requireLead(request.leadId(),actor);
        int before=lead.getScore();
        ScoreRule rule=scoreRuleDAO.findFirstByCompanyIdAndInteractionTypeAndStatus(actor.getCompany().getId(),request.type(),ScoreRuleStatus.ACTIVE).orElse(null);
        int after=rule==null?before:apply(before,rule); int delta=after-before;
        Interaction i=new Interaction(); i.setLead(lead); i.setResponsibleUser(actor); i.setChannel(request.channel()); i.setType(request.type());
        i.setNotes(request.notes()); i.setScoreApplied(delta); i.setScoreRuleName(rule==null?null:rule.getName()); i=interactionDAO.save(i);
        lead.setScore(after); lead.setLastInteractionAt(Instant.now()); leadDAO.save(lead);
        historyService.record(lead,actor,HistoryEventType.INTERACTION_CREATED,null,request.type().name(),"Interação registrada via "+request.channel().name()+".");
        if(delta!=0) historyService.record(lead,actor,HistoryEventType.SCORE_CHANGED,String.valueOf(before),String.valueOf(after),"Pontuação atualizada pela regra "+rule.getName()+".");
        if(!lead.getResponsibleUser().getId().equals(actor.getId())) notificationService.create(lead.getResponsibleUser(), NotificationType.INTERACTION_CREATED,"Nova interação", "Uma interação foi registrada em "+lead.getName()+".","LEAD",lead.getId());
        return toResponse(i);
    }

    private int apply(int current, ScoreRule rule){
        return switch(rule.getOperation()){
            case ADD -> current+rule.getValue();
            case SUBTRACT -> current-rule.getValue();
            case SET -> rule.getValue();
        };
    }

    private InteractionResponse toResponse(Interaction i){
        Lead l=i.getLead();
        return new InteractionResponse(i.getId(),l.getId(),l.getName(),l.getBranch().getId(),l.getBranch().getName(),i.getResponsibleUser().getId(),i.getResponsibleUser().getName(),i.getChannel(),i.getType(),i.getNotes(),i.getScoreApplied(),i.getScoreRuleName(),l.getStage(),i.getCreatedAt());
    }
}
