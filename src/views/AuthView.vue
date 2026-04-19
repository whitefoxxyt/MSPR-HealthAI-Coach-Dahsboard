<template>
  <div class="auth-page">
    <section class="auth-card" aria-labelledby="auth-title">
      <header class="auth-header">
        <p class="auth-eyebrow">HealthAI Coach</p>
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
  if (mode.value === 'register') return 'Créer un compte administrateur'
  if (mode.value === 'forgot') return 'Réinitialiser votre mot de passe'
  return "Connexion à l'espace administration"
})

const panelSubtitle = computed(() => {
  if (mode.value === 'register') return 'Préparez votre accès sécurisé au dashboard.'
  if (mode.value === 'forgot') return 'Recevez un lien pour récupérer votre accès.'
  return 'Connectez-vous pour accéder au dashboard HealthAI Coach.'
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
    await router.push({ name: 'dashboard' })
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
    // Email verification is required — stay on auth page, the store sets infoMessage
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: radial-gradient(ellipse at 50% 0%, rgba(48, 209, 88, 0.08) 0%, transparent 60%), #000000;
}

.auth-card {
  width: 100%;
  max-width: 460px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  padding: 2.25rem 2rem;
}

.auth-header {
  margin-bottom: 1.5rem;
}

.auth-eyebrow {
  margin: 0 0 0.5rem;
  color: var(--c-brand);
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-title {
  margin: 0;
  color: var(--c-text);
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.auth-subtitle {
  margin: 0.375rem 0 0;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}

.auth-tabs {
  margin-bottom: 1.25rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.auth-tab {
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-text-muted);
  border-radius: calc(var(--radius) * 0.67);
  padding: 0.625rem 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.auth-tab:hover {
  border-color: rgba(48, 209, 88, 0.35);
  background: var(--c-brand-xlight);
  color: var(--c-brand);
}

.auth-tab--active {
  border-color: var(--c-brand);
  background: var(--c-brand);
  color: #000000;
}

.auth-tab:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

.alert {
  margin: 0 0 1rem;
  border-radius: calc(var(--radius) * 0.67);
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
}

.alert-error {
  color: var(--c-danger);
  background: var(--c-danger-light);
  border: 1px solid rgba(255, 69, 58, 0.3);
}

.alert-info {
  color: var(--c-brand);
  background: var(--c-brand-xlight);
  border: 1px solid rgba(48, 209, 88, 0.25);
}

.auth-form {
  display: grid;
  gap: 0.75rem;
}

.field-label {
  color: var(--c-text);
  font-weight: 600;
  font-size: 0.875rem;
}

.field-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--c-border);
  border-radius: calc(var(--radius) * 0.67);
  font: inherit;
  color: var(--c-text);
  background: var(--c-surface-2);
  transition: border-color 0.15s, outline 0.15s;
}

.field-input:focus {
  outline: 2px solid var(--c-brand);
  outline-offset: 1px;
  border-color: var(--c-brand);
}

.submit-button {
  margin-top: 0.5rem;
  border: none;
  border-radius: calc(var(--radius) * 0.67);
  background: var(--c-brand);
  color: #000000;
  padding: 0.8rem 1rem;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  letter-spacing: 0.01em;
}

.submit-button:hover:not(:disabled) {
  background: var(--c-brand-dark);
  color: #ffffff;
  transform: translateY(-1px);
}

.submit-button:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.inline-link {
  border: none;
  background: transparent;
  color: var(--c-brand);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  transition: color 0.15s;
}

.inline-link:hover {
  color: var(--c-brand-dark);
  text-decoration: underline;
}

.inline-link:focus-visible {
  outline: 2px solid var(--c-brand);
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

@media (max-width: 640px) {
  .auth-card {
    padding: 1.5rem 1.25rem;
  }

  .auth-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
