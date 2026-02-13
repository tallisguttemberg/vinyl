# Sistemas Web e Mobile (Monitor, Ontag e Uzo)

Este documento detalha as arquiteturas baseadas em nuvem para os sistemas de suporte e operação móvel.

## Sistemas MONITOR e ONTAG (Web)

Estes sistemas compartilham uma arquitetura similar, baseada em Node.js e hospedada em instâncias EC2.

### Diagrama de Componentes

```mermaid
componentDiagram
    package "Client Browser" {
        [Frontend (HTML/JS)] as View
    }

    package "AWS Cloud (EC2)" {
        [Backend (Node.js)] as API
    }

    package "CAIS" {
        [MS SQL Server] as DB
    }

    View ..> API : "HTTPS/REST"
    API ..> DB : "SQL Server Driver"
```

## Sistema UZO (Mobile)

O sistema UZO é baseado em Java e utiliza o AWS Elastic Beanstalk para facilitar a escalabilidade e gerenciamento.

### Diagrama de Componentes

```mermaid
componentDiagram
    package "Mobile Tablet" {
        [UZO App (Java/Android)] as App
    }

    package "AWS Cloud (Elastic Beanstalk)" {
        [UZO Backend (Java)] as Backend
    }

    package "AWS (RDS)" {
        [PostgreSQL Instance] as Postgres
    }

    App ..> Backend : "HTTPS/REST"
    Backend ..> Postgres : "JDBC"
```

### Diagrama de Implantação (Multiclou/Hybrid)

```mermaid
deploymentDiagram
    subgraph "External Access"
        node "Mobile Tablet"
        node "User Browser"
    end

    subgraph "AWS Ecosystem"
        node "EC2 Instance (Monitor/Ontag)"
        node "Elastic Beanstalk (UZO)"
        node "RDS PostgreSQL"
    end

    subgraph "On-Premises / Datacenter"
        node "CAIS SQL Server (Linux)"
    end

    "User Browser" -- "HTTPS" : "EC2 Instance (Monitor/Ontag)"
    "Mobile Tablet" -- "HTTPS" : "Elastic Beanstalk (UZO)"
    
    "EC2 Instance (Monitor/Ontag)" -- "SQL Protocol" : "CAIS SQL Server (Linux)"
    "Elastic Beanstalk (UZO)" -- "SQL Protocol" : "RDS PostgreSQL"
```

## Comparativo de Tecnologias

| Sistema | Linguagem | Banco de Dados | Hosting |
| :--- | :--- | :--- | :--- |
| **MONITOR** | JavaScript (Node.js) | MS SQL Server (CAIS) | AWS EC2 |
| **ONTAG** | JavaScript (Node.js) | MS SQL Server (CAIS) | AWS EC2 |
| **UZO** | Java | PostgreSQL | AWS Elastic Beanstalk / RDS |
