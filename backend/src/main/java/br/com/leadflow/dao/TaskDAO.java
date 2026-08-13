package br.com.leadflow.dao;

import br.com.leadflow.model.Task;
import br.com.leadflow.model.enums.TaskStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TaskDAO extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
    Page<Task> findByLeadBranchCompanyId(Long companyId, Pageable pageable);
    Page<Task> findByResponsibleUserId(Long userId, Pageable pageable);
    Page<Task> findByLeadBranchIdIn(List<Long> branchIds, Pageable pageable);
    List<Task> findByLeadIdOrderByDueAtAsc(Long leadId);
    List<Task> findByStatusAndDueAtBefore(TaskStatus status, Instant before);
    long countByResponsibleUserIdAndStatusIn(Long userId, Collection<TaskStatus> statuses);
    long countByLeadIdAndStatusIn(Long leadId, Collection<TaskStatus> statuses);
}
