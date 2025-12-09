/**
 * Direct Re-embedding Script (Simplified)
 *
 * Directly connects to Supabase using SUPABASE_SECRET_API_KEY
 * No API endpoint needed - runs locally against production database
 *
 * Usage:
 *   npx tsx scripts/reembed-direct.ts [--dry-run] [--batch-size=N]
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Validate required environment variables
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('❌ Missing Supabase configuration in .env.local:');
	console.error('   PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
	console.error('   SUPABASE_SECRET_API_KEY:', SUPABASE_KEY ? '✓' : '✗');
	process.exit(1);
}

if (!GEMINI_KEY) {
	console.error('❌ Missing GEMINI_API_KEY in .env.local');
	process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// Constants
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 3072;

/**
 * Generate embedding using Gemini
 */
async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const result = await ai.models.embedContent({
			model: EMBEDDING_MODEL,
			contents: text
		});

		const embedding = result.embeddings?.[0] || result.embedding;
		if (!embedding?.values || embedding.values.length === 0) {
			throw new Error('No embedding values returned');
		}

		if (embedding.values.length !== EMBEDDING_DIMENSIONS) {
			console.warn(
				`Warning: embedding dimension ${embedding.values.length} (expected ${EMBEDDING_DIMENSIONS})`
			);
		}

		return embedding.values;
	} catch (error) {
		throw new Error(
			`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Get status of embeddings
 */
async function getStatus() {
	const { count: total } = await supabase
		.from('community_images')
		.select('id', { count: 'exact', head: true });

	const { count: completed } = await supabase
		.from('community_images')
		.select('id', { count: 'exact', head: true })
		.not('embedding', 'is', null);

	const { count: remaining } = await supabase
		.from('community_images')
		.select('id', { count: 'exact', head: true })
		.is('embedding', null);

	return {
		total: total ?? 0,
		completed: completed ?? 0,
		remaining: remaining ?? 0,
		percentComplete: total ? ((completed ?? 0) / total) * 100 : 0
	};
}

/**
 * Process a batch of images
 */
async function processBatch(offset: number, batchSize: number, dryRun: boolean) {
	const { data: images, error } = await supabase
		.from('community_images')
		.select('id, card_title')
		.is('embedding', null)
		.order('created_at', { ascending: true })
		.range(offset, offset + batchSize - 1);

	if (error) {
		throw new Error(`Failed to fetch images: ${error.message}`);
	}

	if (!images || images.length === 0) {
		return { processed: 0, successful: 0, failed: 0, errors: [], hasMore: false };
	}

	const results = {
		processed: 0,
		successful: 0,
		failed: 0,
		errors: [] as Array<{ id: string; error: string }>
	};

	for (const image of images) {
		results.processed++;

		try {
			// Use card_title as embedding text (fallback to "untitled")
			const text = image.card_title || 'untitled card';

			// Generate embedding
			const embedding = await generateEmbedding(text);

			// Update database (unless dry run)
			if (!dryRun) {
				const { error: updateError } = await supabase
					.from('community_images')
					.update({ embedding })
					.eq('id', image.id);

				if (updateError) {
					throw new Error(`DB update failed: ${updateError.message}`);
				}
			}

			results.successful++;
			console.log(
				`   ✓ ${image.id.substring(0, 8)}... "${text}" ${dryRun ? '(DRY RUN)' : '(SAVED)'}`
			);

			// Rate limiting: 100ms between requests
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (err) {
			results.failed++;
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			results.errors.push({ id: image.id, error: errorMsg });
			console.error(`   ✗ ${image.id.substring(0, 8)}... ${errorMsg}`);
		}
	}

	// Check if more remain
	const { count: remaining } = await supabase
		.from('community_images')
		.select('id', { count: 'exact', head: true })
		.is('embedding', null);

	return {
		...results,
		hasMore: (remaining ?? 0) > 0,
		totalRemaining: remaining ?? 0
	};
}

/**
 * Main execution
 */
async function main() {
	// Parse arguments
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const batchSizeArg = args.find((arg) => arg.startsWith('--batch-size='));
	const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 10;

	console.log('🚀 Direct Re-embedding Script');
	console.log(`   Supabase: ${SUPABASE_URL}`);
	console.log(`   Model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}d)`);
	console.log(`   Batch size: ${batchSize}`);
	console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update DB)'}`);
	console.log('');

	// Get initial status
	try {
		const status = await getStatus();
		console.log('📊 Current Status:');
		console.log(`   Total images: ${status.total}`);
		console.log(`   Completed: ${status.completed} (${status.percentComplete.toFixed(1)}%)`);
		console.log(`   Remaining: ${status.remaining}`);
		console.log('');

		if (status.remaining === 0) {
			console.log('✅ All images already have embeddings!');
			return;
		}
	} catch (err) {
		console.error('❌ Failed to get status:', err);
		process.exit(1);
	}

	// Process batches
	let offset = 0;
	let batchNumber = 1;
	let totalProcessed = 0;
	let totalSuccessful = 0;
	let totalFailed = 0;

	while (true) {
		console.log(`📦 Batch ${batchNumber} (offset: ${offset})`);

		try {
			const result = await processBatch(offset, batchSize, dryRun);

			totalProcessed += result.processed;
			totalSuccessful += result.successful;
			totalFailed += result.failed;

			if (result.errors.length > 0) {
				console.log('   Errors in this batch:');
				result.errors.forEach((err) => {
					console.log(`      ${err.id}: ${err.error}`);
				});
			}

			if (!result.hasMore) {
				console.log('');
				console.log('✅ All batches processed!');
				break;
			}

			console.log(`   Remaining: ${result.totalRemaining}`);
			console.log('');

			offset += batchSize;
			batchNumber++;

			// Small delay between batches
			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (err) {
			console.error(`❌ Batch ${batchNumber} failed:`, err);
			console.error('   Stopping execution');
			break;
		}
	}

	// Final summary
	console.log('');
	console.log('📊 Final Summary:');
	console.log(`   Processed: ${totalProcessed}`);
	console.log(`   Successful: ${totalSuccessful}`);
	console.log(`   Failed: ${totalFailed}`);

	if (dryRun) {
		console.log('');
		console.log('⚠️  DRY RUN - No changes were saved');
		console.log('   Run without --dry-run to actually update the database');
	}

	// Get final status
	try {
		const finalStatus = await getStatus();
		console.log('');
		console.log('📊 Final Database Status:');
		console.log(`   Total: ${finalStatus.total}`);
		console.log(
			`   Completed: ${finalStatus.completed} (${finalStatus.percentComplete.toFixed(1)}%)`
		);
		console.log(`   Remaining: ${finalStatus.remaining}`);
	} catch (err) {
		console.error('Failed to get final status:', err);
	}
}

// Run it!
main().catch((err) => {
	console.error('❌ Fatal error:', err);
	process.exit(1);
});
