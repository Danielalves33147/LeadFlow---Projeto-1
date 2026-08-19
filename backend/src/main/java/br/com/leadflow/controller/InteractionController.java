package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.InteractionDTOs.CreateInteractionRequest;
import br.com.leadflow.model.enums.InteractionChannel;
import br.com.leadflow.model.enums.InteractionType;
import br.com.leadflow.service.InteractionService;

import jakarta.validation.Valid;

import java.time.Instant;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/interactions")
public class InteractionController {

    private final InteractionService service;

    public InteractionController(InteractionService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<?> list(
        @RequestParam(required = false) Long branchId,
        @RequestParam(required = false) Long leadId,
        @RequestParam(required = false) Long responsibleId,
        @RequestParam(required = false) InteractionChannel channel,
        @RequestParam(required = false) InteractionType type,
        @RequestParam(required = false) Instant from,
        @RequestParam(required = false) Instant to,
        @PageableDefault(size = 25, sort = "createdAt") Pageable pageable
    ) {
        return ApiResponse.of(service.list(branchId, leadId, responsibleId, channel, type, from, to, pageable));
    }

    @GetMapping("/preview")
    public ApiResponse<?> preview(@RequestParam Long leadId, @RequestParam InteractionType type) {
        return ApiResponse.of(service.preview(leadId, type));
    }

    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody CreateInteractionRequest request) {
        return ApiResponse.of(service.create(request));
    }
}
