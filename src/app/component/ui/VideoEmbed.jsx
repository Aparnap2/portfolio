import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

const VideoEmbed = ({ 
  src, 
  thumbnail, 
  title = "Demo Video",
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {!isPlaying ? (
        <div 
          className="relative cursor-pointer group"
          onClick={() => setIsPlaying(true)}
        >
          <Image 
            src={thumbnail} 
            alt={title}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
        </div>
      ) : (
        <iframe
          src={src}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};

export default VideoEmbed;