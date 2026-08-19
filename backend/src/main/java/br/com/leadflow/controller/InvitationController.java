package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.InvitationDTOs.CreateInvitationRequest;
import br.com.leadflow.service.InvitationService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    "/api/v1/users/invitations"
)
public class InvitationController {

    private final InvitationService service;

    public InvitationController(
        InvitationService service
    ) {
        this.service = service;
    }

    @PostMapping
    public ApiResponse<?> create(
        @Valid
        @RequestBody
        CreateInvitationRequest request
    ) {
        return ApiResponse.of(
            service.create(request)
        );
    }
}