<template>
  <div class="page">
    <!-- Content -->
    <main class="center-wrapper">
      <div class="content">
        <img src="../assets/logo-bumacogroup.svg" alt="Bumaco" class="logo-large" />
        <h2>Logistiek Platform</h2>

        <div class="buttons">
          <RouterLink to="/purchase" class="btn">Purchase</RouterLink>
          <RouterLink to="/renting" class="btn">Renting</RouterLink>
          <RouterLink to="/tools" class="btn">Tools</RouterLink>
          <RouterLink to="/logistiek" class="btn">Logistiek</RouterLink>
          <RouterLink to="/facilities" class="btn">Facilities</RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 90vh;
  background: #f6f8fb;
  display: flex;
  flex-direction: column;
}

/* Header blijft boven */

.center-wrapper {
  flex: 1; /* neemt alle resterende hoogte */
  display: flex;
  align-items: center; /* verticaal centreren */
  justify-content: center; /* horizontaal centreren */
}

.content {
  text-align: center;
}

.logo-large {
  width: 90%;
  margin-bottom: 16px;
}

h1 {
  font-size: 48px;
  margin: 0;
  color: #0f2e4d;
}

.subtitle {
  color: #7fa6c5;
  margin-bottom: 24px;
}

h2 {
  margin-bottom: 32px;
  font-weight: 500;
}

.buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  background: #2f80ed;
  color: white;
  padding: 8px 18px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 14px;
}

.btn:hover {
  background: #2563c9;
}
</style>
