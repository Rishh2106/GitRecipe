package com.recipe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {
    private String bio;
    private String profilePictureUrl;
}
