package com.recipe.repository;

import com.recipe.entity.Category;
import com.recipe.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    
    List<Recipe> findAllByOrderByCreatedAtDesc();
    
    List<Recipe> findByCategoryOrderByCreatedAtDesc(Category category);
    
    List<Recipe> findByAuthorUsernameOrderByCreatedAtDesc(String username);
    
    @Query("SELECT DISTINCT r FROM Recipe r " +
           "LEFT JOIN r.ingredients i " +
           "LEFT JOIN r.author a " +
           "WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(i.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.username) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(r.category) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY r.createdAt DESC")
    List<Recipe> searchRecipes(@Param("query") String query);
}
