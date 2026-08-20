package br.com.leadflow.dao;

import br.com.leadflow.model.Lead;
import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeadDAO extends JpaRepository<Lead, Long>, JpaSpecificationExecutor<Lead> {

    interface DashboardLeadPoint {
        Instant getCreatedAt();
        LeadStage getStage();
    }

    interface DashboardRecentLead {
        Long getId();
        String getName();
        String getPhone();
        String getEmail();
        LeadOrigin getOrigin();
        LeadStage getStage();
        Integer getScore();
        Long getBranchId();
        String getBranchName();
        Long getResponsibleUserId();
        String getResponsibleUserName();
        Instant getLastInteractionAt();
        Instant getCreatedAt();
    }

    interface BranchLeadMetrics {
        Long getBranchId();
        Long getNewLeads();
        Long getActiveLeads();
        Long getConversions();
    }

    Optional<Lead> findByIdAndBranchCompanyId(Long id, Long companyId);
    long countByBranchCompanyIdAndStageNot(Long companyId, LeadStage stage);
    long countByBranchCompanyIdAndCreatedAtBetween(Long companyId, Instant from, Instant to);
    long countByBranchIdAndStageNot(Long branchId, LeadStage stage);
    long countByBranchIdAndCreatedAtBetween(Long branchId, Instant from, Instant to);
    long countByBranchIdAndStageNotAndCreatedAtBetween(Long branchId, LeadStage stage, Instant from, Instant to);
    long countByResponsibleUserIdAndStageNot(Long userId, LeadStage stage);
    long countByResponsibleUserIdAndCreatedAtBetween(Long userId, Instant from, Instant to);
    long countByResponsibleUserIdAndStageAndCreatedAtBetween(Long userId, LeadStage stage, Instant from, Instant to);
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

    @Query("""
        select
            l.createdAt as createdAt,
            l.stage as stage
        from Lead l
        where l.branch.id in :branchIds
          and l.createdAt between :from and :to
        order by l.createdAt asc
        """)
    List<DashboardLeadPoint> findDashboardLeadPoints(
        @Param("branchIds") List<Long> branchIds,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query("""
        select
            l.id as id,
            l.name as name,
            l.phone as phone,
            l.email as email,
            l.origin as origin,
            l.stage as stage,
            l.score as score,
            l.branch.id as branchId,
            l.branch.name as branchName,
            l.responsibleUser.id as responsibleUserId,
            l.responsibleUser.name as responsibleUserName,
            l.lastInteractionAt as lastInteractionAt,
            l.createdAt as createdAt
        from Lead l
        where l.branch.id in :branchIds
          and l.createdAt between :from and :to
        order by l.createdAt desc
        """)
    List<DashboardRecentLead> findDashboardRecentLeads(
        @Param("branchIds") List<Long> branchIds,
        @Param("from") Instant from,
        @Param("to") Instant to,
        Pageable pageable
    );

    @Query("""
        select
            l.branch.id as branchId,
            count(l) as newLeads,
            sum(case when l.stage <> :lost then 1 else 0 end) as activeLeads,
            sum(case when l.stage = :customer then 1 else 0 end) as conversions
        from Lead l
        where l.branch.id in :branchIds
          and l.createdAt between :from and :to
        group by l.branch.id
        """)
    List<BranchLeadMetrics> aggregateBranchLeadMetrics(
        @Param("branchIds") List<Long> branchIds,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("lost") LeadStage lost,
        @Param("customer") LeadStage customer
    );
}
