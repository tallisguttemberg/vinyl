package br.com.football.bar.api.dto;

import br.com.football.bar.domain.entity.Pedido;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record PedidoResponse(
    Long id,
    String usuarioId,
    UUID clienteId,
    BigDecimal total,
    String status,
    LocalDateTime criadoEm,
    List<ItemPedidoResponse> itens
) {
    public static PedidoResponse from(Pedido pedido) {
        return new PedidoResponse(
            pedido.getId(),
            pedido.getUsuarioId(),
            pedido.getClienteId(),
            pedido.getTotal(),
            pedido.getStatus().name(),
            pedido.getCriadoEm(),
            pedido.getItens().stream().map(ItemPedidoResponse::from).collect(Collectors.toList())
        );
    }

    public record ItemPedidoResponse(
        Long id,
        String produtoNome,
        Integer quantidade,
        BigDecimal precoUnitario
    ) {
        public static ItemPedidoResponse from(br.com.football.bar.domain.entity.ItemPedido item) {
            return new ItemPedidoResponse(
                item.getId(),
                item.getProduto().getNome(),
                item.getQuantidade(),
                item.getPrecoUnitario()
            );
        }
    }
}
