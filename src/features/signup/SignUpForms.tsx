import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SignUpHeaders } from "./SignUpHeaders";
import { EntityChoice } from "./EntityChoice";
import { SignUpInputs } from "./SignUpInputs";
import { DarbeButton } from "../../components/buttons/DarbeButton";
import { SignUpSteps } from "./SignUpSteps";
import { SignUpState } from "./types";
import { useAppDispatch } from "../../services/hooks";
import { setUser } from "../users/userSlice";
import {
  useLazyCheckEmailAvailabilityQuery,
  useSubmitSignUpMutation,
} from "../../services/api/endpoints/signup/signup.api";

import styles from "./styles/signUpPage.module.css";

const INITIAL_STATE = {
  userType: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  city: "",
  zip: "",
  dob: {
    month: "",
    day: "",
    year: "",
  },
  causes: [],
  availability: {
    monday: {
      start: "",
      end: "",
      open: false,
    },
    tuesday: {
      start: "",
      end: "",
      open: false,
    },
    wednesday: {
      start: "",
      end: "",
      open: false,
    },
    thursday: {
      start: "",
      end: "",
      open: false,
    },
    friday: {
      start: "",
      end: "",
      open: false,
    },
    saturday: {
      start: "",
      end: "",
      open: false,
    },
    sunday: {
      start: "",
      end: "",
      open: false,
    },
  },
};

export const SignUpForms = () => {
  const [errorFound, setErrorFound] = useState(false);
  const [signUpStarted, setSignUpStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [signUpData, setSignUpData] = useState<SignUpState>(INITIAL_STATE);
  const [submitSignUp] = useSubmitSignUpMutation();
  const [checkEmailAvailability] = useLazyCheckEmailAvailabilityQuery();
  const [emailAvailabilityError, setEmailAvailabilityError] = useState<string | null>(
    null
  );
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleStart = (evt: React.MouseEvent<HTMLButtonElement>) => {
    // to coerce the innerText of the button as existing
    const target = evt.target as HTMLButtonElement;
    setSignUpData((state) => ({
      ...state,
      userType: target.innerText.toLowerCase(),
    }));
    setStep(2);
    setSignUpStarted(true);
  };

  const handleRestart = () => {
    setSignUpStarted(false);
    setSignUpData(INITIAL_STATE);
    setStep(1);
    setEmailAvailabilityError(null);
    setIsCheckingEmail(false);
  };

  const handleGoBack = () => {
    setStep((state) => state - 1);
    if (step === 2) {
      handleRestart();
    }
  };

  const handleGoNext = async () => {
    if (step === 2) {
      const emailToCheck = signUpData.email.trim();
      if (!emailToCheck) {
        setEmailAvailabilityError("Please enter a valid email address.");
        return;
      }

      setIsCheckingEmail(true);
      try {
        const result = await checkEmailAvailability(emailToCheck).unwrap();
        if (!result.available) {
          setEmailAvailabilityError(
            "An account with this email already exists. Please log in."
          );
          return;
        }
        setEmailAvailabilityError(null);
      } catch (error) {
        console.error(error);
        setEmailAvailabilityError(
          "Unable to verify email availability. Please try again."
        );
        return;
      } finally {
        setIsCheckingEmail(false);
      }
    }

    setStep((state) => state + 1);
    if (signUpData.userType === "individual" && step === 5) {
      submitSignUpData();
    }
    if (signUpData.userType !== "individual" && step === 4) {
      submitSignUpData();
    }
  };

  const submitSignUpData = async () => {
    try {
      if (signUpData.userType !== "individual") {
        delete signUpData.availability;
        delete signUpData.firstName;
        delete signUpData.lastName;
        delete signUpData.dob;
      }
      const result = await submitSignUp(signUpData).unwrap();

      dispatch(setUser(result.user));
      navigate("/home");
    } catch (error) {
      console.error(error);
      handleRestart();
    }
  };

  const getButtonText = useMemo(() => {
    if (signUpData.userType === "individual") {
      return step === 5 ? "Submit" : "Next";
    }
    return step === 4 ? "Submit" : "Next";
  }, [signUpData.userType, step]);

  const buttonText = getButtonText;

  const markError = (hasError: boolean) => {
    setErrorFound(hasError);
  };

  const clearEmailAvailabilityError = () => {
    if (emailAvailabilityError) {
      setEmailAvailabilityError(null);
    }
  };

  return (
    <div className={styles.signUpFormArea}>
      {!signUpStarted && (
        <>
          <SignUpHeaders />
          <EntityChoice onClick={handleStart} />
        </>
      )}
      {signUpStarted && (
        <>
          <SignUpSteps step={step} entityType={signUpData.userType} />
          <SignUpInputs
            step={step}
            data={signUpData}
            entityType={signUpData.userType}
            handleChange={setSignUpData}
            markError={markError}
            emailAvailabilityError={emailAvailabilityError}
            clearEmailAvailabilityError={clearEmailAvailabilityError}
          />
          <div className={styles.signUpButtonArea}>
            <DarbeButton
              buttonText="Previous"
              onClick={handleGoBack}
              darbeButtonType="secondaryButton"
            />
            <DarbeButton
              buttonText={buttonText}
              onClick={handleGoNext}
              isDisabled={errorFound || !!emailAvailabilityError || isCheckingEmail}
              darbeButtonType="primaryButton"
            />
          </div>
        </>
      )}
    </div>
  );
};
