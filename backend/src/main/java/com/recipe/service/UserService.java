package com.recipe.service;

import com.recipe.dto.UserDto;
import com.recipe.entity.User;
import com.recipe.repository.RecipeLikeRepository;
import com.recipe.repository.RecipeRepository;
import com.recipe.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeLikeRepository recipeLikeRepository;

    public UserService(UserRepository userRepository,
                       RecipeRepository recipeRepository,
                       RecipeLikeRepository recipeLikeRepository) {
        this.userRepository = userRepository;
        this.recipeRepository = recipeRepository;
        this.recipeLikeRepository = recipeLikeRepository;
    }

    public UserDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));

        long recipeCount = recipeRepository.findByAuthorUsernameOrderByCreatedAtDesc(username).size();
        long likesReceived = recipeLikeRepository.countLikesReceivedByUserId(user.getId());

        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .profilePictureUrl(user.getProfilePictureUrl())
                .joinDate(user.getJoinDate())
                .recipeCount(recipeCount)
                .likesReceived(likesReceived)
                .build();
    }

    @Transactional
    public UserDto updateProfile(User currentUser, String bio, String profilePictureUrl) {
        if (currentUser == null) {
            throw new IllegalStateException("Authentication required");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (bio != null) {
            user.setBio(bio);
        }
        if (profilePictureUrl != null) {
            user.setProfilePictureUrl(profilePictureUrl);
        }

        userRepository.save(user);

        return getUserProfile(user.getUsername());
    }
}
