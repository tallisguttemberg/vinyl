package br.com.football.bar.api.controller;

import br.com.football.auth.security.JwtService;
import br.com.football.bar.api.dto.PedidoRequest;
import br.com.football.bar.domain.entity.Pedido;
import br.com.football.bar.domain.repository.PedidoRepository;
import br.com.football.bar.service.VendaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bar/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    private final VendaService vendaService;
    private final PedidoRepository pedidoRepository;
    private final JwtService jwtService;

    public PedidoController(VendaService vendaService, PedidoRepository pedidoRepository, JwtService jwtService) {
        this.vendaService = vendaService;
        this.pedidoRepository = pedidoRepository;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<?> criarPedido(@RequestBody PedidoRequest request, HttpServletRequest httpRequest) {
        try {
            String usuarioId = extractUsuarioId(httpRequest);
            Pedido pedido = vendaService.realizarPedido(usuarioId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(pedido);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<br.com.football.bar.api.dto.PedidoResponse>> listarMeusPedidos(HttpServletRequest httpRequest) {
        String usuarioId = extractUsuarioId(httpRequest);
        List<Pedido> pedidos = pedidoRepository.findByUsuarioIdOrderByCriadoEmDesc(usuarioId);
        return ResponseEntity.ok(pedidos.stream().map(br.com.football.bar.api.dto.PedidoResponse::from).toList());
    }

    @GetMapping("/admin/todos")
    public ResponseEntity<List<br.com.football.bar.api.dto.PedidoResponse>> listarTodos() {
        List<Pedido> pedidos = pedidoRepository.findAll();
        return ResponseEntity.ok(pedidos.stream().map(br.com.football.bar.api.dto.PedidoResponse::from).toList());
    }

    private String extractUsuarioId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtService.extractUsuarioId(token);
        }
        throw new RuntimeException("Usuário não autenticado");
    }
}
