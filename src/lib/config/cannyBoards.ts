export type CannyBoardKind = 'feedback' | 'bug-report' | 'feature-request';

export const CANNY_BOARDS: Record<CannyBoardKind, { token: string; path: string; label: string }> = {
	feedback: {
		token: 'fa8409f4-c781-afe7-9602-4ec48d58988b',
		path: '/feedback/general',
		label: 'Feedback'
	},
	'bug-report': {
		token: '3a0433ac-06d3-898e-4012-b4e58602f2c9',
		path: '/feedback/bug-report',
		label: 'Bug report'
	},
	'feature-request': {
		token: '6f87df40-d3a5-c2b8-a960-a5c701694c0f',
		path: '/feedback/feature-request',
		label: 'Feature request'
	}
};
