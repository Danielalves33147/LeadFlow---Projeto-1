package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.UserDTOs.CreateUserRequest;
import br.com.leadflow.dto.UserDTOs.UpdateUserRequest;
import br.com.leadflow.dto.UserDTOs.UserStatusRequest;
import br.com.leadflow.model.enums.UserRole;
import br.com.leadflow.model.enums.UserStatus;
import br.com.leadflow.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService service; public UserController(UserService service){this.service=service;}
    @GetMapping public ApiResponse<?> list(@RequestParam(required=false)Long branchId,@RequestParam(required=false)UserRole role,@RequestParam(required=false)UserStatus status){return ApiResponse.of(service.list(branchId,role,status));}
    @GetMapping("/{id}") public ApiResponse<?> get(@PathVariable Long id){return ApiResponse.of(service.get(id));}
    @GetMapping("/{id}/deactivation-impact") public ApiResponse<?> impact(@PathVariable Long id){return ApiResponse.of(service.impact(id));}
    @GetMapping("/active-sellers") public ApiResponse<?> sellers(@RequestParam Long branchId){return ApiResponse.of(service.activeSellers(branchId));}
    @PostMapping public ApiResponse<?> create(@Valid @RequestBody CreateUserRequest request){return ApiResponse.of(service.create(request));}
    @PutMapping("/{id}") public ApiResponse<?> update(@PathVariable Long id,@Valid @RequestBody UpdateUserRequest request){return ApiResponse.of(service.update(id,request));}
    @PatchMapping("/{id}/status") public ApiResponse<?> status(@PathVariable Long id,@Valid @RequestBody UserStatusRequest request){return ApiResponse.of(service.changeStatus(id,request));}
}
