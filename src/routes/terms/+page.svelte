<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Terms of Service - Astounding Cards</title>
	<meta name="description" content="Terms of Service for Astounding Cards" />
</svelte:head>

<div class="legal-page">
	<div class="content">
		<h1>Terms of Service</h1>
		<p class="last-updated">
			Last updated: {new Date().toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</p>

		<section>
			<h2>1. Acceptance of Terms</h2>
			<p>
				By accessing or using Astounding Cards ("the Service"), you agree to be bound by these Terms
				of Service. If you do not agree to these terms, please do not use the Service.
			</p>
		</section>

		<section>
			<h2>2. Description of Service</h2>
			<p>
				Astounding Cards is a hobby and community project providing a web-based application that
				allows users to create, design, and manage custom cards for tabletop RPGs, board games, and
				other creative projects. The Service includes:
			</p>
			<ul>
				<li>Card and deck creation tools</li>
				<li>AI-powered card and image generation</li>
				<li>Image upload and hosting</li>
				<li>Publishing and sharing of decks</li>
				<li>Community gallery features</li>
			</ul>
		</section>

		<section>
			<h2>3. User Accounts</h2>
			<p>
				To access certain features, you must create an account using Google authentication. You are
				responsible for:
			</p>
			<ul>
				<li>Maintaining the security of your account</li>
				<li>All activities that occur under your account</li>
				<li>Notifying us immediately of any unauthorized use</li>
			</ul>
		</section>

		<section>
			<h2>4. User Content</h2>

			<h3>Your Responsibilities</h3>
			<p>
				You are solely responsible for the content you create, upload, or share through the Service.
				You agree not to:
			</p>
			<ul>
				<li>Upload or share content that infringes on intellectual property rights</li>
				<li>Post illegal, harmful, threatening, abusive, or offensive content</li>
				<li>Impersonate others or misrepresent your affiliation</li>
				<li>Use the Service for any unlawful purpose</li>
			</ul>

			<h3>Content Ownership</h3>
			<p>
				You retain ownership of the content you create. By publishing content to the public gallery,
				you grant us a non-exclusive, worldwide license to display and distribute that content
				through the Service.
			</p>

			<h3>Content Moderation</h3>
			<p>
				We reserve the right to remove any content that violates these terms or is otherwise
				objectionable, without notice.
			</p>
		</section>

		<section>
			<h2>5. AI-Generated Content</h2>
			<p>
				The Service uses AI technology (Google Gemini) to generate cards and images. You acknowledge
				that:
			</p>
			<ul>
				<li>AI-generated content may not always be accurate or appropriate</li>
				<li>You are responsible for reviewing and editing AI-generated content before use</li>
				<li>AI generation consumes tokens from your account balance</li>
				<li>We do not guarantee the quality or suitability of AI-generated content</li>
			</ul>
		</section>

		<section>
			<h2>6. Tokens and Payments</h2>

			<h3>Nature of Service</h3>
			<p>
				Astounding Cards is a hobby and community project. Revenue from token purchases primarily
				covers operational costs (AI API fees, hosting, storage). We do not guarantee profits
				or commercial viability.
			</p>

			<h3>Token Purchases</h3>
			<p>
				Some features require tokens, which are consumed when using AI generation features:
			</p>
			<ul>
				<li>Token costs are displayed in the application before purchase</li>
				<li><strong>All purchases are final and non-refundable</strong></li>
				<li>Tokens are a digital service delivered immediately upon purchase</li>
				<li>Once tokens are consumed (used for AI generation), they cannot be restored</li>
				<li>Unused tokens remain in your account unless the service is discontinued</li>
			</ul>

			<h3>Service Discontinuation</h3>
			<p>
				As a hobby project, we reserve the right to discontinue the Service or specific features
				(including token purchases) at any time:
			</p>
			<ul>
				<li>If token purchases are discontinued, we will provide at least 30 days notice</li>
				<li>Users will have the opportunity to use remaining tokens during this period</li>
				<li>Unused tokens may be refunded at our discretion if the service shuts down</li>
				<li>We are not obligated to provide refunds for tokens in active accounts</li>
			</ul>
		</section>

		<section>
			<h2>7. Intellectual Property</h2>
			<p>
				The Service, including its design, features, and underlying technology, is protected by
				copyright and other intellectual property laws. You may not:
			</p>
			<ul>
				<li>Copy, modify, or distribute the Service</li>
				<li>Reverse engineer or attempt to extract source code</li>
				<li>Remove or alter any copyright notices</li>
			</ul>
		</section>

		<section>
			<h2>8. Prohibited Uses</h2>
			<p>You agree not to:</p>
			<ul>
				<li>Use the Service in any way that violates laws or regulations</li>
				<li>Attempt to gain unauthorized access to the Service or related systems</li>
				<li>Interfere with or disrupt the Service</li>
				<li>Use automated systems (bots, scrapers) without permission</li>
				<li>Circumvent usage limits or restrictions</li>
			</ul>
		</section>

		<section>
			<h2>9. Service Availability</h2>
			<p>We strive to provide reliable service, but we do not guarantee:</p>
			<ul>
				<li>Uninterrupted or error-free operation</li>
				<li>That the Service will meet your specific requirements</li>
				<li>That your data will always be accessible or recoverable</li>
			</ul>
			<p>
				We may modify, suspend, or discontinue any part of the Service at any time with or without
				notice.
			</p>
		</section>

		<section>
			<h2>10. Disclaimer of Warranties</h2>
			<p>
				THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
				EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
				FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
			</p>
		</section>

		<section>
			<h2>11. Limitation of Liability</h2>
			<p>
				TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
				SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
				INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR OTHER INTANGIBLE LOSSES.
			</p>
		</section>

		<section>
			<h2>12. Indemnification</h2>
			<p>
				You agree to indemnify and hold us harmless from any claims, damages, liabilities, and
				expenses (including legal fees) arising from your use of the Service or violation of these
				terms.
			</p>
		</section>

		<section>
			<h2>13. Termination</h2>
			<p>
				We may terminate or suspend your account and access to the Service at any time, with or
				without cause or notice, for any reason including violation of these terms.
			</p>
			<p>
				You may delete your account at any time. Upon termination, your right to use the Service
				will immediately cease.
			</p>
		</section>

		<section>
			<h2>14. Changes to Terms</h2>
			<p>
				We reserve the right to modify these terms at any time. We will notify users of material
				changes by posting the updated terms on this page with a new "Last updated" date. Your
				continued use of the Service after changes constitutes acceptance of the new terms.
			</p>
		</section>

		<section>
			<h2>15. Governing Law</h2>
			<p>
				These terms shall be governed by and construed in accordance with applicable laws, without
				regard to conflict of law provisions.
			</p>
		</section>

		<section>
			<h2>16. Contact Information</h2>
			<p>If you have questions about these Terms of Service, please contact us at:</p>
			<p><strong>Email:</strong> golemaktig+legal@gmail.com</p>
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
