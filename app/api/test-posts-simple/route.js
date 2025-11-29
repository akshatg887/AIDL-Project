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

    console.log("Testing posts scraper for:", input);

    const apifyService = new ApifyLinkedInService();

    // Just get the raw posts data without filtering to see what we get
    const targetUsername = input.includes("linkedin.com/in/")
      ? apifyService.extractUsernameFromUrl(input)
      : input;

    console.log("Target username:", targetUsername);

    const postsData = await apifyService.scrapePosts(input);

    return NextResponse.json({
      success: true,
      targetUsername,
      totalPostsFound: postsData.length,
      samplePosts: postsData.slice(0, 3).map((post) => ({
        content: post.content?.substring(0, 200),
        author: post.author,
        authorName: post.authorName,
        authorUsername: post.authorUsername,
        username: post.username,
        profileUrl: post.profileUrl,
      })),
      posts: postsData,
    });
  } catch (error) {
    console.error("Error testing posts scraper:", error);
    return NextResponse.json(
      {
        error: "Failed to test posts scraper",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
