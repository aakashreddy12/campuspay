import { supabase } from "@/lib/supabase";
import { AdCampaign } from "@shared/api";

export interface User {
  id: string;
  course?: string;
  gender?: string;
  year?: number;
  college?: string;
  ageGroup?: string;
  residenceType?: string;
  interests?: string | string[];
}

// Helper function to check if error is a network error
function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("NetworkError") ||
    error?.message?.includes("TypeError: Failed to fetch")
  );
}

// Helper function to retry operations with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isNetworkError(error)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `Network error detected, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Global flag to disable impression tracking if network issues persist
let impressionTrackingEnabled = true;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

export class AdService {
  static async fetchTargetedAds(
    user: User,
    page?: string,
  ): Promise<AdCampaign[]> {
    if (!user) {
      console.log("No user provided to fetchTargetedAds");
      return [];
    }

    console.log("Fetching ads for user:", {
      id: user.id,
      course: user.course,
      college: user.college,
    });

    try {
      // Get current date for comparison
      const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      // Fetch all active campaigns that are currently running with retry logic
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from("ad_campaigns")
          .select("*")
          .eq("status", "active")
          .lte("start_date", now)
          .gte("end_date", now);
      });

      if (error) {
        console.error(
          "Error fetching ads from database:",
          JSON.stringify(error, null, 2),
        );
        console.error("Error details:", error);
        throw error;
      }

      console.log(
        `Found ${data?.length || 0} active campaigns for date range: ${now}`,
      );
      if (data && data.length > 0) {
        console.log("Sample campaign:", JSON.stringify(data[0], null, 2));
      }

      // Filter ads based on user targeting
      const targetedAds =
        data?.filter((ad) => {
          const targeting = ad.target_audience || {};

          // If no targeting specified, show to all students
          if (Object.keys(targeting).length === 0) {
            return true;
          }

          // Check courses targeting (array)
          if (
            targeting.courses &&
            targeting.courses.length > 0 &&
            user.course
          ) {
            if (!targeting.courses.includes(user.course)) {
              return false;
            }
          }

          // Check genders targeting (array)
          if (
            targeting.genders &&
            targeting.genders.length > 0 &&
            user.gender
          ) {
            if (!targeting.genders.includes(user.gender)) {
              return false;
            }
          }

          // Check years targeting (array)
          if (targeting.years && targeting.years.length > 0 && user.year) {
            if (!targeting.years.includes(user.year)) {
              return false;
            }
          }

          // Check age groups targeting (array)
          if (
            targeting.ageGroups &&
            targeting.ageGroups.length > 0 &&
            user.ageGroup
          ) {
            if (!targeting.ageGroups.includes(user.ageGroup)) {
              return false;
            }
          }

          // Check residence types targeting (array)
          if (
            targeting.residenceTypes &&
            targeting.residenceTypes.length > 0 &&
            user.residenceType
          ) {
            if (!targeting.residenceTypes.includes(user.residenceType)) {
              return false;
            }
          }

          // Check interests targeting (array to array matching)
          if (
            targeting.interests &&
            targeting.interests.length > 0 &&
            user.interests &&
            user.interests.length > 0
          ) {
            const userInterests = Array.isArray(user.interests)
              ? user.interests
              : [user.interests];
            const hasMatchingInterest = targeting.interests.some(
              (interest: string) => userInterests.includes(interest),
            );
            if (!hasMatchingInterest) {
              return false;
            }
          }

          // Check college targeting (single value)
          if (
            targeting.college &&
            user.college &&
            targeting.college !== user.college
          ) {
            return false;
          }

          return true;
        }) || [];

      // Transform to AdCampaign format
      const adsWithConvertedDates = targetedAds.map((ad) => {
        console.log("Processing ad from database:", {
          id: ad.id,
          title: ad.title,
          media_url: ad.media_url,
          media_url_length: ad.media_url?.length,
          media_type: ad.media_type,
        });

        return {
          ...ad,
          startDate: new Date(ad.start_date),
          endDate: new Date(ad.end_date),
          createdAt: new Date(ad.created_at),
          mediaUrl: ad.media_url,
          mediaType: ad.media_type,
          size: ad.target_audience?.size || "medium",
          targetAudience: ad.target_audience,
          websiteUrl: ad.website_url,
          callToAction: ad.call_to_action,
          advertiserId: ad.advertiser_id,
        };
      });

      // Track impressions for visible ads (non-blocking)
      if (adsWithConvertedDates.length > 0) {
        // Use setTimeout to make this completely non-blocking
        setTimeout(async () => {
          try {
            await AdService.trackImpressions(user, adsWithConvertedDates, page);
          } catch (impressionError) {
            console.warn(
              "Impression tracking failed (non-critical):",
              JSON.stringify(impressionError, null, 2),
            );
            // Completely silent failure - ads still work fine
          }
        }, 0);
      }

      return adsWithConvertedDates;
    } catch (error) {
      console.error(
        "Error fetching targeted ads:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      return [];
    }
  }

  static async trackImpressions(
    user: User,
    ads: AdCampaign[],
    page?: string,
  ): Promise<void> {
    if (!user || ads.length === 0) return;

    // Check if impression tracking is disabled due to persistent failures
    if (!impressionTrackingEnabled) {
      console.info(
        "Impression tracking temporarily disabled due to network issues",
      );
      return;
    }

    // Check if we're online
    if (!navigator.onLine) {
      console.warn("Offline - skipping impression tracking");
      return;
    }

    try {
      const impressionEvents = ads.map((ad) => ({
        user_id: user.id,
        ad_id: ad.id,
        type: "impression" as const,
        metadata: {
          placement: ad.placement,
          page: page || "unknown",
          user_course: user.course,
          user_year: user.year,
          user_college: user.college,
          timestamp: new Date().toISOString(),
        },
      }));

      // Use shorter retry with reduced attempts for impression tracking
      const { error } = await retryOperation(
        async () => {
          return await supabase.from("ad_events").insert(impressionEvents);
        },
        2, // Only 2 retries instead of 3
        500, // Shorter delay (500ms instead of 1000ms)
      );

      if (error) {
        consecutiveFailures++;
        console.warn(
          `Impression tracking failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}) - ads will continue to work:`,
          error.message || error,
        );

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          impressionTrackingEnabled = false;
          console.warn(
            "Impression tracking disabled due to persistent network issues",
          );
          // Re-enable after 5 minutes
          setTimeout(
            () => {
              impressionTrackingEnabled = true;
              consecutiveFailures = 0;
              console.info("Impression tracking re-enabled");
            },
            5 * 60 * 1000,
          );
        }
      } else {
        // Reset failure count on success
        consecutiveFailures = 0;
      }
    } catch (error) {
      consecutiveFailures++;
      console.warn(
        `Impression tracking unavailable (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}) - ads continue normally:`,
        error instanceof Error ? error.message : "Unknown error",
      );

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        impressionTrackingEnabled = false;
        console.warn("Impression tracking disabled due to persistent errors");
        // Re-enable after 5 minutes
        setTimeout(
          () => {
            impressionTrackingEnabled = true;
            consecutiveFailures = 0;
            console.info("Impression tracking re-enabled");
          },
          5 * 60 * 1000,
        );
      }
    }
  }

  static async trackClick(
    user: User,
    ad: AdCampaign,
    page?: string,
  ): Promise<void> {
    if (!user) return;

    try {
      const { error } = await supabase.from("ad_events").insert([
        {
          user_id: user.id,
          ad_id: ad.id,
          type: "click",
          metadata: {
            placement: ad.placement,
            page: page || "unknown",
            user_course: user.course,
            user_year: user.year,
            user_college: user.college,
            clicked_at: new Date().toISOString(),
          },
        },
      ]);

      if (error) {
        console.error("Error tracking ad click:", error);
      }
    } catch (error) {
      console.error("Error tracking ad click:", error);
    }

    // Open website URL if provided
    if (ad.websiteUrl) {
      window.open(ad.websiteUrl, "_blank");
    }
  }

  static async trackView(
    user: User,
    ad: AdCampaign,
    durationSeconds: number,
    page?: string,
  ): Promise<void> {
    if (!user) return;

    try {
      const { error } = await supabase.from("ad_events").insert([
        {
          user_id: user.id,
          ad_id: ad.id,
          type: "view",
          duration_seconds: durationSeconds,
          metadata: {
            placement: ad.placement,
            page: page || "unknown",
            user_course: user.course,
            user_year: user.year,
            user_college: user.college,
            viewed_at: new Date().toISOString(),
          },
        },
      ]);

      if (error) {
        console.error("Error tracking ad view:", error);
      }
    } catch (error) {
      console.error("Error tracking ad view:", error);
    }
  }
}
