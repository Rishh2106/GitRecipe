# GitRecipe (V1)

GitRecipe is a modern, interactive web application designed for food lovers and chefs to discover, share, bookmark, and discuss culinary recipes. It features a robust Spring Boot REST backend secured with JWT and a premium, responsive HTML/CSS/JS Single-Page Application (SPA) styled using the custom Modern-Organic ("Heirloom & Hearth") design language.

---

## Key Features

- **Stateless Authentication**: Register and login securely. Session persistence and API authentication are managed via JSON Web Tokens (JWT).
- **Recipe Management**: Create, edit, and delete recipes. Supports dynamic forms to add ingredients and step-by-step instructions.
- **Modern-Organic Design**: Sun-drenched kitchen aesthetic styled with warm cream backgrounds, custom ambient shadows, rounded container geometry, and high-quality typography (Plus Jakarta Sans headings and Source Serif 4 body text).
- **Robust Image Uploads**: Upload recipe covers and profile pictures. Integrates with Cloudinary for CDN delivery, with a zero-config local disk storage fallback if Cloudinary credentials are not configured.
- **Discussion Threads**: Chronological flat comment feeds under recipes, allowing comment owners to edit or delete their posts.
- **Community Engagement**: Toggle likes and save recipes to your private cookbook bookmarks.
- **Universal Search**: Instantly query recipes by title, category, author username, or ingredients.
- **Interactive API Documentation**: Out-of-the-box Swagger UI for exploring and testing REST endpoints.

---

## Technology Stack

### Backend
- **Java 25 (LTS)**
- **Spring Boot 4.0** (Spring Web, Spring Security, Spring Data JPA, Spring Validation)
- **Hibernate / MySQL 8** (JPA Object-Relational Mapping and Database persistence)
- **JJWT (Java JWT)** (For signing and validating stateless authentication tokens)
- **Cloudinary Java SDK** (For recipe cover and avatar photo uploads)
- **SpringDoc OpenAPI (Swagger UI)** (Interactive REST API documentation)
- **Lombok** (Boilerplate reduction)
- **H2 Database** (Test-scoped in-memory database for isolated unit tests)

### Frontend
- **HTML5 / CSS3 (Custom Vanilla CSS)**
- **JavaScript (ES6+ Vanilla SPA Router & Client-side Controllers)**
- **Axios** (REST API requests and authorization token interception)
- **Bootstrap 5 & Bootstrap Icons** (Responsive layout and icon library)

---

## Directory Structure

```text
GitRecipe
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/recipe/      # Entities, Repositories, Services, Controllers
│   │   │   └── resources/
│   │   │       └── application.properties # Main MySQL database & Cloudinary settings
│   │   └── test/                     # Context and integration unit tests
│   └── pom.xml                       # Maven dependency tree
├── frontend/
│   └── recipe-hub-frontend/
│       ├── index.html                # App shell HTML container
│       ├── index.css                 # Custom glassmorphism & typography CSS rules
│       └── app.js                    # SPA state router and Axios client
└── README.md                         # Project documentation
```

---

## Getting Started

### Prerequisites
- **Java 25 JDK** installed.
- **Maven 3.x** installed (or use the included `./mvnw` script wrapper).
- **MySQL 8.x Server** running locally.

### 1. Database Setup
Ensure that your MySQL server is running, and create a new schema named `gitrecipe`:
```sql
CREATE DATABASE gitrecipe;
```
*Note: Hibernate will automatically create and update the database tables (users, recipes, ingredients, recipe_steps, comments, recipe_likes, saved_recipes) on startup.*

### 2. Configure Backend Credentials
Open [backend/src/main/resources/application.properties](file:///c:/Users/rishi/Desktop/prac/GitRecipe/backend/src/main/resources/application.properties) and customize settings to fit your local environment:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/gitrecipe
spring.datasource.username=root
spring.datasource.password=your_mysql_password

# JWT Settings (256-bit hex signing key)
jwt.secret=9a4f2c8d3b7a1e5f8g2h6k3m9n4p7q8r1s5t6u3v9w2x4y7z8a1b2c3d4e5f6g7h

# Cloudinary Credentials (Optional - Falls back to local directory uploads if default)
cloudinary.cloud-name=your_cloudinary_cloud_name
cloudinary.api-key=your_cloudinary_api_key
cloudinary.api-secret=your_cloudinary_api_secret
```

### 3. Run the Backend
From the `backend` directory, start the Spring Boot server:
```bash
# Windows
./mvnw.cmd spring-boot:run

# macOS/Linux
./mvnw spring-boot:run
```
The server will boot on `http://localhost:8080`.

### 4. Run the Frontend
Simply open [frontend/recipe-hub-frontend/index.html](file:///c:/Users/rishi/Desktop/prac/GitRecipe/frontend/recipe-hub-frontend/index.html) in your favorite browser. No complex package installations or node dependencies are required!
*Alternatively, you can serve the directory statically, for example, using Node:*
```bash
npx serve frontend/recipe-hub-frontend
```

---

## API Testing & Documentation
Once the backend is running, explore the fully interactive API docs on:
**[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**

### Running Automated Tests
Run compiled test cases to ensure the project works:
```bash
./mvnw.cmd test
```
*Tests utilize an isolated, in-memory H2 database, requiring no MySQL server connection to pass.*
