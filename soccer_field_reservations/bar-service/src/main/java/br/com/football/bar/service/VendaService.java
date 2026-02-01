package br.com.football.bar.service;

import br.com.football.bar.api.dto.PedidoRequest;
import br.com.football.bar.domain.entity.ItemPedido;
import br.com.football.bar.domain.entity.Pedido;
import br.com.football.bar.domain.entity.ProdutoBar;
import br.com.football.bar.domain.repository.PedidoRepository;
import br.com.football.bar.domain.repository.ProdutoBarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class VendaService {

    private final PedidoRepository pedidoRepository;
    private final ProdutoBarRepository produtoRepository;

    public VendaService(PedidoRepository pedidoRepository, ProdutoBarRepository produtoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public Pedido realizarPedido(String usuarioId, PedidoRequest request) {
        Pedido pedido = new Pedido();
        pedido.setUsuarioId(usuarioId);
        pedido.setClienteId(request.getClienteId());
        pedido.setStatus(Pedido.StatusPedido.PAGO); // Para simplificar, assume pago agora

        BigDecimal total = BigDecimal.ZERO;
        List<ItemPedido> itens = new ArrayList<>();

        for (PedidoRequest.ItemPedidoRequest itemReq : request.getItens()) {
            ProdutoBar produto = produtoRepository.findById(itemReq.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + itemReq.getProdutoId()));

            if (!produto.getAtivo()) {
                throw new RuntimeException("Produto inativo: " + produto.getNome());
            }

            if (produto.getEstoque() < itemReq.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente para: " + produto.getNome());
            }

            // Atualiza estoque
            produto.setEstoque(produto.getEstoque() - itemReq.getQuantidade());
            produtoRepository.save(produto);

            // Cria item do pedido
            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProduto(produto);
            item.setQuantidade(itemReq.getQuantidade());
            item.setPrecoUnitario(produto.getPreco());

            itens.add(item);

            // Soma ao total
            BigDecimal subtotal = produto.getPreco().multiply(BigDecimal.valueOf(itemReq.getQuantidade()));
            total = total.add(subtotal);
        }

        pedido.setItens(itens);
        pedido.setTotal(total);

        return pedidoRepository.save(pedido);
    }
}
