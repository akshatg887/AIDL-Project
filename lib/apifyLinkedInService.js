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
   * Scrape LinkedIn posts using Apify
   * @param {string} input - LinkedIn profile URL or username
   * @param {Object} options - Additional scraping options
   * @returns {Promise<Object>} - Scraped posts data
   */
  async scrapePosts(input, options = {}) {
    try {
      if (!process.env.APIFY_API_TOKEN) {
        throw new Error("APIFY_API_TOKEN environment variable is not set");
      }

      if (!input) {
        throw new Error("LinkedIn profile URL or username is required");
      }

      console.log(`Starting LinkedIn posts scraping for: ${input}`);

      // Extract username from URL if needed
      let profileIdentifier = input;
      if (input.includes("linkedin.com/in/")) {
        const username = this.extractUsernameFromUrl(input);
        if (username) {
          profileIdentifier = username;
          console.log(`Extracted username: ${username}`);
        }
      }

      // Configure the input for the posts scraper
      // Try different input formats to ensure compatibility
      const fullUrl = input.includes("linkedin.com/in/")
        ? input
        : `https://www.linkedin.com/in/${profileIdentifier}/`;

      const actorInput = {
        profiles: [profileIdentifier], // Use extracted username
        startUrls: [fullUrl], // Use full URL format
        profileUrls: [fullUrl], // Some actors might expect this field
        maxPosts: 50, // Limit posts to reasonable number
        proxy: {
          useApifyProxy: true,
          apifyProxyCountry: "US",
        },
        ...options,
      };

      console.log(`Posts scraper input:`, JSON.stringify(actorInput, null, 2));

      // Run the posts scraper actor
      const postsActorId = "apimaestro/linkedin-profile-posts";
      const run = await this.client.actor(postsActorId).call(actorInput);

      console.log(`Posts scraper run finished with status: ${run.status}`);

      if (run.status !== "SUCCEEDED") {
        throw new Error(`Posts scraper run failed with status: ${run.status}`);
      }

      // Get the results
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems();

      if (!items || items.length === 0) {
        console.log("No posts data was scraped");
        return [];
      }

      console.log(
        `Posts scraping completed successfully. Found ${items.length} posts.`
      );

      // Debug: Log the structure of posts to understand filtering
      console.log("=== Posts Data Structure Debug ===");
      if (items.length > 0) {
        console.log("First post keys:", Object.keys(items[0]));
        console.log("First post author info:", {
          author: items[0].author,
          authorName: items[0].authorName,
          authorUsername: items[0].authorUsername,
          username: items[0].username,
          profileUrl: items[0].profileUrl,
        });
      }

      // Filter posts to only include those from the target profile
      const targetUsername = profileIdentifier.toLowerCase();
      const filteredPosts = items.filter((post) => {
        // Try multiple possible author field names
        const possibleUsernames = [
          post.author?.username,
          post.authorUsername,
          post.username,
          post.author?.name,
          post.authorName,
          // Extract username from profile URL if available
          post.profileUrl ? this.extractUsernameFromUrl(post.profileUrl) : null,
          post.author?.profileUrl
            ? this.extractUsernameFromUrl(post.author.profileUrl)
            : null,
        ]
          .filter(Boolean)
          .map((u) => u.toLowerCase());

        // Check if any of the possible usernames match our target (exact match only)
        const isMatch = possibleUsernames.some(
          (username) => username === targetUsername
        );

        if (isMatch) {
          console.log("Matched post:", {
            content: post.content?.substring(0, 100),
            matchedUsernames: possibleUsernames,
            targetUsername,
          });
        }

        return isMatch;
      });

      console.log(
        `Filtered to ${filteredPosts.length} posts from target profile out of ${items.length} total posts.`
      );

      // If no posts matched, log some sample posts for debugging
      if (filteredPosts.length === 0 && items.length > 0) {
        console.log("=== DEBUG: No posts matched, showing sample posts ===");
        items.slice(0, 3).forEach((post, index) => {
          console.log(`Sample post ${index + 1}:`, {
            content: post.content?.substring(0, 100),
            author: post.author,
            authorName: post.authorName,
            authorUsername: post.authorUsername,
            username: post.username,
            profileUrl: post.profileUrl,
          });
        });
      }

      return filteredPosts;
    } catch (error) {
      console.error("Error scraping LinkedIn posts:", error);
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
   * Extract username from LinkedIn URL
   * @param {string} url - LinkedIn profile URL
   * @returns {string} - Extracted username
   */
  extractUsernameFromUrl(url) {
    if (this.isValidLinkedInUrl(url)) {
      const match = url.match(/\/in\/([a-zA-Z0-9\-]+)\/?$/);
      return match ? match[1] : null;
    }
    return null;
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
