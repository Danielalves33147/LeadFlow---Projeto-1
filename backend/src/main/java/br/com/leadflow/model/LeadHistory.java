package br.com.leadflow.model;

import br.com.leadflow.model.enums.HistoryEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lead_history")
public class LeadHistory extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private HistoryEventType eventType;

    @Column(name = "previous_value", length = 250)
    private String previousValue;

    @Column(name = "new_value", length = 250)
    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "performed_by", nullable = false)
    private User performedBy;

    @Column(columnDefinition = "text")
    private String description;

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }
    public HistoryEventType getEventType() { return eventType; }
    public void setEventType(HistoryEventType eventType) { this.eventType = eventType; }
    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public User getPerformedBy() { return performedBy; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
