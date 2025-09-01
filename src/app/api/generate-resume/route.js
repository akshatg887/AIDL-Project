import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeGenerator } from "@/lib/resumeGenerator";
import ApifyLinkedInService from "@/lib/apifyLinkedInService";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export async function POST(request) {
  try {
    const { linkedinUrl, jobDescription } = await request.json();

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

    try {
      console.log("Attempting LinkedIn scraping with Apify...");
      const apifyService = new ApifyLinkedInService();
      const scrapedData = await apifyService.scrapeProfile(linkedinUrl);

      // Debug: Log the actual structure of scraped data
      console.log("Raw Apify data structure:");
      console.log("Keys:", Object.keys(scrapedData));
      console.log("Full data:", JSON.stringify(scrapedData, null, 2));

      // Try multiple possible field names for the profile name
      const possibleNames = [
        scrapedData.fullName,
        scrapedData.name,
        scrapedData.rawData?.firstName && scrapedData.rawData?.lastName
          ? `${scrapedData.rawData.firstName.trim()} ${scrapedData.rawData.lastName.trim()}`
          : null,
        scrapedData.rawData?.firstName,
        scrapedData.personalInfo?.name,
        scrapedData.profile?.name,
        scrapedData.basic?.name,
        scrapedData.person?.name,
      ].filter(Boolean);

      console.log("Possible names found:", possibleNames);

      // Convert Apify data to the format expected by resume generator
      profileData = {
        name: possibleNames[0] || "",
        headline:
          scrapedData.headline ||
          scrapedData.rawData?.headline ||
          scrapedData.rawData?.occupation ||
          scrapedData.title ||
          scrapedData.position ||
          scrapedData.personalInfo?.headline ||
          "",
        location:
          scrapedData.location ||
          scrapedData.rawData?.geoLocationName ||
          scrapedData.rawData?.geoCountryName ||
          scrapedData.personalInfo?.location ||
          "",
        about:
          scrapedData.about ||
          scrapedData.summary ||
          scrapedData.description ||
          "",
        experience: formatExperience(
          scrapedData.experience || scrapedData.rawData?.positions || []
        ),
        education: formatEducation(
          scrapedData.education || scrapedData.rawData?.educations || []
        ),
        skills: formatSkills(
          scrapedData.skills || scrapedData.rawData?.skills || []
        ),
        certifications: formatCertifications(
          scrapedData.certifications ||
            scrapedData.rawData?.certifications ||
            []
        ),
        languages: formatLanguages(
          scrapedData.languages || scrapedData.rawData?.languages || []
        ),
        // Additional data for Gemini to work with
        rawLinkedInData: {
          connectionsCount: scrapedData.connectionsCount || 0,
          followersCount: scrapedData.followersCount || 0,
          industry: scrapedData.rawData?.industryName || "",
          currentJobTitle: scrapedData.rawData?.jobTitle || "",
          currentCompany: scrapedData.rawData?.companyName || "",
          accomplishments: scrapedData.accomplishments || {},
          volunteer: scrapedData.rawData?.volunteerExperiences || [],
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
      } else if (scrapingError.message.includes("LinkedIn session cookie")) {
        errorMessage =
          "LinkedIn session cookie is required. Please add LINKEDIN_SESSION_COOKIE to your environment variables.";
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

    // Step 2: Generate tailored resume using Gemini AI
    const resumeContent = await generateResumeContent(
      profileData,
      jobDescription
    );

    // Step 3: Create PDF resume
    const resumeGenerator = new ResumeGenerator();
    const pdfBuffer = resumeGenerator.generate(resumeContent);

    // Return the PDF as base64
    const base64PDF = Buffer.from(pdfBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      resume: base64PDF,
      profileData,
      resumeContent,
      scrapingSource: "Apify LinkedIn Scraper",
    });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { error: "Failed to generate resume: " + error.message },
      { status: 500 }
    );
  }
}

// Helper function to format experience data from Apify
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

      const name = cert.name || cert.title || "";
      const authority =
        cert.authority || cert.issuer || cert.organization || "";

      // Format date from timePeriod
      let date = "";
      if (cert.timePeriod && cert.timePeriod.startDate) {
        const startDate = cert.timePeriod.startDate;
        date = startDate.year ? startDate.year.toString() : "";
        if (startDate.month && startDate.year) {
          date = `${startDate.month}/${startDate.year}`;
        }
      }

      return {
        name,
        authority,
        date: date || cert.date || cert.year || "",
      };
    })
    .filter((cert) => cert.name);
}

// Helper function to format languages data from Apify
function formatLanguages(languagesArray) {
  if (!Array.isArray(languagesArray)) return [];

  return languagesArray
    .map((lang) => {
      if (typeof lang === "string") return { name: lang, proficiency: "" };

      return {
        name: lang.name || lang.language || "",
        proficiency: lang.proficiency || lang.level || "",
      };
    })
    .filter((lang) => lang.name);
}

async function generateResumeContent(profileData, jobDescription) {
  try {
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

Certifications (${profileData.certifications.length} certifications):
${profileData.certifications
  .map((cert) =>
    typeof cert === "string"
      ? cert
      : `${cert.name}${cert.authority ? ` - ${cert.authority}` : ""}${
          cert.date ? ` (${cert.date})` : ""
        }`
  )
  .join("\n")}

Languages (${profileData.languages.length} languages):
${profileData.languages
  .map((lang) =>
    typeof lang === "string"
      ? lang
      : `${lang.name}${lang.proficiency ? ` - ${lang.proficiency}` : ""}`
  )
  .join("\n")}

Additional Context:
- Industry: ${profileData.rawLinkedInData?.industry || "Not specified"}
- Current Role: ${
      profileData.rawLinkedInData?.currentJobTitle || "Not specified"
    }
- Current Company: ${
      profileData.rawLinkedInData?.currentCompany || "Not specified"
    }
- Connections: ${profileData.rawLinkedInData?.connectionsCount || 0}
- Followers: ${profileData.rawLinkedInData?.followersCount || 0}

Job Description: ${
      jobDescription ||
      "General professional position requiring strong skills and experience"
    }

INSTRUCTIONS:
1. Create a comprehensive, tailored resume using ALL available data
2. Fill in missing sections intelligently based on the provided data
3. Prioritize and reorganize content to match the job requirements
4. Generate professional summaries and descriptions where data is sparse
5. Include ALL relevant sections even if original data is limited

Create a complete resume with these sections:
1. Professional Summary (3-4 compelling lines showcasing value proposition)
2. Core Skills (technical and soft skills, prioritized for the job)
3. Professional Experience (detailed achievements and responsibilities)
4. Education (academic qualifications and relevant coursework)
5. Certifications (professional certifications and licenses)
6. Languages (language proficiencies)
7. Soft Skills (interpersonal and leadership skills inferred from experience)
8. Projects (if any projects can be inferred from experience/skills)

Return ONLY a JSON object with this exact structure:
{
  "personalInfo": {
    "name": "Full Name",
    "headline": "Professional Title",
    "location": "City, State"
  },
  "summary": "Professional summary paragraph highlighting key achievements and value proposition...",
  "skills": ["Technical Skill 1", "Technical Skill 2", "Core Skill 3", "Domain Skill 4"],
  "softSkills": ["Leadership", "Communication", "Problem-solving", "Team collaboration"],
  "experience": [
    "Company Name - Job Title (Duration): Detailed description of role, achievements, and impact...",
    "Previous Company - Previous Role (Duration): Another detailed experience description..."
  ],
  "education": [
    "Degree Name - Institution Name (Year): Relevant coursework, honors, or additional details...",
    "Additional Education Entry..."
  ],
  "certifications": [
    "Certification Name - Issuing Authority (Year/Date)",
    "Additional Certification..."
  ],
  "languages": [
    "Language Name - Proficiency Level",
    "Additional Language..."
  ],
  "projects": [
    "Project Name: Brief description of project, technologies used, and outcomes...",
    "Additional Project..."
  ]
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
