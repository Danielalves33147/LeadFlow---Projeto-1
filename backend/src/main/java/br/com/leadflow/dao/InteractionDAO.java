package br.com.leadflow.dao;

import br.com.leadflow.model.Interaction;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InteractionDAO extends JpaRepository<Interaction, Long>, JpaSpecificationExecutor<Interaction> {

    Page<Interaction> findByLeadBranchCompanyId(Long companyId, Pageable pageable);
    Page<Interaction> findByResponsibleUserId(Long userId, Pageable pageable);
    Page<Interaction> findByLeadBranchIdIn(List<Long> branchIds, Pageable pageable);
    List<Interaction> findByLeadIdOrderByCreatedAtDesc(Long leadId);
    List<Interaction> findByLeadBranchIdAndCreatedAtBetweenOrderByCreatedAtAsc(Long branchId, Instant from,
        Instant to);
    long countByLeadBranchCompanyIdAndCreatedAtBetween(Long companyId, Instant from, Instant to);
    long countByLeadBranchIdAndCreatedAtBetween(Long branchId, Instant from, Instant to);
    long countByResponsibleUserIdAndCreatedAtBetween(Long userId, Instant from, Instant to);
    long countByResponsibleUserId(Long userId);
    @Query("select coalesce(sum(i.scoreApplied),0) from Interaction i where i.lead.branch.id = :branchId and i.createdAt between :from and :to")
    Long sumScoreAppliedByBranchBetween(
        @Param("branchId") Long branchId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );
}
