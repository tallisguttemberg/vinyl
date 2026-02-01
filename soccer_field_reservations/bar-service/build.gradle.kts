plugins {
    id("org.springframework.boot") version "3.2.1"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.spring") version "1.9.22"
    kotlin("plugin.jpa") version "1.9.22"
}

group = "br.com.bar"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}



repositories {
    mavenCentral()
}

dependencies {

    // Core Spring
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // Security (já deixa preparado)
    implementation("org.springframework.boot:spring-boot-starter-security")

    // PostgreSQL
    runtimeOnly("org.postgresql:postgresql")

    // Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // Testes
    testImplementation("org.springframework.boot:spring-boot-starter-test")

    // JWT Support (Retained for existing implementation)
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
