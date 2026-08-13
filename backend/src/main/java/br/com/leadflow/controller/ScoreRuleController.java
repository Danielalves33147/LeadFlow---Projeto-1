package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.ScoreRuleDTOs.ScoreRuleRequest;
import br.com.leadflow.dto.ScoreRuleDTOs.ScoreRuleStatusRequest;
import br.com.leadflow.service.ScoreRuleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/score-rules")
public class ScoreRuleController {
    private final ScoreRuleService service; public ScoreRuleController(ScoreRuleService service){this.service=service;}
    @GetMapping public ApiResponse<?> list(){return ApiResponse.of(service.list());}
    @PostMapping public ApiResponse<?> create(@Valid @RequestBody ScoreRuleRequest request){return ApiResponse.of(service.create(request));}
    @PutMapping("/{id}") public ApiResponse<?> update(@PathVariable Long id,@Valid @RequestBody ScoreRuleRequest request){return ApiResponse.of(service.update(id,request));}
    @PatchMapping("/{id}/status") public ApiResponse<?> status(@PathVariable Long id,@Valid @RequestBody ScoreRuleStatusRequest request){return ApiResponse.of(service.changeStatus(id,request));}
}
