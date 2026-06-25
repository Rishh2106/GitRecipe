package com.recipe.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "saved_recipes",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "recipe_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;
}
