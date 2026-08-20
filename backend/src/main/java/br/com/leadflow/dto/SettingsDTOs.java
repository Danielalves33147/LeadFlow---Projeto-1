package br.com.leadflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class SettingsDTOs {

    private SettingsDTOs() {
    }

    public record SettingsResponse(
        Long companyId,
        String companyName,
        String cnpj,
        String companyEmail,
        String companyPhone,
        String website,
        String postalCode,
        String street,
        String number,
        String complement,
        String neighborhood,
        String city,
        String state,
        int defaultPeriodDays,
        boolean compactTables,
        String timezone
    ) {
    }

    public record UpdateSettingsRequest(
        @NotBlank @Size(min = 2, max = 160) String companyName,
        @Min(7) @Max(365) int defaultPeriodDays,
        boolean compactTables,
        @NotBlank @Size(max = 80) String timezone
    ) {
    }

    public record UpdateCompanyRequest(
        @NotBlank @Size(min = 2, max = 160) String companyName,
        @Email @Size(max = 180) String companyEmail,
        @Size(max = 20) String companyPhone,
        @Size(max = 255) String website,
        @Size(max = 8) String postalCode,
        @Size(max = 180) String street,
        @Size(max = 30) String number,
        @Size(max = 120) String complement,
        @Size(max = 120) String neighborhood,
        @Size(max = 120) String city,
        @Size(max = 2) String state
    ) {
    }

    public record UpdatePreferencesRequest(
        @Min(7) @Max(365) int defaultPeriodDays,
        @NotBlank @Size(max = 80) String timezone
    ) {
    }
}
