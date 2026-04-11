import hands from "/svgs/common/hands.svg";
import worldLove from "/svgs/common/worldLove.svg";
import unity from "/svgs/common/unity.svg";
import worldLocation from "/svgs/common/worldLocation.svg";
import handShake from "/svgs/common/handShake.svg";
import useScreenWidthHook from "../../../utils/commonHooks/UseScreenWidth";

import styles from "../styles/landingComponents.module.css";

export const FAQ = () => {
  const { isDesktop } = useScreenWidthHook();
  const className = isDesktop
    ? styles.faqLandingQuestionsDesktop
    : styles.faqLandingQuestions;
  const reverseClassName = isDesktop
    ? styles.faqLandingQuestionsDesktopReverse
    : styles.faqLandingQuestions;

  return (
    <div className={styles.faqLanding} id="faq">
      <div className={styles.faqHeaderText}>
        <span className={styles.blueActionHeader}>We Are Here To Help</span>
        <span className={styles.faqHeaderHeadline}>
          Frequently Asked Questions
        </span>
      </div>
      <div className={reverseClassName}>
        <img src={hands} alt="hands Svg" />
        <div className={styles.faqQaCard}>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqQRegularText}>
              <span className={styles.faqQBlueText}>Q : </span> What is Darbe
            </span>
          </div>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqAnswerText}>
              <span className={styles.faqQBlueText}>A : </span>
              We are a free social networking platform that connects volunteers,
              donors, and fundraisers to charities and nonprofits in their local
              communities. Our mission is to build a better way to do good!
            </span>
          </div>
        </div>
      </div>
      <div className={className}>
        <img src={worldLove} alt="world love Svg" />
        <div className={styles.faqQaCard}>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqQRegularText}>
              <span className={styles.faqQBlueText}>Q : </span> How Does Darbe
              Make Philanthropy Better?
            </span>
          </div>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqAnswerText}>
              <span className={styles.faqQBlueText}>A : </span>
              We are the one-stop-shop for philanthropy. We leverage modern
              technology on an engaging social platform. This allows volunteers,
              donors, nonprofits, and organizations to connect and create long
              lasting relationships!
            </span>
          </div>
        </div>
      </div>
      <div className={reverseClassName}>
        <img src={unity} alt="unity Svg" />
        <div className={styles.faqQaCard}>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqQRegularText}>
              <span className={styles.faqQBlueText}>Q : </span> Who Is Darbe
              For?
            </span>
          </div>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqAnswerText}>
              <span className={styles.faqQBlueText}>A : </span>
              For <a href="/signup">Individuals</a> who want to connect with
              causes they are passionate about around their own schedule to
              create long lasting impact in their local community.
            </span>
          </div>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqAnswerText}>
              <span className={styles.faqQBlueText}>A : </span>
              For <a href="/signup">Organizations</a> of all sizes who want to
              be connected with highly impactful nonprofits on one social
              networking platform. This allows meaningful engagement with
              members and purposeful impact in their community.
            </span>
          </div>
        </div>
      </div>
      <div className={className}>
        <img src={worldLocation} alt="world location Svg" />
        <div className={styles.faqQaCard}>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqQRegularText}>
              <span className={styles.faqQBlueText}>Q : </span> Where Is Darbe
              Based In?
            </span>
          </div>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqAnswerText}>
              <span className={styles.faqQBlueText}>A : </span>
              We are based in and will be beta tested in Houston Texas. Any
              inquiries from individuals/nonprofits/organizations can be emailed
              to: <a href="mailto: info@darbe.co">info@darbe.co</a>
            </span>
          </div>
        </div>
      </div>
      <div className={reverseClassName}>
        <img src={handShake} alt="handshake Svg" />
        <div className={styles.faqQaCard}>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqQRegularText}>
              <span className={styles.faqQBlueText}>Q : </span> Will Darbe Cost
              Anything?
            </span>
          </div>
          <div className={styles.faqQuestionText}>
            <span className={styles.faqAnswerText}>
              <span className={styles.faqQBlueText}>A : </span> Our platform is
              100% free to use
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
