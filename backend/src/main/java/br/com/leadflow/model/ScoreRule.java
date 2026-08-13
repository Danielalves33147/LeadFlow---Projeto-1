package br.com.leadflow.model;

import br.com.leadflow.model.enums.InteractionType;
import br.com.leadflow.model.enums.ScoreOperation;
import br.com.leadflow.model.enums.ScoreRuleStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "score_rules")
public class ScoreRule extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 30)
    private InteractionType interactionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScoreOperation operation;

    @Column(nullable = false)
    private int value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScoreRuleStatus status = ScoreRuleStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public InteractionType getInteractionType() { return interactionType; }
    public void setInteractionType(InteractionType interactionType) { this.interactionType = interactionType; }
    public ScoreOperation getOperation() { return operation; }
    public void setOperation(ScoreOperation operation) { this.operation = operation; }
    public int getValue() { return value; }
    public void setValue(int value) { this.value = value; }
    public ScoreRuleStatus getStatus() { return status; }
    public void setStatus(ScoreRuleStatus status) { this.status = status; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}
