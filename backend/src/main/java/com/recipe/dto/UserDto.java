package com.recipe.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String bio;
    private String profilePictureUrl;
    private LocalDateTime joinDate;
    private long recipeCount;
    private long likesReceived;
}
