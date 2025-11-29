import { NextResponse } from "next/server";
import ApifyLinkedInService from "@/lib/apifyLinkedInService";

export async function POST(request) {
  try {
    const { input } = await request.json();

    if (!input) {
      return NextResponse.json(
        { error: "LinkedIn profile URL or username is required" },
        { status: 400 }
      );
    }

    console.log("Debug Posts Scraper - Input:", input);

    const apifyService = new ApifyLinkedInService();

    // Extract username for debugging
    const extractedUsername = apifyService.extractUsernameFromUrl(input);
    console.log("Extracted username:", extractedUsername);

    const postsData = await apifyService.scrapePosts(input);

    // Debug: Log the structure of the first few posts
    console.log("=== DEBUG: Posts Data Structure ===");
    console.log("Total posts found:", postsData.length);

    if (postsData.length > 0) {
      // Log the first post structure
      console.log(
        "First post structure:",
        JSON.stringify(postsData[0], null, 2)
      );

      // Log author information from all posts
      console.log("=== Author information from all posts ===");
      postsData.slice(0, 10).forEach((post, index) => {
        console.log(`Post ${index + 1}:`, {
          author: post.author,
          authorName: post.authorName,
          authorUsername: post.authorUsername,
          username: post.username,
          profileUrl: post.profileUrl,
          // Check all possible author fields
          ...Object.keys(post)
            .filter((key) => key.toLowerCase().includes("author"))
            .reduce((obj, key) => {
              obj[key] = post[key];
              return obj;
            }, {}),
        });
      });
    }

    return NextResponse.json({
      success: true,
      debug: {
        inputProvided: input,
        extractedUsername: extractedUsername,
        totalPostsFound: postsData.length,
        firstPostKeys: postsData.length > 0 ? Object.keys(postsData[0]) : [],
        firstPostAuthorInfo:
          postsData.length > 0
            ? {
                author: postsData[0].author,
                authorName: postsData[0].authorName,
                authorUsername: postsData[0].authorUsername,
                username: postsData[0].username,
                profileUrl: postsData[0].profileUrl,
              }
            : null,
        samplePosts: postsData.slice(0, 3).map((post) => ({
          content: post.content?.substring(0, 100) + "...",
          author: post.author,
          authorName: post.authorName,
          authorUsername: post.authorUsername,
          date: post.date || post.publishedAt || post.timestamp,
        })),
      },
      posts: postsData.slice(0, 5), // Return first 5 posts for inspection
    });
  } catch (error) {
    console.error("Debug posts scraper error:", error);
    return NextResponse.json(
      {
        error: "Failed to debug posts scraping",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
