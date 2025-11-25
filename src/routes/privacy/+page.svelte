<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Privacy Policy - Astounding Cards</title>
	<meta name="description" content="Privacy Policy for Astounding Cards" />
</svelte:head>

<div class="legal-page">
	<div class="content">
		<h1>Privacy Policy</h1>
		<p class="last-updated">
			Last updated: {new Date().toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</p>

		<section>
			<h2>Introduction</h2>
			<p>
				Astounding Cards ("we", "our", or "us") is committed to protecting your privacy. This
				Privacy Policy explains how we collect, use, and safeguard your information when you use our
				card creation application.
			</p>
		</section>

		<section>
			<h2>Information We Collect</h2>

			<h3>Account Information</h3>
			<p>When you sign in with Google, we collect:</p>
			<ul>
				<li>Your email address</li>
				<li>Your name</li>
				<li>Your Google profile picture (if available)</li>
			</ul>

			<h3>Usage Data</h3>
			<p>We automatically collect certain information when you use our service:</p>
			<ul>
				<li>Decks and cards you create</li>
				<li>Images you upload or generate</li>
				<li>Token usage for AI features</li>
				<li>Browser type and device information</li>
				<li>Error logs and performance data (via Sentry)</li>
			</ul>
		</section>

		<section>
			<h2>How We Use Your Information</h2>
			<p>We use the collected information to:</p>
			<ul>
				<li>Provide and maintain our service</li>
				<li>Authenticate your account</li>
				<li>Store your created content (decks, cards, images)</li>
				<li>Process AI generation requests</li>
				<li>Track token usage for billing/quota purposes</li>
				<li>Improve our service and fix bugs</li>
				<li>Communicate with you about service updates (with your consent)</li>
			</ul>
		</section>

		<section>
			<h2>Email Communications</h2>
			<p>With your explicit consent, we may send you emails about:</p>
			<ul>
				<li>Product updates and new features</li>
				<li>Important service changes or maintenance</li>
				<li>Community highlights and featured decks from the gallery</li>
				<li>Tips for using the service effectively</li>
			</ul>
			<p>
				You can opt in or out of these communications at any time in your dashboard settings. We
				will never sell or share your email with third parties for marketing purposes. Critical
				service notifications (security issues, account-related) may be sent regardless of your
				communication preferences.
			</p>
			<p>
				<strong>Frequency:</strong> We aim to send updates no more than once per month, except for
				urgent service-related notifications.
			</p>
		</section>

		<section>
			<h2>Data Storage</h2>
			<p>Your data is stored in the following locations:</p>
			<ul>
				<li><strong>Local Storage:</strong> Your browser's IndexedDB for offline functionality</li>
				<li><strong>Supabase:</strong> User accounts, published decks, and token balances</li>
				<li><strong>Cloudflare R2:</strong> Uploaded and generated images</li>
			</ul>
		</section>

		<section>
			<h2>Data Sharing</h2>
			<p>We do not sell your personal information. We share data only with:</p>
			<ul>
				<li><strong>Google:</strong> For authentication purposes</li>
				<li><strong>Supabase:</strong> Our database and authentication provider</li>
				<li><strong>Cloudflare:</strong> For image hosting</li>
				<li>
					<strong>Google Gemini AI:</strong> For AI-powered card and image generation (prompts only,
					no personal data)
				</li>
				<li><strong>Sentry:</strong> For error tracking and performance monitoring</li>
			</ul>
		</section>

		<section>
			<h2>Your Rights</h2>
			<p>You have the right to:</p>
			<ul>
				<li>Access your personal data</li>
				<li>Delete your account and associated data</li>
				<li>Export your created content</li>
				<li>Opt out of AI features</li>
			</ul>
			<p>To exercise these rights, please contact us at the email below.</p>
		</section>

		<section>
			<h2>Data Security</h2>
			<p>
				We implement industry-standard security measures to protect your data. However, no method of
				transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
			</p>
		</section>

		<section>
			<h2>Children's Privacy</h2>
			<p>
				Our service is not intended for children under 13. We do not knowingly collect personal
				information from children under 13. If you believe we have collected such information,
				please contact us.
			</p>
		</section>

		<section>
			<h2>Changes to This Policy</h2>
			<p>
				We may update this Privacy Policy from time to time. We will notify you of any changes by
				posting the new Privacy Policy on this page and updating the "Last updated" date.
			</p>
		</section>

		<section>
			<h2>Contact Us</h2>
			<p>If you have questions about this Privacy Policy, please contact us at:</p>
			<p><strong>Email:</strong> golemaktig+privacy@gmail.com</p>
		</section>

		<div class="back-link">
			<a href="/">← Back to Astounding Cards</a>
		</div>
	</div>
</div>

<style>
	.legal-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
		line-height: 1.6;
	}

	.content {
		background: var(--ui-bg, #ffffff);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 2rem;
	}

	h1 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: var(--text-primary, #1a202c);
	}

	.last-updated {
		color: var(--text-secondary, #718096);
		margin-bottom: 2rem;
		font-size: 0.9rem;
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: var(--text-primary, #1a202c);
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		padding-bottom: 0.5rem;
	}

	h3 {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: var(--text-primary, #1a202c);
		font-size: 1.1rem;
	}

	p {
		margin-bottom: 1rem;
		color: var(--text-primary, #2d3748);
	}

	ul {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
		color: var(--text-primary, #2d3748);
	}

	strong {
		color: var(--text-primary, #1a202c);
	}

	.back-link {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.back-link a {
		color: var(--primary, #3b82f6);
		text-decoration: none;
	}

	.back-link a:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.legal-page {
			padding: 1rem 0.5rem;
		}

		.content {
			padding: 1.5rem;
		}
	}
</style>
