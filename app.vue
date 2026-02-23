<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtPwaManifest />
    <ClientOnly>
      <NuxtPage />
    </ClientOnly>
    <UNotifications />
  </div>
</template>
