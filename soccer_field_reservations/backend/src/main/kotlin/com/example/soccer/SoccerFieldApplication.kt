package com.example.soccer

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class SoccerFieldApplication

fun main(args: Array<String>) {
    runApplication<SoccerFieldApplication>(*args)
}
