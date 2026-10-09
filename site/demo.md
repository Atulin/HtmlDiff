---
title: Interactive Demo
---

# Interactive Demo

Edit either textarea below — the diff updates live as you type. Green marks added
content, strikethrough red marks removed content, and amber marks changed content.
Content wrapped in a dashed outline is re-styled inside a special tag (e.g. `<em>` or
`<strong>`).

<script setup lang="ts">
import DiffDemo from "./.vitepress/components/DiffDemo.vue";
</script>

<DiffDemo />
