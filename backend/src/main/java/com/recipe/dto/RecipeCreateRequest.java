package com.recipe.dto;

import com.recipe.entity.Category;
import com.recipe.entity.Difficulty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecipeCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String coverImageUrl;

    @NotNull(message = "Preparation time is required")
    @Min(value = 1, message = "Preparation time must be at least 1 minute")
    private Integer prepTime;

    @NotNull(message = "Cooking time is required")
    @Min(value = 0, message = "Cooking time must be non-negative")
    private Integer cookTime;

    @NotNull(message = "Servings count is required")
    @Min(value = 1, message = "Servings must be at least 1")
    private Integer servings;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotNull(message = "Category is required")
    private Category category;

    @NotEmpty(message = "At least one ingredient is required")
    private List<String> ingredients;

    @NotEmpty(message = "At least one cooking step is required")
    private List<String> steps;
}
