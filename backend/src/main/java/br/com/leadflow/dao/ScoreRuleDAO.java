package br.com.leadflow.dao;

import br.com.leadflow.model.ScoreRule;
import br.com.leadflow.model.enums.InteractionType;
import br.com.leadflow.model.enums.ScoreRuleStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreRuleDAO extends JpaRepository<ScoreRule, Long> {

    List<ScoreRule> findByCompanyIdOrderByInteractionTypeAsc(Long companyId);
    Optional<ScoreRule> findFirstByCompanyIdAndInteractionTypeAndStatus(
        Long companyId,
        InteractionType interactionType,
        ScoreRuleStatus status
    );
    boolean existsByCompanyIdAndInteractionTypeAndStatusAndIdNot(
        Long companyId,
        InteractionType interactionType,
        ScoreRuleStatus status,
        Long id
    );
    boolean existsByCompanyIdAndInteractionTypeAndStatus(
        Long companyId,
        InteractionType interactionType,
        ScoreRuleStatus status
    );
}
