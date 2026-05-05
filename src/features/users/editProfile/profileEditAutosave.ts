type ProfileEditAutosaveHandler = () => Promise<boolean | void> | boolean | void;

let activeProfileEditAutosaveHandler:
  | ProfileEditAutosaveHandler
  | undefined;

export const registerProfileEditAutosave = (
  handler: ProfileEditAutosaveHandler
) => {
  activeProfileEditAutosaveHandler = handler;

  return () => {
    if (activeProfileEditAutosaveHandler === handler) {
      activeProfileEditAutosaveHandler = undefined;
    }
  };
};

export const runProfileEditAutosave = async () => {
  if (!activeProfileEditAutosaveHandler) {
    return true;
  }

  const result = await activeProfileEditAutosaveHandler();

  return result !== false;
};
