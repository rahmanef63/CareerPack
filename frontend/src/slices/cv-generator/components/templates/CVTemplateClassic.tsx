import Image from "next/image";
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar } from "lucide-react";
import type { CVData } from "../../types";
import { calcAge, formatMonthYear, tidyUrl, yearOnly } from "../../utils/format";

interface Props {
  cv: CVData;
  photoUrl: string;
}

/**
 * Klasik Eksekutif — sidebar foto + serif headline + accent rule.
 * Indonesian convention: photo, age, full date range. Rendered light-
 * mode only; theme-agnostic so the PDF is identical for every user.
 */
export function CVTemplateClassic({ cv, photoUrl }: Props) {
  const { profile, displayPrefs } = cv;
  const age = displayPrefs.showAge ? calcAge(profile.dateOfBirth) : null;

  return (
    <div
      className="bg-white text-[#1a1a1a]"
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        width: "210mm",
        padding: "16mm 14mm",
        fontSize: "10pt",
        lineHeight: 1.5,
      }}
    >
      <header
        className="flex items-start gap-6 border-b-2 pb-5"
        style={{ borderColor: "#0d4f3c" }}
      >
        {displayPrefs.showPicture && photoUrl && (
          <Image
            src={photoUrl}
            alt={profile.name}
            width={120}
            height={160}
            unoptimized
            className="rounded-sm object-cover"
            style={{ width: "30mm", height: "40mm", border: "1px solid #d4d4d4" }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h1
            className="font-display"
            style={{
              fontSize: "26pt",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "#0d4f3c",
              fontWeight: 600,
            }}
          >
            {profile.name || "Nama Lengkap"}
          </h1>
          {profile.targetIndustry && (
            <p style={{ fontSize: "11pt", color: "#525252", marginTop: "2mm" }}>
              {profile.targetIndustry}
            </p>
          )}
          <div
            className="flex flex-wrap gap-x-4 gap-y-1"
            style={{ marginTop: "3mm", fontSize: "9pt", color: "#404040" }}
          >
            {profile.email && (
              <span className="inline-flex items-center gap-1">
                <Mail style={{ width: "3mm", height: "3mm" }} />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone style={{ width: "3mm", height: "3mm" }} />
                {profile.phone}
              </span>
            )}
            {profile.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin style={{ width: "3mm", height: "3mm" }} />
                {profile.location}
              </span>
            )}
            {age !== null && (
              <span className="inline-flex items-center gap-1">
                <Calendar style={{ width: "3mm", height: "3mm" }} />
                {age} tahun
              </span>
            )}
            {profile.linkedin && (
              <span className="inline-flex items-center gap-1">
                <Linkedin style={{ width: "3mm", height: "3mm" }} />
                {tidyUrl(profile.linkedin)}
              </span>
            )}
            {profile.portfolio && (
              <span className="inline-flex items-center gap-1">
                <Globe style={{ width: "3mm", height: "3mm" }} />
                {tidyUrl(profile.portfolio)}
              </span>
            )}
          </div>
        </div>
      </header>

      {profile.summary && (
        <Section title="Ringkasan Profesional">
          <p style={{ textAlign: "justify" }}>{profile.summary}</p>
        </Section>
      )}

      {cv.experience.length > 0 && (
        <Section title="Pengalaman Kerja">
          {cv.experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: "4mm" }}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 style={{ fontWeight: 600, fontSize: "10.5pt" }}>
                  {exp.position || "Posisi"}
                  {exp.company && (
                    <span style={{ color: "#525252", fontWeight: 400 }}>
                      {" — "}
                      {exp.company}
                    </span>
                  )}
                </h3>
                <span style={{ fontSize: "9pt", color: "#737373", whiteSpace: "nowrap" }}>
                  {formatMonthYear(exp.startDate)} – {exp.endDate ? formatMonthYear(exp.endDate) : "Sekarang"}
                </span>
              </div>
              {exp.description && (
                <p style={{ marginTop: "1mm", textAlign: "justify" }}>{exp.description}</p>
              )}
              {exp.achievements.length > 0 && (
                <ul style={{ marginTop: "1.5mm", paddingLeft: "5mm", listStyle: "disc" }}>
                  {exp.achievements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title="Pendidikan">
          {cv.education.map((edu) => {
            const range = displayPrefs.showGraduationYear
              ? `${yearOnly(edu.startDate)} – ${yearOnly(edu.endDate) || "Sekarang"}`
              : "";
            return (
              <div key={edu.id} style={{ marginBottom: "3mm" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 style={{ fontWeight: 600, fontSize: "10.5pt" }}>
                    {edu.degree}
                    {edu.fieldOfStudy && ` ${edu.fieldOfStudy}`}
                  </h3>
                  {range && (
                    <span style={{ fontSize: "9pt", color: "#737373", whiteSpace: "nowrap" }}>
                      {range}
                    </span>
                  )}
                </div>
                <p style={{ color: "#525252" }}>
                  {edu.institution}
                  {edu.gpa && ` · IPK ${edu.gpa}`}
                </p>
              </div>
            );
          })}
        </Section>
      )}

      {cv.skills.length > 0 && (
        <Section title="Keterampilan">
          <div className="flex flex-wrap" style={{ gap: "1.5mm" }}>
            {cv.skills.map((s) => (
              <span
                key={s.id}
                style={{
                  border: "1px solid #d4d4d4",
                  borderRadius: "1mm",
                  padding: "0.8mm 2.2mm",
                  fontSize: "9pt",
                  color: "#262626",
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {cv.certifications.length > 0 && (
        <Section title="Sertifikasi">
          {cv.certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between" style={{ marginBottom: "1.5mm" }}>
              <span>
                <strong>{cert.name}</strong>
                {cert.issuer && <span style={{ color: "#525252" }}> — {cert.issuer}</span>}
              </span>
              <span style={{ color: "#737373", fontSize: "9pt" }}>
                {formatMonthYear(cert.date)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {cv.projects.length > 0 && (
        <Section title="Proyek">
          {cv.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: "3mm" }}>
              <h3 style={{ fontWeight: 600, fontSize: "10.5pt" }}>{proj.name}</h3>
              {proj.description && (
                <p style={{ marginTop: "0.5mm", textAlign: "justify" }}>{proj.description}</p>
              )}
              {proj.link && (
                <p style={{ marginTop: "0.5mm", color: "#0d4f3c", fontSize: "9pt" }}>
                  {tidyUrl(proj.link)}
                </p>
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
    <section style={{ marginTop: "6mm" }}>
      <h2
        style={{
          fontSize: "11pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#0d4f3c",
          borderBottom: "1px solid #d4d4d4",
          paddingBottom: "1mm",
          marginBottom: "2.5mm",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
