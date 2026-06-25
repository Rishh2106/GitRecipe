package com.recipe.service;

import com.recipe.dto.*;
import com.recipe.entity.*;
import com.recipe.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final RecipeLikeRepository recipeLikeRepository;
    private final SavedRecipeRepository savedRecipeRepository;

    public RecipeService(RecipeRepository recipeRepository,
                         UserRepository userRepository,
                         CommentRepository commentRepository,
                         RecipeLikeRepository recipeLikeRepository,
                         SavedRecipeRepository savedRecipeRepository) {
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.recipeLikeRepository = recipeLikeRepository;
        this.savedRecipeRepository = savedRecipeRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipeDto> getAllRecipes(Category category, String searchQuery, User currentUser) {
        List<Recipe> recipes;

        if (searchQuery != null && !searchQuery.isBlank()) {
            recipes = recipeRepository.searchRecipes(searchQuery);
        } else if (category != null) {
            recipes = recipeRepository.findByCategoryOrderByCreatedAtDesc(category);
        } else {
            recipes = recipeRepository.findAllByOrderByCreatedAtDesc();
        }

        return recipes.stream()
                .map(r -> mapToRecipeDto(r, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RecipeDetailDto getRecipeDetails(Long id, User currentUser) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with ID: " + id));

        List<Comment> comments = commentRepository.findByRecipeIdOrderByCreatedAtAsc(id);

        return mapToRecipeDetailDto(recipe, comments, currentUser);
    }

    @Transactional
    public RecipeDetailDto createRecipe(RecipeCreateRequest request, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to create a recipe");
        }

        Recipe recipe = Recipe.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .coverImageUrl(request.getCoverImageUrl())
                .prepTime(request.getPrepTime())
                .cookTime(request.getCookTime())
                .servings(request.getServings())
                .difficulty(request.getDifficulty())
                .category(request.getCategory())
                .author(currentUser)
                .build();

        if (request.getIngredients() != null) {
            for (String name : request.getIngredients()) {
                Ingredient ingredient = Ingredient.builder().name(name).recipe(recipe).build();
                recipe.addIngredient(ingredient);
            }
        }

        if (request.getSteps() != null) {
            for (int i = 0; i < request.getSteps().size(); i++) {
                RecipeStep step = RecipeStep.builder()
                        .stepNumber(i + 1)
                        .description(request.getSteps().get(i))
                        .recipe(recipe)
                        .build();
                recipe.addStep(step);
            }
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        return getRecipeDetails(savedRecipe.getId(), currentUser);
    }

    @Transactional
    public RecipeDetailDto updateRecipe(Long id, RecipeCreateRequest request, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to update a recipe");
        }

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with ID: " + id));

        // Enforce ownership security check
        if (!recipe.getAuthor().getId().equals(currentUser.getId())) {
            throw new SecurityException("You do not own this recipe");
        }

        recipe.setTitle(request.getTitle());
        recipe.setDescription(request.getDescription());
        if (request.getCoverImageUrl() != null) {
            recipe.setCoverImageUrl(request.getCoverImageUrl());
        }
        recipe.setPrepTime(request.getPrepTime());
        recipe.setCookTime(request.getCookTime());
        recipe.setServings(request.getServings());
        recipe.setDifficulty(request.getDifficulty());
        recipe.setCategory(request.getCategory());

        // Refresh ingredients (orphanRemoval=true handles deletion of old child rows)
        recipe.getIngredients().clear();
        if (request.getIngredients() != null) {
            for (String name : request.getIngredients()) {
                Ingredient ingredient = Ingredient.builder().name(name).recipe(recipe).build();
                recipe.addIngredient(ingredient);
            }
        }

        // Refresh steps
        recipe.getSteps().clear();
        if (request.getSteps() != null) {
            for (int i = 0; i < request.getSteps().size(); i++) {
                RecipeStep step = RecipeStep.builder()
                        .stepNumber(i + 1)
                        .description(request.getSteps().get(i))
                        .recipe(recipe)
                        .build();
                recipe.addStep(step);
            }
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        return getRecipeDetails(savedRecipe.getId(), currentUser);
    }

    @Transactional
    public void deleteRecipe(Long id, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to delete a recipe");
        }

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with ID: " + id));

        // Enforce ownership security check
        if (!recipe.getAuthor().getId().equals(currentUser.getId())) {
            throw new SecurityException("You do not own this recipe");
        }

        recipeRepository.delete(recipe);
    }

    @Transactional
    public boolean toggleLike(Long recipeId, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to like a recipe");
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with ID: " + recipeId));

        // Note: We can block self-likes if desired, but here we allow it as a generic toggle behavior
        var existingLike = recipeLikeRepository.findByUserAndRecipe(currentUser, recipe);
        if (existingLike.isPresent()) {
            recipeLikeRepository.delete(existingLike.get());
            return false; // unliked
        } else {
            RecipeLike like = RecipeLike.builder()
                    .user(currentUser)
                    .recipe(recipe)
                    .build();
            recipeLikeRepository.save(like);
            return true; // liked
        }
    }

    @Transactional
    public boolean toggleSave(Long recipeId, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to bookmark a recipe");
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with ID: " + recipeId));

        var existingSave = savedRecipeRepository.findByUserAndRecipe(currentUser, recipe);
        if (existingSave.isPresent()) {
            savedRecipeRepository.delete(existingSave.get());
            return false; // unsaved
        } else {
            SavedRecipe save = SavedRecipe.builder()
                    .user(currentUser)
                    .recipe(recipe)
                    .build();
            savedRecipeRepository.save(save);
            return true; // saved
        }
    }

    @Transactional(readOnly = true)
    public List<RecipeDto> getSavedRecipes(User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to view bookmarks");
        }

        List<SavedRecipe> savedList = savedRecipeRepository.findByUserOrderByRecipeCreatedAtDesc(currentUser);
        return savedList.stream()
                .map(s -> mapToRecipeDto(s.getRecipe(), currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto addComment(Long recipeId, String content, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to comment");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with ID: " + recipeId));

        Comment comment = Comment.builder()
                .content(content.trim())
                .recipe(recipe)
                .user(currentUser)
                .build();

        Comment savedComment = commentRepository.save(comment);
        return mapToCommentDto(savedComment);
    }

    @Transactional
    public CommentDto editComment(Long commentId, String content, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to edit a comment");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with ID: " + commentId));

        // Enforce ownership security check
        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("You do not own this comment");
        }

        comment.setContent(content.trim());
        Comment savedComment = commentRepository.save(comment);
        return mapToCommentDto(savedComment);
    }

    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required to delete a comment");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with ID: " + commentId));

        // Enforce ownership security check
        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("You do not own this comment");
        }

        commentRepository.delete(comment);
    }

    // Mappers
    private RecipeDto mapToRecipeDto(Recipe r, User currentUser) {
        long likesCount = recipeLikeRepository.countByRecipe(r);
        boolean liked = currentUser != null && recipeLikeRepository.existsByUserAndRecipe(currentUser, r);
        boolean saved = currentUser != null && savedRecipeRepository.existsByUserAndRecipe(currentUser, r);

        return RecipeDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .coverImageUrl(r.getCoverImageUrl())
                .prepTime(r.getPrepTime())
                .cookTime(r.getCookTime())
                .servings(r.getServings())
                .difficulty(r.getDifficulty())
                .category(r.getCategory())
                .authorUsername(r.getAuthor().getUsername())
                .authorName(r.getAuthor().getName())
                .likesCount(likesCount)
                .likedByCurrentUser(liked)
                .savedByCurrentUser(saved)
                .createdAt(r.getCreatedAt())
                .build();
    }

    private RecipeDetailDto mapToRecipeDetailDto(Recipe r, List<Comment> comments, User currentUser) {
        long likesCount = recipeLikeRepository.countByRecipe(r);
        boolean liked = currentUser != null && recipeLikeRepository.existsByUserAndRecipe(currentUser, r);
        boolean saved = currentUser != null && savedRecipeRepository.existsByUserAndRecipe(currentUser, r);

        List<String> ingredients = r.getIngredients().stream().map(Ingredient::getName).collect(Collectors.toList());
        List<String> steps = r.getSteps().stream()
                .sorted((s1, s2) -> Integer.compare(s1.getStepNumber(), s2.getStepNumber()))
                .map(RecipeStep::getDescription)
                .collect(Collectors.toList());

        List<CommentDto> commentDtos = comments.stream().map(this::mapToCommentDto).collect(Collectors.toList());

        return RecipeDetailDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .coverImageUrl(r.getCoverImageUrl())
                .prepTime(r.getPrepTime())
                .cookTime(r.getCookTime())
                .servings(r.getServings())
                .difficulty(r.getDifficulty())
                .category(r.getCategory())
                .authorUsername(r.getAuthor().getUsername())
                .authorName(r.getAuthor().getName())
                .likesCount(likesCount)
                .likedByCurrentUser(liked)
                .savedByCurrentUser(saved)
                .createdAt(r.getCreatedAt())
                .ingredients(ingredients)
                .steps(steps)
                .comments(commentDtos)
                .build();
    }

    private CommentDto mapToCommentDto(Comment c) {
        return CommentDto.builder()
                .id(c.getId())
                .content(c.getContent())
                .authorUsername(c.getUser().getUsername())
                .authorName(c.getUser().getName())
                .authorProfilePictureUrl(c.getUser().getProfilePictureUrl())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
