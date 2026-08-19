package br.com.leadflow.dao;

import br.com.leadflow.model.Lead;
import br.com.leadflow.model.enums.LeadStage;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeadDAO extends JpaRepository<Lead, Long>, JpaSpecificationExecutor<Lead> {

    Optional<Lead> findByIdAndBranchCompanyId(Long id, Long companyId);
    long countByBranchCompanyIdAndStageNot(Long companyId, LeadStage stage);
    long countByBranchCompanyIdAndCreatedAtBetween(Long companyId, Instant from, Instant to);
    long countByBranchIdAndStageNot(Long branchId, LeadStage stage);
    long countByBranchIdAndCreatedAtBetween(Long branchId, Instant from, Instant to);
    long countByResponsibleUserIdAndStageNot(Long userId, LeadStage stage);
    long countByResponsibleUserIdAndCreatedAtBetween(Long userId, Instant from, Instant to);
    long countByResponsibleUserIdAndStage(Long userId, LeadStage stage);
    long countByBranchIdAndStage(Long branchId, LeadStage stage);
    List<Lead> findTop8ByBranchCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<Lead> findTop8ByResponsibleUserIdOrderByCreatedAtDesc(Long responsibleUserId);
    List<Lead> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    long countByResponsibleUserIdAndStageNotIn(Long responsibleUserId, List<LeadStage> stages);
    long countByResponsibleUserId(Long responsibleUserId);
    long countByBranchId(Long branchId);
    @Query("select coalesce(sum(l.score),0) from Lead l where l.branch.company.id = :companyId")
    Long sumScoreByCompany(@Param("companyId") Long companyId);
    @Query("select coalesce(sum(l.score),0) from Lead l where l.branch.id = :branchId")
    Long sumScoreByBranch(@Param("branchId") Long branchId);
    @Query("select coalesce(sum(l.score),0) from Lead l where l.responsibleUser.id = :userId")
    Long sumScoreByUser(@Param("userId") Long userId);
}
