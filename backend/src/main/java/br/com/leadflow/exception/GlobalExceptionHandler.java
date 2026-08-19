package br.com.leadflow.exception;

import jakarta.validation.ConstraintViolationException;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<ApiError
            .FieldError> fields = ex
            .getBindingResult()
            .getFieldErrors()
            .stream()
            .map(e -> new ApiError.FieldError(e.getField(), e.getDefaultMessage()))
            .toList();

            return ResponseEntity
            .badRequest()
            .body(new ApiError(Instant.now(), 400, "VALIDATION_ERROR", "Não foi possível processar a solicitação.",
                fields));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest()
            .body(ApiError.of(400, "VALIDATION_ERROR", "Parâmetros inválidos."));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {

            return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApiError.of(404, "RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    ResponseEntity<ApiError> handleDuplicate(DuplicateResourceException ex) {

            return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApiError.of(409, "DUPLICATE_RESOURCE", ex.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex) {

            return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ApiError.of(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos."));
    }

    @ExceptionHandler({AccessDeniedBusinessException.class, AccessDeniedException.class})
    ResponseEntity<ApiError> handleForbidden(Exception ex) {

            return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ApiError.of(403, "ACCESS_DENIED", "Seu perfil não possui acesso a esta operação."));
    }

    @ExceptionHandler(InvalidStateException.class)
    ResponseEntity<ApiError> handleInvalidState(InvalidStateException ex) {
        return ResponseEntity.unprocessableEntity()
            .body(ApiError.of(422, "INVALID_STATE", ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiError> handleBusiness(BusinessException ex) {
        return ResponseEntity.unprocessableEntity()
            .body(ApiError.of(422, ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleGeneric(Exception ex) {

            return ResponseEntity
            .internalServerError()
            .body(ApiError.of(500, "INTERNAL_ERROR", "Ocorreu um erro inesperado. Tente novamente."));
    }
}
