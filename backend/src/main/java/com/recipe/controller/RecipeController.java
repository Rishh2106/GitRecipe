package com.recipe.controller;

import com.recipe.dto.*;
import com.recipe.entity.Category;
import com.recipe.entity.User;
import com.recipe.service.AuthService;
import com.recipe.service.RecipeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;
    private final AuthService authService;

    public RecipeController(RecipeService recipeService, AuthService authService) {
        this.recipeService = recipeService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<RecipeDto>> getAllRecipes(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String search) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        List<RecipeDto> recipes = recipeService.getAllRecipes(category, search, currentUser);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/saved")
    public ResponseEntity<List<RecipeDto>> getSavedRecipes() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        List<RecipeDto> recipes = recipeService.getSavedRecipes(currentUser);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeDetailDto> getRecipeById(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        RecipeDetailDto recipe = recipeService.getRecipeDetails(id, currentUser);
        return ResponseEntity.ok(recipe);
    }

    @PostMapping
    public ResponseEntity<RecipeDetailDto> createRecipe(@Valid @RequestBody RecipeCreateRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        RecipeDetailDto recipe = recipeService.createRecipe(request, currentUser);
        return ResponseEntity.ok(recipe);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeDetailDto> updateRecipe(
            @PathVariable Long id,
            @Valid @RequestBody RecipeCreateRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        RecipeDetailDto recipe = recipeService.updateRecipe(id, request, currentUser);
        return ResponseEntity.ok(recipe);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRecipe(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        recipeService.deleteRecipe(id, currentUser);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Recipe deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        boolean liked = recipeService.toggleLike(id, currentUser);
        Map<String, Object> response = new HashMap<>();
        response.put("liked", liked);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Map<String, Object>> toggleSave(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        boolean saved = recipeService.toggleSave(id, currentUser);
        Map<String, Object> response = new HashMap<>();
        response.put("saved", saved);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        String content = requestBody.get("content");
        CommentDto commentDto = recipeService.addComment(id, content, currentUser);
        return ResponseEntity.ok(commentDto);
    }
}
