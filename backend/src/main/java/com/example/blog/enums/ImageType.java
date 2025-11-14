package com.example.blog.enums;

public enum ImageType {
    MODEL_3D("3D"),
    PHOTO_360("360"),
    NORMAL("");
   
    private final String value;

    ImageType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
