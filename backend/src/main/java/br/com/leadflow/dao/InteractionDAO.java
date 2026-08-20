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

    interface DashboardInteractionPoint {
        Instant getCreatedAt();
        Integer getScoreApplied();
    }

    interface BranchInteractionMetrics {
        Long getBranchId();
        Long getInteractions();
        Long getPoints();
        Long getPreviousPoints();
    }

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

    @Query("select coalesce(sum(i.scoreApplied),0) from Interaction i where i.responsibleUser.id = :userId and i.createdAt between :from and :to")
    Long sumScoreAppliedByResponsibleUserBetween(
        @Param("userId") Long userId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query("""
        select
            i.createdAt as createdAt,
            i.scoreApplied as scoreApplied
        from Interaction i
        where i.lead.branch.id in :branchIds
          and i.createdAt between :from and :to
        order by i.createdAt asc
        """)
    List<DashboardInteractionPoint> findDashboardInteractionPoints(
        @Param("branchIds") List<Long> branchIds,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query("""
        select
            i.lead.branch.id as branchId,
            sum(case when i.createdAt between :from and :to then 1 else 0 end) as interactions,
            sum(case when i.createdAt between :from and :to then i.scoreApplied else 0 end) as points,
            sum(case when i.createdAt between :previousFrom and :from then i.scoreApplied else 0 end) as previousPoints
        from Interaction i
        where i.lead.branch.id in :branchIds
          and i.createdAt between :previousFrom and :to
        group by i.lead.branch.id
        """)
    List<BranchInteractionMetrics> aggregateBranchInteractionMetrics(
        @Param("branchIds") List<Long> branchIds,
        @Param("previousFrom") Instant previousFrom,
        @Param("from") Instant from,
        @Param("to") Instant to
    );
}
