package br.com.football.bar.api.controller;

import br.com.football.bar.domain.entity.ProdutoBar;
import br.com.football.bar.domain.repository.ProdutoBarRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bar/produtos")
@CrossOrigin(origins = "*")
public class ProdutoBarController {

    private final ProdutoBarRepository repository;

    public ProdutoBarController(ProdutoBarRepository repository) {
        this.repository = repository;
    }

    // =========================
    // LISTAR PRODUTOS ATIVOS
    // =========================
    @GetMapping
    public ResponseEntity<List<ProdutoBar>> listarProdutos() {
        return ResponseEntity.ok(repository.findByAtivoTrue());
    }

    // =========================
    // LISTAR PRODUTOS COM ESTOQUE
    // =========================
    @GetMapping("/disponiveis")
    public ResponseEntity<List<ProdutoBar>> listarDisponiveis() {
        return ResponseEntity.ok(
                repository.findByAtivoTrueAndEstoqueGreaterThan(0)
        );
    }

    // =========================
    // CADASTRAR PRODUTO
    // =========================
    @PostMapping
    public ResponseEntity<?> criarProduto(@RequestBody ProdutoBar produto) {

        if (repository.existsByNomeIgnoreCaseAndAtivoTrue(produto.getNome())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Produto já cadastrado");
        }

        ProdutoBar salvo = repository.save(produto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(salvo);
    }

    // =========================
    // ATUALIZAR PRODUTO
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarProduto(
            @PathVariable Long id,
            @RequestBody ProdutoBar produtoAtualizado
    ) {

        Optional<ProdutoBar> optional = repository.findById(id);

        if (optional.isEmpty() || !optional.get().getAtivo()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Produto não encontrado");
        }

        ProdutoBar produto = optional.get();
        produto.setNome(produtoAtualizado.getNome());
        produto.setPreco(produtoAtualizado.getPreco());
        produto.setEstoque(produtoAtualizado.getEstoque());

        repository.save(produto);

        return ResponseEntity.ok(produto);
    }

    // =========================
    // REMOVER (SOFT DELETE)
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removerProduto(@PathVariable Long id) {

        Optional<ProdutoBar> optional = repository.findById(id);

        if (optional.isEmpty() || !optional.get().getAtivo()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Produto não encontrado");
        }

        ProdutoBar produto = optional.get();
        produto.setAtivo(false);

        repository.save(produto);

        return ResponseEntity.noContent().build();
    }
}
