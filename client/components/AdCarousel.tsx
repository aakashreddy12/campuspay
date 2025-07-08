import { useState, useEffect } from "react";
import { AdCampaign } from "@shared/api";
import { User } from "@/lib/adService";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdCarouselProps {
  ads: AdCampaign[];
  user: User;
  placement: string;
  page?: string;
  className?: string;
  size?: "small" | "default" | "large";
  showCloseButton?: boolean;
  onAdClosed?: (adId: string) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  children: (ad: AdCampaign, index: number) => React.ReactNode;
}

export function AdCarousel({
  ads,
  user,
  placement,
  page = "unknown",
  className = "",
  size = "default",
  showCloseButton = true,
  onAdClosed,
  autoPlay = true,
  autoPlayInterval = 5000,
  children,
}: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Filter ads by placement
  const filteredAds = ads.filter((ad) => ad.placement === placement);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || filteredAds.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredAds.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, filteredAds.length, isHovered]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredAds.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredAds.length);
  };

  if (filteredAds.length === 0) {
    return null;
  }

  if (filteredAds.length === 1) {
    return <div className={className}>{children(filteredAds[0], 0)}</div>;
  }

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main ad display */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {filteredAds.map((ad, index) => (
            <div key={ad.id} className="w-full flex-shrink-0">
              {children(ad, index)}
            </div>
          ))}
        </div>

        {/* Navigation arrows - only show on hover and when multiple ads */}
        {filteredAds.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 text-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:text-purple-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 text-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:text-purple-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label="Next ad"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {filteredAds.length > 1 && (
        <div className="flex justify-center space-x-3 mt-4 mb-2">
          {filteredAds.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${
                index === currentIndex
                  ? "bg-purple-600 border-purple-600 shadow-lg transform scale-110"
                  : "bg-white border-gray-300 hover:border-purple-400 hover:bg-purple-50"
              }`}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Ad counter */}
      {filteredAds.length > 1 && (
        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {filteredAds.length}
        </div>
      )}
    </div>
  );
}
