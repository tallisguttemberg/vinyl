# Infraestrutura de TI - Visão Geral

Este documento apresenta a visão macro da infraestrutura de TI, conectando os ambientes locais, o datacenter CAIS e a nuvem AWS.

## Diagrama de Paisagem (Landscape Diagram)

Este diagrama mostra como os diferentes sistemas e ambientes se comunicam.

```mermaid
graph TB
    subgraph Local["Unidades Locais (Estações de Trabalho)"]
        Workstation["Estações de Trabalho (Delphi)"]
        Tablet["Tablets Operacionais (Java)"]
    end

    subgraph CAIS["Datacenter CAIS (Oracle Linux)"]
        MSSQL["MS SQL Server"]
    end

    subgraph AWS["Amazon Web Services (AWS)"]
        S3["Amazon S3 (Backups)"]
        EC2_Monitor["EC2 (Node.js - MONITOR)"]
        EC2_Ontag["EC2 (Node.js - ONTAG)"]
        EB_UZO["Elastic Beanstalk (Java - UZO)"]
        RDS["RDS PostgreSQL (UZO)"]
    end

    %% Conexões NAVEGANTES
    Workstation -- "Conexão Direta (SQL)" --> MSSQL
    MSSQL -- "Backup Automático" --> S3

    %% Conexões MONITOR/ONTAG
    EC2_Monitor -- "Consulta SQL" --> MSSQL
    EC2_Ontag -- "Consulta SQL" --> MSSQL

    %% Conexões UZO
    Tablet -- "Operações Web/Mobile" --> EB_UZO
    EB_UZO -- "Persistência" --> RDS
```

## Resumo de Ambientes

| Ambiente | Host / Serviço | Responsabilidade |
| :--- | :--- | :--- |
| **CAIS** | Oracle Linux / MS SQL Server | Banco de dados centralizador (NAVEGANTES, MONITOR, ONTAG) |
| **AWS** | EC2 / Elastic Beanstalk | Hospedagem de backends (Node.js e Java) |
| **AWS** | RDS (PostgreSQL) | Banco de dados dedicado para o sistema UZO |
| **AWS** | S3 Bucket | Armazenamento de backups e recuperação de desastres |
