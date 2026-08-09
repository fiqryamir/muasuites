<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { faqs } from './faq-data';
</script>

<section id="faq" class="scroll-mt-20 py-20 sm:py-28">
	<div class="mx-auto w-full max-w-3xl px-5 sm:px-8">
		<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Fair questions</h2>

		<div class="divide-border/60 ring-foreground/10 bg-card mt-8 divide-y rounded-xl ring-1">
			{#each faqs as faq (faq.question)}
				<details class="group px-6 py-5" name="faq">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-4">
						<span class="text-sm font-semibold sm:text-base">{faq.question}</span>
						<ChevronDown
							class="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
						/>
					</summary>
					<p class="text-muted-foreground mt-3 text-sm leading-relaxed">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</div>
</section>
