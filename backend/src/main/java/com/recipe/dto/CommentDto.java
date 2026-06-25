package com.recipe.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDto {
    private Long id;
    private String content;
    private String authorUsername;
    private String authorName;
    private String authorProfilePictureUrl;
    private LocalDateTime createdAt;
}
