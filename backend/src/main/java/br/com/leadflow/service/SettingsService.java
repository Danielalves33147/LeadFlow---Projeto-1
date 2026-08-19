package br.com.leadflow.service;

import br.com.leadflow.dto.SettingsDTOs.SettingsResponse;
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
        Company c = actor.getCompany();
        c.setName(request.companyName().trim());
        c.setDefaultPeriodDays(request.defaultPeriodDays());
        c.setCompactTables(request.compactTables());
        c.setTimezone(request.timezone().trim());
        return toResponse(c);
    }

    private User admin() {
        User u = accessService.currentUser();
        if (u.getRole() != UserRole.ADMIN)
            throw new AccessDeniedBusinessException("Seu perfil não possui acesso a esta configuração.");
        return u;
    }

    private SettingsResponse toResponse(Company c) {

            return new SettingsResponse(c.getId(), c.getName(), c.getCnpj(), c.getDefaultPeriodDays(), c.isCompactTables(),
            c.getTimezone());
    }
}
