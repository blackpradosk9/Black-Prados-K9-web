import React, { useState } from 'react';
import { CustomPanel, CustomPanelItem, SiteContent } from '../types';
import { Editable } from './Editable';
import { Trash2, Plus, Sparkles } from 'lucide-react';

interface CustomPanelsProps {
  customPanels: CustomPanel[];
  siteContent: SiteContent;
  updateContent: (key: string, value: string) => void;
  editMode: boolean;
  onDeletePanel: (id: string) => void;
  onUpdatePanelItems?: (panelId: string, newItems: CustomPanelItem[]) => void;
}

export const CustomPanelsSection: React.FC<CustomPanelsProps> = ({
  customPanels,
  siteContent,
  updateContent,
  editMode,
  onDeletePanel,
  onUpdatePanelItems
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!customPanels || customPanels.length === 0) return null;

  const handleAddColumn = (panel: CustomPanel) => {
    if (!onUpdatePanelItems) return;
    const currentItems = panel.items || [];
    const newId = Date.now().toString();

    let newItem: CustomPanelItem;
    if (panel.type === 'features') {
      newItem = {
        id: newId,
        title: `NEW FEATURE ${currentItems.length + 1}`,
        desc: 'Add custom description or highlights for this feature.'
      };
    } else {
      newItem = {
        id: newId,
        tag: 'New Tier',
        title: `PACKAGE ${currentItems.length + 1}`,
        price: '₹999',
        desc: 'Custom service package details, perks, and schedule.'
      };
    }

    onUpdatePanelItems(panel.id, [...currentItems, newItem]);
  };

  const handleDeleteColumn = (panel: CustomPanel, indexToDelete: number) => {
    if (!onUpdatePanelItems) return;
    const currentItems = panel.items || [];
    const updated = currentItems.filter((_, idx) => idx !== indexToDelete);
    onUpdatePanelItems(panel.id, updated);
  };

  return (
    <div className="space-y-12 my-12">
      {customPanels.map((panel, index) => {
        const titleKey = `cp_${panel.id}_title`;
        const subtitleKey = `cp_${panel.id}_sub`;
        const badgeKey = `cp_${panel.id}_badge`;
        const contentKey = `cp_${panel.id}_content`;

        const hasColumns = panel.type === 'features' || panel.type === 'cards';

        return (
          <section
            key={panel.id}
            id={`panel-${panel.id}`}
            className="relative max-w-7xl mx-auto px-6 md:px-12 transition-all"
          >
            {/* EDIT MODE ADMIN PANEL HEADER */}
            {editMode && (
              <div className="bg-amber-950/95 border border-amber-500/50 text-amber-200 rounded-t-lg px-4 py-2.5 flex flex-wrap items-center justify-between text-xs mb-2 shadow-lg backdrop-blur-sm gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Custom Panel #{index + 1}
                  </span>
                  <span className="bg-amber-900/80 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-700/50 uppercase font-bold">
                    Type: {panel.type}
                  </span>
                  {hasColumns && (
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                      {(panel.items || []).length} Columns
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasColumns && (
                    <button
                      onClick={() => handleAddColumn(panel)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      title="Add a new column card to this panel"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Column</span>
                    </button>
                  )}

                  {confirmDeleteId === panel.id ? (
                    <div className="flex items-center gap-1 bg-red-950 p-1 rounded border border-red-700 animate-fade-in">
                      <span className="text-[10px] text-white font-bold uppercase px-1">Delete Panel?</span>
                      <button
                        onClick={() => {
                          onDeletePanel(panel.id);
                          setConfirmDeleteId(null);
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-zinc-800 text-zinc-300 font-bold text-[10px] px-2 py-0.5 rounded uppercase cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(panel.id)}
                      className="bg-red-900/60 hover:bg-red-600 text-red-200 hover:text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer border border-red-800/80"
                      title="Delete this entire panel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Panel</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PANEL TYPE 1: BANNER / PROMO */}
            {panel.type === 'banner' && (
              <div className="bg-ink-2 border border-line rounded-lg p-8 md:p-12 text-center space-y-4 relative overflow-hidden shadow-xl">
                <div className="inline-block bg-ember/10 border border-ember/30 text-ember text-xs uppercase font-bold tracking-widest px-4 py-1.5 rounded-full">
                  <Editable
                    textKey={badgeKey}
                    defaultText={panel.badge || "Featured Announcement"}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>

                <h2 className="font-display text-2xl md:text-4xl text-bone uppercase tracking-wider max-w-3xl mx-auto">
                  <Editable
                    textKey={titleKey}
                    defaultText={panel.title}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h2>

                <p className="text-steel text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                  <Editable
                    textKey={subtitleKey}
                    defaultText={panel.subtitle || "Customize this section with any updates, notices, or offers."}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </p>

                <div className="pt-2">
                  <a href="#contact" className="inline-block bg-ember text-ink hover:bg-ember/90 font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm transition-all">
                    Contact Us
                  </a>
                </div>
              </div>
            )}

            {/* PANEL TYPE 2: FEATURE GRID */}
            {panel.type === 'features' && (
              <div className="bg-ink-2 border border-line rounded-lg p-8 md:p-12 space-y-8 shadow-xl">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider">
                    <Editable
                      textKey={titleKey}
                      defaultText={panel.title}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                    />
                  </h2>
                  <p className="text-steel text-sm">
                    <Editable
                      textKey={subtitleKey}
                      defaultText={panel.subtitle || "Highlights & specialized care guidelines."}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                      as="p"
                    />
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(panel.items || []).map((item, i) => (
                    <div key={item.id || i} className="bg-ink border border-line p-6 rounded-md space-y-3 relative group transition-all hover:border-amber-500/40">
                      {/* Column Delete Button in Edit Mode */}
                      {editMode && (
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => handleDeleteColumn(panel, i)}
                            className="bg-red-950/90 hover:bg-red-600 text-red-200 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer border border-red-800/80 shadow"
                            title="Delete this feature column"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Column</span>
                          </button>
                        </div>
                      )}

                      <div className="w-8 h-8 rounded-full bg-ember/15 text-ember flex items-center justify-center font-bold text-sm border border-ember/30">
                        {i + 1}
                      </div>
                      <h3 className="font-display text-lg text-bone uppercase">
                        <Editable
                          textKey={`cp_${panel.id}_item_${i}_title`}
                          defaultText={item.title}
                          siteContent={siteContent}
                          updateContent={updateContent}
                          editMode={editMode}
                        />
                      </h3>
                      <p className="text-steel text-xs leading-relaxed">
                        <Editable
                          textKey={`cp_${panel.id}_item_${i}_desc`}
                          defaultText={item.desc}
                          siteContent={siteContent}
                          updateContent={updateContent}
                          editMode={editMode}
                          as="p"
                        />
                      </p>
                    </div>
                  ))}

                  {/* Add New Column Card Placeholder in Edit Mode */}
                  {editMode && (
                    <button
                      onClick={() => handleAddColumn(panel)}
                      className="bg-ink/40 hover:bg-amber-950/20 border-2 border-dashed border-amber-500/40 hover:border-amber-400 p-6 rounded-md flex flex-col items-center justify-center space-y-2 text-amber-400 hover:text-amber-300 transition-all cursor-pointer min-h-[180px]"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase tracking-wider">Add Column Card</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PANEL TYPE 3: TESTIMONIAL SPOTLIGHT */}
            {panel.type === 'testimonials' && (
              <div className="bg-ink-2 border border-line rounded-lg p-8 md:p-12 space-y-6 text-center shadow-xl">
                <div className="flex justify-center text-ember tracking-widest text-lg">
                  ★★★★★
                </div>
                <blockquote className="font-display text-xl md:text-2xl text-bone uppercase tracking-wider max-w-3xl mx-auto leading-snug">
                  "
                  <Editable
                    textKey={contentKey}
                    defaultText={panel.content || "Black Prados K9 is by far the best boarding and training facility we have ever used!"}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                  "
                </blockquote>
                <div className="text-xs uppercase font-bold tracking-wider text-ember">
                  — <Editable
                    textKey={titleKey}
                    defaultText={panel.title}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
              </div>
            )}

            {/* PANEL TYPE 4: PRICING / CARDS */}
            {panel.type === 'cards' && (
              <div className="bg-ink-2 border border-line rounded-lg p-8 md:p-12 space-y-8 shadow-xl">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider">
                    <Editable
                      textKey={titleKey}
                      defaultText={panel.title}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                    />
                  </h2>
                  <p className="text-steel text-sm">
                    <Editable
                      textKey={subtitleKey}
                      defaultText={panel.subtitle || "Select the package that best fits your dog's needs."}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                      as="p"
                    />
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(panel.items || []).map((item, i) => (
                    <div key={item.id || i} className="bg-ink border border-line p-6 rounded-md flex flex-col justify-between space-y-4 relative group transition-all hover:border-amber-500/40">
                      {/* Column Delete Button in Edit Mode */}
                      {editMode && (
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => handleDeleteColumn(panel, i)}
                            className="bg-red-950/90 hover:bg-red-600 text-red-200 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer border border-red-800/80 shadow"
                            title="Delete this service column"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Column</span>
                          </button>
                        </div>
                      )}

                      <div className="space-y-3">
                        <span className="text-[10px] uppercase font-bold text-ember tracking-widest bg-ember/10 px-2.5 py-1 rounded border border-ember/20 inline-block">
                          <Editable
                            textKey={`cp_${panel.id}_card_${i}_tag`}
                            defaultText={item.tag || "Option"}
                            siteContent={siteContent}
                            updateContent={updateContent}
                            editMode={editMode}
                          />
                        </span>
                        <h3 className="font-display text-xl text-bone uppercase">
                          <Editable
                            textKey={`cp_${panel.id}_card_${i}_title`}
                            defaultText={item.title}
                            siteContent={siteContent}
                            updateContent={updateContent}
                            editMode={editMode}
                          />
                        </h3>
                        <div className="font-display text-2xl text-ember font-bold">
                          <Editable
                            textKey={`cp_${panel.id}_card_${i}_price`}
                            defaultText={item.price || "₹800"}
                            siteContent={siteContent}
                            updateContent={updateContent}
                            editMode={editMode}
                          />
                        </div>
                        <p className="text-steel text-xs leading-relaxed">
                          <Editable
                            textKey={`cp_${panel.id}_card_${i}_desc`}
                            defaultText={item.desc}
                            siteContent={siteContent}
                            updateContent={updateContent}
                            editMode={editMode}
                            as="p"
                          />
                        </p>
                      </div>

                      <a href="#contact" className="block text-center bg-ember/20 hover:bg-ember text-ember hover:text-ink font-bold text-xs uppercase tracking-widest py-2.5 rounded transition-all">
                        Select Plan
                      </a>
                    </div>
                  ))}

                  {/* Add New Column Card Placeholder in Edit Mode */}
                  {editMode && (
                    <button
                      onClick={() => handleAddColumn(panel)}
                      className="bg-ink/40 hover:bg-amber-950/20 border-2 border-dashed border-amber-500/40 hover:border-amber-400 p-6 rounded-md flex flex-col items-center justify-center space-y-2 text-amber-400 hover:text-amber-300 transition-all cursor-pointer min-h-[220px]"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase tracking-wider">Add Column Card</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PANEL TYPE 5: RICH TEXT BLOCK */}
            {panel.type === 'richText' && (
              <div className="bg-ink-2 border border-line rounded-lg p-8 md:p-12 space-y-4 shadow-xl">
                <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider">
                  <Editable
                    textKey={titleKey}
                    defaultText={panel.title}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h2>
                <div className="text-steel text-sm md:text-base leading-relaxed space-y-2">
                  <Editable
                    textKey={contentKey}
                    defaultText={panel.content || "Use this custom text section to publish facility rules, trainer bio, seasonal notices, or special dog care instructions."}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="div"
                  />
                </div>
              </div>
            )}

          </section>
        );
      })}
    </div>
  );
};
