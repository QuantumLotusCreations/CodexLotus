import React, { useState } from "react";
import { documentation, DocPage } from "../../../docs";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";
import { vars } from "../../theme/tokens.css.ts";

export const HelpTab: React.FC = () => {
    const [activePageId, setActivePageId] = useState<string>(documentation[0].id);

    const activePage = documentation.find(p => p.id === activePageId) || documentation[0];

    return (
        <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
            {/* Sidebar */}
            <div style={{ 
                width: 250, 
                minWidth: 200,
                flexShrink: 0,
                borderRight: `1px solid ${vars.color.border.subtle}`,
                backgroundColor: vars.color.background.sidebar,
                display: "flex",
                flexDirection: "column"
            }}>
                <div style={{
                    padding: "12px 16px",
                    fontWeight: 600,
                    borderBottom: `1px solid ${vars.color.border.subtle}`,
                    color: vars.color.text.primary
                }}>
                    Documentation
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                    {documentation.map(page => (
                        <div 
                            key={page.id}
                            onClick={() => setActivePageId(page.id)}
                            style={{
                                padding: "8px 16px",
                                cursor: "pointer",
                                backgroundColor: activePageId === page.id ? vars.color.background.panelRaised : "transparent",
                                color: activePageId === page.id ? vars.color.text.primary : vars.color.text.secondary,
                                fontSize: 14
                            }}
                        >
                            {page.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, height: "100%", overflow: "hidden", backgroundColor: vars.color.background.panel }}>
                 <MarkdownPreview content={activePage.content} />
            </div>
        </div>
    );
};

