# StyleHub static frontend (Netlify-ready structure)

This is a static HTML/CSS/JavaScript frontend intended to call the StyleHub Spring Boot JSON API.

## Included pages
- `index.html`: product list
- `signup.html`: register
- `login.html`: login
- `cart.html`: view/update/remove cart items
- `checkout.html`: place order
- `orders.html`: order history

## Local testing
1. Start your Spring Boot backend.
2. Open `config.js`.
3. For local development, keep `window.STYLEHUB_API_BASE = "http://localhost:8080";`
4. Use a local static server (VS Code Live Server is suitable) and open the provided local URL, commonly `http://127.0.0.1:5500`.

Opening HTML directly as `file://` may cause browser restrictions; use a local static server.

## Before deploying
1. Deploy the backend to Render and the MySQL database to Aiven.
2. In `config.js`, replace `http://localhost:8080` with the actual Render service URL, e.g. `https://your-service.onrender.com`. Do not include a trailing slash.
3. In the Render environment variables, set `CORS_ALLOWED_ORIGINS` to the exact deployed Netlify site origin (e.g. `https://your-site.netlify.app`).
4. For cross-site session cookies, configure Spring Boot to use `SESSION_COOKIE_SAME_SITE=None` and `SESSION_COOKIE_SECURE=true`, if those variables are supported by the deployed backend configuration.
5. Redeploy/re-publish the frontend after changing `config.js`.

## Important backend note
The backend ZIP supplied for review does **not** contain `StoreApiController.java` or `CorsConfig.java`, although the API works in the user's local running project. Use the updated local backend folder that passed the API tests for deployment, and ensure these two files are included in the backend ZIP/repository. The frontend expects the tested endpoints:
- GET `/api/products`
- GET `/api/auth/me`
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/cart`
- POST `/api/cart/items`
- PUT `/api/cart/items/{productId}`
- DELETE `/api/cart/items/{productId}`
- POST `/api/checkout`
- GET `/api/orders`

This is a frontend integration starter; test all actions against the exact backend build before considering deployment complete. Demo checkout does not process real payments.
