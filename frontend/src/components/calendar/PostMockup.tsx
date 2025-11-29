import { useState } from 'react';
import { Heart, MessageCircle, Share2, Camera, MoreVertical, Music, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostMockupProps {
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption: string;
  username?: string;
  templateType: 'image' | 'video';
  platform: 'tiktok' | 'instagram';
  status: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export const PostMockup = ({
  mediaUrl,
  thumbnailUrl,
  caption,
  username = '@username',
  templateType,
  platform,
  status,
  likes = 0,
  comments = 0,
  shares = 0,
}: PostMockupProps) => {
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  
  // Format numbers for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Truncate caption
  const MAX_CAPTION_LENGTH = 100;
  const shouldTruncate = caption.length > MAX_CAPTION_LENGTH;
  const displayCaption = isCaptionExpanded || !shouldTruncate 
    ? caption 
    : `${caption.substring(0, MAX_CAPTION_LENGTH)}...`;

  const mediaSource = mediaUrl || thumbnailUrl;
  const hasMedia = !!mediaSource;

  if (platform === 'tiktok') {
    return (
      <div className="bg-white border border-[rgba(22,24,35,0.12)] rounded-[9.6px] overflow-hidden w-full max-w-[390px]">
        {/* Main Container */}
        <div className="relative">
          {/* Video/Image Container */}
          <div className="relative w-full aspect-[9/16] bg-black overflow-hidden">
            {hasMedia ? (
              templateType === 'image' ? (
                <img
                  src={mediaSource}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={mediaSource}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-sm">No media</p>
                </div>
              </div>
            )}

            {/* TikTok Logo - Top Right */}
            <div className="absolute top-[9.6px] right-[9.6px] w-[57.6px] h-[57.6px] flex items-center justify-center">
              <div className="text-white text-xs font-bold">TikTok</div>
            </div>

            {/* Right Sidebar - Interactions */}
            <div className="absolute right-0 top-[317px] bottom-[38.4px] w-[96px] flex flex-col items-center justify-center gap-4 px-0">
              {/* Profile Picture */}
              <div className="relative w-[57.6px] h-[57.6px]">
                <div className="w-full h-full rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Like */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-[48px] h-[48px] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" fill="white" />
                </div>
                <span className="text-white text-[15.12px] font-normal leading-[20.4px]">
                  {formatCount(likes)}
                </span>
              </div>

              {/* Comment */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-[48px] h-[48px] flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-[15.6px] font-normal leading-[20.4px]">
                  {formatCount(comments)}
                </span>
              </div>

              {/* Share */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-[48px] h-[48px] flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-[15.6px] font-normal leading-[20.4px]">
                  {formatCount(shares)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section - White Overlay */}
          <div className="bg-white">
            {/* Banner with Watch Now Button */}
            <div className="flex items-center justify-between px-[14.4px] py-0 h-[52.8px] border-b border-[rgba(22,24,35,0.12)]">
              <div className="flex-1 overflow-hidden">
                <p className="text-[#161823] text-[19.2px] leading-[52.8px] truncate">
                  Watch more exciting videos on TikTok
                </p>
              </div>
              <button className="bg-[#fe2c55] text-white rounded-full h-[33.6px] px-6 text-[19.2px] font-normal shrink-0">
                Watch now
              </button>
            </div>

            {/* Username and Caption */}
            <div className="px-[14.4px] pb-[16.8px] pt-[13.8px]">
              {/* Username */}
              <div className="mb-[9.6px]">
                <p className="text-[#161823] text-[20.4px] leading-[24px] font-normal">
                  {username}
                </p>
              </div>

              {/* Caption */}
              <div className="mb-[9.6px]">
                <p className="text-black text-[18px] leading-[21.6px]">
                  {displayCaption}
                  {shouldTruncate && !isCaptionExpanded && (
                    <button
                      onClick={() => setIsCaptionExpanded(true)}
                      className="text-[#161823] font-normal ml-1"
                    >
                      See more
                    </button>
                  )}
                </p>
              </div>

              {/* Audio Info */}
              <div className="flex items-center gap-2">
                <Music className="w-6 h-6 text-black" />
                <p className="text-black text-[18px] leading-[21.6px]">
                  original sound - {username.replace('@', '')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instagram Mockup
  return (
    <div className="bg-black w-full relative">
      {/* Reel Container */}
      <div className="relative w-full aspect-[9/16] bg-black overflow-hidden">
        {hasMedia ? (
          templateType === 'image' ? (
            <img
              src={mediaSource}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={mediaSource}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-sm">No media</p>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Camera Icon - Top Right */}
        <div className="absolute top-[44px] right-[16px] w-[28px] h-[28px] flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>

        {/* Right Sidebar - Actions */}
        <div className="absolute right-[16px] top-[88px] bottom-[88px] flex flex-col items-center justify-end gap-4 w-[28px]">
          {/* Camera Icon (top) */}
          <div className="w-[28px] h-[28px] flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>

          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-[28px] h-[28px] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-white text-[12px] font-semibold leading-[22px]">
              {formatCount(likes)}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-[28px] h-[28px] flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-[12px] font-semibold leading-[22px]">
              {formatCount(comments)}
            </span>
          </div>

          {/* Share */}
          <div className="w-[28px] h-[28px] flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>

          {/* More Options */}
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180">
            <MoreVertical className="w-5 h-5 text-white" />
          </div>

          {/* Audio Icon */}
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180">
            <div className="w-[20px] h-[20px] rounded border-2 border-white overflow-hidden">
              <div className="w-full h-full bg-gray-400" />
            </div>
          </div>
        </div>

        {/* Bottom Left Overlay - Post Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Profile and Name */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[30px] h-[30px] rounded-full bg-gray-400 overflow-hidden">
              <div className="w-full h-full bg-gray-500" />
            </div>
            <p className="text-white text-[12px] font-bold leading-[22px]">
              Page name
            </p>
          </div>

          {/* Caption */}
          <div className="mb-2 pr-[60px]">
            <p className="text-white text-[12px] leading-[1.2] tracking-[0.5px]">
              {displayCaption}
              {shouldTruncate && !isCaptionExpanded && (
                <button
                  onClick={() => setIsCaptionExpanded(true)}
                  className="text-white/60 ml-1"
                >
                  more
                </button>
              )}
            </p>
          </div>

          {/* Audio Info */}
          <div className="flex items-center gap-3">
            <Music className="w-[14px] h-[14px] text-white" />
            <p className="text-white text-[12px] leading-[22px]">
              Page name · Original Audio
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-black border-t border-[#383838] h-[88px] flex items-center justify-between px-6 py-3">
        {/* Home */}
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm" />
        </div>
        {/* Search */}
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm" />
        </div>
        {/* Reels */}
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm" />
        </div>
        {/* Shop */}
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm" />
        </div>
        {/* Profile */}
        <div className="w-[26px] h-[26px] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gray-400" />
        </div>
      </div>
    </div>
  );
};

