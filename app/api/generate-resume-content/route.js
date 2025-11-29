import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ApifyLinkedInService from "@/lib/apifyLinkedInService";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export async function POST(request) {
  try {
    const {
      linkedinUrl,
      jobDescription,
      includePosts = false,
    } = await request.json();

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    // Basic LinkedIn URL validation
    if (!linkedinUrl.includes("linkedin.com/in/")) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username/)",
        },
        { status: 400 }
      );
    }

    // Extract LinkedIn profile data using Apify
    let profileData;
    let postsData = [];

    try {
      console.log("Attempting LinkedIn scraping with Apify...");
      const apifyService = new ApifyLinkedInService();
      const scrapedData = await apifyService.scrapeProfile(linkedinUrl);

      // If includePosts is true, also scrape posts data
      if (includePosts) {
        try {
          console.log("Also scraping LinkedIn posts...");
          postsData = await apifyService.scrapePosts(linkedinUrl);
          console.log(`Scraped ${postsData.length} posts`);
        } catch (postsError) {
          console.warn(
            "Posts scraping failed, continuing without posts:",
            postsError.message
          );
          postsData = [];
        }
      }

      // Handle the new dev_fusion/Linkedin-Profile-Scraper format
      // The data comes as an array, so we take the first element
      const profileInfo = Array.isArray(scrapedData)
        ? scrapedData[0]
        : scrapedData;

      console.log("Raw Apify data structure:");
      console.log("Keys:", Object.keys(profileInfo));
      console.log("Full data:", JSON.stringify(profileInfo, null, 2));

      // Extract name from the new format
      const fullName =
        profileInfo.fullName ||
        (profileInfo.firstName && profileInfo.lastName
          ? `${profileInfo.firstName} ${profileInfo.lastName}`
          : "");

      console.log("Extracted name:", fullName);

      // Convert Apify data to the format expected by resume generator
      profileData = {
        name: fullName,
        headline: profileInfo.headline || profileInfo.jobTitle || "",
        location:
          profileInfo.addressWithCountry ||
          profileInfo.addressWithoutCountry ||
          profileInfo.addressCountryOnly ||
          "",
        about: profileInfo.about || "",
        experience: formatExperienceNewFormat(profileInfo.experiences || []),
        education: formatEducationNewFormat(profileInfo.educations || []),
        skills: formatSkillsNewFormat(profileInfo.skills || []),
        certifications: formatCertifications(
          profileInfo.licenseAndCertificates || []
        ),
        languages: formatLanguages(profileInfo.languages || []),
        // Additional data for Gemini to work with
        rawLinkedInData: {
          connectionsCount: profileInfo.connections || 0,
          followersCount: profileInfo.followers || 0,
          industry: profileInfo.companyIndustry || "",
          currentJobTitle: profileInfo.jobTitle || "",
          currentCompany: profileInfo.companyName || "",
          currentJobDuration: profileInfo.currentJobDuration || "",
          topSkills: profileInfo.topSkillsByEndorsements || "",
          updates: profileInfo.updates || [],
          projects: profileInfo.projects || [],
          publications: profileInfo.publications || [],
          courses: profileInfo.courses || [],
          honors: profileInfo.honorsAndAwards || [],
          volunteer: profileInfo.volunteerAndAwards || [],
        },
      };

      console.log("Formatted profile data:", profileData);

      // Validate that we got meaningful data
      if (!profileData.name || profileData.name.trim() === "") {
        console.error("No name found in any of the expected fields");
        console.error("Available data keys:", Object.keys(scrapedData));
        throw new Error(
          "Could not extract profile name from LinkedIn data. Available fields: " +
            Object.keys(scrapedData).join(", ")
        );
      }

      console.log("Apify scraping succeeded!");
    } catch (scrapingError) {
      console.error("Apify scraping failed:", scrapingError.message);

      // Provide specific error messages but don't use fallback data
      let errorMessage = "LinkedIn profile scraping failed";

      if (scrapingError.message.includes("APIFY_API_TOKEN")) {
        errorMessage =
          "Apify API token is not configured. Please add APIFY_API_TOKEN to your environment variables.";
      } else if (
        scrapingError.message.includes("Invalid LinkedIn profile URL")
      ) {
        errorMessage =
          "Invalid LinkedIn profile URL format. Please use a valid LinkedIn profile URL.";
      } else if (
        scrapingError.message.includes("private") ||
        scrapingError.message.includes("restricted")
      ) {
        errorMessage =
          "LinkedIn profile is private or restricted. Please ensure the profile is publicly accessible.";
      } else {
        errorMessage = `LinkedIn scraping failed: ${scrapingError.message}`;
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Generate tailored resume content using Gemini AI
    const resumeContent = await generateResumeContent(
      profileData,
      jobDescription,
      postsData
    );

    // Return only the resume content for preview and editing
    return NextResponse.json({
      success: true,
      resumeContent,
      profileData,
      scrapingSource: "Apify LinkedIn Scraper",
    });
  } catch (error) {
    console.error("Error generating resume content:", error);
    return NextResponse.json(
      { error: "Failed to generate resume content: " + error.message },
      { status: 500 }
    );
  }
}

// Helper function to format experience data from new Apify format
function formatExperienceNewFormat(experienceArray) {
  if (!Array.isArray(experienceArray)) return [];

  return experienceArray
    .map((exp) => {
      const experiences = [];

      if (exp.breakdown && exp.subComponents) {
        // Handle company with multiple roles
        exp.subComponents.forEach((role) => {
          if (role.title) {
            const title = role.title;
            const company = exp.title || ""; // Company name is in the main title when breakdown is true
            const duration = role.caption || "";
            const location = role.metadata || "";
            const description =
              role.description && Array.isArray(role.description)
                ? role.description.join(" ")
                : "";

            let formatted = `${title}`;
            if (company) formatted += ` at ${company}`;
            if (duration) formatted += ` (${duration})`;
            if (location) formatted += ` - ${location}`;
            if (description) formatted += ` - ${description}`;

            experiences.push(formatted);
          }
        });
      } else {
        // Handle single role
        const title = exp.title || "";
        const subtitle = exp.subtitle || "";
        const duration = exp.caption || "";
        const description =
          exp.subComponents &&
          exp.subComponents[0] &&
          exp.subComponents[0].description
            ? Array.isArray(exp.subComponents[0].description)
              ? exp.subComponents[0].description.join(" ")
              : exp.subComponents[0].description
            : "";

        if (title) {
          let formatted = title;
          if (subtitle) formatted += ` - ${subtitle}`;
          if (duration) formatted += ` (${duration})`;
          if (description) formatted += ` - ${description}`;

          experiences.push(formatted);
        }
      }

      return experiences;
    })
    .flat()
    .filter(Boolean);
}

// Helper function to format education data from new Apify format
function formatEducationNewFormat(educationArray) {
  if (!Array.isArray(educationArray)) return [];

  return educationArray
    .map((edu) => {
      const institution = edu.title || "";
      const degree = edu.subtitle || "";
      const duration = edu.caption || "";
      const description =
        edu.subComponents &&
        edu.subComponents[0] &&
        edu.subComponents[0].description
          ? Array.isArray(edu.subComponents[0].description)
            ? edu.subComponents[0].description.join(" ")
            : edu.subComponents[0].description
          : "";

      let formatted = "";
      if (degree && institution) {
        formatted = `${degree} - ${institution}`;
      } else if (institution) {
        formatted = institution;
      } else if (degree) {
        formatted = degree;
      }

      if (formatted && duration) {
        formatted += ` (${duration})`;
      }

      if (description) {
        formatted += ` - ${description}`;
      }

      return formatted;
    })
    .filter(Boolean);
}

// Helper function to format skills data from new Apify format
function formatSkillsNewFormat(skillsArray) {
  if (!Array.isArray(skillsArray)) return [];

  return skillsArray
    .map((skill) => {
      return skill.title || skill.name || "";
    })
    .filter(Boolean);
}

// Helper function to format experience data from old Apify format (keeping for backward compatibility)
function formatExperience(experienceArray) {
  if (!Array.isArray(experienceArray)) return [];

  return experienceArray
    .map((exp) => {
      if (typeof exp === "string") return exp;

      // Handle Apify positions structure
      const title = exp.title || exp.position || exp.jobTitle || "";
      const company = exp.company?.name || exp.companyName || exp.company || "";

      // Format time period
      let duration = "";
      if (exp.timePeriod) {
        const startDate = exp.timePeriod.startDate;
        const endDate = exp.timePeriod.endDate;

        if (startDate) {
          const startYear = startDate.year;
          const startMonth = startDate.month;
          const start = startMonth ? `${startMonth}/${startYear}` : startYear;

          if (endDate) {
            const endYear = endDate.year;
            const endMonth = endDate.month;
            const end = endMonth ? `${endMonth}/${endYear}` : endYear;
            duration = `${start} - ${end}`;
          } else {
            duration = `${start} - Present`;
          }
        }
      } else {
        duration = exp.duration || exp.dateRange || "";
      }

      const description = exp.description || exp.summary || "";

      if (title && company) {
        return `${title} at ${company}${duration ? ` (${duration})` : ""}${
          description ? ` - ${description}` : ""
        }`;
      }

      return exp.title || exp.position || exp.company || exp.description || "";
    })
    .filter(Boolean);
}

// Helper function to format education data from Apify
function formatEducation(educationArray) {
  if (!Array.isArray(educationArray)) return [];

  return educationArray
    .map((edu) => {
      if (typeof edu === "string") return edu;

      const degree = edu.degree || edu.degreeName || edu.fieldOfStudy || "";
      const school = edu.school || edu.schoolName || edu.institution || "";

      // Format time period for education
      let year = "";
      if (edu.timePeriod) {
        const endDate = edu.timePeriod.endDate;
        const startDate = edu.timePeriod.startDate;

        if (endDate && endDate.year) {
          year = endDate.year.toString();
        } else if (startDate && startDate.year) {
          year = `${startDate.year} - Present`;
        }
      } else {
        year = edu.year || edu.graduationYear || edu.endDate || "";
      }

      // Create education entry
      let entry = "";
      if (degree && school) {
        entry = `${degree} - ${school}`;
      } else if (school) {
        entry = school;
      } else if (degree) {
        entry = degree;
      }

      if (entry && year) {
        entry += ` (${year})`;
      }

      return entry || edu.description || "";
    })
    .filter(Boolean);
}

// Helper function to format skills data from Apify
function formatSkills(skillsArray) {
  if (!Array.isArray(skillsArray)) return [];

  return skillsArray
    .map((skill) => {
      if (typeof skill === "string") return skill;
      return skill.name || skill.skill || skill.title || "";
    })
    .filter(Boolean);
}

// Helper function to format certifications data from Apify
function formatCertifications(certificationsArray) {
  if (!Array.isArray(certificationsArray)) return [];

  return certificationsArray
    .map((cert) => {
      if (typeof cert === "string") return cert;

      // Handle new format
      const name = cert.title || cert.name || "";
      const authority =
        cert.subtitle ||
        cert.authority ||
        cert.issuer ||
        cert.organization ||
        "";
      const date = cert.caption || cert.date || cert.year || "";

      if (name) {
        return `${name}${authority ? ` - ${authority}` : ""}${
          date ? ` (${date})` : ""
        }`;
      }

      return "";
    })
    .filter(Boolean);
}

// Helper function to format languages data from Apify
function formatLanguages(languagesArray) {
  if (!Array.isArray(languagesArray)) return [];

  return languagesArray
    .map((lang) => {
      if (typeof lang === "string") return lang;

      // Handle new format
      const name = lang.title || lang.name || lang.language || "";
      const proficiency = lang.subtitle || lang.proficiency || lang.level || "";

      return `${name}${proficiency ? ` - ${proficiency}` : ""}`;
    })
    .filter(Boolean);
}

async function generateResumeContent(
  profileData,
  jobDescription,
  postsData = []
) {
  try {
    // Helper function to format posts data for the prompt
    const formatPostsData = (posts) => {
      if (!posts || posts.length === 0) return "No posts data available.";

      return posts
        .slice(0, 10)
        .map((post, index) => {
          const content = post.text || post.content || post.description || "";
          const date =
            post.posted_at?.date || post.date || post.publishedAt || "";
          const likes =
            post.stats?.total_reactions || post.stats?.like || post.likes || 0;
          const comments = post.stats?.comments || post.comments || 0;

          return `Post ${index + 1}${
            date ? ` (${date})` : ""
          }: ${content.substring(0, 200)}${
            content.length > 200 ? "..." : ""
          } [${likes} reactions, ${comments} comments]`;
        })
        .join("\n");
    };

    // Helper function to extract project-related posts
    const extractProjectPosts = (posts) => {
      if (!posts || posts.length === 0)
        return "No project-related posts found.";

      // Keywords that indicate project-related content
      const projectKeywords = [
        "project",
        "built",
        "developed",
        "created",
        "launched",
        "implemented",
        "designed",
        "working on",
        "completed",
        "delivered",
        "deployed",
        "released",
        "prototype",
        "mvp",
        "minimum viable product",
        "hackathon",
        "coding",
        "programming",
        "app",
        "website",
        "platform",
        "system",
        "tool",
        "solution",
        "feature",
        "product",
        "github",
        "repository",
        "open source",
        "demo",
        "showcase",
        "portfolio",
        "tech stack",
        "framework",
        "library",
        "api",
        "database",
        "algorithm",
        "machine learning",
        "ai",
        "data science",
        "web development",
        "mobile app",
        "frontend",
        "backend",
        "full stack",
        "devops",
        "cloud",
        "aws",
        "azure",
        "three.js",
        "react",
        "node.js",
        "mongodb",
        "express",
        "gsap",
        "animation",
      ];

      const projectPosts = posts
        .filter((post) => {
          const content = (
            post.text ||
            post.content ||
            post.description ||
            ""
          ).toLowerCase();
          return projectKeywords.some((keyword) => content.includes(keyword));
        })
        .slice(0, 5); // Get top 5 project-related posts

      if (projectPosts.length === 0) return "No project-related posts found.";

      return projectPosts
        .map((post, index) => {
          const content = post.text || post.content || post.description || "";
          const date =
            post.posted_at?.date || post.date || post.publishedAt || "";
          const likes =
            post.stats?.total_reactions || post.stats?.like || post.likes || 0;
          const comments = post.stats?.comments || post.comments || 0;

          return `Project Post ${index + 1}${
            date ? ` (${date})` : ""
          }: ${content} [${likes} reactions, ${comments} comments]`;
        })
        .join("\n\n");
    };

    const prompt = `
Create a professional, ATS-optimized resume based on this comprehensive LinkedIn profile data and job description.

LinkedIn Profile Data:
- Name: ${profileData.name}
- Headline: ${profileData.headline}
- Location: ${profileData.location}
- About/Summary: ${profileData.about}

Experience (${profileData.experience.length} positions):
${profileData.experience.map((exp) => `- ${exp}`).join("\n")}

Education (${profileData.education.length} entries):
${profileData.education.map((edu) => `- ${edu}`).join("\n")}

Skills (${profileData.skills.length} skills):
${profileData.skills.join(", ")}

LinkedIn Posts Activity (${postsData.length} recent posts):
${formatPostsData(postsData)}

PROJECT-RELATED POSTS ANALYSIS:
${extractProjectPosts(postsData)}

Certifications (${profileData.certifications.length} certifications):
${profileData.certifications.join("\n")}

Languages (${profileData.languages.length} languages):
${profileData.languages.join("\n")}

Additional Context:
- Industry: ${profileData.rawLinkedInData?.industry || "Not specified"}
- Current Role: ${
      profileData.rawLinkedInData?.currentJobTitle || "Not specified"
    }
- Current Company: ${
      profileData.rawLinkedInData?.currentCompany || "Not specified"
    }
- Current Job Duration: ${
      profileData.rawLinkedInData?.currentJobDuration || "Not specified"
    }
- Connections: ${profileData.rawLinkedInData?.connectionsCount || 0}
- Followers: ${profileData.rawLinkedInData?.followersCount || 0}
- Top Skills by Endorsements: ${
      profileData.rawLinkedInData?.topSkills || "Not specified"
    }

Additional Available Data:
- Projects: ${profileData.rawLinkedInData?.projects?.length || 0} projects found
- Publications: ${
      profileData.rawLinkedInData?.publications?.length || 0
    } publications found
- Courses: ${profileData.rawLinkedInData?.courses?.length || 0} courses found
- Honors & Awards: ${
      profileData.rawLinkedInData?.honors?.length || 0
    } honors found
- Volunteer Experience: ${
      profileData.rawLinkedInData?.volunteer?.length || 0
    } volunteer experiences found

Job Description: ${
      jobDescription ||
      "General professional position requiring strong skills and experience"
    }

INSTRUCTIONS:
1. Create a comprehensive, tailored resume using ALL available data including insights from LinkedIn posts
2. Use posts data to infer additional skills, interests, thought leadership, and professional insights
3. SPECIFICALLY ANALYZE PROJECT-RELATED POSTS: Extract and prioritize projects mentioned in LinkedIn posts
4. For the KEY PROJECTS section: Include ONLY the 3 most recent/relevant projects from posts analysis
5. Extract key project details: project name, technologies used, outcomes, impact, and timeline
6. Focus on technical achievements, problem-solving, and measurable results from posts
7. Fill in missing sections intelligently based on the provided data
8. Prioritize and reorganize content to match the job requirements
9. Generate professional summaries and descriptions where data is sparse
10. Extract expertise areas and industry knowledge from posts content
11. Include ALL relevant sections even if original data is limited

SPECIAL FOCUS ON PROJECTS:
- Analyze the "PROJECT-RELATED POSTS ANALYSIS" section above carefully
- Extract concrete project details from posts (avoid including entire post content)
- Identify technologies, frameworks, tools, and programming languages mentioned
- Look for project outcomes, metrics, achievements, and impact
- Prioritize recent projects (check dates in posts)
- Include only 3 most impressive/relevant projects in the final resume
- Format each project as: "Project Name: Brief description focusing on technologies used, problem solved, and key outcomes/achievements"

Create a complete resume with these sections in this EXACT order:
1. Summary (3-4 compelling lines showcasing value proposition, enhanced with insights from posts)
2. Skills (separate technical and professional skills sections, including skills inferred from posts)
3. Projects (EXACTLY 3 projects - prioritize projects found in posts analysis, then from experience/profile)
4. Experience (detailed achievements and responsibilities)
5. Education (academic qualifications and relevant coursework)
6. Additional Information (languages, certifications, awards, honors, volunteer work)

Return ONLY a JSON object with this exact structure:
{
  "personalInfo": {
    "name": "Full Name",
    "headline": "Professional Title",
    "location": "City, State"
  },
  "summary": "Professional summary paragraph highlighting key achievements and value proposition...",
  "skills": ["Technical Skill 1", "Technical Skill 2", "Programming Language 1", "Software Tool 1"],
  "softSkills": ["Leadership", "Communication", "Problem-solving", "Team collaboration"],
  "projects": [
    "Project Name: Brief description of project, technologies used, and outcomes...",
    "Additional Project..."
  ],
  "experience": [
    "Company Name - Job Title (Duration): Detailed description of role, achievements, and impact...",
    "Previous Company - Previous Role (Duration): Another detailed experience description..."
  ],
  "education": [
    "Degree Name - Institution Name (Year): Relevant coursework, honors, or additional details...",
    "Additional Education Entry..."
  ],
  "additionalInfo": {
    "languages": [
      "Language Name - Proficiency Level",
      "Additional Language..."
    ],
    "certifications": [
      "Certification Name - Issuing Authority (Year/Date)",
      "Additional Certification..."
    ],
    "awards": [
      "Award Name - Issuing Organization (Year): Description...",
      "Additional Award..."
    ],
    "volunteer": [
      "Organization Name - Role (Duration): Description of volunteer work...",
      "Additional Volunteer Experience..."
    ]
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let resumeContent;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      resumeContent = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Gemini JSON parsing error:", parseError);
      throw new Error(
        "Failed to generate resume content. Gemini AI response was invalid."
      );
    }

    return resumeContent;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw new Error(
      "Failed to generate resume content using AI. Please try again."
    );
  }
}
