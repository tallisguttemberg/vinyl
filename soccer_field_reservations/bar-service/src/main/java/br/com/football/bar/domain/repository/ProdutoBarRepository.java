package br.com.football.bar.domain.repository;

import br.com.football.bar.domain.entity.ProdutoBar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoBarRepository extends JpaRepository<ProdutoBar, Long> {

    // Lista apenas produtos ativos
    List<ProdutoBar> findByAtivoTrue();

    // Lista produtos ativos com estoque disponível
    List<ProdutoBar> findByAtivoTrueAndEstoqueGreaterThan(Integer estoque);

    // Busca produto ativo por nome (útil para evitar duplicidade)
    boolean existsByNomeIgnoreCaseAndAtivoTrue(String nome);
}
