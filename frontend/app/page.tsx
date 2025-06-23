'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import VideoPlayer from '@/components/VideoPlayer';
import RecommendationCard from '@/components/RecommendationCard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ChevronRight, 
  Search, 
  Play, 
  Clock, 
  Eye,
  Sparkles,
  Brain,
  ArrowRight,
  ChevronLeft,
  MoreHorizontal
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

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

interface Recommendation {
  video: Video;
  relevance_score: number;
  reason: string;
}

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecommendations, setTotalRecommendations] = useState(0);
  
  const RECOMMENDATIONS_PER_PAGE = 3;

  const loadVideo = async (videoId: string) => {
    setTransitioning(true);
    setShowSearchResults(false);
    setCurrentPage(1); // Reset to first page when loading new video
    try {
      const [videoResponse, recommendationsResponse] = await Promise.all([
        axios.get(`${API_BASE}/api/videos/${videoId}`),
        axios.get(`${API_BASE}/api/videos/${videoId}/recommendations`)
      ]);

      setCurrentVideo(videoResponse.data);
      
      // Mock: Simulate getting more recommendations than we show
      const allRecommendations = [
        ...recommendationsResponse.data,
        // Add mock additional recommendations to demonstrate pagination
        ...Array.from({ length: 8 }, (_, i) => ({
          video: {
            id: `mock-${i}`,
            title: `Additional Video ${i + 1}: Related Content`,
            description: `This is another relevant video that provides additional insights related to your current topic.`,
            duration: 120 + (i * 30),
            views: Math.floor(Math.random() * 5000) + 500,
            category: ['Tutorial', 'Advanced', 'Quick Tips'][i % 3],
            tags: ['related', 'tutorial', 'guide'],
            thumbnail: undefined
          },
          relevance_score: 0.7 - (i * 0.05),
          reason: `This video complements the current content by covering ${['fundamental concepts', 'advanced techniques', 'practical examples', 'troubleshooting'][i % 4]}.`
        }))
      ];
      
      setRecommendations(allRecommendations);
      setTotalRecommendations(allRecommendations.length);
      setLoading(false);
      
      setTimeout(() => setTransitioning(false), 300);
    } catch (error) {
      console.error('Error loading video:', error);
      setLoading(false);
      setTransitioning(false);
    }
  };

  const loadInitialVideo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/videos`);
      if (response.data.length > 0) {
        const firstVideo = response.data[0];
        await loadVideo(firstVideo.id);
      }
    } catch (error) {
      console.error('Error loading initial video:', error);
    }
  }, []);

  useEffect(() => {
    loadInitialVideo();
  }, [loadInitialVideo]);

  const handleVideoEnd = async () => {
    if (currentVideo) {
      await axios.post(`${API_BASE}/api/videos/${currentVideo.id}/complete`);
      
      if (recommendations.length > 0) {
        loadVideo(recommendations[0].video.id);
      }
    }
  };

  const selectVideo = (videoId: string) => {
    loadVideo(videoId);
  };

  // Mock search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    
    // Mock API call with delay
    setTimeout(() => {
      // Mock search results based on query
      const mockResults: Video[] = [
        {
          id: 'search-1',
          title: `How to ${query}?`,
          description: `This video explains everything about ${query} in detail.`,
          duration: 180,
          views: 1234,
          category: 'Tutorial',
          tags: [query.toLowerCase(), 'tutorial', 'guide']
        },
        {
          id: 'search-2',
          title: `Advanced ${query} Techniques`,
          description: `Learn advanced techniques and best practices for ${query}.`,
          duration: 240,
          views: 892,
          category: 'Advanced',
          tags: [query.toLowerCase(), 'advanced', 'tips']
        },
        {
          id: 'search-3',
          title: `Common ${query} Problems`,
          description: `Troubleshooting guide for common issues with ${query}.`,
          duration: 160,
          views: 567,
          category: 'Troubleshooting',
          tags: [query.toLowerCase(), 'problems', 'solutions']
        }
      ];
      
      setSearchResults(mockResults);
      setShowSearchResults(true);
      setSearchLoading(false);
    }, 800);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pagination logic
  const totalPages = Math.ceil(totalRecommendations / RECOMMENDATIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECOMMENDATIONS_PER_PAGE;
  const currentRecommendations = recommendations.slice(startIndex, startIndex + RECOMMENDATIONS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-blue-200 animate-pulse"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading your personalized experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Catalyx AI Learning Hub
                </h1>
                <p className="text-sm text-slate-500">Interactive Video FAQ Platform</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {searchLoading ? (
                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ask me anything... "
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-12 pr-6 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                           transition-all duration-200 text-slate-700 placeholder-slate-400
                           shadow-sm hover:shadow-md"
                />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Powered</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Brain className="w-4 h-4" />
                        <span>AI found {searchResults.length} relevant videos</span>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.map((video, index) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => selectVideo(video.id)}
                          className="p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 truncate">{video.title}</h4>
                              <p className="text-sm text-slate-600 line-clamp-2 mt-1">{video.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDuration(video.duration)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{video.views.toLocaleString()}</span>
                                </div>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {video.category}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentVideo && (
                <motion.div
                  key={currentVideo.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Video Player with Enhanced Styling */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
                      <VideoPlayer
                        videoId={currentVideo.id}
                        onEnded={handleVideoEnd}
                        autoplay={transitioning}
                      />
                    </div>
                  </div>
                  
                  {/* Video Info Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-slate-800 mb-3 leading-tight">
                          {currentVideo.title}
                        </h2>
                        <p className="text-slate-600 text-lg leading-relaxed mb-6">
                          {currentVideo.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {currentVideo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 
                                   text-blue-700 rounded-full text-sm font-medium
                                   border border-blue-200/50 hover:shadow-md transition-all duration-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                      <div className="flex items-center space-x-6 text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-5 h-5" />
                          <span className="font-medium">{currentVideo.views.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">{formatDuration(currentVideo.duration)}</span>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-cyan-50 
                                    text-emerald-700 rounded-full text-sm font-medium
                                    border border-emerald-200/50">
                        {currentVideo.category}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Recommendations Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800">Up Next</h3>
                      <p className="text-sm text-slate-500">{totalRecommendations} related videos</p>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                </div>
                
                {/* Recommendations List */}
                <div className="px-6">
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {currentRecommendations.map((rec, index) => (
                        <motion.div
                          key={`${rec.video.id}-${currentPage}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <RecommendationCard
                            video={rec.video}
                            relevanceScore={rec.relevance_score}
                            reason={rec.reason}
                            onClick={() => selectVideo(rec.video.id)}
                            index={index}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-6 pt-4 border-t border-slate-200/50 mt-4">
                    <div className="flex items-center justify-between">
                      {/* Previous Button */}
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 
                                 hover:text-blue-600 disabled:text-slate-400 disabled:cursor-not-allowed
                                 transition-colors duration-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum < 1 || pageNum > totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg
                                        transition-all duration-200 ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            <button
                              onClick={() => goToPage(totalPages)}
                              className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg
                                       text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all duration-200"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 
                                 hover:text-blue-600 disabled:text-slate-400 disabled:cursor-not-allowed
                                 transition-colors duration-200"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Page Info */}
                    <div className="mt-3 text-center">
                      <span className="text-xs text-slate-500">
                        Showing {startIndex + 1}-{Math.min(startIndex + RECOMMENDATIONS_PER_PAGE, totalRecommendations)} of {totalRecommendations} videos
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}