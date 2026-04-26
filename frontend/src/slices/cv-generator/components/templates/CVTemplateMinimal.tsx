import type { CVData } from "../../types";
import { calcAge, formatMonthYear, tidyUrl, yearOnly } from "../../utils/format";

interface Props {
  cv: CVData;
}

/**
 * Minimal ATS — single column, pure black on white, no photo / accent.
 * Optimized for ATS scrapers: real headings, plain bullets, semantic
 * order (header → summary → experience → education → skills → other).
 * Default for international applications.
 */
export function CVTemplateMinimal({ cv }: Props) {
  const { profile, displayPrefs } = cv;
  const age = displayPrefs.showAge ? calcAge(profile.dateOfBirth) : null;

  return (
    <div
      className="bg-white text-black"
      style={{
        fontFamily: "var(--font-inter), Arial, sans-serif",
        width: "210mm",
        padding: "16mm 18mm",
        fontSize: "10pt",
        lineHeight: 1.45,
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "5mm" }}>
        <h1
          style={{
            fontSize: "20pt",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {profile.name || "Your Name"}
        </h1>
        <p
          style={{
            marginTop: "1.5mm",
            fontSize: "9.5pt",
            color: "#262626",
          }}
        >
          {[
            profile.email,
            profile.phone,
            profile.location,
            age !== null ? `${age} tahun` : null,
            tidyUrl(profile.linkedin),
            tidyUrl(profile.portfolio),
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </header>

      {profile.summary && (
        <Section title="Summary">
          <p style={{ textAlign: "justify" }}>{profile.summary}</p>
        </Section>
      )}

      {cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((exp) => (
            <article key={exp.id} style={{ marginBottom: "3.5mm" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm" }}>
                <strong style={{ fontSize: "10.5pt" }}>
                  {exp.position}
                  {exp.company && `, ${exp.company}`}
                </strong>
                <span style={{ fontSize: "9.5pt", whiteSpace: "nowrap" }}>
                  {formatMonthYear(exp.startDate)} – {exp.endDate ? formatMonthYear(exp.endDate) : "Present"}
                </span>
              </div>
              {exp.description && (
                <p style={{ marginTop: "1mm", textAlign: "justify" }}>{exp.description}</p>
              )}
              {exp.achievements.length > 0 && (
                <ul style={{ marginTop: "1mm", paddingLeft: "5mm", listStyle: "disc" }}>
                  {exp.achievements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu) => {
            const range = displayPrefs.showGraduationYear
              ? `${yearOnly(edu.startDate)} – ${yearOnly(edu.endDate) || "Present"}`
              : "";
            return (
              <div key={edu.id} style={{ marginBottom: "2.5mm" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm" }}>
                  <strong>
                    {edu.degree}
                    {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    {edu.institution && `, ${edu.institution}`}
                  </strong>
                  {range && <span style={{ fontSize: "9.5pt" }}>{range}</span>}
                </div>
                {edu.gpa && (
                  <p style={{ fontSize: "9.5pt", color: "#404040" }}>GPA: {edu.gpa}</p>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {cv.skills.length > 0 && (
        <Section title="Skills">
          <p>{cv.skills.map((s) => s.name).join(" · ")}</p>
        </Section>
      )}

      {cv.certifications.length > 0 && (
        <Section title="Certifications">
          <ul style={{ paddingLeft: "5mm", listStyle: "disc" }}>
            {cv.certifications.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>
                {c.issuer && `, ${c.issuer}`}
                {c.date && ` (${formatMonthYear(c.date)})`}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cv.projects.length > 0 && (
        <Section title="Projects">
          {cv.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: "2.5mm" }}>
              <strong>{proj.name}</strong>
              {proj.link && (
                <span style={{ fontSize: "9.5pt", color: "#404040" }}>
                  {" · "}
                  {tidyUrl(proj.link)}
                </span>
              )}
              {proj.description && (
                <p style={{ marginTop: "0.5mm", textAlign: "justify" }}>{proj.description}</p>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "4mm" }}>
      <h2
        style={{
          fontSize: "10.5pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          borderBottom: "1px solid black",
          paddingBottom: "0.8mm",
          marginBottom: "2mm",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
