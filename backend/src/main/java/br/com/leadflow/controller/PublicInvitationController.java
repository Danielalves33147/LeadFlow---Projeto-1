package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.InvitationDTOs.AcceptInvitationRequest;
import br.com.leadflow.service.InvitationService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    "/api/v1/auth/invitations"
)
public class PublicInvitationController {

    private final InvitationService service;

    public PublicInvitationController(
        InvitationService service
    ) {
        this.service = service;
    }

    @GetMapping("/validate")
    public ApiResponse<?> validate(
        @RequestParam
        String token
    ) {
        return ApiResponse.of(
            service.validate(token)
        );
    }

    @PostMapping("/accept")
    public ApiResponse<?> accept(
        @Valid
        @RequestBody
        AcceptInvitationRequest request
    ) {
        return ApiResponse.of(
            service.accept(request)
        );
    }
}