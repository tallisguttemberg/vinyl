#!/bin/bash

BASE_URL="http://localhost:8080/api/campos"

echo "1. List Fields (Before)"
curl -s $BASE_URL | jq '. | length'

echo -e "\n2. Create New Field (Admin)"
NEW_ID=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "nome": "Campo Teste Admin",
    "tipo": "Areia",
    "valorHora": 50.00,
    "descricao": "Campo criado via admin",
    "ativo": true
}' $BASE_URL | jq -r '.id')
echo "Created Field ID: $NEW_ID"

echo -e "\n3. Update Field (Admin)"
curl -s -X PUT -H "Content-Type: application/json" -d '{
    "nome": "Campo Teste Admin (Editado)",
    "tipo": "Areia",
    "valorHora": 60.00,
    "descricao": "Campo editado via admin",
    "ativo": false
}' $BASE_URL/$NEW_ID | jq .

echo -e "\n4. Verify Update (Get by ID)"
curl -s $BASE_URL/admin | grep "Campo Teste Admin (Editado)" > /dev/null && echo "✅ Update Verified" || echo "❌ Update Failed"
