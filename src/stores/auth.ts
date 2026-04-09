import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthSession } from '@/types'
import { authApi, authSessionManager } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(authSessionManager.getSession())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const infoMessage = ref<string | null>(null)

  const isAuthenticated = computed(() => session.value !== null)
  const currentUser = computed(() => session.value?.user ?? null)

  function hydrateFromStorage() {
    session.value = authSessionManager.getSession()
  }

  function clearMessages() {
    error.value = null
    infoMessage.value = null
  }

  function setSession(nextSession: AuthSession | null) {
    session.value = nextSession
    if (nextSession) {
      authSessionManager.setSession(nextSession)
      return
    }
    authSessionManager.clearSession()
  }

  async function login(email: string, password: string) {
    loading.value = true
    clearMessages()
    try {
      const nextSession = await authApi.login(email, password)
      setSession(nextSession)
      infoMessage.value = 'Connexion réussie'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la connexion'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(name: string, email: string, password: string) {
    loading.value = true
    clearMessages()
    try {
      const nextSession = await authApi.register(name, email, password)
      setSession(nextSession)
      infoMessage.value = 'Compte créé avec succès'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de l’inscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function requestPasswordReset(email: string) {
    loading.value = true
    clearMessages()
    try {
      await authApi.requestPasswordReset(email)
      infoMessage.value = 'Si le compte existe, un email de réinitialisation a été envoyé.'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la demande'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function refreshSession() {
    if (!session.value) return
    if (Date.parse(session.value.tokens.expiresAt) > Date.now()) return

    loading.value = true
    clearMessages()
    try {
      const refreshedTokens = await authApi.refreshAccessToken(session.value.tokens.refreshToken)
      setSession({
        ...session.value,
        tokens: refreshedTokens,
      })
    } catch (e) {
      setSession(null)
      error.value = e instanceof Error ? e.message : 'Session expirée'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    setSession(null)
    infoMessage.value = 'Déconnexion effectuée'
  }

  return {
    session,
    loading,
    error,
    infoMessage,
    isAuthenticated,
    currentUser,
    hydrateFromStorage,
    clearMessages,
    login,
    register,
    requestPasswordReset,
    refreshSession,
    logout,
  }
})
