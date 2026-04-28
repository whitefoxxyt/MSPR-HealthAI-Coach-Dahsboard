<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile()
  }
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1 class="page-title">Profil</h1>
      <p class="page-subtitle">Informations personnelles et objectifs.</p>
    </header>

    <p v-if="userStore.error" class="alert alert-error" role="alert">{{ userStore.error }}</p>

    <article v-if="userStore.profile" class="profile-card" aria-live="polite">
      <dl class="profile-list">
        <div class="profile-row"><dt>Nom</dt><dd>{{ userStore.profile.fullName }}</dd></div>
        <div class="profile-row"><dt>Email</dt><dd>{{ userStore.profile.email }}</dd></div>
        <div class="profile-row"><dt>Objectif</dt><dd>{{ userStore.profile.objective }}</dd></div>
        <div class="profile-row"><dt>Âge</dt><dd>{{ userStore.profile.age }} ans</dd></div>
        <div class="profile-row"><dt>Taille</dt><dd>{{ userStore.profile.heightCm }} cm</dd></div>
        <div class="profile-row"><dt>Poids</dt><dd>{{ userStore.profile.weightKg }} kg</dd></div>
      </dl>
    </article>
  </section>
</template>

<style scoped>
.page {
  padding: 1rem;
}

.page-title {
  margin: 0;
}

.page-subtitle {
  margin: 0.35rem 0 1rem;
  color: #6b7280;
}

.profile-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.profile-list {
  margin: 0;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f3f4f6;
  padding: 0.65rem 0;
  gap: 1rem;
}

.profile-row:last-child {
  border-bottom: none;
}

dt {
  font-weight: 700;
  color: #374151;
}

dd {
  margin: 0;
  color: #111827;
  text-align: right;
}

.alert {
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.alert-error {
  color: #991b1b;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

@media (min-width: 900px) {
  .page {
    padding: 1.5rem 2rem;
  }
}
</style>
