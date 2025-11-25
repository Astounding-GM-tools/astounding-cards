import type { Meta, StoryObj } from '@storybook/svelte';
import Toasts from '$lib/components/ui/Toasts.svelte';
import { toasts } from '$lib/stores/toast';

const meta = {
	title: 'Components/Toasts',
	component: Toasts,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen'
	}
} satisfies Meta<Toasts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Demo: Story = {
	render: () => ({
		Component: Toasts,
		props: {},
		template: `
			<div>
				<Toasts />
				<div style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
					<h2>Toast Notification Demo</h2>
					<p>Click the buttons below to trigger different types of toast notifications:</p>

					<button
						onclick={() => toasts.success('Your changes have been saved successfully!')}
						style="padding: 0.75rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Success Toast (auto-dismiss 5s)
					</button>

					<button
						onclick={() => toasts.info('Here is some helpful information for you.')}
						style="padding: 0.75rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Info Toast (auto-dismiss 5s)
					</button>

					<button
						onclick={() => toasts.warning('Please be careful with this action.')}
						style="padding: 0.75rem 1rem; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Warning Toast (manual dismiss)
					</button>

					<button
						onclick={() => toasts.error('Something went wrong. Please try again.')}
						style="padding: 0.75rem 1rem; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Error Toast (manual dismiss)
					</button>

					<button
						onclick={() => {
							const id = toasts.loading('Processing your request...');
							setTimeout(() => {
								toasts.update(id, { type: 'success', message: 'Request completed!', timeout: 5000, dismissible: true });
							}, 3000);
						}}
						style="padding: 0.75rem 1rem; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Loading Toast (converts to success after 3s)
					</button>

					<button
						onclick={() => {
							toasts.success('Toast 1');
							setTimeout(() => toasts.info('Toast 2'), 200);
							setTimeout(() => toasts.warning('Toast 3'), 400);
						}}
						style="padding: 0.75rem 1rem; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Multiple Toasts
					</button>

					<div style="margin-top: 1rem; padding: 1rem; background: rgba(100, 116, 139, 0.1); border-radius: 6px; font-size: 0.875rem;">
						<strong>Toast Behavior:</strong>
						<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
							<li><strong>Success/Info:</strong> Auto-dismiss after 5 seconds</li>
							<li><strong>Warning/Error:</strong> Require manual dismissal (click X or click toast)</li>
							<li><strong>Loading:</strong> No dismiss button, must be updated programmatically</li>
						</ul>
					</div>
				</div>
			</div>
		`
	})
};

export const AllTypes: Story = {
	render: () => ({
		Component: Toasts,
		props: {},
		template: `
			<div>
				<Toasts />
				<div style="padding: 2rem;">
					<button
						onclick={() => {
							toasts.success('Success: Changes saved!');
							toasts.info('Info: Here is some information.');
							toasts.warning('Warning: Please be careful.');
							toasts.error('Error: Something went wrong.');
							toasts.loading('Loading: Processing...');
						}}
						style="padding: 1rem 2rem; background: #1e293b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;"
					>
						Show All Toast Types
					</button>
				</div>
			</div>
		`
	})
};

export const LongMessage: Story = {
	render: () => ({
		Component: Toasts,
		props: {},
		template: `
			<div>
				<Toasts />
				<div style="padding: 2rem;">
					<button
						onclick={() => toasts.info('This is a longer toast message that demonstrates how the component handles multi-line text with proper wrapping and icon alignment. The icon should stay at the top while the text wraps naturally.')}
						style="padding: 1rem 2rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;"
					>
						Show Long Message
					</button>
				</div>
			</div>
		`
	})
};
