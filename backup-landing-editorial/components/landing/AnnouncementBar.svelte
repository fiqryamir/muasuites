<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from 'phosphor-svelte';
</script>

<div class="bg-primary/[0.06] text-primary text-center">
	<a
		href={resolve('/login')}
		class="ease-fluid inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-300 hover:gap-2.5"
	>
		Free plan available — no card required
		<span
			class="bg-primary/10 ease-fluid flex size-5 items-center justify-center rounded-full transition-transform duration-300"
		>
			<ArrowRight size={9} weight="bold" />
		</span>
	</a>
</div>
