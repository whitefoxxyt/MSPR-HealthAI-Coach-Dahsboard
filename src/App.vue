<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <!-- Navigation principale -->
    <nav class="main-nav" role="navigation" aria-label="Navigation principale">
      <div class="nav-container">
        <RouterLink to="/" class="nav-brand">
          <span class="nav-brand__icon" aria-hidden="true">❤️</span>
          <span class="nav-brand__text">HealthAI Coach</span>
        </RouterLink>

        <ul class="nav-menu">
          <li class="nav-item">
            <RouterLink to="/" class="nav-link" active-class="nav-link--active">
              📊 Dashboard
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/data-cleaning" class="nav-link" active-class="nav-link--active">
              🧹 Nettoyage
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/validation" class="nav-link" active-class="nav-link--active">
              ✓ Validation
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Contenu principal -->
    <main class="main-content" role="main">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="main-footer" role="contentinfo">
      <p class="footer-text">
        © 2026 HealthAI Coach - Dashboard d'administration
      </p>
    </footer>
  </div>
</template>

<style>
/* Reset et styles globaux */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  line-height: 1.6;
  color: #111827;
  background: #f9fafb;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation */
.main-nav {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  text-decoration: none;
  color: #111827;
  font-weight: 700;
  font-size: 1.25rem;
  transition: opacity 0.2s;
}

.nav-brand:hover {
  opacity: 0.8;
}

.nav-brand__icon {
  font-size: 1.75rem;
  line-height: 1;
}

.nav-menu {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: block;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-link--active {
  background: #3b82f6;
  color: white;
}

.nav-link--active:hover {
  background: #2563eb;
}

/* Contenu principal */
.main-content {
  flex: 1;
  background: #f9fafb;
}

/* Footer */
.main-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Accessibilité */
.nav-link:focus-visible,
.nav-brand:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Skip link pour accessibilité */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .nav-brand {
    justify-content: center;
    padding: 1rem 0 0.5rem;
  }

  .nav-menu {
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .nav-link {
    border-radius: 0;
    padding: 0.875rem 1rem;
  }
}

/* Animation pour les transitions de page */
.router-link-active {
  /* Style déjà géré par nav-link--active */
}

/* Print styles */
@media print {
  .main-nav,
  .main-footer {
    display: none;
  }
}
</style>
