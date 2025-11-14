<section class="test-layout">
	<h1>Test Layout</h1>
	<label for="small">Small (poker) cards</label>
	<input type="checkbox" id="small" />
	<section class="page" data-size="poker">
		<article class="card">
			<div class="crop-mark top-left"></div>
			<div class="crop-mark top-right"></div>
			<div class="crop-mark bottom-left"></div>
			<div class="crop-mark bottom-right"></div>
			<section class="content">
				<h1>Card 1</h1>
				<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
			</section>
		</article>
	</section>

	<section class="page back-page" data-size="tarot">
		<article class="card">
			<div class="crop-mark top-left"></div>
			<div class="crop-mark top-right"></div>
			<div class="crop-mark bottom-left"></div>
			<div class="crop-mark bottom-right"></div>
			<section class="content">
				<h1>Back Card 1</h1>
				<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
			</section>
		</article>
	</section>
</section>

<style>
	.test-layout {
		margin: 20px auto;
		width: 100%;
		max-width: 1000px;

		--crop-mark-size: 10mm;
		--crop-mark-border-width: 0.25mm;
		--crop-mark-border-color: black;
	}

	.page {
		border: 1px solid gray;
		display: grid;
		padding: 10mm;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
	}

	.back-page {
		direction: rtl;
	}

	#small:checked + .page {
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
	}

	.card {
		display: flex;
		flex-direction: column;
		background-color: lightblue;
		aspect-ratio: 5/7;
		position: relative;
		direction: ltr;

		container-type: inline-size;
		container-name: card;
	}

	.content {
		font-size: 10cqw;
	}

	.content h1 {
		margin: 0;
		padding: 0;
		font-size: 1.2em;
	}

	.content p {
		margin: 0;
		padding: 0;
		font-size: 0.8em;
	}

	.crop-mark {
		position: absolute;
		width: 10mm;
		height: 10mm;
		border-style: solid;
		border-width: 0;
		border-color: var(--crop-mark-border-color);
	}

	.crop-mark.top-left {
		top: -10mm;
		left: -10mm;
		border-right-width: var(--crop-mark-border-width);
		border-bottom-width: var(--crop-mark-border-width);
	}

	.crop-mark.top-right {
		top: -10mm;
		right: -10mm;
		border-left-width: var(--crop-mark-border-width);
		border-bottom-width: var(--crop-mark-border-width);
	}

	.crop-mark.bottom-left {
		bottom: -10mm;
		left: -10mm;
		border-right-width: var(--crop-mark-border-width);
		border-top-width: var(--crop-mark-border-width);
	}

	.crop-mark.bottom-right {
		bottom: -10mm;
		right: -10mm;
		border-left-width: var(--crop-mark-border-width);
		border-top-width: var(--crop-mark-border-width);
	}
</style>
