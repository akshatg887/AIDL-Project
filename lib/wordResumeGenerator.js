import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

export class WordResumeGenerator {
  constructor() {
    this.doc = null;
  }

  generate(resumeContent) {
    const sections = [];

    // Header with name and contact info
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeContent.personalInfo.name.toUpperCase(),
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Headline
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeContent.personalInfo.headline,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Location
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeContent.personalInfo.location,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Professional Summary
    if (resumeContent.summary) {
      sections.push(this.createSectionHeader("PROFESSIONAL SUMMARY"));
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeContent.summary,
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Skills Section (separate technical and professional)
    if (resumeContent.skills && resumeContent.skills.length > 0) {
      sections.push(this.createSectionHeader("TECHNICAL SKILLS"));
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeContent.skills.join(", "),
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Soft Skills
    if (resumeContent.softSkills && resumeContent.softSkills.length > 0) {
      sections.push(this.createSectionHeader("PROFESSIONAL SKILLS"));
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeContent.softSkills.join(", "),
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Projects
    if (resumeContent.projects && resumeContent.projects.length > 0) {
      sections.push(this.createSectionHeader("KEY PROJECTS"));
      resumeContent.projects.forEach((project) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
            bullet: {
              level: 0,
            },
          })
        );
      });
      sections.push(new Paragraph({ spacing: { after: 200 } }));
    }

    // Experience
    if (resumeContent.experience && resumeContent.experience.length > 0) {
      sections.push(this.createSectionHeader("PROFESSIONAL EXPERIENCE"));
      resumeContent.experience.forEach((exp) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
            bullet: {
              level: 0,
            },
          })
        );
      });
      sections.push(new Paragraph({ spacing: { after: 200 } }));
    }

    // Education
    if (resumeContent.education && resumeContent.education.length > 0) {
      sections.push(this.createSectionHeader("EDUCATION"));
      resumeContent.education.forEach((edu) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
            bullet: {
              level: 0,
            },
          })
        );
      });
      sections.push(new Paragraph({ spacing: { after: 200 } }));
    }

    // Additional Information
    const hasAdditionalInfo =
      (resumeContent.additionalInfo?.languages || resumeContent.languages)
        ?.length > 0 ||
      (
        resumeContent.additionalInfo?.certifications ||
        resumeContent.certifications
      )?.length > 0 ||
      resumeContent.additionalInfo?.awards?.length > 0 ||
      resumeContent.additionalInfo?.volunteer?.length > 0;

    if (hasAdditionalInfo) {
      sections.push(this.createSectionHeader("ADDITIONAL INFORMATION"));

      // Languages
      const languages =
        resumeContent.additionalInfo?.languages || resumeContent.languages;
      if (languages && languages.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Languages: ",
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: languages.join(", "),
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }

      // Certifications
      const certifications =
        resumeContent.additionalInfo?.certifications ||
        resumeContent.certifications;
      if (certifications && certifications.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Certifications:",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        certifications.forEach((cert) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cert,
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
              bullet: {
                level: 0,
              },
            })
          );
        });
      }

      // Awards
      if (resumeContent.additionalInfo?.awards?.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Awards & Honors:",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        resumeContent.additionalInfo.awards.forEach((award) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: award,
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
              bullet: {
                level: 0,
              },
            })
          );
        });
      }

      // Volunteer Experience
      if (resumeContent.additionalInfo?.volunteer?.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Volunteer Experience:",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        resumeContent.additionalInfo.volunteer.forEach((vol) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: vol,
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
              bullet: {
                level: 0,
              },
            })
          );
        });
      }

      sections.push(new Paragraph({ spacing: { after: 200 } }));
    }

    this.doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    return Packer.toBuffer(this.doc);
  }

  createSectionHeader(title) {
    return new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 26,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      border: {
        bottom: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    });
  }
}

export default WordResumeGenerator;
