package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.TaskDTOs.CancelTaskRequest;
import br.com.leadflow.dto.TaskDTOs.CreateTaskRequest;
import br.com.leadflow.dto.TaskDTOs.RescheduleTaskRequest;
import br.com.leadflow.dto.TaskDTOs.UpdateTaskRequest;
import br.com.leadflow.model.enums.TaskStatus;
import br.com.leadflow.service.TaskService;

import jakarta.validation.Valid;

import java.time.Instant;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<?> list(
        @RequestParam(required = false) Long branchId,
        @RequestParam(required = false) Long leadId,
        @RequestParam(required = false) Long responsibleId,
        @RequestParam(required = false) TaskStatus status,
        @RequestParam(required = false) String title,
        @RequestParam(required = false) Instant from,
        @RequestParam(required = false) Instant to,
        @PageableDefault(size = 50, sort = "dueAt") Pageable pageable
    ) {
        return ApiResponse.of(service.list(branchId, leadId, responsibleId, status, title, from, to, pageable));
    }

    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody CreateTaskRequest request) {
        return ApiResponse.of(service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ApiResponse.of(service.update(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ApiResponse<?> complete(@PathVariable Long id) {
        return ApiResponse.of(service.complete(id));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<?> cancel(
        @PathVariable Long id,
        @Valid @RequestBody CancelTaskRequest request
    ) {
        return ApiResponse.of(service.cancel(id, request));
    }

    @PatchMapping("/{id}/reschedule")
    public ApiResponse<?> reschedule(
        @PathVariable Long id,
        @Valid @RequestBody RescheduleTaskRequest request
    ) {
        return ApiResponse.of(service.reschedule(id, request));
    }
}
