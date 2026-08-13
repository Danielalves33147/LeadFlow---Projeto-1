package br.com.leadflow.controller;

import br.com.leadflow.dto.CommonDTOs.ApiResponse;
import br.com.leadflow.service.RankingService;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ranking/branches")
public class RankingController {
    private final RankingService service; public RankingController(RankingService service){this.service=service;}
    @GetMapping public ApiResponse<?> get(@RequestParam(required=false)Instant from,@RequestParam(required=false)Instant to){return ApiResponse.of(service.ranking(from,to));}
}
