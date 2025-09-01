import { jsPDF } from "jspdf";

export class ResumeGenerator {
  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    this.yPosition = 20;
    this.verticalSpacing = 5;
  }

  generate(resumeContent) {
    // Header with name, title, and contact info
    this.addATSHeader(resumeContent.personalInfo);

    // Summary section
    this.addATSSection("PROFESSIONAL SUMMARY", resumeContent.summary);

    // Skills section (combined technical and soft skills)
    this.addATSSkillsSection(resumeContent);

    // Projects section
    if (resumeContent.projects && resumeContent.projects.length > 0) {
      this.addATSSection("KEY PROJECTS", resumeContent.projects);
    }

    // Experience section
    this.addATSSection("PROFESSIONAL EXPERIENCE", resumeContent.experience);

    // Education section
    this.addATSSection("EDUCATION", resumeContent.education);

    // Additional Information section
    this.addAdditionalInformationSection(resumeContent);

    return this.doc.output("arraybuffer");
  }

  addATSHeader(personalInfo) {
    // Name - centered and large
    this.doc.setFontSize(22);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(
      personalInfo.name.toUpperCase(),
      this.pageWidth / 2,
      this.yPosition,
      {
        align: "center",
      }
    );
    this.yPosition += 8;

    // Headline/Title - centered
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(personalInfo.headline, this.pageWidth / 2, this.yPosition, {
      align: "center",
    });
    this.yPosition += 8;

    // Contact info - single line, centered
    this.doc.setFontSize(10);
    const contactInfo = `${personalInfo.location || ""} | ${
      personalInfo.email || ""
    } | ${personalInfo.phone || ""} | ${personalInfo.linkedin || ""}`;
    this.doc.text(contactInfo, this.pageWidth / 2, this.yPosition, {
      align: "center",
    });
    this.yPosition += 12;
  }

  addATSSection(title, content) {
    if (!content || (Array.isArray(content) && content.length === 0)) return;

    this.checkPageBreak(20);

    // Section title with underline
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title.toUpperCase(), this.margin, this.yPosition);
    this.yPosition += this.verticalSpacing;

    // Add underline
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.yPosition,
      this.pageWidth - this.margin,
      this.yPosition
    );
    this.yPosition += this.verticalSpacing;

    // Content
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");

    if (typeof content === "string") {
      const textLines = this.doc.splitTextToSize(
        content,
        this.pageWidth - 2 * this.margin
      );
      this.doc.text(textLines, this.margin, this.yPosition);
      this.yPosition += textLines.length * 6;
    } else if (Array.isArray(content)) {
      content.forEach((item) => {
        this.checkPageBreak(15);

        if (typeof item === "object") {
          // Handle structured data (experience, education, projects)
          if (item.name || item.role || item.degree || item.title) {
            this.doc.setFontSize(13);
            this.doc.setFont("helvetica", "bold");
            const itemTitle =
              item.name || item.role || item.degree || item.title || "";
            this.doc.text(itemTitle, this.margin, this.yPosition);

            // Right-aligned details (duration, company, etc.)
            let detailsText = "";
            if (item.duration) detailsText += item.duration;
            if (item.company) detailsText += " | " + item.company;
            if (item.gpa) detailsText += " | " + item.gpa;
            if (item.authority) detailsText += " | " + item.authority;
            if (item.date) detailsText += " | " + item.date;

            if (detailsText) {
              this.doc.setFontSize(11);
              this.doc.setFont("helvetica", "normal");
              this.doc.text(
                detailsText,
                this.pageWidth - this.margin,
                this.yPosition,
                {
                  align: "right",
                }
              );
            }

            this.yPosition += 6;
          }

          // Add description/content
          this.doc.setFontSize(12);
          this.doc.setFont("helvetica", "normal");

          const keysToIgnore = [
            "name",
            "role",
            "degree",
            "title",
            "company",
            "duration",
            "gpa",
            "authority",
            "date",
          ];
          for (const key in item) {
            if (
              item.hasOwnProperty(key) &&
              !keysToIgnore.includes(key) &&
              typeof item[key] === "string" &&
              item[key].trim() !== ""
            ) {
              const textLines = this.doc.splitTextToSize(
                item[key],
                this.pageWidth - 2 * this.margin
              );
              this.doc.text(textLines, this.margin, this.yPosition);
              this.yPosition += textLines.length * 6;
            }
          }
        } else if (typeof item === "string") {
          // Handle simple string items
          const textLines = this.doc.splitTextToSize(
            item,
            this.pageWidth - 2 * this.margin
          );
          this.doc.text(textLines, this.margin, this.yPosition);
          this.yPosition += textLines.length * 6;
        }

        this.yPosition += 4; // Space between items
      });
    }

    this.yPosition += this.verticalSpacing;
  }

  addATSSkillsSection(resumeContent) {
    if (
      (!resumeContent.skills || resumeContent.skills.length === 0) &&
      (!resumeContent.softSkills || resumeContent.softSkills.length === 0)
    ) {
      return;
    }

    this.checkPageBreak(30);

    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("SKILLS", this.margin, this.yPosition);
    this.yPosition += this.verticalSpacing;

    // Add underline
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.yPosition,
      this.pageWidth - this.margin,
      this.yPosition
    );
    this.yPosition += this.verticalSpacing;

    const midX = this.pageWidth / 2;
    let leftY = this.yPosition;
    let rightY = this.yPosition;

    // Technical Skills (left column)
    if (resumeContent.skills && resumeContent.skills.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Technical Skills", this.margin, leftY);
      leftY += 8;

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      const technicalSkillsText = resumeContent.skills.join(", ");
      const leftLines = this.doc.splitTextToSize(
        technicalSkillsText,
        midX - this.margin - 5
      );
      this.doc.text(leftLines, this.margin, leftY);
      leftY += leftLines.length * 6;
    }

    // Professional/Soft Skills (right column)
    if (resumeContent.softSkills && resumeContent.softSkills.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Professional Skills", midX + 5, rightY);
      rightY += 8;

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      const softSkillsText = resumeContent.softSkills.join(", ");
      const rightLines = this.doc.splitTextToSize(
        softSkillsText,
        midX - this.margin - 5
      );
      this.doc.text(rightLines, midX + 5, rightY);
      rightY += rightLines.length * 6;
    }

    this.yPosition = Math.max(leftY, rightY) + this.verticalSpacing;
  }

  addAdditionalInformationSection(resumeContent) {
    const hasLanguages = (resumeContent.additionalInfo?.languages || resumeContent.languages)?.length > 0;
    const hasCertifications = (resumeContent.additionalInfo?.certifications || resumeContent.certifications)?.length > 0;
    const hasAwards = resumeContent.additionalInfo?.awards?.length > 0;
    const hasVolunteer = resumeContent.additionalInfo?.volunteer?.length > 0;

    if (!hasLanguages && !hasCertifications && !hasAwards && !hasVolunteer) {
      return;
    }

    this.checkPageBreak(30);

    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("ADDITIONAL INFORMATION", this.margin, this.yPosition);
    this.yPosition += this.verticalSpacing;

    // Add underline
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.yPosition,
      this.pageWidth - this.margin,
      this.yPosition
    );
    this.yPosition += this.verticalSpacing;

    // Languages
    if (hasLanguages) {
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Languages:", this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      const languages = resumeContent.additionalInfo?.languages || resumeContent.languages || [];
      const languagesText = languages.join(", ");
      const languageLines = this.doc.splitTextToSize(
        languagesText,
        this.pageWidth - 2 * this.margin
      );
      this.doc.text(languageLines, this.margin, this.yPosition);
      this.yPosition += languageLines.length * 6 + 4;
    }

    // Certifications
    if (hasCertifications) {
      this.checkPageBreak(15);
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Certifications:", this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      const certifications = resumeContent.additionalInfo?.certifications || resumeContent.certifications || [];
      certifications.forEach((cert) => {
        this.checkPageBreak(8);
        this.doc.text("• " + cert, this.margin, this.yPosition);
        this.yPosition += 6;
      });
      this.yPosition += 4;
    }

    // Awards
    if (hasAwards) {
      this.checkPageBreak(15);
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Awards & Honors:", this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      resumeContent.additionalInfo.awards.forEach((award) => {
        this.checkPageBreak(8);
        this.doc.text("• " + award, this.margin, this.yPosition);
        this.yPosition += 6;
      });
      this.yPosition += 4;
    }

    // Volunteer Experience
    if (hasVolunteer) {
      this.checkPageBreak(15);
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Volunteer Experience:", this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      resumeContent.additionalInfo.volunteer.forEach((vol) => {
        this.checkPageBreak(8);
        this.doc.text("• " + vol, this.margin, this.yPosition);
        this.yPosition += 6;
      });
      this.yPosition += 4;
    }
  }

  checkPageBreak(requiredSpace) {
    if (this.yPosition + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }
}

export default ResumeGenerator;
