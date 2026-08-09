<script lang="ts">
	import { CaretDown } from 'phosphor-svelte';
	import { faqs } from './faq-data';
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';
</script>

<section id="faq" class="scroll-mt-24 py-24 sm:py-36">
	<div class="mx-auto w-full max-w-3xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading eyebrow="fair questions" title="Fair questions" />
		</Reveal>

		<Reveal delay={100} class="mt-12">
			<div class="bezel-outer">
				<div class="bezel-inner divide-foreground/10 divide-y overflow-hidden">
					{#each faqs as faq (faq.question)}
						<details class="group px-6 py-5 sm:px-8" name="faq">
							<summary class="flex cursor-pointer list-none items-center justify-between gap-4">
								<span class="text-sm font-semibold sm:text-base">
									{faq.question}
								</span>
								<span
									class="bg-foreground/5 ring-foreground/10 text-foreground/70 ease-fluid flex size-7 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-500 group-open:rotate-180"
								>
									<CaretDown size={12} weight="bold" />
								</span>
							</summary>
							<p class="text-muted-foreground mt-3 text-sm leading-relaxed">
								{faq.answer}
							</p>
						</details>
					{/each}
				</div>
			</div>
		</Reveal>
	</div>
</section>
