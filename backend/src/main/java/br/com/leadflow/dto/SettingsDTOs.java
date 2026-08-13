package br.com.leadflow.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class SettingsDTOs {
    private SettingsDTOs() {}

    public record SettingsResponse(
        Long companyId, String companyName, String cnpj, int defaultPeriodDays, boolean compactTables, String timezone
    ) {}

    public record UpdateSettingsRequest(
        @NotBlank @Size(min = 2, max = 160) String companyName,
        @Min(7) @Max(365) int defaultPeriodDays,
        boolean compactTables,
        @NotBlank @Size(max = 80) String timezone
    ) {}
}
