<!--
  UserAvatar — placeholder avatar berupa siluet orang (SVG), menggantikan inisial huruf.
  Mengisi penuh container induk (mis. .t-ava, .ava, .prof-ava) dan mewarisi warna teks
  container lewat `currentColor`, sehingga tampil seperti avatar default standar perusahaan.
-->
<template>
  <span class="user-avatar" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="currentColor" role="img">
      <circle cx="12" cy="8.2" r="3.9" />
      <path
        d="M12 13.6c-4.2 0-7.4 2.32-7.4 5.15 0 .75.6 1.35 1.35 1.35h12.1c.75 0 1.35-.6 1.35-1.35 0-2.83-3.2-5.15-7.4-5.15Z"
      />
    </svg>
  </span>
</template>

<script setup lang="ts"></script>

<style scoped>
.user-avatar {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  line-height: 0;
}
.user-avatar svg {
  width: 62%;
  height: 62%;
  display: block;
}
</style>
