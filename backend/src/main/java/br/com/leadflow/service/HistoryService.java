package br.com.leadflow.service;

import br.com.leadflow.dao.LeadHistoryDAO;
import br.com.leadflow.model.Lead;
import br.com.leadflow.model.LeadHistory;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.HistoryEventType;
import org.springframework.stereotype.Service;

@Service
public class HistoryService {
    private final LeadHistoryDAO historyDAO;
    public HistoryService(LeadHistoryDAO historyDAO) { this.historyDAO = historyDAO; }

    public void record(Lead lead, User actor, HistoryEventType type, String previous, String next, String description) {
        LeadHistory history = new LeadHistory();
        history.setLead(lead);
        history.setPerformedBy(actor);
        history.setEventType(type);
        history.setPreviousValue(previous);
        history.setNewValue(next);
        history.setDescription(description);
        historyDAO.save(history);
    }
}
