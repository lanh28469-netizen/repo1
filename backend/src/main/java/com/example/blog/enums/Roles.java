package com.example.blog.enums;

public enum Roles {
    ADMIN,
    MANAGER,
    USER;
    
    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
