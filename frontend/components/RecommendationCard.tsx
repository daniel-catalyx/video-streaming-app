'use client';

import { motion } from 'framer-motion';
import { Play, Eye, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  category: string;
  tags: string[];
  thumbnail?: string; // Add optional thumbnail
}

interface RecommendationCardProps {
  video: Video;
  relevanceScore: number;
  reason: string;
  onClick: () => void;
  index: number;
}

export default function RecommendationCard({ 
  video, 
  relevanceScore, 
  reason, 
  onClick 
}: RecommendationCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'from-emerald-500 to-teal-500';
    if (score >= 0.6) return 'from-blue-500 to-cyan-500';
    if (score >= 0.4) return 'from-orange-500 to-amber-500';
    return 'from-gray-500 to-slate-500';
  };

  // const getRelevanceText = (score: number) => {
  //   if (score >= 0.8) return 'Highly Relevant';
  //   if (score >= 0.6) return 'Relevant';
  //   if (score >= 0.4) return 'Somewhat Relevant';
  //   return 'Related';
  // };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl 
                      transition-all duration-300 border border-slate-200/50
                      hover:border-blue-200">
        
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-purple-50/0 
                        group-hover:from-blue-50/50 group-hover:to-purple-50/50 
                        transition-all duration-300"></div>
        
        <div className="relative z-10 flex gap-3 p-4">
          {/* Video Thumbnail */}
          <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
            {video.thumbnail ? (
              <Image 
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
              />
            ) : (
              // Placeholder thumbnail with gradient and video icon
              <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-cyan-400 flex items-center justify-center">
                <Play className="w-6 h-6 text-white/80" />
              </div>
            )}
            
            {/* Duration overlay */}
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-medium">
              {formatDuration(video.duration)}
            </div>
            
            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="w-8 h-8 bg-white/0 group-hover:bg-white/90 rounded-full flex items-center justify-center transition-all duration-300 transform scale-0 group-hover:scale-100">
                <Play className="w-4 h-4 text-slate-700 ml-0.5" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Relevance */}
            <div className="flex items-start justify-between mb-2">
              <div className={`px-2 py-1 bg-gradient-to-r ${getRelevanceColor(relevanceScore)} 
                              rounded-full text-xs font-medium text-white shadow-sm`}>
                {Math.round(relevanceScore * 100)}%
              </div>
            </div>

            {/* Video Title */}
            <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-1 
                           group-hover:text-blue-700 transition-colors duration-200
                           line-clamp-2">
              {video.title}
            </h4>

            {/* AI Reason */}
            <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 
                            rounded-md border border-amber-200/50">
              <div className="flex items-center space-x-1 mb-1">
                <TrendingUp className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">AI Insight</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed line-clamp-2">
                {reason}
              </p>
            </div>

            {/* Stats and Category */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{video.views > 1000 ? `${(video.views/1000).toFixed(1)}k` : video.views}</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                  {video.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r 
                        from-blue-500 via-purple-500 to-cyan-500 
                        transform scale-x-0 group-hover:scale-x-100 
                        transition-transform duration-300 origin-left"></div>
      </div>
    </motion.div>
  );
}