package com.recipe.dto;

import com.recipe.entity.Category;
import com.recipe.entity.Difficulty;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeDto {
    private Long id;
    private String title;
    private String description;
    private String coverImageUrl;
    private Integer prepTime;
    private Integer cookTime;
    private Integer servings;
    private Difficulty difficulty;
    private Category category;
    private String authorUsername;
    private String authorName;
    private long likesCount;
    private boolean likedByCurrentUser;
    private boolean savedByCurrentUser;
    private LocalDateTime createdAt;
}
