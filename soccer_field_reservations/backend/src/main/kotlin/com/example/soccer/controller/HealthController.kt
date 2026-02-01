package com.example.soccer.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HealthController {

    @GetMapping("/public/health")
    fun health(): String {
        return "Backend funcionando!"
    }
}
