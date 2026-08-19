package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.SettingsDTOs.UpdateSettingsRequest;
import br.com.leadflow.service.SettingsService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<?> get() {
        return ApiResponse.of(service.get());
    }

    @PutMapping
    public ApiResponse<?> update(@Valid @RequestBody UpdateSettingsRequest request) {
        return ApiResponse.of(service.update(request));
    }
}
