"use client"

import React from 'react';
import { EmbedMessage as EmbedMessageType } from '../lib/types';

interface EmbedMessageProps {
    embed: EmbedMessageType;
}

const EmbedMessage: React.FC<EmbedMessageProps> = ({ embed }) => {
    return (
        <div className="embed" style={{ borderLeft: `4px solid #${embed.color.toString(16)}` }}>
            {embed.author && (
                <div className="embed-author">
                    {embed.author.icon_url && (
                        <img src={embed.author.icon_url} alt="author icon" className="embed-author-icon" />
                    )}
                    <a href={embed.author.url} className="embed-author-name">
                        {embed.author.name}
                    </a>
                </div>
            )}
            {embed.title && (
                <div className="embed-title">
                    <a href={embed.url}>{embed.title}</a>
                </div>
            )}
            {embed.description && <div className="embed-description">{embed.description}</div>}
            {embed.thumbnail && <img src={embed.thumbnail.url} alt="thumbnail" className="embed-thumbnail" />}
            {embed.fields && (
                <div className="embed-fields">
                    {embed.fields.map((field, index) => (
                        <div key={index} className={`embed-field ${field.inline ? 'inline' : ''}`}>
                            <div className="embed-field-name">{field.name}</div>
                            <div className="embed-field-value">{field.value}</div>
                        </div>
                    ))}
                </div>
            )}
            {embed.image && <img src={embed.image.url} alt="image" className="embed-image" />}
            {embed.timestamp && (
                <div className="embed-timestamp">
                    {new Date(embed.timestamp).toLocaleString()}
                </div>
            )}
            {embed.footer && (
                <div className="embed-footer">
                    {embed.footer.icon_url && (
                        <img src={embed.footer.icon_url} alt="footer icon" className="embed-footer-icon" />
                    )}
                    <span>{embed.footer.text}</span>
                </div>
            )}
        </div>
    );
};

export default EmbedMessage;
