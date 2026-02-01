package br.com.football.bar.domain.repository;

import br.com.football.bar.domain.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByUsuarioIdOrderByCriadoEmDesc(String usuarioId);
}
