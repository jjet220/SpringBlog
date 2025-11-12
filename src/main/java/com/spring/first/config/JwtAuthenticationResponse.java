package com.spring.first.config;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

//@Data
@Getter
@Setter

public class JwtAuthenticationResponse {
    private String token;

    public JwtAuthenticationResponse(String token){
        this.token = token;
    }
}
