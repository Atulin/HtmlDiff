<script setup lang="ts">
import { computed, ref } from "vue";
import { diff } from "../../../src/Diff";

const oldHtml = ref(`<p>Some <em>old</em> html here</p>
<p>This is a longer piece of text to ensure the new blocksize algorithm works</p>
<p>Sigríður og Guðmundur</p>`);

const newHtml = ref(`<p>Some <b>new</b> html goes here</p>
<p>This is a longer piece of text to <strong>ensure</strong> the new blocksize algorithm works decently</p>
<p>Ákvæði á ekki viðmundsson um</p>`);

const result = computed(() => diff(oldHtml.value, newHtml.value) ?? "");
</script>

<template>
	<div class="diff-demo">
		<div class="inputs">
			<label class="input">
				<span>Old HTML</span>
				<textarea v-model="oldHtml" spellcheck="false" aria-label="Old HTML" />
			</label>
			<label class="input">
				<span>New HTML</span>
				<textarea v-model="newHtml" spellcheck="false" aria-label="New HTML" />
			</label>
		</div>

		<div class="output">
			<span>Live diff</span>
			<div class="legend">
				<span class="legend-item ins">added</span>
				<span class="legend-item del">removed</span>
				<span class="legend-item mod">changed</span>
			</div>
			<div class="result" v-html="result" />
		</div>
	</div>
</template>

<style scoped>
.diff-demo {
	margin: 16px 0;
}

.inputs {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.input {
	display: block;
}

.input span,
.output > span {
	display: block;
	font-size: 13px;
	font-weight: 600;
	margin-bottom: 6px;
}

.input textarea {
	width: 100%;
	min-height: 220px;
	box-sizing: border-box;
	font-family: var(--vp-font-family-mono);
	font-size: 13px;
	line-height: 1.6;
	padding: 12px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	resize: vertical;
	tab-size: 2;
}

.input textarea:focus {
	outline: 2px solid var(--vp-c-brand-1);
	outline-offset: -1px;
}

.output {
	margin-top: 24px;
}

.legend {
	display: flex;
	gap: 16px;
	margin-bottom: 8px;
	font-size: 12px;
}

.legend-item {
	padding: 2px 8px;
	border-radius: 4px;
}

.legend-item.ins {
	background: rgba(63, 185, 80, 0.25);
}

.legend-item.del {
	background: rgba(248, 81, 73, 0.2);
	text-decoration: line-through;
}

.legend-item.mod {
	background: rgba(255, 196, 0, 0.18);
}

.result {
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	padding: 16px;
	font-size: 15px;
	line-height: 1.8;
	white-space: pre-wrap;
	word-break: break-word;
}

.result :deep(ins) {
	text-decoration: none;
}

.result :deep(del) {
	text-decoration: line-through;
}

.result :deep(ins.diffins) {
	background: rgba(63, 185, 80, 0.25);
	border-radius: 3px;
}

.result :deep(del.diffdel) {
	background: rgba(248, 81, 73, 0.2);
	border-radius: 3px;
}

.result :deep(.diffmod) {
	background: rgba(255, 196, 0, 0.18);
	border-radius: 3px;
}

.result :deep(ins.mod) {
	outline: 1px dashed rgba(63, 185, 80, 0.6);
}

@media (max-width: 640px) {
	.inputs {
		grid-template-columns: 1fr;
	}
}
</style>
