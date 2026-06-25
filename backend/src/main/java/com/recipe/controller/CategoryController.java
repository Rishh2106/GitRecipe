package com.recipe.controller;

import com.recipe.entity.Category;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @GetMapping
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(Arrays.asList(Category.values()));
    }
}
