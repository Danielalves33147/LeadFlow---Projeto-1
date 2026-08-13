package br.com.leadflow.controller;

import br.com.leadflow.dto.BranchDTOs.BranchRequest;
import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.service.BranchService;
import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/branches")
public class BranchController {
    private final BranchService service; public BranchController(BranchService service){this.service=service;}
    @GetMapping public ApiResponse<?> list(@RequestParam(required=false)Instant from,@RequestParam(required=false)Instant to){return ApiResponse.of(service.list(from,to));}
    @GetMapping("/{id}") public ApiResponse<?> get(@PathVariable Long id,@RequestParam(required=false)Instant from,@RequestParam(required=false)Instant to){return ApiResponse.of(service.get(id,from,to));}
    @PostMapping public ApiResponse<?> create(@Valid @RequestBody BranchRequest request){return ApiResponse.of(service.create(request));}
    @PutMapping("/{id}") public ApiResponse<?> update(@PathVariable Long id,@Valid @RequestBody BranchRequest request){return ApiResponse.of(service.update(id,request));}
}
