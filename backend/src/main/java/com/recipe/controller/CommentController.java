package com.recipe.controller;

import com.recipe.dto.CommentDto;
import com.recipe.entity.User;
import com.recipe.service.AuthService;
import com.recipe.service.RecipeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final RecipeService recipeService;
    private final AuthService authService;

    public CommentController(RecipeService recipeService, AuthService authService) {
        this.recipeService = recipeService;
        this.authService = authService;
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentDto> editComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> requestBody) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        String content = requestBody.get("content");
        CommentDto updated = recipeService.editComment(commentId, content, currentUser);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(@PathVariable Long commentId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        recipeService.deleteComment(commentId, currentUser);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Comment deleted successfully");
        return ResponseEntity.ok(response);
    }
}
