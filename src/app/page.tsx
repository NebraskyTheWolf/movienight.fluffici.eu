import React from 'react';
import Player from "@/components/player";

const Home = () => {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 flex relative">
                <Player />
            </div>
        </div>
    );
};

export default Home;
