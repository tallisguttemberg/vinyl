package com.example.soccer.controller

import com.example.soccer.model.*
import com.example.soccer.service.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/clientes")
class ClienteController(private val service: ClienteService) {

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun criar(@Valid @RequestBody cliente: Cliente): ResponseEntity<Cliente> {
        return ResponseEntity(service.criar(cliente), HttpStatus.CREATED)
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun listar(): List<Cliente> = service.listar()

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun atualizar(@PathVariable id: UUID, @Valid @RequestBody cliente: Cliente): ResponseEntity<Cliente> {
        return ResponseEntity.ok(service.atualizar(id, cliente))
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun deletar(@PathVariable id: UUID): ResponseEntity<Void> {
        service.deletar(id)
        return ResponseEntity.noContent().build()
    }
}

@RestController
@RequestMapping("/api/campos")
class CampoController(private val service: CampoService) {
    @GetMapping
    fun listar(): List<Campo> = service.listarAtivos()

    @GetMapping("/admin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun listarTodos(): List<Campo> = service.listarTodos()

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun criar(@Valid @RequestBody campo: Campo): ResponseEntity<Campo> {
        return ResponseEntity(service.criar(campo), HttpStatus.CREATED)
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun atualizar(@PathVariable id: UUID, @Valid @RequestBody campo: Campo): ResponseEntity<Campo> {
        return ResponseEntity.ok(service.atualizar(id, campo))
    }
}

@RestController
@RequestMapping("/api/reservas")
class ReservaController(private val service: ReservaService, private val campoService: CampoService, private val clienteRepository: com.example.soccer.repository.ClienteRepository) {

    // Simple DTO to avoid recursion/complex JSON payload in request
    data class ReservaRequest(
        val clienteId: UUID,
        val campoId: UUID,
        val dataReserva: java.time.LocalDate,
        val horaInicio: java.time.LocalTime,
        val horaFim: java.time.LocalTime
    )

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    fun criar(@RequestBody req: ReservaRequest): ResponseEntity<Any> {
        return try {
            val campo = campoService.buscarPorId(req.campoId)
            val cliente = clienteRepository.findById(req.clienteId).orElseThrow { IllegalArgumentException("Cliente não encontrado") }
            
            // Calc value simple logic (real logic could be in service)
            val horas = java.time.Duration.between(req.horaInicio, req.horaFim).toMinutes() / 60.0
            val valor = campo.valorHora.multiply(java.math.BigDecimal(horas))

            val reserva = Reserva(
                cliente = cliente,
                campo = campo,
                dataReserva = req.dataReserva,
                horaInicio = req.horaInicio,
                horaFim = req.horaFim,
                valor = valor
            )
            
            val created = service.criar(reserva)
            ResponseEntity(created, HttpStatus.CREATED)
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.badRequest().body(mapOf("erro" to e.message))
        }
    }

    @GetMapping
    fun listar(
        @RequestParam(required = false) data: java.time.LocalDate?,
        @RequestParam(required = false) ambiente: java.util.UUID?
    ): List<Reserva> {
        if (data != null && ambiente != null) {
            return service.listarReservasDoDia(ambiente, data)
        }
        return service.listarTodas()
    }
}
