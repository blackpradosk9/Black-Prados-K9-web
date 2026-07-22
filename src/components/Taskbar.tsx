import React, { useState } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Plus,
  Trash2,
  X,
  Layers,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';
import { CustomPanel } from '../types';

interface TaskbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddPanel: (type: CustomPanel['type']) => void;
  customPanels: CustomPanel[];
  onDeletePanel: (id: string) => void;
  onExitEditMode: () => void;
}

const FONT_OPTIONS = [
  { name: 'Anton (Display)', value: 'Anton, sans-serif' },
  { name: 'Work Sans (Default)', value: 'Work Sans, sans-serif' },
  { name: 'Playfair (Serif)', value: 'Playfair Display, serif' },
  { name: 'Inter (Clean)', value: 'Inter, sans-serif' },
  { name: 'Courier (Mono)', value: 'Courier Prime, monospace' },
  { name: 'Georgia (Classic)', value: 'Georgia, serif' },
];

const SIZE_OPTIONS = [
  { label: '12px (Small)', value: '12px', cmdSize: '1' },
  { label: '14px (Normal)', value: '14px', cmdSize: '2' },
  { label: '16px (Body)', value: '16px', cmdSize: '3' },
  { label: '18px (Large)', value: '18px', cmdSize: '4' },
  { label: '24px (Subheading)', value: '24px', cmdSize: '5' },
  { label: '32px (Heading)', value: '32px', cmdSize: '6' },
  { label: '48px (Title)', value: '48px', cmdSize: '7' },
  { label: '64px (Hero)', value: '64px', cmdSize: '7' },
];

const COLOR_SWATCHES = [
  { name: 'Ember Gold', hex: '#b37e2d' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Bone White', hex: '#f5f7fa' },
  { name: 'Deep Slate', hex: '#0f172a' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Violet', hex: '#a855f7' },
];

export const Taskbar: React.FC<TaskbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddPanel,
  customPanels,
  onDeletePanel,
  onExitEditMode
}) => {
  const [showAddPanelMenu, setShowAddPanelMenu] = useState(false);
  const [showManagePanelsMenu, setShowManagePanelsMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#b37e2d');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ExecCommand Helpers for Active Selection or ContentEditable
  const execCmd = (cmd: string, val: string = '') => {
    try {
      document.execCommand(cmd, false, val);
    } catch (e) {
      console.warn('execCommand failed:', e);
    }
  };

  const handleApplyFont = (fontValue: string) => {
    execCmd('fontName', fontValue);
    setShowFontMenu(false);
  };

  const handleApplySize = (cmdSize: string, pxSize: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Wrap in span with exact inline style
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = pxSize;
      try {
        range.surroundContents(span);
      } catch (e) {
        execCmd('fontSize', cmdSize);
      }
    } else {
      execCmd('fontSize', cmdSize);
    }
    setShowSizeMenu(false);
  };

  const handleApplyColor = (hex: string) => {
    setSelectedColor(hex);
    execCmd('foreColor', hex);
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-5xl w-[95%] sm:w-auto bg-black/95 backdrop-blur-md text-emerald-400 border border-emerald-500/60 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.25)] p-2 md:p-3 flex flex-wrap items-center justify-between gap-2 transition-all animate-fade-in font-mono">
      
      {/* LEFT SECTION: Undo/Redo & Text Formatting Tools */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
        
        {/* Undo / Redo */}
        <div className="flex items-center bg-zinc-900/90 rounded-lg p-1 border border-emerald-900">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-emerald-950/80 hover:text-emerald-300 disabled:opacity-30 disabled:hover:bg-transparent text-emerald-400 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-emerald-950/80 hover:text-emerald-300 disabled:opacity-30 disabled:hover:bg-transparent text-emerald-400 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-emerald-900/80 mx-0.5" />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFontMenu(!showFontMenu);
              setShowSizeMenu(false);
              setShowColorMenu(false);
              setShowAddPanelMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-emerald-950/80 border border-emerald-800/80 hover:border-emerald-500 rounded-lg cursor-pointer transition-colors text-emerald-300"
            title="Select Font Family"
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Font</span>
            <ChevronDown className="w-3 h-3 text-emerald-500" />
          </button>

          {showFontMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-950 border border-emerald-600/80 rounded-lg shadow-2xl p-1 z-50 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-2 py-1 border-b border-emerald-900/60">Font Family</div>
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => handleApplyFont(font.value)}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-100 transition-colors cursor-pointer flex items-center justify-between"
                  style={{ fontFamily: font.value }}
                >
                  <span>{font.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Size Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSizeMenu(!showSizeMenu);
              setShowFontMenu(false);
              setShowColorMenu(false);
              setShowAddPanelMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-emerald-950/80 border border-emerald-800/80 hover:border-emerald-500 rounded-lg cursor-pointer transition-colors text-emerald-300"
            title="Text Size"
          >
            <span className="text-emerald-400 font-bold text-xs">Aa</span>
            <span className="hidden sm:inline">Size</span>
            <ChevronDown className="w-3 h-3 text-emerald-500" />
          </button>

          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-zinc-950 border border-emerald-600/80 rounded-lg shadow-2xl p-1 z-50 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-2 py-1 border-b border-emerald-900/60">Text Size</div>
              {SIZE_OPTIONS.map((sz) => (
                <button
                  key={sz.label}
                  onClick={() => handleApplySize(sz.cmdSize, sz.value)}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-100 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{sz.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color Picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowFontMenu(false);
              setShowSizeMenu(false);
              setShowAddPanelMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-emerald-950/80 border border-emerald-800/80 hover:border-emerald-500 rounded-lg cursor-pointer transition-colors text-emerald-300"
            title="Text Color"
          >
            <div className="w-3.5 h-3.5 rounded-full border border-emerald-500 shadow-sm" style={{ backgroundColor: selectedColor }} />
            <span className="hidden sm:inline">Color</span>
            <ChevronDown className="w-3 h-3 text-emerald-500" />
          </button>

          {showColorMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-950 border border-emerald-600/80 rounded-lg shadow-2xl p-3 z-50 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 border-b border-emerald-900/60 pb-1">Brand Swatches</div>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.name}
                    onClick={() => handleApplyColor(swatch.hex)}
                    className="w-8 h-8 rounded-full border border-emerald-800 hover:scale-110 transition-transform cursor-pointer relative flex items-center justify-center shadow"
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                  >
                    {selectedColor === swatch.hex && <Check className="w-3 h-3 text-black drop-shadow" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-emerald-900/80 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Custom Hex:</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleApplyColor(e.target.value)}
                  className="w-8 h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-emerald-900/80 mx-0.5 hidden md:block" />

        {/* Formatting Buttons */}
        <div className="flex items-center bg-zinc-900/90 rounded-lg p-1 border border-emerald-900">
          <button
            onClick={() => execCmd('bold')}
            className="p-1.5 rounded hover:bg-emerald-950/80 text-emerald-300 transition-colors cursor-pointer"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('italic')}
            className="p-1.5 rounded hover:bg-emerald-950/80 text-emerald-300 transition-colors cursor-pointer"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('underline')}
            className="p-1.5 rounded hover:bg-emerald-950/80 text-emerald-300 transition-colors cursor-pointer"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="hidden sm:flex items-center bg-zinc-900/90 rounded-lg p-1 border border-emerald-900">
          <button
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 rounded hover:bg-emerald-950/80 text-emerald-300 transition-colors cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 rounded hover:bg-emerald-950/80 text-emerald-300 transition-colors cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 rounded hover:bg-emerald-950/80 text-emerald-300 transition-colors cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* RIGHT SECTION: Panel Management & Exit */}
      <div className="flex items-center gap-2">
        
        {/* ADD PANEL BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAddPanelMenu(!showAddPanelMenu);
              setShowFontMenu(false);
              setShowSizeMenu(false);
              setShowColorMenu(false);
              setShowManagePanelsMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            title="Add a New Custom Panel / Section"
          >
            <Plus className="w-4 h-4" />
            <span>Add Panel</span>
          </button>

          {showAddPanelMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-950 border border-emerald-500/80 rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1 flex items-center justify-between border-b border-emerald-900/60">
                <span>Select Panel Preset</span>
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </div>

              <button
                onClick={() => {
                  onAddPanel('banner');
                  setShowAddPanelMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-emerald-950/60 transition-colors cursor-pointer flex flex-col group border border-transparent hover:border-emerald-800/60"
              >
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-100">📢 Promo / Announcement Banner</span>
                <span className="text-[10px] text-emerald-600">Full-width callout section with eyebrow, heading & CTA button</span>
              </button>

              <button
                onClick={() => {
                  onAddPanel('features');
                  setShowAddPanelMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-emerald-950/60 transition-colors cursor-pointer flex flex-col group border border-transparent hover:border-emerald-800/60"
              >
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-100">✨ Feature Grid Panel</span>
                <span className="text-[10px] text-emerald-600">3-column highlights grid with titles & descriptions</span>
              </button>

              <button
                onClick={() => {
                  onAddPanel('testimonials');
                  setShowAddPanelMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-emerald-950/60 transition-colors cursor-pointer flex flex-col group border border-transparent hover:border-emerald-800/60"
              >
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-100">💬 Customer Spotlight Card</span>
                <span className="text-[10px] text-emerald-600">Quote card block with ratings & owner feedback</span>
              </button>

              <button
                onClick={() => {
                  onAddPanel('cards');
                  setShowAddPanelMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-emerald-950/60 transition-colors cursor-pointer flex flex-col group border border-transparent hover:border-emerald-800/60"
              >
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-100">🏷️ Service Packages Tier</span>
                <span className="text-[10px] text-emerald-600">Pricing cards grid with prices & features list</span>
              </button>

              <button
                onClick={() => {
                  onAddPanel('richText');
                  setShowAddPanelMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-emerald-950/60 transition-colors cursor-pointer flex flex-col group border border-transparent hover:border-emerald-800/60"
              >
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-100">📝 Rich Text Content Block</span>
                <span className="text-[10px] text-emerald-600">Custom formatted message or story section</span>
              </button>
            </div>
          )}
        </div>

        {/* MANAGE PANELS BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setShowManagePanelsMenu(!showManagePanelsMenu);
              setShowAddPanelMenu(false);
              setShowFontMenu(false);
              setShowSizeMenu(false);
              setShowColorMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-emerald-950/80 border border-emerald-800/80 rounded-lg cursor-pointer transition-colors text-emerald-300"
            title="Manage Custom Panels"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Panels</span>
            <span className="bg-emerald-500 text-black font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              {customPanels.length}
            </span>
          </button>

          {showManagePanelsMenu && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-950 border border-emerald-600/80 rounded-xl shadow-2xl p-3 z-50 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 border-b border-emerald-900/60 pb-1 flex justify-between items-center">
                <span>Active Custom Panels</span>
                <span>{customPanels.length} total</span>
              </div>

              {customPanels.length === 0 ? (
                <div className="text-xs text-emerald-600 py-3 text-center">
                  No custom panels added yet. Click "+ Add Panel" to create one!
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {customPanels.map((panel, idx) => (
                    <div key={panel.id} className="flex items-center justify-between bg-black/80 p-2 rounded border border-emerald-900 text-xs">
                      <div className="flex flex-col truncate max-w-[170px]">
                        <span className="font-bold text-emerald-300 truncate">{idx + 1}. {panel.title}</span>
                        <span className="text-[9px] uppercase text-emerald-500 font-mono">{panel.type}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {confirmDeleteId === panel.id ? (
                          <div className="flex items-center gap-1 bg-red-950/90 p-1 rounded border border-red-800">
                            <button
                              onClick={() => {
                                onDeletePanel(panel.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[9px] bg-red-600 hover:bg-red-500 text-white font-bold px-1.5 py-0.5 rounded uppercase"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[9px] bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.5 rounded uppercase"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(panel.id)}
                            className="p-1 rounded text-red-400 hover:bg-red-950/60 transition-colors"
                            title="Delete Panel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* EXIT EDIT MODE */}
        <button
          onClick={onExitEditMode}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-red-950 hover:bg-red-900 text-red-300 rounded-lg cursor-pointer transition-all border border-red-700/80 shadow-[0_0_10px_rgba(220,38,38,0.2)]"
          title="Exit Edit Mode"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Done</span>
        </button>

      </div>

    </div>
  );
};
