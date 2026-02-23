<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtPwaManifest />
    <ClientOnly>
      <NuxtPage />
    </ClientOnly>
  </div>
</template>
