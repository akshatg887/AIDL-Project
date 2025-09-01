import { NextResponse } from "next/server";
import ApifyLinkedInService from "@/lib/apifyLinkedInService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileUrl = searchParams.get("url");
    const testMode = searchParams.get("test") === "true";

    if (!profileUrl && !testMode) {
      return NextResponse.json(
        {
          error:
            "Profile URL is required. Use ?url=<linkedin-url> or ?test=true for test mode",
        },
        { status: 400 }
      );
    }

    const service = new ApifyLinkedInService();

    // Test mode - get actor information
    if (testMode) {
      console.log("Running in test mode - getting actor information...");

      try {
        const actorInfo = await service.getActorInfo();
        return NextResponse.json({
          success: true,
          message: "Apify LinkedIn scraper is accessible",
          actorInfo,
          apiTokenConfigured: !!process.env.APIFY_API_TOKEN,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to access Apify actor",
            details: error.message,
            apiTokenConfigured: !!process.env.APIFY_API_TOKEN,
            suggestions: [
              "Check if APIFY_API_TOKEN is set correctly",
              'Verify the actor ID "curious_coder/linkedin-profile-scraper" exists',
              "Ensure your Apify account has access to this actor",
            ],
          },
          { status: 500 }
        );
      }
    }

    // Actual scraping
    console.log(`Testing LinkedIn profile scraping for: ${profileUrl}`);

    const startTime = Date.now();
    const result = await service.scrapeProfile(profileUrl);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    return NextResponse.json({
      success: true,
      message: "Profile scraped successfully",
      data: result,
      metadata: {
        scrapingDuration: `${duration} seconds`,
        profileUrl,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("LinkedIn scraping test failed:", error);

    // Provide helpful error messages based on error type
    let errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    if (error.message.includes("APIFY_API_TOKEN")) {
      errorResponse.suggestions = [
        "Set APIFY_API_TOKEN environment variable",
        "Get your API token from https://console.apify.com/account/integrations",
        "Add APIFY_API_TOKEN=your-token to your .env.local file",
      ];
    } else if (error.message.includes("Invalid LinkedIn profile URL")) {
      errorResponse.suggestions = [
        "Use a valid LinkedIn profile URL format: https://www.linkedin.com/in/username",
        "Make sure the URL is publicly accessible",
        "Remove any query parameters from the URL",
      ];
    } else if (error.message.includes("Actor run failed")) {
      errorResponse.suggestions = [
        "The LinkedIn profile might be private or restricted",
        "Try with a different public profile",
        "Check if the actor is currently available on Apify",
      ];
    } else if (error.message.includes("LinkedIn session cookie")) {
      errorResponse.suggestions = [
        "LinkedIn session cookie is required for scraping",
        "Steps to get your LinkedIn cookie:",
        "1. Log into LinkedIn in your browser",
        "2. Open Developer Tools (F12)",
        "3. Go to Application/Storage tab → Cookies → linkedin.com",
        '4. Copy all cookie values and format as: "name1=value1; name2=value2; ..."',
        "5. Add LINKEDIN_SESSION_COOKIE=your-cookie-string to .env.local",
      ];
    } else if (error.message.includes("cookie is required")) {
      errorResponse.suggestions = [
        "LinkedIn session cookie is required for this scraper",
        "Get your LinkedIn session cookie from browser developer tools",
        "Add LINKEDIN_SESSION_COOKIE to your .env.local file",
        "Make sure you are logged into LinkedIn when copying the cookie",
      ];
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { profileUrl, options = {} } = body;

    if (!profileUrl) {
      return NextResponse.json(
        { error: "Profile URL is required in request body" },
        { status: 400 }
      );
    }

    const service = new ApifyLinkedInService();
    const result = await service.scrapeProfile(profileUrl, options);

    return NextResponse.json({
      success: true,
      message: "Profile scraped successfully",
      data: result,
    });
  } catch (error) {
    console.error("LinkedIn scraping failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
