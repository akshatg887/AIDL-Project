"use client";
import React, { useState } from "react";

const ResumePreview = ({ resumeContent, onEdit, onBack }) => {
  const [editedContent, setEditedContent] = useState(resumeContent);
  const [editingSection, setEditingSection] = useState(null);
  const [previewMode, setPreviewMode] = useState("formatted"); // "formatted" or "inline"
  const [isGenerating, setIsGenerating] = useState(false);

  const updateSection = (section, value) => {
    setEditedContent((prev) => ({
      ...prev,
      [section]: value,
    }));
    onEdit({
      ...editedContent,
      [section]: value,
    });
  };

  const updatePersonalInfo = (field, value) => {
    const newPersonalInfo = {
      ...editedContent.personalInfo,
      [field]: value,
    };
    setEditedContent((prev) => ({
      ...prev,
      personalInfo: newPersonalInfo,
    }));
    onEdit({
      ...editedContent,
      personalInfo: newPersonalInfo,
    });
  };

  const addItem = (section, newItem) => {
    const newArray = [...(editedContent[section] || []), newItem];
    updateSection(section, newArray);
  };

  const removeItem = (section, index) => {
    const newArray = editedContent[section].filter((_, i) => i !== index);
    updateSection(section, newArray);
  };

  const updateItem = (section, index, value) => {
    const newArray = [...editedContent[section]];
    newArray[index] = value;
    updateSection(section, newArray);
  };

  const handleDownload = async (format) => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeContent: editedContent,
          format: format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to generate ${format.toUpperCase()}: ${data.error}`);
        return;
      }

      // Download the file
      const fileBlob = new Blob(
        [Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0))],
        { type: data.mimeType }
      );

      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Error generating ${format}: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const InlineEditableText = ({
    value,
    onUpdate,
    multiline = false,
    placeholder = "Click to edit...",
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || "");

    const handleSave = () => {
      onUpdate(editValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(value || "");
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="relative">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 border-2 border-blue-500 rounded resize-none"
              rows={4}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 border-2 border-blue-500 rounded"
              autoFocus
            />
          )}
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer hover:bg-blue-50 p-2 rounded border-2 border-transparent hover:border-blue-200 transition-colors"
        title="Click to edit"
      >
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </div>
    );
  };

  const InlineEditableList = ({ items, onUpdate, sectionName }) => {
    const handleUpdateItem = (index, newValue) => {
      const newItems = [...items];
      newItems[index] = newValue;
      onUpdate(newItems);
    };

    const handleRemoveItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      onUpdate(newItems);
    };

    const handleAddItem = () => {
      const newItems = [...items, ""];
      onUpdate(newItems);
    };

    // Helper function to convert object to string for display
    const getDisplayValue = (item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        // Handle experience objects
        if (item.company || item.title || item.position) {
          return `${item.title || item.position || ""} ${
            item.company ? `at ${item.company}` : ""
          } ${item.duration ? `(${item.duration})` : ""} ${
            item.description ? `- ${item.description}` : ""
          }`.trim();
        }
        // Handle education objects
        if (item.school || item.institution || item.degree) {
          return `${item.degree || item.title || ""} ${
            item.school || item.institution || ""
          } ${item.year ? `(${item.year})` : ""} ${
            item.description ? `- ${item.description}` : ""
          }`.trim();
        }
        // Handle project objects
        if (item.name || item.title) {
          return `${item.title || item.name || ""} ${
            item.description ? `- ${item.description}` : ""
          } ${item.technologies ? `(${item.technologies})` : ""}`.trim();
        }
        // Handle other objects - convert to JSON or extract first meaningful value
        return Object.values(item).join(" ").trim() || JSON.stringify(item);
      }
      return String(item);
    };

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="flex-1">
              <InlineEditableText
                value={getDisplayValue(item)}
                onUpdate={(newValue) => handleUpdateItem(index, newValue)}
                multiline={true}
                placeholder={`Enter ${sectionName.toLowerCase()} item...`}
              />
            </div>
            <button
              onClick={() => handleRemoveItem(index)}
              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 mt-2"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          + Add {sectionName} Item
        </button>
      </div>
    );
  };

  // Formatted Resume Preview Component
  const FormattedResumePreview = () => (
    <div
      className="bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {editedContent.personalInfo?.name?.toUpperCase() || "YOUR NAME"}
        </h1>
        <h2 className="text-xl text-gray-700 mb-2">
          {editedContent.personalInfo?.headline || "Your Professional Title"}
        </h2>
        <p className="text-gray-600">
          {editedContent.personalInfo?.location || "Your Location"}
        </p>
      </div>

      {/* Professional Summary */}
      {editedContent.summary && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            PROFESSIONAL SUMMARY
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {editedContent.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {editedContent.skills && editedContent.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              TECHNICAL SKILLS
            </h3>
            <p className="text-gray-700">
              {editedContent.skills
                .map((skill) =>
                  typeof skill === "string"
                    ? skill
                    : typeof skill === "object" && skill !== null
                    ? skill.name || skill.title || String(skill)
                    : String(skill)
                )
                .join(", ")}
            </p>
          </div>
        )}

        {editedContent.softSkills && editedContent.softSkills.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              PROFESSIONAL SKILLS
            </h3>
            <p className="text-gray-700">
              {editedContent.softSkills
                .map((skill) =>
                  typeof skill === "string"
                    ? skill
                    : typeof skill === "object" && skill !== null
                    ? skill.name || skill.title || String(skill)
                    : String(skill)
                )
                .join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Projects */}
      {editedContent.projects && editedContent.projects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            KEY PROJECTS
          </h3>
          <div className="space-y-3">
            {editedContent.projects.map((project, index) => (
              <div key={index} className="text-gray-700">
                •{" "}
                {typeof project === "string"
                  ? project
                  : typeof project === "object" && project !== null
                  ? `${project.title || project.name || ""} ${
                      project.description ? `- ${project.description}` : ""
                    } ${
                      project.technologies ? `(${project.technologies})` : ""
                    }`.trim()
                  : String(project)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {editedContent.experience && editedContent.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            PROFESSIONAL EXPERIENCE
          </h3>
          <div className="space-y-3">
            {editedContent.experience.map((exp, index) => (
              <div key={index} className="text-gray-700">
                •{" "}
                {typeof exp === "string"
                  ? exp
                  : typeof exp === "object" && exp !== null
                  ? `${exp.title || exp.position || ""} ${
                      exp.company ? `at ${exp.company}` : ""
                    } ${exp.duration ? `(${exp.duration})` : ""} ${
                      exp.description ? `- ${exp.description}` : ""
                    }`.trim()
                  : String(exp)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {editedContent.education && editedContent.education.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            EDUCATION
          </h3>
          <div className="space-y-3">
            {editedContent.education.map((edu, index) => (
              <div key={index} className="text-gray-700">
                •{" "}
                {typeof edu === "string"
                  ? edu
                  : typeof edu === "object" && edu !== null
                  ? `${edu.degree || edu.title || ""} ${
                      edu.school || edu.institution || ""
                    } ${edu.year ? `(${edu.year})` : ""} ${
                      edu.description ? `- ${edu.description}` : ""
                    }`.trim()
                  : String(edu)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Information */}
      {(editedContent.additionalInfo?.languages?.length > 0 ||
        editedContent.additionalInfo?.certifications?.length > 0 ||
        editedContent.additionalInfo?.awards?.length > 0 ||
        editedContent.additionalInfo?.volunteer?.length > 0 ||
        editedContent.languages?.length > 0 ||
        editedContent.certifications?.length > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            ADDITIONAL INFORMATION
          </h3>

          {/* Languages */}
          {(editedContent.additionalInfo?.languages?.length > 0 ||
            editedContent.languages?.length > 0) && (
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800">Languages:</h4>
              <p className="text-gray-700">
                {(
                  editedContent.additionalInfo?.languages ||
                  editedContent.languages ||
                  []
                )
                  .map((lang) =>
                    typeof lang === "string"
                      ? lang
                      : typeof lang === "object" && lang !== null
                      ? lang.name || lang.language || String(lang)
                      : String(lang)
                  )
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Certifications */}
          {(editedContent.additionalInfo?.certifications?.length > 0 ||
            editedContent.certifications?.length > 0) && (
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800">Certifications:</h4>
              <div className="space-y-1">
                {(
                  editedContent.additionalInfo?.certifications ||
                  editedContent.certifications ||
                  []
                ).map((cert, index) => (
                  <div key={index} className="text-gray-700">
                    •{" "}
                    {typeof cert === "string"
                      ? cert
                      : typeof cert === "object" && cert !== null
                      ? cert.name ||
                        cert.title ||
                        cert.certification ||
                        String(cert)
                      : String(cert)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {editedContent.additionalInfo?.awards?.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800">Awards & Honors:</h4>
              <div className="space-y-1">
                {editedContent.additionalInfo.awards.map((award, index) => (
                  <div key={index} className="text-gray-700">
                    •{" "}
                    {typeof award === "string"
                      ? award
                      : typeof award === "object" && award !== null
                      ? award.name ||
                        award.title ||
                        award.award ||
                        String(award)
                      : String(award)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Work */}
          {editedContent.additionalInfo?.volunteer?.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800">
                Volunteer Experience:
              </h4>
              <div className="space-y-1">
                {editedContent.additionalInfo.volunteer.map((vol, index) => (
                  <div key={index} className="text-gray-700">
                    •{" "}
                    {typeof vol === "string"
                      ? vol
                      : typeof vol === "object" && vol !== null
                      ? `${vol.role || vol.title || ""} ${
                          vol.organization ? `at ${vol.organization}` : ""
                        } ${
                          vol.description ? `- ${vol.description}` : ""
                        }`.trim() || String(vol)
                      : String(vol)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Inline Editable Resume Component
  const InlineEditableResume = () => (
    <div
      className="bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          <InlineEditableText
            value={editedContent.personalInfo?.name?.toUpperCase()}
            onUpdate={(value) => updatePersonalInfo("name", value)}
            placeholder="YOUR NAME"
          />
        </div>
        <div className="text-xl text-gray-700 mb-2">
          <InlineEditableText
            value={editedContent.personalInfo?.headline}
            onUpdate={(value) => updatePersonalInfo("headline", value)}
            placeholder="Your Professional Title"
          />
        </div>
        <div className="text-gray-600">
          <InlineEditableText
            value={editedContent.personalInfo?.location}
            onUpdate={(value) => updatePersonalInfo("location", value)}
            placeholder="Your Location"
          />
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
          PROFESSIONAL SUMMARY
        </h3>
        <div className="text-gray-700 leading-relaxed">
          <InlineEditableText
            value={editedContent.summary}
            onUpdate={(value) => updateSection("summary", value)}
            multiline={true}
            placeholder="Enter your professional summary..."
          />
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            TECHNICAL SKILLS
          </h3>
          <InlineEditableList
            items={editedContent.skills || []}
            onUpdate={(newItems) => updateSection("skills", newItems)}
            sectionName="Technical Skill"
          />
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            PROFESSIONAL SKILLS
          </h3>
          <InlineEditableList
            items={editedContent.softSkills || []}
            onUpdate={(newItems) => updateSection("softSkills", newItems)}
            sectionName="Professional Skill"
          />
        </div>
      </div>

      {/* Projects */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
          KEY PROJECTS
        </h3>
        <InlineEditableList
          items={editedContent.projects || []}
          onUpdate={(newItems) => updateSection("projects", newItems)}
          sectionName="Project"
        />
      </div>

      {/* Experience */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
          PROFESSIONAL EXPERIENCE
        </h3>
        <InlineEditableList
          items={editedContent.experience || []}
          onUpdate={(newItems) => updateSection("experience", newItems)}
          sectionName="Experience"
        />
      </div>

      {/* Education */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
          EDUCATION
        </h3>
        <InlineEditableList
          items={editedContent.education || []}
          onUpdate={(newItems) => updateSection("education", newItems)}
          sectionName="Education"
        />
      </div>

      {/* Additional Information */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
          ADDITIONAL INFORMATION
        </h3>

        {/* Languages */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Languages:</h4>
          <InlineEditableList
            items={
              editedContent.additionalInfo?.languages ||
              editedContent.languages ||
              []
            }
            onUpdate={(newItems) => {
              if (editedContent.additionalInfo) {
                updateSection("additionalInfo", {
                  ...editedContent.additionalInfo,
                  languages: newItems,
                });
              } else {
                updateSection("languages", newItems);
              }
            }}
            sectionName="Language"
          />
        </div>

        {/* Certifications */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Certifications:</h4>
          <InlineEditableList
            items={
              editedContent.additionalInfo?.certifications ||
              editedContent.certifications ||
              []
            }
            onUpdate={(newItems) => {
              if (editedContent.additionalInfo) {
                updateSection("additionalInfo", {
                  ...editedContent.additionalInfo,
                  certifications: newItems,
                });
              } else {
                updateSection("certifications", newItems);
              }
            }}
            sectionName="Certification"
          />
        </div>

        {/* Awards */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Awards & Honors:</h4>
          <InlineEditableList
            items={editedContent.additionalInfo?.awards || []}
            onUpdate={(newItems) =>
              updateSection("additionalInfo", {
                ...editedContent.additionalInfo,
                awards: newItems,
              })
            }
            sectionName="Award"
          />
        </div>

        {/* Volunteer Work */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            Volunteer Experience:
          </h4>
          <InlineEditableList
            items={editedContent.additionalInfo?.volunteer || []}
            onUpdate={(newItems) =>
              updateSection("additionalInfo", {
                ...editedContent.additionalInfo,
                volunteer: newItems,
              })
            }
            sectionName="Volunteer Experience"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Resume Preview & Editor
        </h1>
        <p className="text-gray-600">
          Review and edit your resume before downloading
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="bg-white rounded-lg p-1 shadow-md">
          <button
            onClick={() => setPreviewMode("formatted")}
            className={`px-4 py-2 rounded ${
              previewMode === "formatted"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📄 Formatted View
          </button>
          <button
            onClick={() => setPreviewMode("inline")}
            className={`px-4 py-2 rounded ${
              previewMode === "inline"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ✏️ Inline Editor
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-center space-x-4">
        <button
          onClick={() => handleDownload("pdf")}
          disabled={isGenerating}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          📄 Download PDF
        </button>
        <button
          onClick={() => handleDownload("word")}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          📝 Download Word
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Form
        </button>
      </div>

      {/* Help Text for Inline Editor */}
      {previewMode === "inline" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>Inline Editor Mode:</strong> Click on any text to edit it
            directly. Changes are saved automatically and will appear exactly as
            shown in your downloaded resume.
          </p>
        </div>
      )}

      {/* Resume Preview */}
      {previewMode === "formatted" ? (
        <FormattedResumePreview />
      ) : (
        <InlineEditableResume />
      )}

      {/* Footer Actions */}
      <div className="mt-8 text-center space-x-4">
        <button
          onClick={() => handleDownload("pdf")}
          disabled={isGenerating}
          className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isGenerating ? "Generating..." : "📄 Download PDF"}
        </button>
        <button
          onClick={() => handleDownload("word")}
          disabled={isGenerating}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isGenerating ? "Generating..." : "📝 Download Word"}
        </button>
      </div>
    </div>
  );
};

export default ResumePreview;
