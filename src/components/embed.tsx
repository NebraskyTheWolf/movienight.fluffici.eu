import { useEffect, useState } from "react";
import axios from "axios";
import * as React from "react";
import ReactPlayer from "react-player";

interface EmbedSpecial {
    type: string;
    content_type?: string;
    id?: string;
}

interface EmbedImage {
    url: string;
    width: number;
    height: number;
    size: string;
}

interface EmbedVideo {
    url: string;
    width: number;
    height: number;
}

interface EmbedData {
    type: string;
    url: string;
    original_url?: string;
    special?: EmbedSpecial;
    title?: string;
    description?: string;
    image?: EmbedImage;
    video?: EmbedVideo;
    opengraph_type?: string;
    site_name?: string;
    icon_url?: string;
    colour?: string;
    width?: number;
    height?: number;
}

interface EmbedProps {
    url: string;
}

/**
 * React component for embedding content.
 *
 * @param {Object} props - The component props.
 * @param {string} props.url - The URL of the content to embed.
 * @returns {JSX.Element|null} The embedded content or `null` if no embed data is available.
 */
export const Embed: React.FC<EmbedProps> = ({ url }: EmbedProps): JSX.Element | null => {
    const [embedData, setEmbedData] = useState<EmbedData>();

    useEffect(() => {
        const fetchEmbedData = async (url: string) => {
            try {
                const response = await axios.get(`https://blackmesa.fluffici.eu/embed?url=${url}`);
                setEmbedData(response.data);
            } catch (error) {
                console.error("Failed to fetch embed data", error);
                return null;
            }
        };

        fetchEmbedData(url);
    }, [url]);

    if (!embedData) return null;

    const renderImage = (image: EmbedImage, type?: string) => {
        if (type === "website") {
            return <img src={image.url} alt={embedData.title} className="w-full h-auto rounded mt-2" />;
        }
    };

    const renderSpotifyEmbed = (special: EmbedSpecial) => {
        if (special.type === "Spotify" && special.content_type === "track") {
            return (
                <iframe
                    src={`https://open.spotify.com/embed/track/${special.id}`}
                    width="300"
                    height="80"
                    frameBorder="0"
                    allow="encrypted-media"
                    title="Spotify Embed"
                    style={{ fontSize: '14px', maxWidth: '300px', minHeight: '60px', backgroundColor: "transparent" }}
                ></iframe>
            );
        }
        return null;
    };

    const renderTwitchEmbed = (special: EmbedSpecial) => {
        if (special.type === "Twitch" && special.content_type === "Channel") {
            return (
                <iframe
                    src={`https://player.twitch.tv/?channel=${special.id}&parent=meta.tag`}
                    width="620"
                    height="378"
                    frameBorder="0"
                    allowFullScreen={true}
                    scrolling="no"
                    title="Twitch Embed"
                ></iframe>
            );
        }
        return null;
    };

    const renderVideoEmbed = (url: string) => {
        return (
            <ReactPlayer
                url={url}
                controls
                width="100%"
                height="auto"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
        );
    };

    return (
        <>
            {embedData.special?.type === "Spotify" ? (renderSpotifyEmbed(embedData.special)) : (
                <div className="mt-2 p-2 rounded border-l-4" style={{borderLeftColor: `${embedData.colour}`, borderLeftWidth: '8px', backgroundColor: '#2f3136', color: '#dcddde', fontSize: '14px', maxWidth: '300px', minHeight: '60px'}}>
                    {embedData.special?.type === "Twitch" ? (
                        renderTwitchEmbed(embedData.special)
                        ) : embedData.type === "Image" ? (
                        <img src={embedData.url} alt="Embedded content" className="w-full h-auto rounded"/>
                        ) : embedData.type === "Video" ? (
                        renderVideoEmbed(embedData.url)
                        ) : (
                        <>
                            <div className="flex flex-col">
                                <a href={embedData.url} target="_blank" rel="noopener noreferrer"
                                   className="text-blue-500 hover:underline" style={{fontSize: '16px', color: '#00b0f4'}}>
                                    <h3 className="text-lg font-bold">{embedData.title}</h3>
                                </a>
                                {embedData.image && embedData.opengraph_type === "summary" && renderImage(embedData.image, embedData.opengraph_type)}
                            </div>
                            <p className="text-sm text-gray-400">{embedData.description}</p>
                            {embedData.image && embedData.opengraph_type === "thumbnail" && renderImage(embedData.image, embedData.opengraph_type)}
                        </>
                    )}
                </div>
            )}
        </>
    );
};
