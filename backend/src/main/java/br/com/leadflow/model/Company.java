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

    @Column(name = "company_email", length = 180)
    private String companyEmail;

    @Column(name = "company_phone", length = 20)
    private String companyPhone;

    @Column(length = 255)
    private String website;

    @Column(name = "postal_code", length = 8)
    private String postalCode;

    @Column(length = 180)
    private String street;

    @Column(name = "address_number", length = 30)
    private String number;

    @Column(length = 120)
    private String complement;

    @Column(length = 120)
    private String neighborhood;

    @Column(length = 120)
    private String city;

    @Column(length = 2)
    private String state;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "default_period_days", nullable = false)
    private int defaultPeriodDays = 30;

    @Column(name = "compact_tables", nullable = false)
    private boolean compactTables = true;

    @Column(nullable = false, length = 80)
    private String timezone = "America/Bahia";

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getCompanyEmail() {
        return companyEmail;
    }

    public void setCompanyEmail(String companyEmail) {
        this.companyEmail = companyEmail;
    }

    public String getCompanyPhone() {
        return companyPhone;
    }

    public void setCompanyPhone(String companyPhone) {
        this.companyPhone = companyPhone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getComplement() {
        return complement;
    }

    public void setComplement(String complement) {
        this.complement = complement;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public void setNeighborhood(String neighborhood) {
        this.neighborhood = neighborhood;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getDefaultPeriodDays() {
        return defaultPeriodDays;
    }

    public void setDefaultPeriodDays(int defaultPeriodDays) {
        this.defaultPeriodDays = defaultPeriodDays;
    }

    public boolean isCompactTables() {
        return compactTables;
    }

    public void setCompactTables(boolean compactTables) {
        this.compactTables = compactTables;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
}
