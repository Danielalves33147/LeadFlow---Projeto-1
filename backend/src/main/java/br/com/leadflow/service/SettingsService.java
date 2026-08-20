package br.com.leadflow.service;

import br.com.leadflow.dto.SettingsDTOs.SettingsResponse;
import br.com.leadflow.dto.SettingsDTOs.UpdateCompanyRequest;
import br.com.leadflow.dto.SettingsDTOs.UpdatePreferencesRequest;
import br.com.leadflow.dto.SettingsDTOs.UpdateSettingsRequest;
import br.com.leadflow.exception.AccessDeniedBusinessException;
import br.com.leadflow.model.Company;
import br.com.leadflow.model.User;
import br.com.leadflow.model.enums.UserRole;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {

    private final AccessService accessService;

    public SettingsService(AccessService accessService) {
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public SettingsResponse get() {
        User actor = admin();
        return toResponse(actor.getCompany());
    }

    @Transactional
    public SettingsResponse update(UpdateSettingsRequest request) {
        User actor = admin();
        Company company = actor.getCompany();
        company.setName(request.companyName().trim());
        company.setDefaultPeriodDays(request.defaultPeriodDays());
        company.setCompactTables(request.compactTables());
        company.setTimezone(request.timezone().trim());
        return toResponse(company);
    }

    @Transactional
    public SettingsResponse updateCompany(UpdateCompanyRequest request) {
        User actor = admin();
        Company company = actor.getCompany();

        company.setName(request.companyName().trim());
        company.setCompanyEmail(blankToNull(request.companyEmail()));
        company.setCompanyPhone(blankToNull(request.companyPhone()));
        company.setWebsite(blankToNull(request.website()));
        company.setPostalCode(blankToNull(request.postalCode()));
        company.setStreet(blankToNull(request.street()));
        company.setNumber(blankToNull(request.number()));
        company.setComplement(blankToNull(request.complement()));
        company.setNeighborhood(blankToNull(request.neighborhood()));
        company.setCity(blankToNull(request.city()));
        company.setState(normalizedState(request.state()));

        return toResponse(company);
    }

    @Transactional
    public SettingsResponse updatePreferences(UpdatePreferencesRequest request) {
        User actor = admin();
        Company company = actor.getCompany();

        company.setDefaultPeriodDays(request.defaultPeriodDays());
        company.setTimezone(request.timezone().trim());

        return toResponse(company);
    }

    private User admin() {
        User user = accessService.currentUser();

        if (user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedBusinessException(
                "Seu perfil não possui acesso a esta configuração."
            );
        }

        return user;
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizedState(String value) {
        String state = blankToNull(value);
        return state == null ? null : state.toUpperCase();
    }

    private SettingsResponse toResponse(Company company) {
        return new SettingsResponse(
            company.getId(),
            company.getName(),
            company.getCnpj(),
            company.getCompanyEmail(),
            company.getCompanyPhone(),
            company.getWebsite(),
            company.getPostalCode(),
            company.getStreet(),
            company.getNumber(),
            company.getComplement(),
            company.getNeighborhood(),
            company.getCity(),
            company.getState(),
            company.getDefaultPeriodDays(),
            company.isCompactTables(),
            company.getTimezone()
        );
    }
}
