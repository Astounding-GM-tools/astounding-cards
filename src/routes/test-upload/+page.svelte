<script lang="ts">
	let uploading = $state(false);
	let result = $state<any>(null);
	let error = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	async function handleUpload() {
		if (!fileInput?.files?.[0]) {
			error = 'Please select a file';
			return;
		}

		const file = fileInput.files[0];
		
		uploading = true;
		error = null;
		result = null;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('cardId', 'test-' + Date.now());

			const response = await fetch('/api/images/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Upload failed');
			}

			result = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="container">
	<h1>R2 Image Upload Test</h1>
	
	<div class="upload-form">
		<input 
			type="file" 
			accept="image/*" 
			bind:this={fileInput}
			disabled={uploading}
		/>
		
		<button onclick={handleUpload} disabled={uploading}>
			{uploading ? 'Uploading...' : 'Upload to R2'}
		</button>
	</div>

	{#if error}
		<div class="error">
			<strong>Error:</strong> {error}
		</div>
	{/if}

	{#if result}
		<div class="success">
			<h2>✅ Upload Successful!</h2>
			<pre>{JSON.stringify(result, null, 2)}</pre>
			
			<p><strong>Key:</strong> {result.key}</p>
			<p><strong>URL:</strong> <a href={result.url} target="_blank">{result.url}</a></p>
			<p><strong>Size:</strong> {(result.size / 1024).toFixed(2)} KB</p>
			<p><strong>Type:</strong> {result.contentType}</p>
			
			{#if result.url.startsWith('http')}
				<div class="image-preview">
					<h3>Image Preview:</h3>
					<img src={result.url} alt="Uploaded to R2" />
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		color: #333;
		margin-bottom: 2rem;
	}

	.upload-form {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #2563eb;
	}

	button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.error {
		padding: 1rem;
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 6px;
		color: #c33;
	}

	.success {
		padding: 1rem;
		background: #efe;
		border: 1px solid #cfc;
		border-radius: 6px;
	}

	pre {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
	}

	.note {
		margin-top: 1rem;
		padding: 1rem;
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.image-preview {
		margin-top: 1rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 4px;
	}

	.image-preview h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.image-preview img {
		max-width: 100%;
		height: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
	}
</style>
