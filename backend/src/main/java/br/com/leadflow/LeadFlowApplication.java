package br.com.leadflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LeadFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(LeadFlowApplication.class, args);
    }
}
