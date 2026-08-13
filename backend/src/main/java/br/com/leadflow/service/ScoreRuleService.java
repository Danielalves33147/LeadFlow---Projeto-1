package br.com.leadflow.service;

import br.com.leadflow.dao.ScoreRuleDAO;
import br.com.leadflow.dto.ScoreRuleDTOs.ScoreRuleRequest;
import br.com.leadflow.dto.ScoreRuleDTOs.ScoreRuleResponse;
import br.com.leadflow.dto.ScoreRuleDTOs.ScoreRuleStatusRequest;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.exception.BusinessException;
import br.com.leadflow.exception.ResourceNotFoundException;
import br.com.leadflow.model.ScoreRule;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.ScoreRuleStatus;
import br.com.leadflow.model.enums.UserRole;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScoreRuleService {
    private final ScoreRuleDAO scoreRuleDAO; private final AccessService accessService;
    public ScoreRuleService(ScoreRuleDAO scoreRuleDAO,AccessService accessService){this.scoreRuleDAO=scoreRuleDAO;this.accessService=accessService;}

    @Transactional(readOnly=true)
    public List<ScoreRuleResponse> list(){User actor=admin();return scoreRuleDAO.findByCompanyIdOrderByInteractionTypeAsc(actor.getCompany().getId()).stream().map(this::toResponse).toList();}

    @Transactional
    public ScoreRuleResponse create(ScoreRuleRequest request){User actor=admin();assertNoConflict(actor.getCompany().getId(),request,null);ScoreRule r=new ScoreRule();r.setName(request.name().trim());r.setInteractionType(request.interactionType());r.setOperation(request.operation());r.setValue(request.value());r.setStatus(request.status());r.setCompany(actor.getCompany());return toResponse(scoreRuleDAO.save(r));}

    @Transactional
    public ScoreRuleResponse update(Long id,ScoreRuleRequest request){User actor=admin();ScoreRule r=require(id,actor);assertNoConflict(actor.getCompany().getId(),request,id);r.setName(request.name().trim());r.setInteractionType(request.interactionType());r.setOperation(request.operation());r.setValue(request.value());r.setStatus(request.status());return toResponse(r);}

    @Transactional
    public ScoreRuleResponse changeStatus(Long id,ScoreRuleStatusRequest request){User actor=admin();ScoreRule r=require(id,actor);if(request.status()==ScoreRuleStatus.ACTIVE){ScoreRuleRequest req=new ScoreRuleRequest(r.getName(),r.getInteractionType(),r.getOperation(),r.getValue(),request.status());assertNoConflict(actor.getCompany().getId(),req,id);}r.setStatus(request.status());return toResponse(r);}

    private void assertNoConflict(Long companyId,ScoreRuleRequest r,Long id){if(r.status()!=ScoreRuleStatus.ACTIVE)return;boolean exists=id==null?scoreRuleDAO.existsByCompanyIdAndInteractionTypeAndStatus(companyId,r.interactionType(),ScoreRuleStatus.ACTIVE):scoreRuleDAO.existsByCompanyIdAndInteractionTypeAndStatusAndIdNot(companyId,r.interactionType(),ScoreRuleStatus.ACTIVE,id);if(exists)throw new BusinessException("SCORE_RULE_CONFLICT","Já existe uma regra ativa para este tipo de interação.");}
    private ScoreRule require(Long id,User actor){ScoreRule r=scoreRuleDAO.findById(id).orElseThrow(()->new ResourceNotFoundException("Regra não encontrada."));if(!r.getCompany().getId().equals(actor.getCompany().getId()))throw new AccessDeniedBusinessException("Regra fora da empresa atual.");return r;}
    private User admin(){User u=accessService.currentUser();if(u.getRole()!=UserRole.ADMIN)throw new AccessDeniedBusinessException("Somente Administradores acessam regras de pontuação.");return u;}
    private ScoreRuleResponse toResponse(ScoreRule r){return new ScoreRuleResponse(r.getId(),r.getName(),r.getInteractionType(),r.getOperation(),r.getValue(),r.getStatus(),r.getUpdatedAt());}
}
