import Image from "next/image";
import type { CVData } from "../../types";
import { calcAge, formatMonthYear, tidyUrl, yearOnly } from "../../utils/format";

interface Props {
  cv: CVData;
  photoUrl: string;
}

const ACCENT = "#1d4ed8";
const ACCENT_SOFT = "#eff6ff";

/**
 * Modern Akzent — full-width brand band header, two-column body with
 * sidebar for skills/contact. Geometric sans across the board, subtle
 * accent strip on each section heading.
 */
export function CVTemplateModern({ cv, photoUrl }: Props) {
  const { profile, displayPrefs } = cv;
  const age = displayPrefs.showAge ? calcAge(profile.dateOfBirth) : null;

  return (
    <div
      className="bg-white text-[#171717]"
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        width: "210mm",
        fontSize: "9.5pt",
        lineHeight: 1.5,
      }}
    >
      <header
        style={{
          background: ACCENT,
          color: "white",
          padding: "12mm 14mm",
          display: "flex",
          alignItems: "center",
          gap: "8mm",
        }}
      >
        {displayPrefs.showPicture && photoUrl && (
          <Image
            src={photoUrl}
            alt={profile.name}
            width={120}
            height={120}
            unoptimized
            style={{
              width: "26mm",
              height: "26mm",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,0.6)",
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: "24pt",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {profile.name || "Nama Lengkap"}
          </h1>
          {profile.targetIndustry && (
            <p style={{ fontSize: "11pt", color: "#dbeafe", marginTop: "1.5mm" }}>
              {profile.targetIndustry}
            </p>
          )}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "62mm 1fr",
          gap: "8mm",
          padding: "10mm 14mm",
        }}
      >
        <aside>
          <SidebarBlock title="Kontak">
            <div style={{ display: "grid", gap: "1.5mm", fontSize: "8.5pt", color: "#404040" }}>
              {profile.email && <span>{profile.email}</span>}
              {profile.phone && <span>{profile.phone}</span>}
              {profile.location && <span>{profile.location}</span>}
              {age !== null && <span>{age} tahun</span>}
              {profile.linkedin && <span>{tidyUrl(profile.linkedin)}</span>}
              {profile.portfolio && <span>{tidyUrl(profile.portfolio)}</span>}
            </div>
          </SidebarBlock>

          {cv.skills.length > 0 && (
            <SidebarBlock title="Keterampilan">
              <ul style={{ display: "grid", gap: "1.2mm", fontSize: "9pt" }}>
                {cv.skills.map((s) => (
                  <li key={s.id} style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
                    <span
                      style={{
                        width: "1.5mm",
                        height: "1.5mm",
                        borderRadius: "50%",
                        background: ACCENT,
                      }}
                    />
                    {s.name}
                  </li>
                ))}
              </ul>
            </SidebarBlock>
          )}

          {cv.certifications.length > 0 && (
            <SidebarBlock title="Sertifikasi">
              <ul style={{ display: "grid", gap: "2mm", fontSize: "8.5pt" }}>
                {cv.certifications.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong>
                    <div style={{ color: "#737373" }}>
                      {c.issuer}
                      {c.date && ` · ${formatMonthYear(c.date)}`}
                    </div>
                  </li>
                ))}
              </ul>
            </SidebarBlock>
          )}
        </aside>

        <main style={{ minWidth: 0 }}>
          {profile.summary && (
            <MainBlock title="Profil">
              <p style={{ textAlign: "justify" }}>{profile.summary}</p>
            </MainBlock>
          )}

          {cv.experience.length > 0 && (
            <MainBlock title="Pengalaman">
              <div style={{ display: "grid", gap: "4mm" }}>
                {cv.experience.map((exp) => (
                  <div key={exp.id} style={{ position: "relative", paddingLeft: "4mm" }}>
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "1.5mm",
                        width: "1.5mm",
                        height: "1.5mm",
                        borderRadius: "50%",
                        background: ACCENT,
                      }}
                    />
                    <h3 style={{ fontSize: "10.5pt", fontWeight: 600 }}>{exp.position}</h3>
                    <p style={{ color: ACCENT, fontWeight: 500, fontSize: "9.5pt" }}>
                      {exp.company}
                      <span style={{ color: "#737373", fontWeight: 400 }}>
                        {" · "}
                        {formatMonthYear(exp.startDate)} – {exp.endDate ? formatMonthYear(exp.endDate) : "Sekarang"}
                      </span>
                    </p>
                    {exp.description && (
                      <p style={{ marginTop: "1mm", textAlign: "justify" }}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </MainBlock>
          )}

          {cv.education.length > 0 && (
            <MainBlock title="Pendidikan">
              <div style={{ display: "grid", gap: "3mm" }}>
                {cv.education.map((edu) => {
                  const range = displayPrefs.showGraduationYear
                    ? `${yearOnly(edu.startDate)} – ${yearOnly(edu.endDate) || "Sekarang"}`
                    : "";
                  return (
                    <div key={edu.id}>
                      <h3 style={{ fontSize: "10.5pt", fontWeight: 600 }}>
                        {edu.degree}
                        {edu.fieldOfStudy && ` ${edu.fieldOfStudy}`}
                      </h3>
                      <p style={{ color: "#525252" }}>
                        {edu.institution}
                        {range && <span style={{ color: "#737373" }}> · {range}</span>}
                        {edu.gpa && ` · IPK ${edu.gpa}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </MainBlock>
          )}

          {cv.projects.length > 0 && (
            <MainBlock title="Proyek">
              <div style={{ display: "grid", gap: "3mm" }}>
                {cv.projects.map((proj) => (
                  <div key={proj.id}>
                    <h3 style={{ fontSize: "10.5pt", fontWeight: 600 }}>{proj.name}</h3>
                    {proj.description && (
                      <p style={{ marginTop: "0.5mm", textAlign: "justify" }}>{proj.description}</p>
                    )}
                    {proj.link && (
                      <p style={{ marginTop: "0.5mm", color: ACCENT, fontSize: "9pt" }}>
                        {tidyUrl(proj.link)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </MainBlock>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "5mm" }}>
      <h2
        style={{
          fontSize: "9pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: ACCENT,
          background: ACCENT_SOFT,
          padding: "1mm 2mm",
          marginBottom: "2mm",
          borderRadius: "1mm",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MainBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "5mm" }}>
      <h2
        style={{
          fontSize: "12pt",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "#171717",
          marginBottom: "2.5mm",
          paddingBottom: "1mm",
          borderBottom: `2px solid ${ACCENT}`,
          display: "inline-block",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
