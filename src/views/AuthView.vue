<template>
  <div class="auth-page">
    <aside class="auth-aside" aria-hidden="true">
      <div class="auth-aside__brand">
        <span class="auth-aside__mark">H</span>
        <span class="auth-aside__name">HealthAI Coach</span>
      </div>
      <p class="auth-aside__eyebrow">Coach IA — Nutrition · Performance</p>
      <h2 class="auth-aside__pitch">
        Ton coach IA<br />
        au quotidien.<br />
        <em>Sans excuse.</em>
      </h2>
      <ul class="auth-aside__bullets">
        <li><span aria-hidden="true">◐</span> Analyse photo de tes repas et macros.</li>
        <li><span aria-hidden="true">◑</span> Plans repas adaptes a ton régime et ton budget.</li>
        <li><span aria-hidden="true">◉</span> Programmes fitness calibrés à ton niveau.</li>
      </ul>
    </aside>

    <section class="auth-card" aria-labelledby="auth-title">
      <header class="auth-header">
        <p class="auth-eyebrow">HealthAI Coach · MSPR 2</p>
        <h1 id="auth-title" class="auth-title">{{ panelTitle }}</h1>
        <p class="auth-subtitle">{{ panelSubtitle }}</p>
      </header>

      <nav class="auth-tabs" aria-label="Modes d'authentification">
        <button
          class="auth-tab"
          :class="{ 'auth-tab--active': mode === 'login' }"
          type="button"
          @click="switchMode('login')"
        >
          Connexion
        </button>
        <button
          class="auth-tab"
          :class="{ 'auth-tab--active': mode === 'register' }"
          type="button"
          @click="switchMode('register')"
        >
          Inscription
        </button>
      </nav>

      <p v-if="errorMessage" class="alert alert-error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-else-if="authStore.infoMessage" class="alert alert-info" role="status">
        {{ authStore.infoMessage }}
      </p>

      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="submitLogin">
        <label class="field-label" for="login-email">Email</label>
        <input id="login-email" v-model.trim="loginForm.email" type="email" required class="field-input" />

        <label class="field-label" for="login-password">Mot de passe</label>
        <input
          id="login-password"
          v-model="loginForm.password"
          type="password"
          required
          minlength="8"
          class="field-input"
        />
        <button class="inline-link inline-link--left" type="button" @click="switchMode('forgot')">
          Mot de passe oublié ?
        </button>

        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

      <form v-else-if="mode === 'register'" class="auth-form" @submit.prevent="submitRegister">
        <label class="field-label" for="register-name">Nom complet</label>
        <input id="register-name" v-model.trim="registerForm.name" type="text" required class="field-input" />

        <label class="field-label" for="register-email">Email</label>
        <input id="register-email" v-model.trim="registerForm.email" type="email" required class="field-input" />

        <label class="field-label" for="register-password">Mot de passe</label>
        <input
          id="register-password"
          v-model="registerForm.password"
          type="password"
          required
          minlength="8"
          class="field-input"
        />

        <label class="field-label" for="register-confirm-password">Confirmer le mot de passe</label>
        <input
          id="register-confirm-password"
          v-model="registerForm.confirmPassword"
          type="password"
          required
          minlength="8"
          class="field-input"
        />

        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Création...' : 'Créer un compte' }}
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="submitPasswordReset">
        <label class="field-label" for="forgot-email">Email</label>
        <input id="forgot-email" v-model.trim="forgotEmail" type="email" required class="field-input" />
        <button class="inline-link inline-link--left" type="button" @click="switchMode('login')">
          Retour à la connexion
        </button>

        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isCurrentUserAdmin } from '@/utils/auth-role'

type AuthMode = 'login' | 'register' | 'forgot'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<AuthMode>('login')
const localError = ref<string | null>(null)

const loginForm = ref({
  email: '',
  password: '',
})

const registerForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const forgotEmail = ref('')

const panelTitle = computed(() => {
  if (mode.value === 'register') return 'Crée ton compte.'
  if (mode.value === 'forgot') return 'Mot de passe oublié ?'
  return 'Bon retour.'
})

const panelSubtitle = computed(() => {
  if (mode.value === 'register') return 'Quelques infos et ton coach IA prend le relais.'
  if (mode.value === 'forgot') return "On t'envoie un lien sécurisé pour reprendre la main."
  return 'Reconnecte-toi pour retrouver tes plans, analyses et programmes.'
})

const errorMessage = computed(() => localError.value || authStore.error)

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode
  localError.value = null
  authStore.clearMessages()
}

async function submitLogin() {
  localError.value = null
  try {
    await authStore.login(loginForm.value.email, loginForm.value.password)
    const target = isCurrentUserAdmin() ? { name: 'admin-dashboard' } : { name: 'home' }
    await router.push(target)
  } catch (e) {
    localError.value = e instanceof Error ? e.message : 'Erreur lors de la connexion'
  }
}

async function submitRegister() {
  localError.value = null
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    localError.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  try {
    await authStore.register(registerForm.value.name, registerForm.value.email, registerForm.value.password)
    switchMode('login')
  } catch (e) {
    localError.value = e instanceof Error ? e.message : 'Erreur lors de l\'inscription'
  }
}

async function submitPasswordReset() {
  localError.value = null
  try {
    await authStore.requestPasswordReset(forgotEmail.value)
  } catch (e) {
    localError.value = e instanceof Error ? e.message : 'Erreur lors de la demande'
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 0;
  background: var(--c-cream);
  color: var(--c-onyx);
  font-family: var(--font-body);
}

.auth-aside {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--sp-2xl) var(--sp-xl);
  background: var(--c-onyx);
  color: var(--c-cream);
  overflow: hidden;
}

.auth-aside::before {
  content: '';
  position: absolute;
  inset: auto -120px -180px auto;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--c-acid) 0%, transparent 65%);
  opacity: 0.32;
  pointer-events: none;
}

.auth-aside__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-sm);
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.04em;
}

.auth-aside__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--c-acid);
  color: var(--c-onyx);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0;
}

.auth-aside__eyebrow {
  margin: var(--sp-md) 0 0;
  font-size: 0.8125rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gray-200);
}

.auth-aside__pitch {
  position: relative;
  z-index: 1;
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.4rem, 4.2vw, 3.6rem);
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.auth-aside__pitch em {
  font-style: italic;
  color: var(--c-acid);
}

.auth-aside__bullets {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sp-md);
  font-size: 0.9375rem;
  color: var(--c-gray-200);
}

.auth-aside__bullets li {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: baseline;
  gap: var(--sp-sm);
}

.auth-aside__bullets span {
  color: var(--c-acid);
  font-size: 1.125rem;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  align-self: center;
  padding: var(--sp-2xl) var(--sp-xl);
  background: transparent;
  border: none;
  box-shadow: none;
}

.auth-header {
  margin-bottom: var(--sp-xl);
}

.auth-eyebrow {
  margin: 0 0 var(--sp-sm);
  color: var(--c-gray-600);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.auth-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.2rem, 3.5vw, 2.8rem);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
}

.auth-subtitle {
  margin: var(--sp-sm) 0 0;
  color: var(--c-gray-600);
  font-size: 0.9375rem;
  max-width: 36ch;
}

.auth-tabs {
  margin-bottom: var(--sp-lg);
  display: inline-flex;
  gap: var(--sp-xs);
  padding: 4px;
  background: rgba(20, 20, 20, 0.05);
  border-radius: var(--r-pill);
}

.auth-tab {
  border: none;
  background: transparent;
  color: var(--c-gray-600);
  border-radius: var(--r-pill);
  padding: 0.5rem 1.1rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background var(--d-micro) var(--ease-out-expo), color var(--d-micro) var(--ease-out-expo);
}

.auth-tab:hover {
  color: var(--c-onyx);
}

.auth-tab--active {
  background: var(--c-onyx);
  color: var(--c-cream);
}

.auth-tab:focus-visible {
  outline: 2px solid var(--c-onyx);
  outline-offset: 2px;
}

.alert {
  margin: 0 0 var(--sp-md);
  border-radius: var(--r-md);
  padding: var(--sp-sm) var(--sp-md);
  font-size: 0.875rem;
  font-weight: 500;
}

.alert-error {
  color: #6b1d10;
  background: rgba(255, 107, 74, 0.18);
  border: 1px solid rgba(255, 107, 74, 0.4);
}

.alert-info {
  color: #1f3b00;
  background: rgba(200, 255, 71, 0.28);
  border: 1px solid rgba(158, 214, 38, 0.55);
}

.auth-form {
  display: grid;
  gap: var(--sp-sm);
}

.field-label {
  color: var(--c-onyx);
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.field-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(20, 20, 20, 0.12);
  border-radius: var(--r-md);
  font: inherit;
  color: var(--c-onyx);
  background: #ffffff;
  transition: border-color var(--d-micro), box-shadow var(--d-micro);
}

.field-input:focus {
  outline: none;
  border-color: var(--c-onyx);
  box-shadow: 0 0 0 3px rgba(200, 255, 71, 0.45);
}

.submit-button {
  margin-top: var(--sp-md);
  border: none;
  border-radius: var(--r-pill);
  background: var(--c-onyx);
  color: var(--c-cream);
  padding: 0.9rem 1.4rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: transform var(--d-micro), background var(--d-micro);
}

.submit-button:hover:not(:disabled) {
  background: var(--c-onyx-2);
  transform: translateY(-1px);
}

.submit-button:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.submit-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.inline-link {
  justify-self: start;
  border: none;
  background: transparent;
  color: var(--c-onyx);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  transition: color var(--d-micro);
}

.inline-link:hover {
  color: var(--c-acid-dark);
}

.inline-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 2px;
  border-radius: 4px;
}

.inline-link--left {
  justify-self: start;
}

@media (prefers-reduced-motion: reduce) {
  .submit-button { transition: none; }
  .submit-button:hover:not(:disabled) { transform: none; }
}

@media (max-width: 960px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-aside {
    padding: var(--sp-xl) var(--sp-lg);
    min-height: 280px;
  }

  .auth-aside__pitch {
    font-size: 2rem;
  }

  .auth-aside__bullets {
    display: none;
  }

  .auth-card {
    padding: var(--sp-xl) var(--sp-lg);
  }
}
</style>
