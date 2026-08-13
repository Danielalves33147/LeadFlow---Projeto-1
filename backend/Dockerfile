FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q clean package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 leadflow
COPY --from=build /app/target/leadflow-backend-1.0.0.jar app.jar
USER leadflow
EXPOSE 8080
ENTRYPOINT ["java","-XX:+UseContainerSupport","-jar","/app/app.jar"]
