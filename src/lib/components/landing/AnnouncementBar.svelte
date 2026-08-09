<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from '@lucide/svelte';
</script>

<div class="bg-muted/70 text-center">
	<a
		href={resolve('/login')}
		class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors"
	>
		Free plan available — no card required
		<ArrowRight class="h-3 w-3" />
	</a>
</div>
