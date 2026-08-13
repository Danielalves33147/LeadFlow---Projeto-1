package br.com.leadflow.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "companies")
public class Company extends BaseEntity {
    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "default_period_days", nullable = false)
    private int defaultPeriodDays = 30;

    @Column(name = "compact_tables", nullable = false)
    private boolean compactTables = true;

    @Column(nullable = false, length = 80)
    private String timezone = "America/Bahia";

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getDefaultPeriodDays() { return defaultPeriodDays; }
    public void setDefaultPeriodDays(int defaultPeriodDays) { this.defaultPeriodDays = defaultPeriodDays; }
    public boolean isCompactTables() { return compactTables; }
    public void setCompactTables(boolean compactTables) { this.compactTables = compactTables; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
}
