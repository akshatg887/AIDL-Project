import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export async function POST(request) {
  try {
    const { input } = await request.json();

    if (!input) {
      return NextResponse.json(
        { error: "LinkedIn profile URL or username is required" },
        { status: 400 }
      );
    }

    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    // Build the full URL
    const fullUrl = input.includes("linkedin.com/in/")
      ? input
      : `https://www.linkedin.com/in/${input}/`;

    console.log("Testing different LinkedIn posts scrapers for:", fullUrl);

    // Try different actors for LinkedIn posts
    const actorsToTry = [
      {
        id: "apimaestro/linkedin-profile-posts",
        input: {
          profiles: [input],
          startUrls: [fullUrl],
          maxPosts: 10,
          proxy: { useApifyProxy: true, apifyProxyCountry: "US" },
        },
      },
      {
        id: "curious_coder/linkedin-post-scraper",
        input: {
          profileUrls: [fullUrl],
          maxPosts: 10,
          proxy: { useApifyProxy: true },
        },
      },
      {
        id: "dtrungtin/linkedin-posts-scraper",
        input: {
          profiles: [fullUrl],
          maxPosts: 10,
        },
      },
    ];

    const results = [];

    for (const actor of actorsToTry) {
      try {
        console.log(`Trying actor: ${actor.id}`);
        console.log(`Input:`, JSON.stringify(actor.input, null, 2));

        const run = await client.actor(actor.id).call(actor.input);

        if (run.status === "SUCCEEDED") {
          const { items } = await client
            .dataset(run.defaultDatasetId)
            .listItems();

          results.push({
            actorId: actor.id,
            status: "SUCCESS",
            postsFound: items.length,
            samplePost: items[0]
              ? {
                  content: items[0].content?.substring(0, 200),
                  author: items[0].author,
                  authorName: items[0].authorName,
                  authorUsername: items[0].authorUsername,
                  keys: Object.keys(items[0]),
                }
              : null,
          });
        } else {
          results.push({
            actorId: actor.id,
            status: "FAILED",
            runStatus: run.status,
            postsFound: 0,
          });
        }
      } catch (error) {
        results.push({
          actorId: actor.id,
          status: "ERROR",
          error: error.message,
          postsFound: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      profileUrl: fullUrl,
      results,
    });
  } catch (error) {
    console.error("Error testing LinkedIn actors:", error);
    return NextResponse.json(
      {
        error: "Failed to test LinkedIn actors",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
