import { useState, useEffect, useRef } from "react";
import { AdCampaign } from "@shared/api";
import { AdService, User } from "@/lib/adService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, TrendingUp, ArrowRight, Play, AlertCircle } from "lucide-react";
import { AdCarousel } from "@/components/AdCarousel";

// Media Renderer Component for handling all media types
interface MediaRendererProps {
  mediaUrl: string;
  mediaType: string;
  title?: string;
  className?: string;
}

function MediaRenderer({
  mediaUrl,
  mediaType,
  title,
  className,
}: MediaRendererProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    console.error(`Media failed to load: ${mediaUrl}, type: ${mediaType}`);
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    console.log(`Media loaded successfully: ${mediaUrl}, type: ${mediaType}`);
    setLoading(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-purple-600 mx-auto mb-1" />
          <span className="text-xs text-purple-600">Media Error</span>
        </div>
      </div>
    );
  }

  // Handle different media types
  switch (mediaType) {
    case "video":
      return (
        <div className="relative">
          <video
            ref={videoRef}
            src={mediaUrl}
            className={className}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            controls={false}
            style={{ objectFit: "cover" }}
            onError={handleError}
            onLoadedData={handleLoad}
          />
          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors text-sm"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      );

    case "gif":
      return (
        <img
          src={mediaUrl}
          alt={title || "Advertisement GIF"}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{ objectFit: "cover" }}
        />
      );

    case "html":
      return (
        <iframe
          src={mediaUrl}
          className={className}
          frameBorder="0"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups"
          onError={handleError}
          onLoad={handleLoad}
          title={title || "Advertisement Content"}
        />
      );

    case "image":
    default:
      return (
        <img
          src={mediaUrl}
          alt={title || "Advertisement"}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{ objectFit: "cover" }}
        />
      );
  }
}

interface AdDisplayProps {
  ads: AdCampaign[];
  user: User;
  placement: string;
  page?: string;
  className?: string;
  size?: "small" | "default" | "large";
  showCloseButton?: boolean;
  onAdClosed?: (adId: string) => void;
}

export function AdDisplay({
  ads,
  user,
  placement,
  page = "unknown",
  className = "",
  size = "default",
  showCloseButton = true,
  onAdClosed,
}: AdDisplayProps) {
  const [closedAds, setClosedAds] = useState<string[]>([]);

  // Filter ads by placement and closed status
  const filteredAds = ads
    .filter((ad) => ad.placement === placement)
    .filter((ad) => !closedAds.includes(ad.id));

  useEffect(() => {
    // Track impressions once when ads are loaded (non-blocking)
    if (filteredAds.length > 0 && user) {
      // Use requestIdleCallback if available, otherwise setTimeout
      const trackImpressions = () => {
        AdService.trackImpressions(user, filteredAds, page).catch(() => {
          // Silently ignore impression tracking errors
        });
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(trackImpressions);
      } else {
        setTimeout(trackImpressions, 100);
      }
    }
  }, [filteredAds, user, page]);

  const handleAdClick = async (ad: AdCampaign) => {
    await AdService.trackClick(user, ad, page);
  };

  const closeAd = (adId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing ad:", adId);
    setClosedAds((prev) => {
      const newClosed = [...prev, adId];
      console.log("New closed ads:", newClosed);
      return newClosed;
    });
    onAdClosed?.(adId);
  };

  const AdCard = ({ ad }: { ad: AdCampaign }) => {
    // Use ad's size if specified, otherwise fall back to props size
    const cardSize = ad.size || size;

    // Define size-based styling
    const getSizeClasses = (adSize: string) => {
      switch (adSize) {
        case "small":
          return {
            card: "max-w-xs",
            image: "h-20",
            text: "text-xs",
            title: "text-sm",
          };
        case "large":
          return {
            card: "max-w-2xl",
            image: "h-48",
            text: "text-base",
            title: "text-xl",
          };
        case "extra-large":
          return {
            card: "max-w-4xl",
            image: "h-64",
            text: "text-lg",
            title: "text-2xl",
          };
        default: // medium
          return {
            card: "max-w-lg",
            image: "h-32",
            text: "text-sm",
            title: "text-lg",
          };
      }
    };

    const sizeClasses = getSizeClasses(cardSize);

    return (
      <Card
        className={`border-purple-200 hover:shadow-lg transition-all duration-300 group relative ${sizeClasses.card} ${className}`}
      >
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-purple-600 text-white text-xs">Sponsored</Badge>
        </div>
        {showCloseButton && (
          <button
            onClick={(e) => closeAd(ad.id, e)}
            className="absolute top-2 right-2 z-50 w-6 h-6 bg-gray-800/70 text-white rounded-full flex items-center justify-center hover:bg-gray-800/90 transition-colors shadow-lg"
            style={{ zIndex: 9999 }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <div
          className={`relative ${sizeClasses.image} bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg overflow-hidden cursor-pointer`}
          onClick={() => handleAdClick(ad)}
        >
          {ad.mediaUrl ? (
            <MediaRenderer
              mediaUrl={ad.mediaUrl}
              mediaType={ad.mediaType}
              title={ad.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs text-purple-600">No Media</span>
              </div>
            </div>
          )}
        </div>
        {/* Only show CardContent if there's text content or no image */}
        {(ad.title?.trim() || ad.description?.trim() || !ad.mediaUrl) && (
          <CardContent
            className={`${cardSize === "small" ? "p-3" : cardSize === "extra-large" ? "p-6" : "p-4"}`}
          >
            {ad.title?.trim() && (
              <h3
                className={`font-semibold text-gray-900 group-hover:text-purple-600 transition-colors ${sizeClasses.title}`}
              >
                {ad.title}
              </h3>
            )}
            {ad.description?.trim() && (
              <p
                className={`text-gray-600 ${ad.title?.trim() ? "mt-1" : ""} ${sizeClasses.text}`}
              >
                {ad.description}
              </p>
            )}
            {ad.callToAction?.trim() && (
              <Button
                size={
                  cardSize === "small"
                    ? "sm"
                    : cardSize === "extra-large"
                      ? "lg"
                      : "default"
                }
                variant="outline"
                className={`w-full border-purple-200 hover:bg-purple-50 ${
                  cardSize === "small"
                    ? "mt-2 text-xs"
                    : ad.title?.trim() || ad.description?.trim()
                      ? "mt-3"
                      : ""
                }`}
                onClick={() => handleAdClick(ad)}
              >
                {ad.callToAction}
              </Button>
            )}
          </CardContent>
        )}

        {/* If only image exists (no title/description), make the whole card clickable */}
        {ad.mediaUrl && !ad.title?.trim() && !ad.description?.trim() && (
          <div
            className="absolute inset-0 z-20 cursor-pointer"
            onClick={() => handleAdClick(ad)}
          />
        )}
      </Card>
    );
  };

  const BannerAd = ({ ad }: { ad: AdCampaign }) => {
    const bannerSize = ad.size || size;

    // Define banner size classes
    const getBannerSizeClasses = (adSize: string) => {
      switch (adSize) {
        case "small":
          return {
            container: "max-h-16",
            image: "h-12 w-12",
            text: "text-xs",
            title: "text-sm",
            button: "text-xs px-2 py-1",
          };
        case "large":
          return {
            container: "max-h-40",
            image: "h-32 w-32",
            text: "text-base",
            title: "text-xl",
            button: "text-base px-6 py-3",
          };
        case "extra-large":
          return {
            container: "max-h-48",
            image: "h-40 w-40",
            text: "text-lg",
            title: "text-2xl",
            button: "text-lg px-8 py-4",
          };
        default: // medium
          return {
            container: "max-h-24",
            image: "h-16 w-16",
            text: "text-sm",
            title: "text-lg",
            button: "text-sm px-4 py-2",
          };
      }
    };

    const bannerClasses = getBannerSizeClasses(bannerSize);

    return (
      <Card
        className={`border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-shadow relative ${bannerClasses.container} ${className}`}
      >
        <div className="absolute top-2 left-2">
          <Badge className="bg-purple-600 text-white text-xs">Sponsored</Badge>
        </div>
        {showCloseButton && (
          <button
            onClick={(e) => closeAd(ad.id, e)}
            className="absolute top-2 right-2 z-50 w-6 h-6 bg-gray-800/70 text-white rounded-full flex items-center justify-center hover:bg-gray-800/90 transition-colors shadow-lg"
            style={{ zIndex: 9999 }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {/* If media-only ad (no title/description), fill entire banner */}
        {ad.mediaUrl && !ad.title?.trim() && !ad.description?.trim() ? (
          <div
            className={`cursor-pointer relative ${bannerClasses.container.replace("max-h-", "h-")}`}
            onClick={() => handleAdClick(ad)}
          >
            <MediaRenderer
              mediaUrl={ad.mediaUrl}
              mediaType={ad.mediaType}
              title={ad.title}
              className="w-full h-full object-cover rounded-lg"
            />
            {ad.callToAction?.trim() && (
              <div className="absolute bottom-2 right-2">
                <Button
                  size={
                    bannerSize === "small"
                      ? "sm"
                      : bannerSize === "extra-large"
                        ? "lg"
                        : "default"
                  }
                  className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${bannerClasses.button}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick(ad);
                  }}
                >
                  {ad.callToAction}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <CardContent
            className={`${bannerSize === "small" ? "p-2" : bannerSize === "extra-large" ? "p-6" : "p-4"}`}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleAdClick(ad)}
            >
              {/* Media display for banner ads with text */}
              {ad.mediaUrl && (
                <div className="flex-shrink-0 mr-4">
                  <MediaRenderer
                    mediaUrl={ad.mediaUrl}
                    mediaType={ad.mediaType}
                    title={ad.title}
                    className={`object-cover rounded-lg ${bannerClasses.image}`}
                  />
                </div>
              )}

              {/* Text content - only show if title or description exists */}
              {(ad.title?.trim() || ad.description?.trim()) && (
                <div className="flex-1">
                  {ad.title?.trim() && (
                    <h3
                      className={`font-semibold text-gray-900 ${bannerClasses.title}`}
                    >
                      {ad.title}
                    </h3>
                  )}
                  {ad.description?.trim() && (
                    <p className={`text-gray-600 mt-1 ${bannerClasses.text}`}>
                      {ad.description}
                    </p>
                  )}
                </div>
              )}

              {/* CTA Button - only show if call to action exists */}
              {ad.callToAction?.trim() && (
                <Button
                  size={
                    bannerSize === "small"
                      ? "sm"
                      : bannerSize === "extra-large"
                        ? "lg"
                        : "default"
                  }
                  className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${bannerClasses.button}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick(ad);
                  }}
                >
                  {ad.callToAction}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (filteredAds.length === 0) {
    return null;
  }

  // Render different layouts based on placement
  if (placement === "top-banner" || placement === "footer-banner") {
    return (
      <AdCarousel
        ads={ads}
        user={user}
        placement={placement}
        page={page}
        className={`group ${className}`}
        size={size}
        showCloseButton={showCloseButton}
        onAdClosed={onAdClosed}
      >
        {(ad, index) => <BannerAd key={ad.id} ad={ad} />}
      </AdCarousel>
    );
  }

  if (placement === "floating-cta") {
    const FloatingCard = ({ ad }: { ad: AdCampaign }) => {
      const floatingSize = ad.size || size;
      const getFloatingMaxWidth = (adSize: string) => {
        switch (adSize) {
          case "small":
            return "max-w-xs";
          case "large":
            return "max-w-lg";
          case "extra-large":
            return "max-w-xl";
          default:
            return "max-w-sm";
        }
      };

      return (
        <Card
          className={`border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg relative ${getFloatingMaxWidth(floatingSize)}`}
        >
          <div className="absolute top-1 left-1">
            <Badge className="bg-purple-600 text-white text-xs">
              Sponsored
            </Badge>
          </div>
          {showCloseButton && (
            <button
              onClick={(e) => closeAd(ad.id, e)}
              className="absolute top-1 right-1 z-50 w-6 h-6 bg-gray-800/70 text-white rounded-full flex items-center justify-center hover:bg-gray-800/90 transition-colors shadow-lg"
              style={{ zIndex: 9999 }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <CardContent className="p-3">
            <div className="cursor-pointer" onClick={() => handleAdClick(ad)}>
              {ad.mediaUrl && (
                <div className="mb-2">
                  <MediaRenderer
                    mediaUrl={ad.mediaUrl}
                    mediaType={ad.mediaType}
                    title={ad.title}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                </div>
              )}
              {ad.title?.trim() && (
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {ad.title}
                </h4>
              )}
              {ad.description?.trim() && (
                <p className="text-xs text-gray-600 mb-2">{ad.description}</p>
              )}
              {ad.callToAction?.trim() && (
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick(ad);
                  }}
                >
                  {ad.callToAction}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="fixed bottom-4 right-4 z-40">
        <AdCarousel
          ads={ads}
          user={user}
          placement={placement}
          page={page}
          className={`group ${className}`}
          size={size}
          showCloseButton={showCloseButton}
          onAdClosed={onAdClosed}
        >
          {(ad, index) => <FloatingCard key={ad.id} ad={ad} />}
        </AdCarousel>
      </div>
    );
  }

  // Default layout for sidebar, inline-card, etc.
  return (
    <AdCarousel
      ads={ads}
      user={user}
      placement={placement}
      page={page}
      className={`group ${className}`}
      size={size}
      showCloseButton={showCloseButton}
      onAdClosed={onAdClosed}
    >
      {(ad, index) => <AdCard key={ad.id} ad={ad} />}
    </AdCarousel>
  );
}
