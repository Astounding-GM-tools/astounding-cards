interface BaseBlock {
    content: string;
    type: 'headline' | 'image' | 'text';
    class?: string;
}

export interface HeadlineBlockProps extends BaseBlock {
    headerType: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface ImageBlockProps extends BaseBlock {
    caption: string;
}

interface TextLine {
    type: 'p' | 'li' | 'span' | 'strong' | 'em';
    content: string;
}

export interface TextBlockProps extends Omit<BaseBlock, 'content'> {
    content: TextLine[];
}

export type Blocks = Array<TextBlockProps | ImageBlockProps | HeadlineBlockProps>;

export interface ContentProps {
    blocks: Blocks;
}