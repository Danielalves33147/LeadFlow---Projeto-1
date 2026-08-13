package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.dto.LeadDTOs.ChangeStageRequest;
import br.com.leadflow.dto.LeadDTOs.CreateLeadRequest;
import br.com.leadflow.dto.LeadDTOs.ReassignLeadRequest;
import br.com.leadflow.dto.LeadDTOs.UpdateLeadRequest;
import br.com.leadflow.model.enums.LeadOrigin;
import br.com.leadflow.model.enums.LeadStage;
import br.com.leadflow.service.InteractionService;
import br.com.leadflow.service.LeadService;
import br.com.leadflow.service.TaskService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/leads")
public class LeadController {
    private final LeadService leadService; private final InteractionService interactionService; private final TaskService taskService;
    public LeadController(LeadService leadService,InteractionService interactionService,TaskService taskService){this.leadService=leadService;this.interactionService=interactionService;this.taskService=taskService;}

    @GetMapping public ApiResponse<?> list(@RequestParam(required=false)String search,@RequestParam(required=false)Long branchId,@RequestParam(required=false)LeadStage stage,@RequestParam(required=false)Long responsibleId,@RequestParam(required=false)LeadOrigin origin,@RequestParam(required=false)Integer minScore,@RequestParam(required=false)Integer maxScore,@RequestParam(required=false)Instant createdFrom,@RequestParam(required=false)Instant createdTo,@PageableDefault(size=25,sort="createdAt")Pageable pageable){return ApiResponse.of(leadService.list(search,branchId,stage,responsibleId,origin,minScore,maxScore,createdFrom,createdTo,pageable));}
    @GetMapping("/{id}") public ApiResponse<?> get(@PathVariable Long id){return ApiResponse.of(leadService.get(id));}
    @PostMapping public ApiResponse<?> create(@Valid @RequestBody CreateLeadRequest request){return ApiResponse.of(leadService.create(request));}
    @PutMapping("/{id}") public ApiResponse<?> update(@PathVariable Long id,@Valid @RequestBody UpdateLeadRequest request){return ApiResponse.of(leadService.update(id,request));}
    @PatchMapping("/{id}/stage") public ApiResponse<?> stage(@PathVariable Long id,@Valid @RequestBody ChangeStageRequest request){return ApiResponse.of(leadService.changeStage(id,request));}
    @PatchMapping("/{id}/responsible") public ApiResponse<?> reassign(@PathVariable Long id,@Valid @RequestBody ReassignLeadRequest request){return ApiResponse.of(leadService.reassign(id,request));}
    @GetMapping("/{id}/history") public ApiResponse<?> history(@PathVariable Long id){return ApiResponse.of(leadService.history(id));}
    @GetMapping("/{id}/interactions") public ApiResponse<?> interactions(@PathVariable Long id){return ApiResponse.of(interactionService.byLead(id));}
    @GetMapping("/{id}/tasks") public ApiResponse<?> tasks(@PathVariable Long id){return ApiResponse.of(taskService.byLead(id));}
    @GetMapping(value="/export",produces="text/csv") public ResponseEntity<byte[]> export(@RequestParam(required=false)String search,@RequestParam(required=false)Long branchId,@RequestParam(required=false)LeadStage stage,@RequestParam(required=false)Long responsibleId,@RequestParam(required=false)LeadOrigin origin,@RequestParam(required=false)Integer minScore,@RequestParam(required=false)Integer maxScore,@RequestParam(required=false)Instant createdFrom,@RequestParam(required=false)Instant createdTo){byte[] bytes=leadService.exportCsv(search,branchId,stage,responsibleId,origin,minScore,maxScore,createdFrom,createdTo).getBytes(StandardCharsets.UTF_8);HttpHeaders headers=new HttpHeaders();headers.setContentDisposition(ContentDisposition.attachment().filename("leads.csv").build());headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));return ResponseEntity.ok().headers(headers).body(bytes);}
}
