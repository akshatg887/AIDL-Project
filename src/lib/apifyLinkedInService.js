import { ApifyClient } from "apify-client";

class ApifyLinkedInService {
  constructor() {
    this.client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
    // Updated to use the new scraper that doesn't require cookies
    this.actorId = "dev_fusion/linkedin-profile-scraper";
  }

  /**
   * Scrape LinkedIn profile using Apify
   * @param {string} profileUrl - LinkedIn profile URL
   * @param {Object} options - Additional scraping options
   * @returns {Promise<Object>} - Scraped profile data
   */
  async scrapeProfile(profileUrl, options = {}) {
    try {
      if (!process.env.APIFY_API_TOKEN) {
        throw new Error("APIFY_API_TOKEN environment variable is not set");
      }

      if (!profileUrl) {
        throw new Error("Profile URL is required");
      }

      // Validate LinkedIn URL format
      if (!this.isValidLinkedInUrl(profileUrl)) {
        throw new Error("Invalid LinkedIn profile URL format");
      }

      console.log(`Starting LinkedIn profile scraping for: ${profileUrl}`);

      // Configure the input for the new actor - much simpler, no cookies needed
      const input = {
        profileUrls: [profileUrl], // Changed from 'urls' to 'profileUrls' as required by the new scraper
        proxy: {
          useApifyProxy: true,
          apifyProxyCountry: "US",
        },
        ...options,
      };

      // Run the actor
      const run = await this.client.actor(this.actorId).call(input);

      console.log(`Actor run finished with status: ${run.status}`);

      if (run.status !== "SUCCEEDED") {
        throw new Error(`Actor run failed with status: ${run.status}`);
      }

      // Get the results
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems();

      if (!items || items.length === 0) {
        throw new Error("No data was scraped from the profile");
      }

      // The new scraper returns data in a different format
      // Return the raw data directly since it's already well-structured
      const profileData = items;

      console.log("Profile scraping completed successfully");
      return profileData;
    } catch (error) {
      console.error("Error scraping LinkedIn profile:", error);
      throw error;
    }
  }

  /**
   * Validate LinkedIn URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether the URL is valid
   */
  isValidLinkedInUrl(url) {
    const linkedinUrlPattern =
      /^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    return linkedinUrlPattern.test(url);
  }

  /**
   * Get actor run status
   * @param {string} runId - Actor run ID
   * @returns {Promise<Object>} - Run status information
   */
  async getRunStatus(runId) {
    try {
      const run = await this.client.run(runId).get();
      return {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        duration: run.finishedAt
          ? Math.round(
              (new Date(run.finishedAt) - new Date(run.startedAt)) / 1000
            )
          : null,
      };
    } catch (error) {
      console.error("Error getting run status:", error);
      throw error;
    }
  }

  /**
   * Get actor information
   * @returns {Promise<Object>} - Actor details
   */
  async getActorInfo() {
    try {
      const actor = await this.client.actor(this.actorId).get();
      return {
        id: actor.id,
        name: actor.name,
        title: actor.title,
        description: actor.description,
        stats: actor.stats,
        isPublic: actor.isPublic,
      };
    } catch (error) {
      console.error("Error getting actor info:", error);
      throw error;
    }
  }
}

export default ApifyLinkedInService;
