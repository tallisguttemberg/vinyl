# Sistema NAVEGANTES - Modelagem Técnica

Este documento detalha a arquitetura do sistema NAVEGANTES, o núcleo centralizador de dados da empresa.

## Diagrama de Componentes (Component Diagram)

O NAVEGANTES é uma aplicação desktop monolítica que interage diretamente com a camada de persistência.

```mermaid
componentDiagram
    package "Estação de Trabalho User" {
        [Aplicação NAVEGANTES (Delphi)] as Delphi
    }

    package "Ambiente CAIS" {
        [MS SQL Server] as DB
    }

    package "Cloud Backup (AWS)" {
        [S3 Bucket] as Storage
    }

    Delphi ..> DB : "SQL/TDS Protocol"
    DB ..> Storage : "Backup (Periodic)"
```

## Diagrama de Implantação (Deployment Diagram)

Detalha a distribuição física e lógica dos servidores e redes.

```mermaid
deploymentDiagram
    device "Client Desktop" {
        node "Windows OS" {
            artifact "Navegantes.exe (Delphi App)"
        }
    }

    node "CAIS Datacenter" {
        node "Server (Oracle Linux)" {
            node "Instance (MS SQL Server)" {
                database "Database (NAVEGANTES_DB)"
            }
        }
        node "Firewall/VPN" {
            artifact "Access Rules"
        }
    }

    node "AWS Cloud" {
        node "S3 Service" {
            storage "Bucket (Backups)"
        }
    }

    "Client Desktop" -- "VPN/Firewall" : "Port 1433"
    "VPN/Firewall" -- "Server (Oracle Linux)"
    "Server (Oracle Linux)" -- "S3 Service" : "HTTPS/TLS"
```

## Detalhes de Implementação

*   **Tecnologia Base**: Delphi (Pascal moderno).
*   **Protocolo de Comunicação**: O sistema utiliza o protocolo TDS (Tabular Data Stream) para comunicação direta com o MS SQL Server através de bibliotecas como ADO ou FireDAC.
*   **Persistência**: Centralizada em servidor Linux, oferecendo melhor custo-benefício e estabilidade em relação ao licenciamento Windows Server tradicional para bancos de dados.
