package com.fiao.api;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI fiaoOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FIAO API")
                        .description("API para gestión de negocios, deudas, pagos y usuarios.")
                        .version("1.0.0"));
    }
}
