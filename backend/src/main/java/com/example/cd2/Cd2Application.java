package com.example.cd2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Cd2Application {

    public static void main(String[] args) {
        SpringApplication.run(Cd2Application.class, args);
    }

}
