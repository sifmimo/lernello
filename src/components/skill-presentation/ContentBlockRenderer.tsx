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
  ReadingBlock,
  VocabularyBlock,
  RuleBlock,
  ObservationBlock,
  ExperimentBlock,
  DemoBlock,
  TechniqueBlock,
  ContextBlock,
  AudioBlock,
  NarrationBlock,
} from './blocks';

interface ContentBlockRendererProps {
  block: ContentBlock;
  onInteraction?: () => void;
  onComplete?: (correct: boolean) => void;
}

export function ContentBlockRenderer({ block, onInteraction, onComplete }: ContentBlockRendererProps) {
  switch (block.type) {
    // Blocs génériques
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

    // Blocs Français
    case 'reading':
      return <ReadingBlock block={block} onInteraction={onInteraction} />;
    
    case 'vocabulary':
      return <VocabularyBlock block={block} onInteraction={onInteraction} />;
    
    case 'rule':
      return <RuleBlock block={block} onInteraction={onInteraction} />;

    // Blocs Sciences
    case 'observation':
      return <ObservationBlock block={block} onInteraction={onInteraction} />;
    
    case 'experiment':
      return <ExperimentBlock block={block} onInteraction={onInteraction} />;
    
    case 'hypothesis':
      return <ObservationBlock block={block} onInteraction={onInteraction} />;
    
    case 'conclusion':
      return <SynthesisBlock block={block} onInteraction={onInteraction} />;

    // Blocs Informatique
    case 'demo':
      return <DemoBlock block={block} onInteraction={onInteraction} />;
    
    case 'debug':
      return <DemoBlock block={block} onInteraction={onInteraction} />;

    // Blocs Arts
    case 'technique':
      return <TechniqueBlock block={block} onInteraction={onInteraction} />;
    
    case 'creation':
      return <TechniqueBlock block={block} onInteraction={onInteraction} />;

    // Blocs Histoire
    case 'context':
      return <ContextBlock block={block} onInteraction={onInteraction} />;
    
    case 'story':
      return <HookBlock block={block} onInteraction={onInteraction} />;
    
    case 'characters':
      return <ContextBlock block={block} onInteraction={onInteraction} />;
    
    case 'legacy':
      return <RealWorldBlock block={block} onInteraction={onInteraction} />;

    // Autres
    case 'expression':
      return <PracticeBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
    
    case 'dictation':
      return <ReadingBlock block={block} onInteraction={onInteraction} />;

    // Blocs Audio V6
    case 'audio':
      return <AudioBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
    
    case 'narration':
      return <NarrationBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
    
    default:
      return (
        <div className="rounded-xl bg-gray-100 p-4 text-gray-500">
          Type de bloc inconnu: {block.type}
        </div>
      );
  }
}
