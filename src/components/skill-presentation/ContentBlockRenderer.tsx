'use client';

import { ContentBlock } from '@/types/skill-presentation';
import {
  HookBlock,
  ConceptBlock,
  ExampleBlock,
  PracticeBlock,
  SynthesisBlock,
  RealWorldBlock,
  MetacognitionBlock,
  ExtensionBlock,
} from './blocks';

interface ContentBlockRendererProps {
  block: ContentBlock;
  onInteraction?: () => void;
  onComplete?: (correct: boolean) => void;
}

export function ContentBlockRenderer({ block, onInteraction, onComplete }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'hook':
      return <HookBlock block={block} onInteraction={onInteraction} />;
    
    case 'concept':
      return <ConceptBlock block={block} onInteraction={onInteraction} />;
    
    case 'example':
      return <ExampleBlock block={block} onInteraction={onInteraction} />;
    
    case 'practice':
      return <PracticeBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
    
    case 'synthesis':
      return <SynthesisBlock block={block} onInteraction={onInteraction} />;
    
    case 'real_world':
      return <RealWorldBlock block={block} onInteraction={onInteraction} />;
    
    case 'metacognition':
      return <MetacognitionBlock block={block} onInteraction={onInteraction} />;
    
    case 'extension':
      return <ExtensionBlock block={block} onInteraction={onInteraction} />;
    
    default:
      return (
        <div className="rounded-xl bg-gray-100 p-4 text-gray-500">
          Type de bloc inconnu: {block.type}
        </div>
      );
  }
}
