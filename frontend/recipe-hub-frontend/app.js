// Core API Client Configuration
const API_BASE_URL = 'http://localhost:8080';
const api = axios.create({
    baseURL: API_BASE_URL
});

// Attach Token Interceptor
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Session Expiration Interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            if (localStorage.getItem('token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateNav();
                navigateTo('login');
                showToast('Your session has expired. Please login again.', 'danger');
            }
        }
        return Promise.reject(error);
    }
);

// Global App State
let state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    currentCategory: null,
    currentSearch: null
};

// Toast Handler
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('app-toast');
    const toastMsgEl = document.getElementById('toast-message');
    
    toastEl.className = `toast align-items-center text-white border-0 glass-card bg-${type === 'success' ? 'success' : 'danger'}`;
    toastMsgEl.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}

// Router and Navigation helpers
function navigateTo(hash) {
    window.location.hash = hash;
}

// Update Navbar based on logged-in state
function updateNav() {
    const user = state.user;
    const guestElements = document.querySelectorAll('.guest-only');
    const userElements = document.querySelectorAll('.user-only');
    
    if (user) {
        guestElements.forEach(el => el.classList.add('d-none'));
        userElements.forEach(el => el.classList.remove('d-none'));
        
        document.getElementById('nav-user-name').textContent = user.name;
        document.getElementById('nav-user-avatar').src = user.profilePictureUrl ? (user.profilePictureUrl.startsWith('/') ? API_BASE_URL + user.profilePictureUrl : user.profilePictureUrl) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';
        document.getElementById('my-profile-link').href = `#profile/${user.username}`;
    } else {
        guestElements.forEach(el => el.classList.remove('d-none'));
        userElements.forEach(el => el.classList.add('d-none'));
    }
}

// Handle Page Routing
async function router() {
    const hash = window.location.hash || '#explore';
    const appContainer = document.getElementById('app-container');
    
    // Clear search inputs if moving away from search
    if (!hash.startsWith('#explore')) {
        document.getElementById('search-input').value = '';
        state.currentSearch = null;
    }
    
    // Auth route guards
    const protectedRoutes = ['#create-recipe', '#edit-recipe', '#bookmarks', '#settings'];
    const isProtected = protectedRoutes.some(route => hash.startsWith(route));
    if (isProtected && !state.user) {
        navigateTo('login');
        showToast('Please register or log in to access this page.', 'danger');
        return;
    }
    
    try {
        if (hash === '#explore') {
            await renderExplore(appContainer);
        } else if (hash.startsWith('#explore/category/')) {
            const category = hash.split('/').pop();
            state.currentCategory = category;
            await renderExplore(appContainer);
        } else if (hash === '#login') {
            renderLogin(appContainer);
        } else if (hash === '#register') {
            renderRegister(appContainer);
        } else if (hash === '#bookmarks') {
            await renderBookmarks(appContainer);
        } else if (hash === '#create-recipe') {
            renderRecipeForm(appContainer);
        } else if (hash.startsWith('#edit-recipe/')) {
            const recipeId = hash.split('/').pop();
            await renderRecipeForm(appContainer, recipeId);
        } else if (hash.startsWith('#recipe/')) {
            const recipeId = hash.split('/').pop();
            await renderRecipeDetails(appContainer, recipeId);
        } else if (hash.startsWith('#profile/')) {
            const username = hash.split('/').pop();
            await renderProfile(appContainer, username);
        } else if (hash === '#settings') {
            await renderSettings(appContainer);
        } else {
            // Default Fallback
            appContainer.innerHTML = `
                <div class="text-center py-5 animated-view">
                    <h2 class="text-danger"><i class="bi bi-exclamation-triangle"></i> 404</h2>
                    <p class="text-muted">Oops! The page you are looking for does not exist.</p>
                    <a href="#explore" class="btn btn-action-gradient px-4">Go Home</a>
                </div>
            `;
        }
    } catch (err) {
        console.error(err);
        appContainer.innerHTML = `
            <div class="text-center py-5 animated-view">
                <h3 class="text-danger"><i class="bi bi-x-circle"></i> Error Loading Page</h3>
                <p class="text-muted">${err.response?.data?.error || err.message || 'An error occurred.'}</p>
                <a href="#explore" class="btn btn-glass-secondary px-4 mt-3">Back to Explore</a>
            </div>
        `;
    }
}

// ----------------------------------------------------
// VIEW RENDERERS
// ----------------------------------------------------

// Render EXPLORE PAGE / HOME FEED
async function renderExplore(container) {
    container.innerHTML = `
        <div class="text-center py-4 animated-view">
            <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;"></div>
        </div>
    `;
    
    // Fetch Categories
    let categories = [];
    try {
        const catRes = await api.get('/api/categories');
        categories = catRes.data;
    } catch (e) {
        console.error('Could not load categories', e);
    }
    
    // Fetch Recipes
    let url = '/api/recipes';
    const params = {};
    if (state.currentCategory) {
        params.category = state.currentCategory;
    }
    if (state.currentSearch) {
        params.search = state.currentSearch;
    }
    
    const recipesRes = await api.get(url, { params });
    const recipes = recipesRes.data;
    
    // Render HTML Structure
    let html = `
        <div class="animated-view">
            <!-- Hero Header -->
            ${!state.currentSearch && !state.currentCategory ? `
                <header class="hero-section">
                    <h1 class="hero-title">Heirloom & Hearth</h1>
                    <p class="hero-subtitle">Discover, bookmark, and share culinary recipes with food lovers all over the world.</p>
                    ${!state.user ? '<a href="#register" class="btn btn-action-gradient btn-lg px-5 py-3">Get Started Free</a>' : ''}
                </header>
            ` : ''}
            
            <!-- Category Filter Slider -->
            <div class="category-filter-container">
                <button class="category-btn ${!state.currentCategory ? 'active' : ''}" onclick="filterByCategory('')">All Recipes</button>
                ${categories.map(cat => `
                    <button class="category-btn ${state.currentCategory === cat ? 'active' : ''}" onclick="filterByCategory('${cat}')">
                        ${cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                `).join('')}
            </div>
            
            <!-- Search Results Meta -->
            ${state.currentSearch ? `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>Search Results for "${state.currentSearch}"</h4>
                    <button class="btn btn-glass-secondary btn-sm" onclick="clearSearch()"><i class="bi bi-x-circle"></i> Clear</button>
                </div>
            ` : ''}
            
            ${state.currentCategory && !state.currentSearch ? `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>Category: ${state.currentCategory.charAt(0) + state.currentCategory.slice(1).toLowerCase()}</h4>
                    <button class="btn btn-glass-secondary btn-sm" onclick="filterByCategory('')"><i class="bi bi-x-circle"></i> Clear</button>
                </div>
            ` : ''}

            <!-- Recipes Grid -->
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                ${recipes.length === 0 ? `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-journals fs-1 text-muted"></i>
                        <p class="text-muted mt-3">No recipes found matching these filters.</p>
                    </div>
                ` : recipes.map(recipe => renderRecipeCard(recipe)).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Single Recipe Card HTML utility
function renderRecipeCard(recipe) {
    const isLiked = recipe.likedByCurrentUser;
    const isSaved = recipe.savedByCurrentUser;
    const imgUrl = recipe.coverImageUrl ? (recipe.coverImageUrl.startsWith('/') ? API_BASE_URL + recipe.coverImageUrl : recipe.coverImageUrl) : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=400';
    
    return `
        <div class="col">
            <div class="card h-100 glass-card">
                <img src="${imgUrl}" class="card-img-top recipe-card-img" alt="${recipe.title}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="category-badge">${recipe.category.toLowerCase()}</span>
                        <span class="difficulty-badge difficulty-${recipe.difficulty.toLowerCase()}">${recipe.difficulty.toLowerCase()}</span>
                    </div>
                    <h5 class="card-title text-truncate mb-1">${escapeHtml(recipe.title)}</h5>
                    <p class="recipe-stats mb-3"><i class="bi bi-person"></i> By <a href="#profile/${recipe.authorUsername}" class="recipe-author">${recipe.authorName}</a></p>
                    <p class="card-text text-muted text-truncate-2 flex-grow-1">${escapeHtml(recipe.description)}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary-subtle">
                        <span class="recipe-stats"><i class="bi bi-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                        <div class="card-actions">
                            <button class="btn btn-link text-white p-0 me-3" onclick="toggleCardLike(event, ${recipe.id})">
                                <i class="bi ${isLiked ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i> <span class="likes-count-${recipe.id}">${recipe.likesCount}</span>
                            </button>
                            <button class="btn btn-link text-white p-0 me-3" onclick="toggleCardSave(event, ${recipe.id})">
                                <i class="bi ${isSaved ? 'bi-bookmark-star-fill text-warning' : 'bi-bookmark-star'}"></i>
                            </button>
                            <a href="#recipe/${recipe.id}" class="btn btn-action-gradient btn-sm px-3">View</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Filter Actions
window.filterByCategory = function(cat) {
    state.currentCategory = cat || null;
    navigateTo(`explore${cat ? `/category/${cat}` : ''}`);
};

window.clearSearch = function() {
    state.currentSearch = null;
    document.getElementById('search-input').value = '';
    router();
};

// Toggle likes / saves directly from Cards
window.toggleCardLike = async function(event, recipeId) {
    event.preventDefault();
    if (!state.user) {
        navigateTo('login');
        showToast('You must be logged in to like recipes.', 'danger');
        return;
    }
    try {
        const res = await api.post(`/api/recipes/${recipeId}/like`);
        const liked = res.data.liked;
        const iconEl = event.currentTarget.querySelector('i');
        const countEl = document.querySelector(`.likes-count-${recipeId}`);
        let count = parseInt(countEl.textContent);
        
        if (liked) {
            iconEl.className = 'bi bi-heart-fill text-danger';
            count++;
        } else {
            iconEl.className = 'bi bi-heart';
            count--;
        }
        countEl.textContent = count;
        showToast(liked ? 'Added to liked list' : 'Removed from liked list');
    } catch (e) {
        showToast(e.response?.data?.error || 'Like toggle failed', 'danger');
    }
};

window.toggleCardSave = async function(event, recipeId) {
    event.preventDefault();
    if (!state.user) {
        navigateTo('login');
        showToast('You must be logged in to bookmark recipes.', 'danger');
        return;
    }
    try {
        const res = await api.post(`/api/recipes/${recipeId}/save`);
        const saved = res.data.saved;
        const iconEl = event.currentTarget.querySelector('i');
        iconEl.className = saved ? 'bi bi-bookmark-star-fill text-warning' : 'bi-bookmark-star';
        showToast(saved ? 'Recipe saved to bookmarks' : 'Removed from bookmarks');
    } catch (e) {
        showToast(e.response?.data?.error || 'Save toggle failed', 'danger');
    }
};

// Render BOOKMARKS
async function renderBookmarks(container) {
    container.innerHTML = `
        <div class="text-center py-4 animated-view">
            <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;"></div>
        </div>
    `;
    
    const res = await api.get('/api/recipes/saved');
    const recipes = res.data;
    
    container.innerHTML = `
        <div class="animated-view">
            <h2 class="mb-4"><i class="bi bi-bookmark-star text-warning"></i> My Bookmarks</h2>
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                ${recipes.length === 0 ? `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-bookmark-x fs-1 text-muted"></i>
                        <p class="text-muted mt-3">You haven't bookmarked any recipes yet.</p>
                        <a href="#explore" class="btn btn-action-gradient mt-2">Explore Recipes</a>
                    </div>
                ` : recipes.map(recipe => renderRecipeCard(recipe)).join('')}
            </div>
        </div>
    `;
}

// Render RECIPE DETAILS PAGE
async function renderRecipeDetails(container, recipeId) {
    container.innerHTML = `
        <div class="text-center py-4 animated-view">
            <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;"></div>
        </div>
    `;
    
    const res = await api.get(`/api/recipes/${recipeId}`);
    const recipe = res.data;
    const isAuthor = state.user && state.user.username === recipe.authorUsername;
    const imgUrl = recipe.coverImageUrl ? (recipe.coverImageUrl.startsWith('/') ? API_BASE_URL + recipe.coverImageUrl : recipe.coverImageUrl) : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800';
    
    container.innerHTML = `
        <div class="row animated-view g-5">
            <!-- Left Info Column -->
            <div class="col-lg-7">
                <img src="${imgUrl}" class="recipe-detail-header-img mb-4" alt="${recipe.title}">
                
                <h1 class="mb-2">${escapeHtml(recipe.title)}</h1>
                <p class="text-muted">Published by <a href="#profile/${recipe.authorUsername}" class="recipe-author fs-5">${recipe.authorName}</a> on ${new Date(recipe.createdAt).toLocaleDateString()}</p>
                
                <div class="d-flex gap-2 mb-4">
                    <span class="category-badge">${recipe.category.toLowerCase()}</span>
                    <span class="difficulty-badge difficulty-${recipe.difficulty.toLowerCase()}">${recipe.difficulty.toLowerCase()}</span>
                </div>
                
                <p class="fs-5 text-secondary-emphasis mb-5 border-start border-primary border-4 ps-3">${escapeHtml(recipe.description)}</p>
                
                <!-- Ingredients -->
                <h3 class="mb-4"><i class="bi bi-egg-fried text-primary me-2"></i> Ingredients</h3>
                <div class="glass-card p-4 mb-5">
                    ${recipe.ingredients.map(ing => `
                        <div class="list-ingredient-item">
                            <span class="ingredient-bullet">&#10004;</span>
                            <span>${escapeHtml(ing)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Steps -->
                <h3 class="mb-4"><i class="bi bi-list-ol text-primary me-2"></i> Cooking Instructions</h3>
                <div class="mb-5">
                    ${recipe.steps.map((step, idx) => `
                        <div class="list-step-item">
                            <div class="step-num-badge">${idx + 1}</div>
                            <div class="fs-6 mt-1 text-light-emphasis">${escapeHtml(step)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Right Actions and Comments Column -->
            <div class="col-lg-5">
                <!-- Meta stats -->
                <div class="glass-card p-4 mb-4">
                    <h5 class="mb-3 border-bottom pb-2">Recipe Details</h5>
                    <div class="row g-3">
                        <div class="col-4">
                            <div class="meta-info-pill">
                                <div class="meta-info-title">Prep</div>
                                <div class="meta-info-val">${recipe.prepTime}m</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="meta-info-pill">
                                <div class="meta-info-title">Cook</div>
                                <div class="meta-info-val">${recipe.cookTime}m</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="meta-info-pill">
                                <div class="meta-info-title">Serves</div>
                                <div class="meta-info-val">${recipe.servings}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="interactive-actions mt-4">
                        <button class="btn btn-like ${recipe.likedByCurrentUser ? 'active' : ''}" id="detail-like-btn">
                            <i class="bi ${recipe.likedByCurrentUser ? 'bi-heart-fill' : 'bi-heart'}"></i> Like (<span id="detail-likes-count">${recipe.likesCount}</span>)
                        </button>
                        <button class="btn btn-bookmark-action ${recipe.savedByCurrentUser ? 'active' : ''}" id="detail-save-btn">
                            <i class="bi ${recipe.savedByCurrentUser ? 'bi-bookmark-star-fill' : 'bi-bookmark-star'}"></i> Save
                        </button>
                    </div>

                    <!-- Author Action Buttons -->
                    ${isAuthor ? `
                        <div class="d-flex gap-2 mt-3">
                            <a href="#edit-recipe/${recipe.id}" class="btn btn-glass-secondary flex-grow-1"><i class="bi bi-pencil"></i> Edit Recipe</a>
                            <button class="btn btn-outline-danger flex-grow-1" id="delete-recipe-btn"><i class="bi bi-trash"></i> Delete</button>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Comments Discussion -->
                <div class="glass-card p-4">
                    <h4 class="mb-4">Discussion (${recipe.comments.length})</h4>
                    
                    <!-- Write Comment -->
                    ${state.user ? `
                        <form id="comment-form" class="mb-4">
                            <div class="mb-3">
                                <textarea class="form-control glass-input" id="comment-input" rows="3" placeholder="Add a comment..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-action-gradient btn-sm px-4">Comment</button>
                        </form>
                    ` : `
                        <div class="alert alert-secondary glass-card border-0 mb-4 py-3 text-center">
                            Please <a href="#login" class="text-primary font-weight-bold">login</a> to join the discussion.
                        </div>
                    `}
                    
                    <!-- Comments List -->
                    <div class="comments-list">
                        ${recipe.comments.length === 0 ? `
                            <p class="text-muted text-center py-3">No comments yet. Start the conversation!</p>
                        ` : recipe.comments.map(c => renderCommentItem(c)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Wire up Detail View Interactions
    document.getElementById('detail-like-btn').addEventListener('click', async () => {
        if (!state.user) { navigateTo('login'); return; }
        try {
            const res = await api.post(`/api/recipes/${recipeId}/like`);
            const liked = res.data.liked;
            const btn = document.getElementById('detail-like-btn');
            const countEl = document.getElementById('detail-likes-count');
            let count = parseInt(countEl.textContent);
            
            if (liked) {
                btn.classList.add('active');
                btn.querySelector('i').className = 'bi bi-heart-fill';
                count++;
            } else {
                btn.classList.remove('active');
                btn.querySelector('i').className = 'bi bi-heart';
                count--;
            }
            countEl.textContent = count;
            showToast(liked ? 'Recipe liked!' : 'Like removed.');
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to toggle like', 'danger');
        }
    });

    document.getElementById('detail-save-btn').addEventListener('click', async () => {
        if (!state.user) { navigateTo('login'); return; }
        try {
            const res = await api.post(`/api/recipes/${recipeId}/save`);
            const saved = res.data.saved;
            const btn = document.getElementById('detail-save-btn');
            
            if (saved) {
                btn.classList.add('active');
                btn.querySelector('i').className = 'bi bi-bookmark-star-fill';
                showToast('Recipe bookmarked!');
            } else {
                btn.classList.remove('active');
                btn.querySelector('i').className = 'bi bi-bookmark-star';
                showToast('Removed from bookmarks.');
            }
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to bookmark', 'danger');
        }
    });

    if (isAuthor) {
        document.getElementById('delete-recipe-btn').addEventListener('click', async () => {
            if (confirm('Are you absolutely sure you want to delete this recipe? This action cannot be undone.')) {
                try {
                    await api.delete(`/api/recipes/${recipeId}`);
                    showToast('Recipe deleted successfully');
                    navigateTo('explore');
                } catch (e) {
                    showToast(e.response?.data?.error || 'Failed to delete recipe', 'danger');
                }
            }
        });
    }

    const cForm = document.getElementById('comment-form');
    if (cForm) {
        cForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('comment-input');
            const content = input.value.trim();
            if (!content) return;
            
            try {
                const res = await api.post(`/api/recipes/${recipeId}/comments`, { content });
                input.value = '';
                showToast('Comment posted!');
                await renderRecipeDetails(container, recipeId); // refresh
            } catch (err) {
                showToast(err.response?.data?.error || 'Failed to post comment', 'danger');
            }
        });
    }
}

// Single Comment Item HTML helper
function renderCommentItem(comment) {
    const isCommentOwner = state.user && state.user.username === comment.authorUsername;
    const avatar = comment.authorProfilePictureUrl ? (comment.authorProfilePictureUrl.startsWith('/') ? API_BASE_URL + comment.authorProfilePictureUrl : comment.authorProfilePictureUrl) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';
    
    return `
        <div class="comment-box">
            <img src="${avatar}" alt="Avatar" class="comment-avatar">
            <div class="comment-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <a href="#profile/${comment.authorUsername}" class="comment-author-name text-decoration-none text-light-emphasis">${comment.authorName}</a>
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()} ${new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    ${isCommentOwner ? `
                        <div class="dropdown">
                            <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu glass-dropdown">
                                <li><a class="dropdown-item" href="#" onclick="editCommentPrompt(event, ${comment.id}, '${escapeQuote(comment.content)}')"><i class="bi bi-pencil me-2"></i> Edit</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteComment(event, ${comment.id})"><i class="bi bi-trash me-2"></i> Delete</a></li>
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-content" id="comment-text-${comment.id}">${escapeHtml(comment.content)}</div>
            </div>
        </div>
    `;
}

// Edit/Delete comment functions
window.editCommentPrompt = async function(event, commentId, oldContent) {
    event.preventDefault();
    const newContent = prompt('Edit your comment:', oldContent);
    if (newContent === null) return;
    const content = newContent.trim();
    if (!content) return;
    
    try {
        await api.put(`/api/comments/${commentId}`, { content });
        showToast('Comment updated');
        router(); // refresh
    } catch (e) {
        showToast(e.response?.data?.error || 'Failed to update comment', 'danger');
    }
};

window.deleteComment = async function(event, commentId) {
    event.preventDefault();
    if (confirm('Delete this comment?')) {
        try {
            await api.delete(`/api/comments/${commentId}`);
            showToast('Comment deleted');
            router(); // refresh
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to delete comment', 'danger');
        }
    }
};

// Render CREATE / EDIT RECIPE FORM
async function renderRecipeForm(container, recipeId = null) {
    const isEdit = !!recipeId;
    let recipe = null;
    
    if (isEdit) {
        container.innerHTML = `
            <div class="text-center py-4 animated-view">
                <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;"></div>
            </div>
        `;
        const res = await api.get(`/api/recipes/${recipeId}`);
        recipe = res.data;
        // Verify owner before showing edit form
        if (state.user.username !== recipe.authorUsername) {
            navigateTo('explore');
            showToast('Access denied: You do not own this recipe.', 'danger');
            return;
        }
    }
    
    // Load categories
    const catRes = await api.get('/api/categories');
    const categories = catRes.data;
    
    const initialIngredients = isEdit ? recipe.ingredients : [''];
    const initialSteps = isEdit ? recipe.steps : [''];
    
    container.innerHTML = `
        <div class="card glass-card p-4 p-md-5 max-width-750 mx-auto animated-view">
            <h2 class="mb-4"><i class="bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle-dotted'} text-primary me-2"></i> ${isEdit ? 'Edit Recipe' : 'Publish Recipe'}</h2>
            
            <form id="recipe-submit-form">
                <!-- Basic info -->
                <div class="mb-4">
                    <label class="form-label">Recipe Title</label>
                    <input type="text" class="form-control glass-input" id="recipe-title" placeholder="e.g. Grandma's Famous Spaghetti" value="${isEdit ? escapeHtml(recipe.title) : ''}" required>
                </div>
                
                <div class="mb-4">
                    <label class="form-label">Description</label>
                    <textarea class="form-control glass-input" id="recipe-description" rows="3" placeholder="Briefly describe your dish..." required>${isEdit ? escapeHtml(recipe.description) : ''}</textarea>
                </div>
                
                <!-- Image upload custom area -->
                <div class="mb-4">
                    <label class="form-label">Recipe Cover Image</label>
                    <div class="image-upload-wrapper" id="image-upload-zone">
                        <input type="file" id="image-file-input" accept="image/*" class="d-none">
                        <input type="hidden" id="recipe-cover-url" value="${isEdit ? recipe.coverImageUrl || '' : ''}">
                        
                        <div class="preview-container ${isEdit && recipe.coverImageUrl ? '' : 'd-none'}" id="upload-preview-container">
                            <img src="${isEdit ? recipe.coverImageUrl : ''}" alt="Cover Preview" id="upload-preview-img" class="mb-3">
                            <p class="text-muted small">Click to change cover image</p>
                        </div>
                        
                        <div class="upload-placeholder ${isEdit && recipe.coverImageUrl ? 'd-none' : ''}" id="upload-placeholder-el">
                            <i class="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                            <h5 class="mt-2">Drag & drop or click to upload</h5>
                            <p class="text-muted small">Supports JPG, PNG, WebP up to 10MB</p>
                        </div>
                    </div>
                </div>
                
                <!-- Specs: prep, cook, servings, difficulty, category -->
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <label class="form-label">Prep Time (min)</label>
                        <input type="number" class="form-control glass-input" id="recipe-prep-time" min="1" value="${isEdit ? recipe.prepTime : 15}" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Cook Time (min)</label>
                        <input type="number" class="form-control glass-input" id="recipe-cook-time" min="0" value="${isEdit ? recipe.cookTime : 30}" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Servings</label>
                        <input type="number" class="form-control glass-input" id="recipe-servings" min="1" value="${isEdit ? recipe.servings : 4}" required>
                    </div>
                </div>
                
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <label class="form-label">Difficulty</label>
                        <select class="form-select glass-input" id="recipe-difficulty" required>
                            <option value="EASY" ${isEdit && recipe.difficulty === 'EASY' ? 'selected' : ''}>Easy</option>
                            <option value="MEDIUM" ${isEdit && recipe.difficulty === 'MEDIUM' ? 'selected' : 'DEFAULT'}>Medium</option>
                            <option value="HARD" ${isEdit && recipe.difficulty === 'HARD' ? 'selected' : ''}>Hard</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Category</label>
                        <select class="form-select glass-input" id="recipe-category" required>
                            ${categories.map(cat => `
                                <option value="${cat}" ${isEdit && recipe.category === cat ? 'selected' : ''}>
                                    ${cat.charAt(0) + cat.slice(1).toLowerCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <!-- Ingredients Section -->
                <div class="mb-4">
                    <label class="form-label d-flex justify-content-between align-items-center">
                        <span>Ingredients List</span>
                        <button type="button" class="btn btn-action-gradient btn-sm px-3" onclick="addIngredientInput()"><i class="bi bi-plus-lg"></i> Add</button>
                    </label>
                    <div id="ingredients-container">
                        ${initialIngredients.map((ing, index) => renderIngredientInputRow(ing, index)).join('')}
                    </div>
                </div>
                
                <!-- Cooking steps -->
                <div class="mb-4">
                    <label class="form-label d-flex justify-content-between align-items-center">
                        <span>Preparation Steps</span>
                        <button type="button" class="btn btn-action-gradient btn-sm px-3" onclick="addStepInput()"><i class="bi bi-plus-lg"></i> Add</button>
                    </label>
                    <div id="steps-container">
                        ${initialSteps.map((step, index) => renderStepInputRow(step, index)).join('')}
                    </div>
                </div>
                
                <!-- Buttons -->
                <div class="d-flex gap-3 mt-5">
                    <button type="submit" class="btn btn-action-gradient px-5 py-2">${isEdit ? 'Save Changes' : 'Publish Recipe'}</button>
                    <a href="${isEdit ? `#recipe/${recipe.id}` : '#explore'}" class="btn btn-glass-secondary px-4 py-2">Cancel</a>
                </div>
            </form>
        </div>
    `;
    
    // Wire up file uploads inside forms
    const uploadZone = document.getElementById('image-upload-zone');
    const fileInput = document.getElementById('image-file-input');
    const previewContainer = document.getElementById('upload-preview-container');
    const previewImg = document.getElementById('upload-preview-img');
    const placeholder = document.getElementById('upload-placeholder-el');
    const hiddenUrlInput = document.getElementById('recipe-cover-url');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        
        // Show placeholder loading UI
        placeholder.innerHTML = `<div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Uploading image to Cloudinary...</p>`;
        placeholder.classList.remove('d-none');
        previewContainer.classList.add('d-none');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await api.post('/api/images/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const url = res.data.imageUrl;
            hiddenUrlInput.value = url;
            
            previewImg.src = url.startsWith('/') ? API_BASE_URL + url : url;
            placeholder.classList.add('d-none');
            previewContainer.classList.remove('d-none');
            showToast('Image uploaded successfully!');
        } catch (e) {
            // Restore placeholder
            placeholder.innerHTML = `
                <i class="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                <h5 class="mt-2">Drag & drop or click to upload</h5>
                <p class="text-muted small">Supports JPG, PNG, WebP up to 10MB</p>
            `;
            showToast('Image upload failed: ' + (e.response?.data?.error || e.message), 'danger');
        }
    });

    // Form submission
    document.getElementById('recipe-submit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Extract ingredients
        const ingInputs = document.querySelectorAll('.ingredient-item-input');
        const ingredients = Array.from(ingInputs).map(i => i.value.trim()).filter(v => v !== '');
        
        // Extract steps
        const stepInputs = document.querySelectorAll('.step-item-input');
        const steps = Array.from(stepInputs).map(s => s.value.trim()).filter(v => v !== '');
        
        if (ingredients.length === 0) {
            showToast('Please enter at least one ingredient', 'danger');
            return;
        }
        
        if (steps.length === 0) {
            showToast('Please enter at least one instruction step', 'danger');
            return;
        }
        
        const payload = {
            title: document.getElementById('recipe-title').value.trim(),
            description: document.getElementById('recipe-description').value.trim(),
            coverImageUrl: hiddenUrlInput.value || null,
            prepTime: parseInt(document.getElementById('recipe-prep-time').value),
            cookTime: parseInt(document.getElementById('recipe-cook-time').value),
            servings: parseInt(document.getElementById('recipe-servings').value),
            difficulty: document.getElementById('recipe-difficulty').value,
            category: document.getElementById('recipe-category').value,
            ingredients,
            steps
        };
        
        try {
            let res;
            if (isEdit) {
                res = await api.put(`/api/recipes/${recipeId}`, payload);
                showToast('Recipe updated successfully!');
            } else {
                res = await api.post('/api/recipes', payload);
                showToast('Recipe published successfully!');
            }
            navigateTo(`recipe/${res.data.id}`);
        } catch (err) {
            // Check validation errors
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const errMsg = Object.values(errors).join(', ');
                showToast('Validation failed: ' + errMsg, 'danger');
            } else {
                showToast(err.response?.data?.error || 'Failed to submit recipe', 'danger');
            }
        }
    });
}

// Ingredients / Steps input row utilities
function renderIngredientInputRow(val, idx) {
    return `
        <div class="input-group mb-2 animated-view ingredient-row" id="ing-row-${idx}">
            <input type="text" class="form-control glass-input ingredient-item-input" placeholder="e.g. 2 Large Eggs" value="${escapeHtml(val)}" required>
            <button class="btn btn-outline-danger" type="button" onclick="removeIngredientRow(${idx})"><i class="bi bi-trash"></i></button>
        </div>
    `;
}

function renderStepInputRow(val, idx) {
    return `
        <div class="input-group mb-2 animated-view step-row" id="step-row-${idx}">
            <span class="input-group-text bg-dark border-secondary border-opacity-25 text-primary fw-bold step-number-label">${idx + 1}</span>
            <input type="text" class="form-control glass-input step-item-input" placeholder="e.g. Boil water and add salt" value="${escapeHtml(val)}" required>
            <button class="btn btn-outline-danger" type="button" onclick="removeStepRow(${idx})"><i class="bi bi-trash"></i></button>
        </div>
    `;
}

let ingCounter = 100; // unique row ids
window.addIngredientInput = function() {
    const container = document.getElementById('ingredients-container');
    const newDiv = document.createElement('div');
    newDiv.innerHTML = renderIngredientInputRow('', ingCounter++);
    container.appendChild(newDiv.firstElementChild);
};

window.removeIngredientRow = function(idx) {
    const row = document.getElementById(`ing-row-${idx}`);
    if (document.querySelectorAll('.ingredient-row').length > 1) {
        row.remove();
    } else {
        showToast('You must enter at least one ingredient', 'danger');
    }
};

let stepCounter = 100;
window.addStepInput = function() {
    const container = document.getElementById('steps-container');
    const newDiv = document.createElement('div');
    const currentIdx = document.querySelectorAll('.step-row').length;
    newDiv.innerHTML = renderStepInputRow('', stepCounter++);
    container.appendChild(newDiv.firstElementChild);
    reindexSteps();
};

window.removeStepRow = function(idx) {
    const row = document.getElementById(`step-row-${idx}`);
    if (document.querySelectorAll('.step-row').length > 1) {
        row.remove();
        reindexSteps();
    } else {
        showToast('You must enter at least one instruction step', 'danger');
    }
};

function reindexSteps() {
    const labels = document.querySelectorAll('.step-number-label');
    labels.forEach((lbl, idx) => {
        lbl.textContent = idx + 1;
    });
}

// Render USER PROFILE PAGE
async function renderProfile(container, username) {
    container.innerHTML = `
        <div class="text-center py-4 animated-view">
            <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;"></div>
        </div>
    `;
    
    // Fetch profile info
    const profileRes = await api.get(`/api/users/profile/${username}`);
    const profile = profileRes.data;
    
    // Fetch user's recipes
    const recipesRes = await api.get('/api/recipes');
    const userRecipes = recipesRes.data.filter(r => r.authorUsername === username);
    
    const defaultBigAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
    const avatar = profile.profilePictureUrl ? (profile.profilePictureUrl.startsWith('/') ? API_BASE_URL + profile.profilePictureUrl : profile.profilePictureUrl) : defaultBigAvatar;
    const isCurrentUser = state.user && state.user.username === username;
    
    container.innerHTML = `
        <div class="row animated-view g-5">
            <!-- Profile Info Card -->
            <div class="col-lg-4">
                <div class="card glass-card profile-card">
                    <img src="${avatar}" alt="${profile.name}" class="profile-avatar-big">
                    <h3>${escapeHtml(profile.name)}</h3>
                    <p class="text-primary mb-3">@${profile.username}</p>
                    <p class="text-muted fs-6 mb-4">${profile.bio ? escapeHtml(profile.bio) : 'No bio written yet.'}</p>
                    
                    <div class="row g-2 mb-4">
                        <div class="col-6">
                            <div class="profile-stat-box">
                                <div class="profile-stat-num">${profile.recipeCount}</div>
                                <div class="text-muted small">Recipes</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="profile-stat-box">
                                <div class="profile-stat-num">${profile.likesReceived}</div>
                                <div class="text-muted small">Likes Recv</div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-muted small"><i class="bi bi-calendar3"></i> Joined ${new Date(profile.joinDate).toLocaleDateString()}</p>
                    
                    ${isCurrentUser ? `
                        <a href="#settings" class="btn btn-action-gradient w-100 mt-3"><i class="bi bi-pencil-square"></i> Edit Profile</a>
                    ` : ''}
                </div>
            </div>
            
            <!-- User's Recipes List -->
            <div class="col-lg-8">
                <h3 class="mb-4"><i class="bi bi-grid text-primary me-2"></i> Recipes by ${escapeHtml(profile.name)}</h3>
                <div class="row row-cols-1 row-cols-md-2 g-4">
                    ${userRecipes.length === 0 ? `
                        <div class="col-12 text-center py-5 glass-card">
                            <i class="bi bi-journals fs-2 text-muted"></i>
                            <p class="text-muted mt-3">No recipes published yet.</p>
                            ${isCurrentUser ? '<a href="#create-recipe" class="btn btn-action-gradient btn-sm mt-2">Publish First Recipe</a>' : ''}
                        </div>
                    ` : userRecipes.map(recipe => renderRecipeCard(recipe)).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render SETTINGS PAGE (Profile Updates)
async function renderSettings(container) {
    container.innerHTML = `
        <div class="text-center py-4 animated-view">
            <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;"></div>
        </div>
    `;
    
    const res = await api.get('/api/auth/me');
    const user = res.data;
    
    container.innerHTML = `
        <div class="card glass-card p-4 p-md-5 max-width-600 mx-auto animated-view">
            <h2 class="mb-4"><i class="bi bi-gear text-primary me-2"></i> Account Settings</h2>
            
            <form id="settings-update-form">
                <!-- Avatar upload -->
                <div class="mb-4 text-center">
                    <label class="form-label d-block mb-3">Profile Picture</label>
                    <img src="${user.profilePictureUrl ? (user.profilePictureUrl.startsWith('/') ? API_BASE_URL + user.profilePictureUrl : user.profilePictureUrl) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}" 
                         alt="Avatar" class="profile-avatar-big mb-3 d-block" id="settings-avatar-preview">
                    
                    <input type="file" id="avatar-file-input" accept="image/*" class="d-none">
                    <input type="hidden" id="profile-picture-url" value="${user.profilePictureUrl || ''}">
                    
                    <button type="button" class="btn btn-glass-secondary btn-sm" id="btn-upload-avatar"><i class="bi bi-upload"></i> Upload New Photo</button>
                </div>
                
                <div class="mb-4">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control glass-input" value="${escapeHtml(user.name)}" readonly disabled>
                    <span class="text-muted small">Username and Name cannot be changed.</span>
                </div>
                
                <div class="mb-4">
                    <label class="form-label">Bio</label>
                    <textarea class="form-control glass-input" id="profile-bio" rows="4" placeholder="Tell us about yourself, your cooking preferences...">${user.bio ? escapeHtml(user.bio) : ''}</textarea>
                </div>
                
                <div class="d-flex gap-3">
                    <button type="submit" class="btn btn-action-gradient px-4 py-2">Save Profile</button>
                    <a href="#profile/${user.username}" class="btn btn-glass-secondary px-4 py-2">Back to Profile</a>
                </div>
            </form>
        </div>
    `;
    
    // Wire up avatar uploads
    const btnUpload = document.getElementById('btn-upload-avatar');
    const avatarInput = document.getElementById('avatar-file-input');
    const avatarPreview = document.getElementById('settings-avatar-preview');
    const hiddenPicUrl = document.getElementById('profile-picture-url');
    
    btnUpload.addEventListener('click', () => avatarInput.click());
    
    avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files[0];
        if (!file) return;
        
        btnUpload.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Uploading...`;
        btnUpload.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await api.post('/api/images/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const url = res.data.imageUrl;
            hiddenPicUrl.value = url;
            avatarPreview.src = url.startsWith('/') ? API_BASE_URL + url : url;
            showToast('Profile picture uploaded successfully!');
        } catch (e) {
            showToast('Image upload failed: ' + (e.response?.data?.error || e.message), 'danger');
        } finally {
            btnUpload.innerHTML = `<i class="bi bi-upload"></i> Upload New Photo`;
            btnUpload.disabled = false;
        }
    });

    // Handle submit
    document.getElementById('settings-update-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            bio: document.getElementById('profile-bio').value.trim(),
            profilePictureUrl: hiddenPicUrl.value || null
        };
        
        try {
            const res = await api.put('/api/users/profile', payload);
            
            // Sync local storage state
            state.user.bio = res.data.bio;
            state.user.profilePictureUrl = res.data.profilePictureUrl;
            localStorage.setItem('user', JSON.stringify(state.user));
            
            updateNav();
            showToast('Profile updated successfully!');
            navigateTo(`profile/${state.user.username}`);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update settings', 'danger');
        }
    });
}

// Render LOGIN PAGE
function renderLogin(container) {
    container.innerHTML = `
        <div class="card glass-card auth-container p-4 p-md-5 animated-view">
            <h2 class="text-center mb-4"><i class="bi bi-lock text-primary"></i> Login</h2>
            
            <form id="login-form">
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control glass-input" id="login-username" placeholder="Enter your username" required>
                </div>
                <div class="mb-4">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control glass-input" id="login-password" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn btn-action-gradient w-100 py-2.5 mb-3">Sign In</button>
                
                <p class="text-center text-muted fs-6 mb-0">Don't have an account? <a href="#register" class="text-primary text-decoration-none">Register</a></p>
            </form>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        try {
            const res = await api.post('/api/auth/login', { username, password });
            
            // Save Token and basic info
            localStorage.setItem('token', res.data.token);
            const userObj = {
                id: res.data.id,
                username: res.data.username,
                name: res.data.name,
                profilePictureUrl: null
            };
            
            // Fetch avatar from full profile
            try {
                const profileRes = await api.get(`/api/users/profile/${res.data.username}`);
                userObj.profilePictureUrl = profileRes.data.profilePictureUrl;
            } catch (ignore) {}
            
            localStorage.setItem('user', JSON.stringify(userObj));
            state.user = userObj;
            
            updateNav();
            showToast('Logged in successfully!');
            navigateTo('explore');
        } catch (err) {
            showToast(err.response?.data?.error || 'Login failed. Check credentials.', 'danger');
        }
    });
}

// Render REGISTER PAGE
function renderRegister(container) {
    container.innerHTML = `
        <div class="card glass-card auth-container p-4 p-md-5 animated-view">
            <h2 class="text-center mb-4"><i class="bi bi-person-plus text-primary"></i> Register</h2>
            
            <form id="register-form">
                <div class="mb-3">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control glass-input" id="reg-name" placeholder="e.g. John Doe" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control glass-input" id="reg-username" placeholder="e.g. johndoe" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control glass-input" id="reg-email" placeholder="e.g. john@example.com" required>
                </div>
                <div class="mb-4">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control glass-input" id="reg-password" placeholder="At least 6 characters" required>
                </div>
                <button type="submit" class="btn btn-action-gradient w-100 py-2.5 mb-3">Sign Up</button>
                
                <p class="text-center text-muted fs-6 mb-0">Already have an account? <a href="#login" class="text-primary text-decoration-none">Login</a></p>
            </form>
        </div>
    `;
    
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('reg-name').value.trim(),
            username: document.getElementById('reg-username').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };
        
        try {
            const res = await api.post('/api/auth/register', payload);
            
            // Save Token and basic info
            localStorage.setItem('token', res.data.token);
            const userObj = {
                id: res.data.id,
                username: res.data.username,
                name: res.data.name,
                profilePictureUrl: null
            };
            localStorage.setItem('user', JSON.stringify(userObj));
            state.user = userObj;
            
            updateNav();
            showToast('Account registered successfully!');
            navigateTo('explore');
        } catch (err) {
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const errMsg = Object.values(errors).join(', ');
                showToast('Registration failed: ' + errMsg, 'danger');
            } else {
                showToast(err.response?.data?.error || 'Registration failed.', 'danger');
            }
        }
    });
}

// ----------------------------------------------------
// GLOBAL EVENT LISTENERS & INITIALIZATION
// ----------------------------------------------------

// Navbar search handler
document.getElementById('global-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('search-input').value.trim();
    state.currentSearch = val || null;
    state.currentCategory = null; // search overrides categories
    navigateTo('explore');
    router();
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    state.user = null;
    updateNav();
    showToast('Logged out successfully');
    navigateTo('explore');
});

// Router listeners
window.addEventListener('hashchange', router);

// On load: Verify token and initialize
window.addEventListener('DOMContentLoaded', async () => {
    updateNav();
    
    // Background validation of local storage token
    if (localStorage.getItem('token')) {
        try {
            const res = await api.get('/api/auth/me');
            const userObj = {
                id: res.data.id,
                username: res.data.username,
                name: res.data.name,
                profilePictureUrl: res.data.profilePictureUrl
            };
            localStorage.setItem('user', JSON.stringify(userObj));
            state.user = userObj;
            updateNav();
        } catch (e) {
            console.warn('Invalid session, logging out.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            state.user = null;
            updateNav();
        }
    }
    
    router();
});

// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function escapeQuote(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
}
