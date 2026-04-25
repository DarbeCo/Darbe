import { LandingNavBar } from "../../layout/landing/components/LandingNavBar";
import { Footer } from "../../layout/landing/components/Footer";

import styles from "./contactUs.module.css";

const contactCards = [
  {
    title: "General Questions",
    description:
      "Reach out if you want help understanding Darbe, creating an account, or getting started with volunteering, rosters, and events.",
    actionLabel: "info@darbe.co",
    actionHref: "mailto:info@darbe.co",
  },
  {
    title: "Partnerships",
    description:
      "We would love to hear from nonprofits, organizations, and community teams interested in using Darbe to coordinate volunteers and grow impact.",
    actionLabel: "partnerships@darbe.co",
    actionHref: "mailto:partnerships@darbe.co",
  },
  {
    title: "Support",
    description:
      "If something is not working the way it should, send us a note with what happened and we will help you sort it out.",
    actionLabel: "support@darbe.co",
    actionHref: "mailto:support@darbe.co",
  },
];

export const ContactUs = () => {
  return (
    <div className={styles.contactPage}>
      <LandingNavBar />
      <main className={styles.contactMain}>
        <section className={styles.contactHero}>
          <p className={styles.contactEyebrow}>Darbe Support</p>
          <h1 className={styles.contactTitle}>Contact Us</h1>
          <p className={styles.contactSummary}>
            If you have questions, need support, or want to talk through how
            Darbe can help your community, we are here for it.
          </p>
        </section>

        <section className={styles.contactGrid}>
          <article className={styles.contactCard}>
            <h2>How To Reach Us</h2>
            <p>
              The fastest way to get in touch is by email. Share a little about
              what you need, and we will make sure it gets to the right place.
            </p>
            <div className={styles.contactPrimary}>
              <span className={styles.contactPrimaryLabel}>Primary Email</span>
              <a href="mailto:info@darbe.co">info@darbe.co</a>
            </div>
            <div className={styles.contactHours}>
              <span>Response Window</span>
              <strong>Monday through Friday, 9:00 AM to 5:00 PM CT</strong>
            </div>
          </article>

          <article className={styles.contactCard}>
            <h2>What To Include</h2>
            <ul className={styles.contactList}>
              <li>Your name and the best email to reply to</li>
              <li>The type of account you are using</li>
              <li>A short description of the question or issue</li>
              <li>Any relevant event, roster, or profile details</li>
            </ul>
          </article>
        </section>

        <section className={styles.contactCardSection}>
          {contactCards.map((card) => (
            <article className={styles.contactCard} key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <a className={styles.contactAction} href={card.actionHref}>
                {card.actionLabel}
              </a>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};
