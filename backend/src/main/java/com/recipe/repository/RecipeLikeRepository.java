package com.recipe.repository;

import com.recipe.entity.Recipe;
import com.recipe.entity.RecipeLike;
import com.recipe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Repository
public interface RecipeLikeRepository extends JpaRepository<RecipeLike, Long> {
    boolean existsByUserAndRecipe(User user, Recipe recipe);
    Optional<RecipeLike> findByUserAndRecipe(User user, Recipe recipe);
    long countByRecipe(Recipe recipe);

    @Query("SELECT COUNT(l) FROM RecipeLike l WHERE l.recipe.author.id = :userId")
    long countLikesReceivedByUserId(@Param("userId") Long userId);
}
