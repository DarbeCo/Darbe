import { LandingNavBar } from "../../layout/landing/components/LandingNavBar";
import { Footer } from "../../layout/landing/components/Footer";

import styles from "./privacyPolicy.module.css";

const policySections = [
  {
    title: "Information We Collect",
    body: [
      "We may collect information you provide directly to Darbe, including your name, email address, profile details, nonprofit or organization details, messages, uploaded photos, documents, and event information you choose to share through the platform.",
      "We may also collect activity and device information such as log data, browser type, IP address, approximate location based on the information you provide, and how you interact with the site and app features.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use personal information to operate Darbe, create and manage user accounts, connect volunteers with nonprofits and organizations, support event participation, improve the platform, respond to requests, and protect the security of our services.",
      "We may also use information to send service messages, product updates, policy changes, and other communications related to your use of Darbe.",
    ],
  },
  {
    title: "How Information Is Shared",
    body: [
      "We may share information with other users where needed to power core platform features, such as profiles, events, rosters, volunteering, messaging, and community interactions.",
      "We may share information with service providers that help us host, secure, maintain, analyze, or support Darbe. We may also disclose information when required by law, to enforce our terms, or to protect the rights, safety, and integrity of Darbe and its users.",
      "We do not sell personal information in exchange for money.",
    ],
  },
  {
    title: "Photos, Files, and User Content",
    body: [
      "If you upload profile photos, cover photos, waivers, documents, event materials, or other content, that information may be stored and processed to provide the relevant feature. Content you choose to post or share through Darbe may be visible to other users depending on the feature and your activity.",
    ],
  },
  {
    title: "Cookies and Similar Technologies",
    body: [
      "Darbe may use cookies, local storage, and similar technologies to keep you signed in, remember preferences, improve performance, understand usage, and support core site functionality.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "We retain information for as long as reasonably necessary to provide the service, maintain records, resolve disputes, enforce agreements, and meet legal or operational obligations. Retention periods may vary depending on the type of information and how it is used.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You may update certain account and profile information through your Darbe account. You may also choose not to provide some information, but that may limit your ability to use certain features.",
      "If you would like to request account-related privacy help, you may contact us using the information below.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards designed to protect personal information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "Children's Privacy",
    body: [
      "Darbe is not intended for children under 13, and we do not knowingly collect personal information directly from children under 13 without appropriate authorization where required by law.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. If we make material changes, we may revise the effective date and provide notice through the platform or by other appropriate means.",
    ],
  },
];

export const PrivacyPolicy = () => {
  return (
    <div className={styles.privacyPage}>
      <LandingNavBar />
      <main className={styles.privacyMain}>
        <section className={styles.privacyHero}>
          <p className={styles.privacyEyebrow}>Darbe Legal</p>
          <h1 className={styles.privacyTitle}>Privacy Policy</h1>
          <p className={styles.privacySubtitle}>
            Effective date: April 24, 2026
          </p>
          <p className={styles.privacySummary}>
            This Privacy Policy explains how Darbe collects, uses, stores, and
            shares information when you use our website, mobile experiences, and
            related services.
          </p>
        </section>

        <section className={styles.privacyCard}>
          <h2>Overview</h2>
          <p>
            Darbe is designed to connect individuals, nonprofits, and
            organizations around volunteering, events, rosters, messaging, and
            community engagement. To provide those services, we collect and use
            certain personal information as described below.
          </p>
        </section>

        <section className={styles.privacySectionGrid}>
          {policySections.map((section) => (
            <article className={styles.privacyCard} key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </section>

        <section className={styles.privacyCard}>
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or would like to
            make a privacy-related request, please contact us at{" "}
            <a href="mailto:info@darbe.co">info@darbe.co</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};
