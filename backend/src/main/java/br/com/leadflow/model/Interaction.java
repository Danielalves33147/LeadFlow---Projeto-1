package br.com.leadflow.model;

import br.com.leadflow.model.enums.InteractionChannel;
import br.com.leadflow.model.enums.InteractionType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "interactions")
public class Interaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsible_user_id", nullable = false)
    private User responsibleUser;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InteractionChannel channel;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InteractionType type;
    @Column(columnDefinition = "text")
    private String notes;
    @Column(name = "score_applied", nullable = false)
    private int scoreApplied;
    @Column(name = "score_rule_name", length = 120)
    private String scoreRuleName;

    public Lead getLead() {
        return lead;
    }

    public void setLead(Lead lead) {
        this.lead = lead;
    }

    public User getResponsibleUser() {
        return responsibleUser;
    }

    public void setResponsibleUser(User responsibleUser) {
        this.responsibleUser = responsibleUser;
    }

    public InteractionChannel getChannel() {
        return channel;
    }

    public void setChannel(InteractionChannel channel) {
        this.channel = channel;
    }

    public InteractionType getType() {
        return type;
    }

    public void setType(InteractionType type) {
        this.type = type;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public int getScoreApplied() {
        return scoreApplied;
    }

    public void setScoreApplied(int scoreApplied) {
        this.scoreApplied = scoreApplied;
    }

    public String getScoreRuleName() {
        return scoreRuleName;
    }

    public void setScoreRuleName(String scoreRuleName) {
        this.scoreRuleName = scoreRuleName;
    }
}
