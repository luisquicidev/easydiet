#!/bin/bash

echo "Parando contêineres..."
docker-compose down

echo "Reconstruindo imagens..."
docker-compose build --no-cache

echo "Iniciando contêineres..."
docker-compose up -d

echo "Exibindo logs. Pressione Ctrl+C para sair..."
docker-compose logs -f api