package com.recipe.repository;

import com.recipe.entity.Recipe;
import com.recipe.entity.SavedRecipe;
import com.recipe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedRecipeRepository extends JpaRepository<SavedRecipe, Long> {
    boolean existsByUserAndRecipe(User user, Recipe recipe);
    Optional<SavedRecipe> findByUserAndRecipe(User user, Recipe recipe);
    List<SavedRecipe> findByUserOrderByRecipeCreatedAtDesc(User user);
}
