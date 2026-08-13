package br.com.leadflow.dao;

import br.com.leadflow.model.LeadHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadHistoryDAO extends JpaRepository<LeadHistory, Long> {
    List<LeadHistory> findByLeadIdOrderByCreatedAtDesc(Long leadId);
}
