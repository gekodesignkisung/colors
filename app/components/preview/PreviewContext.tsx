'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useColorStore } from '@/store/colorStore';

interface PreviewContextValue {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  selectedColorProp: 'background' | 'text' | 'border';
  setSelectedColorProp: (prop: 'background' | 'text' | 'border') => void;
  panelAnchor: { x: number; y: number } | null;
  setPanelAnchor: (pos: { x: number; y: number } | null) => void;
  getColor: (elementId: string, variant: string, type: string, state: string) => string;
}

const PreviewContext = createContext<PreviewContextValue | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedColorProp, setSelectedColorProp] = useState<'background' | 'text' | 'border'>('background');
  const [panelAnchor, setPanelAnchor] = useState<{ x: number; y: number } | null>(null);

  const tokens = useColorStore(s => s.tokens);
  const previewAssignments = useColorStore(s => s.previewAssignments);

  // Map any semantic type to one of the 3 panel tabs (background / text / border)
  const toAssignProp = (type: string): 'background' | 'text' | 'border' => {
    if (type === 'text') return 'text';
    if (type === 'border' || type === 'outline') return 'border';
    return 'background'; // background, background-dark, card, fill, etc.
  };

  // Assignment key = "elementId:assignProp" so each color property is independent
  const getColor = (elementId: string, variant: string, type: string, state: string): string => {
    const assignProp = toAssignProp(type);

    // Check manual assignment first
    const assignedTokenId = previewAssignments[`${elementId}:${assignProp}`];
    if (assignedTokenId) {
      const token = tokens.find(t => t.id === assignedTokenId);
      if (token) return token.color;
    }

    // Fallback: find token by variant/assignProp/state
    // (assignProp normalizes 'background-dark', 'card', 'outline' → 'background' / 'border')
    const token =
      tokens.find(t =>
        t.rule.namingVariant === variant &&
        t.rule.namingType === assignProp &&
        t.rule.namingState === state
      ) ??
      // if exact state not found, try 'default'
      tokens.find(t =>
        t.rule.namingVariant === variant &&
        t.rule.namingType === assignProp &&
        t.rule.namingState === 'default'
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
        selectedColorProp,
        setSelectedColorProp,
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
