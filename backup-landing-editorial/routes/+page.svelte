<script lang="ts">
	import AnnouncementBar from '$lib/components/landing/AnnouncementBar.svelte';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import ProblemSection from '$lib/components/landing/ProblemSection.svelte';
	import ComparisonSection from '$lib/components/landing/ComparisonSection.svelte';
	import HowItWorks from '$lib/components/landing/HowItWorks.svelte';
	import ClientExperience from '$lib/components/landing/ClientExperience.svelte';
	import FeaturesSection from '$lib/components/landing/FeaturesSection.svelte';
	import ControlSection from '$lib/components/landing/ControlSection.svelte';
	import PricingSection from '$lib/components/landing/PricingSection.svelte';
	import FaqSection from '$lib/components/landing/FaqSection.svelte';
	import FinalCta from '$lib/components/landing/FinalCta.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import StickyMobileCta from '$lib/components/landing/StickyMobileCta.svelte';
	import { faqs } from '$lib/components/landing/faq-data';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'SoftwareApplication',
				name: 'MUAsuites',
				applicationCategory: 'BusinessApplication',
				operatingSystem: 'Web',
				description:
					'Booking links, deposits and calendar sync for makeup artists. Turn WhatsApp inquiries into paid, confirmed bookings.',
				offers: [
					{
						'@type': 'Offer',
						name: 'Free',
						price: '0',
						priceCurrency: 'MYR'
					},
					{
						'@type': 'Offer',
						name: 'Pro',
						price: '30',
						priceCurrency: 'MYR'
					}
				]
			},
			{
				'@type': 'FAQPage',
				mainEntity: faqs.map((faq) => ({
					'@type': 'Question',
					name: faq.question,
					acceptedAnswer: {
						'@type': 'Answer',
						text: faq.answer
					}
				}))
			}
		]
	};
</script>

<svelte:head>
	<title>MUAsuites — booking links, deposits and calendar sync for makeup artists</title>
	<meta
		name="description"
		content="Turn WhatsApp inquiries into paid, confirmed bookings. One link handles the quote, travel fee, deposit and calendar — you approve every booking. Free to start."
	/>
	<meta property="og:title" content="MUAsuites — your WhatsApp stays. The chaos goes." />
	<meta
		property="og:description"
		content="Booking links, DuitNow deposits and calendar sync for makeup artists. Free to start."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://muasuites.com/og.svg" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</` + 'script>'}
</svelte:head>

<div class="landing min-h-dvh overflow-x-clip">
	<div class="grain-overlay" aria-hidden="true"></div>

	<AnnouncementBar />
	<Nav />

	<main>
		<Hero />
		<ProblemSection />
		<ComparisonSection />
		<HowItWorks />
		<ClientExperience />
		<FeaturesSection />
		<ControlSection />
		<PricingSection />
		<FaqSection />
		<FinalCta />
	</main>

	<Footer />
	<StickyMobileCta />
</div>
