"use client";

import React from 'react';
import { EmbedMessage as EmbedMessageType } from '../lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // To support GitHub Flavored Markdown (optional)
import rehypeRaw from 'rehype-raw'; // To support raw HTML in markdown

interface EmbedMessageProps {
    embed: EmbedMessageType;
    isLowOpacity?: boolean;
}

const EmbedMessage: React.FC<EmbedMessageProps> = ({ embed, isLowOpacity }) => {
    return (
        <div className={isLowOpacity ? 'p-4 mb-4 bg-gray-800 rounded-md border-l-4 opacity-80' : 'p-4 mb-4 bg-gray-800 rounded-md border-l-4'} style={{ borderColor: `#${embed.color}` }}>
            {embed.author && (
                <div className="flex items-center mb-2">
                    {embed.author.icon_url && (
                        <img src={embed.author.icon_url} alt="author icon" className="w-5 h-5 rounded-full mr-2" />
                    )}
                    <a href={embed.author.url} className="font-bold text-indigo-500">
                        {embed.author.name}
                    </a>
                </div>
            )}
            {embed.title && (
                <div className="mb-2">
                    <a href={embed.url} className="font-bold text-lg text-indigo-500">
                        {embed.title}
                    </a>
                </div>
            )}
            {embed.description && (
                <div className="mb-2 text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {embed.description}
                    </ReactMarkdown>
                </div>
            )}
            {embed.thumbnail && embed.thumbnail.url && (
                <img src={embed.thumbnail.url} alt="thumbnail" className="w-20 h-20 float-left mr-2 rounded-md" />
            )}
            {embed.fields && (
                <div className="flex flex-wrap mb-2">
                    {embed.fields.map((field, index) => (
                        <div key={index} className={`flex-1 min-w-[200px] mr-2 ${field.inline ? 'inline-block' : ''}`}>
                            <div className="font-bold text-gray-300">{field.name}</div>
                            <div className="text-gray-300">{field.value}</div>
                        </div>
                    ))}
                </div>
            )}
            {embed.image && embed.image.url && (
                <img src={embed.image.url} alt="image" className="w-full rounded-md mb-2" />
            )}
            {embed.timestamp && (
                <div className="text-xs text-gray-500 text-right">
                    {new Date(embed.timestamp).toLocaleString()}
                </div>
            )}
            {embed.footer && (
                <div className="flex items-center mt-2 text-xs text-gray-500">
                    {embed.footer.icon_url && (
                        <img src={embed.footer.icon_url} alt="footer icon" className="w-5 h-5 rounded-full mr-2" />
                    )}
                    <span>{embed.footer.text}</span>
                </div>
            )}
        </div>
    );
};

export default EmbedMessage;
