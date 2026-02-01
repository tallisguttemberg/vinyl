# =========================
# STAGE 1 - BUILD
# =========================
FROM gradle:8.6-jdk21 AS build

WORKDIR /app

# Copia apenas arquivos necessários para cache correto
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src

# Build do jar
RUN gradle clean bootJar --no-daemon


# =========================
# STAGE 2 - RUNTIME
# =========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copia o jar gerado
COPY --from=build /app/build/libs/*.jar app.jar

# Porta padrão do serviço bar
EXPOSE 8081

# Variáveis podem vir do docker-compose
ENV SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["java", "-jar", "app.jar"]
