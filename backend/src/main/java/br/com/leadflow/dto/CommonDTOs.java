package br.com.leadflow.dto;

import java.time.Instant;
import java.util.List;

public final class CommonDTOs {

    private CommonDTOs() {}public record ApiResponse<T>(T data, Instant timestamp) {
        public static < T > ApiResponse<T> of(T data) {
            return new ApiResponse<>(data, Instant.now());
        }
    }

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}public record OptionResponse(Long id,
        String label) {}
}
