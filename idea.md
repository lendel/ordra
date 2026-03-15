Role: Senior React Native / Expo Developer.
Project: Offline Boutique Manager (Android).
Style: Apple Design Guidelines (Minimalism, SF Typography, #007AFF accents).

Core Requirements:

Stack: Expo, expo-sqlite, zustand, @shopify/flash-list.

Database: > - Create products table (id, name, current_price, updated_at).

Create price_history table (id, product_id, price, date).

Logic: When a price is updated in price_history, the current_price in products must be updated automatically via a Transaction.

UI/UX:

Use Inter font.

Input mask for Tenge (₸) with grouping (e.g., 10 000 ₸).

Fuzzy Search Integration: When adding a product, use fuse.js to suggest existing products from the database that have similar names (to avoid duplicates from different consultants).

Screens:

Dashboard: Apple-style summary cards.

Catalog: High-performance list (FlashList) for 5000+ items.

Product Page: Price history chart or list.

Architecture: Split UI components and Logic (Service/API layer). Use TypeScript. No Excel export, only PDF and Image.

Validation: Use Zod to prevent empty names or zero prices.

Language: Interface strictly in Russian. Currency: KZT (₸).
