<template>
  <div class="auth-page">
    <section class="auth-card" aria-labelledby="auth-title">
      <header class="auth-header">
        <p class="auth-eyebrow">HealthAI Coach</p>
        <h1 id="auth-title" class="auth-title">{{ panelTitle }}</h1>
        <p class="auth-subtitle">{{ panelSubtitle }}</p>
      </header>

      <nav class="auth-tabs" aria-label="Modes d’authentification">
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
  return 'Connexion à l’espace administration'
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
    await router.push({ name: 'dashboard' })
  } catch (e) {
    localError.value = e instanceof Error ? e.message : 'Erreur lors de l’inscription'
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
  background: radial-gradient(circle at top, #dbeafe 0%, #f8fafc 50%, #ffffff 100%);
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(17, 24, 39, 0.08);
  padding: 2rem;
}

.auth-header {
  margin-bottom: 1.5rem;
}

.auth-eyebrow {
  margin: 0 0 0.5rem 0;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-title {
  margin: 0;
  color: #111827;
  font-size: 1.5rem;
  line-height: 1.3;
}

.auth-subtitle {
  margin: 0.5rem 0 0;
  color: #6b7280;
}

.auth-tabs {
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.auth-tab {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  border-radius: 8px;
  padding: 0.625rem 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-tab:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.auth-tab--active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.alert {
  margin: 0 0 1rem 0;
  border-radius: 8px;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
}

.alert-error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.alert-info {
  color: #1e3a8a;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.auth-form {
  display: grid;
  gap: 0.75rem;
}

.field-label {
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
}

.field-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font: inherit;
}

.field-input:focus {
  outline: 2px solid #93c5fd;
  outline-offset: 1px;
  border-color: #2563eb;
}

.submit-button {
  margin-top: 0.5rem;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.inline-link {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
}

.inline-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.inline-link:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
  border-radius: 4px;
}

.inline-link--left {
  justify-self: start;
}

@media (max-width: 640px) {
  .auth-card {
    padding: 1.25rem;
  }

  .auth-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
