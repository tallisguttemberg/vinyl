package br.com.football.bar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "br.com.football")
@EnableJpaRepositories(basePackages = "br.com.football")
@EntityScan(basePackages = "br.com.football")
public class BarServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BarServiceApplication.class, args);
    }

}
