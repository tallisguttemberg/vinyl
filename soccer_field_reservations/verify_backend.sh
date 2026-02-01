#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "Waiting for backend to be ready..."
until curl -s $BASE_URL/campos > /dev/null; do
  echo "Backend not ready yet..."
  sleep 5
done

echo "1. List Fields (Campos)"
curl -s $BASE_URL/campos | jq .

echo -e "\n\n2. Create Client (Cliente)"
CLIENT_ID=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "cpf": "999.999.999-99",
    "email": "test@backend.com",
    "nome": "Backend Tester",
    "telefone": "11999999999"
}' $BASE_URL/clientes | jq -r '.id')
echo "Created Client ID: $CLIENT_ID"

echo -e "\n3. Get Field ID"
CAMPO_ID=$(curl -s $BASE_URL/campos | jq -r '.[0].id')
echo "Campo ID: $CAMPO_ID"

echo -e "\n4. Create Reservation (Success)"
curl -s -X POST -H "Content-Type: application/json" -d "{
    \"clienteId\": \"$CLIENT_ID\",
    \"campoId\": \"$CAMPO_ID\",
    \"dataReserva\": \"$(date -d '+1 day' +%F)\",
    \"horaInicio\": \"10:00\",
    \"horaFim\": \"11:00\"
}" $BASE_URL/reservas | jq .

echo -e "\n5. Create Reservation (Overlap Failure - Should return 4xx/5xx)"
curl -s -X POST -H "Content-Type: application/json" -d "{
    \"clienteId\": \"$CLIENT_ID\",
    \"campoId\": \"$CAMPO_ID\",
    \"dataReserva\": \"$(date -d '+1 day' +%F)\",
    \"horaInicio\": \"10:30\",
    \"horaFim\": \"11:30\"
}" $BASE_URL/reservas | jq .
