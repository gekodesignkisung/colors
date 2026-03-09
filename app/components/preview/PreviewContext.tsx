'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useColorStore } from '@/store/colorStore';

interface PreviewContextValue {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  panelAnchor: { x: number; y: number } | null;
  setPanelAnchor: (pos: { x: number; y: number } | null) => void;
  getColor: (elementId: string, variant: string, type: string, state: string) => string;
}

const PreviewContext = createContext<PreviewContextValue | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [panelAnchor, setPanelAnchor] = useState<{ x: number; y: number } | null>(null);

  const tokens = useColorStore(s => s.tokens);
  const previewAssignments = useColorStore(s => s.previewAssignments);

  const getColor = (elementId: string, variant: string, type: string, state: string): string => {
    // Check if element has a token assignment
    const assignedTokenId = previewAssignments[elementId];
    if (assignedTokenId) {
      const token = tokens.find(t => t.id === assignedTokenId);
      if (token) return token.color;
    }

    // Fall back to default token lookup
    const token = tokens.find(t =>
      t.rule.namingVariant === variant &&
      t.rule.namingType === type &&
      t.rule.namingState === state
    );
    return token?.color ?? '#cccccc';
  };

  return (
    <PreviewContext.Provider
      value={{
        isEditMode,
        setIsEditMode,
        selectedElementId,
        setSelectedElementId,
        panelAnchor,
        setPanelAnchor,
        getColor,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreviewContext() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreviewContext must be used within PreviewProvider');
  }
  return context;
}

// Debug: Log context changes
if (typeof window !== 'undefined') {
  (window as any).logPreviewContext = (context: PreviewContextValue) => {
    console.log('🔍 PreviewContext state:', {
      isEditMode: context.isEditMode,
      selectedElementId: context.selectedElementId,
      panelAnchor: context.panelAnchor,
    });
  };
}
