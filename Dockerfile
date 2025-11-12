FROM docker.io/eclipse-temurin:21-jre

WORKDIR /app

COPY build/libs/SpringTestingGroovy-0.0.1-SNAPSHOT.jar /app/SpringTestingGroovy-0.0.1-SNAPSHOT.jar

CMD ["java", "-XX:+UseG1GC", "-jar", "SpringTestingGroovy-0.0.1-SNAPSHOT.jar"]
