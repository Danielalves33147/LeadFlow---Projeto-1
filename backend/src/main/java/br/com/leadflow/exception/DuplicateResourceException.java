package br.com.leadflow.exception;

public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) { super(message); }
}
