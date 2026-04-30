import { useAppSelector } from "../../../services/hooks";
import { selectUserProfileInformation } from "../selectors";

// TODO: Split into two files in each folder
const useGetProfileInformation = () => {
  const profileInformation = useAppSelector(selectUserProfileInformation);
  return profileInformation;
};

export const useEditAboutInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editUserAboutState = {
    aboutMe: profileInformation?.aboutMe,
    volunteerReason: profileInformation?.volunteerReason,
  };
  const emptyVolunteerExperiences =
    profileInformation?.volunteerExperiences?.length === 0;

  // TYPE COERCIONS
  const entityName = emptyVolunteerExperiences
    ? ""
    : profileInformation?.volunteerExperiences?.[0].entityName;
  const totalHours = emptyVolunteerExperiences
    ? ""
    : profileInformation?.volunteerExperiences?.[0].totalHours;

  // This will break when we allow multiple volunteer experiences?
  const editUserVolunteerExperiencesState = {
    entityName: entityName ? entityName : "",
    totalHours: totalHours ? totalHours : 0,
    startDate: emptyVolunteerExperiences
      ? undefined
      : profileInformation?.volunteerExperiences?.[0].startDate,
    endDate: emptyVolunteerExperiences
      ? undefined
      : profileInformation?.volunteerExperiences?.[0].endDate,
  };

  return {
    editUserAboutState,
    editUserVolunteerExperiencesState,
  };
};

export const useEditProfileInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editProfileState = {
    state: profileInformation?.state,
    tagLine: profileInformation?.tagLine,
    title: profileInformation?.title,
    gender: profileInformation?.gender,
    race: profileInformation?.race,
    allergies: profileInformation?.allergies,
    nonprofitType: profileInformation?.nonprofitType,
    phoneNumber: profileInformation?.phoneNumber,
    website: profileInformation?.website,
    emergencyContact: {
      name: profileInformation?.emergencyContact?.name,
      phone: profileInformation?.emergencyContact?.phone,
      relation: profileInformation?.emergencyContact?.relation,
    },
    user: {
      firstName: profileInformation?.user?.firstName,
      lastName: profileInformation?.user?.lastName,
      city: profileInformation?.user?.city,
      zip: profileInformation?.user?.zip,
      dateOfBirth: profileInformation?.user?.dateOfBirth,
      nonprofitName: profileInformation?.user?.nonprofitName,
      organizationName: profileInformation?.user?.organizationName,
      ein: profileInformation?.user?.ein,
    },
  };

  return editProfileState;
};

export const useEditBackgroundInformation = () => {
  const profileInformation = useGetProfileInformation();

  const emptyJobExperiences = profileInformation?.jobExperiences?.length === 0;

  const jobTitle = emptyJobExperiences
    ? ""
    : profileInformation?.jobExperiences?.[0].jobTitle;
  const companyName = emptyJobExperiences
    ? ""
    : profileInformation?.jobExperiences?.[0].entityName;
  const occupationType = emptyJobExperiences
    ? ""
    : profileInformation?.jobExperiences?.[0].occupationType;

  // same as volunteer experiences, maybe brittle?
  const editJobExperienceState = {
    jobTitle: jobTitle ? jobTitle : "",
    entityName: companyName ? companyName : "",
    occupationType: occupationType ? occupationType : "",
    startDate: emptyJobExperiences
      ? undefined
      : profileInformation?.jobExperiences?.[0].startDate,
    endDate: emptyJobExperiences
      ? undefined
      : profileInformation?.jobExperiences?.[0].endDate,
  };

  const emptyEducationExperiences = profileInformation?.education?.length === 0;

  const schoolName = emptyEducationExperiences
    ? ""
    : profileInformation?.education?.[0].schoolName;
  const degree = emptyEducationExperiences
    ? ""
    : profileInformation?.education?.[0].degree;

  // same as volunteer experiences, maybe brittle?
  const editEducationExperienceState = {
    schoolName: schoolName ? schoolName : "",
    degree: degree ? degree : "",
    startDate: emptyEducationExperiences
      ? undefined
      : profileInformation?.education?.[0].startDate,
    endDate: emptyEducationExperiences
      ? undefined
      : profileInformation?.education?.[0].endDate,
  };

  return {
    editJobExperienceState,
    editEducationExperienceState,
  };
};

export const useEditMilitaryInformation = () => {
  const profileInformation = useGetProfileInformation();

  const emptyMilitaryService =
    profileInformation?.militaryService?.length === 0;

  const militaryBranch = emptyMilitaryService
    ? undefined
    : profileInformation?.militaryService?.[0].branch;
  const militaryRank = emptyMilitaryService
    ? ""
    : profileInformation?.militaryService?.[0].rank;
  const militaryStatus = emptyMilitaryService
    ? ""
    : profileInformation?.militaryService?.[0].status;

  const editMilitaryState = {
    branch: militaryBranch ?? undefined,
    rank: militaryRank ? militaryRank : "",
    status: militaryStatus ? militaryStatus : "",
  };

  return {
    editMilitaryState,
  };
};

// TODO: Replicate this pattern for the above job, education, etc when we allow more than one
// TODO: Make this a generic hook to be more DRY
export const useEditLicenseInformation = (id: string | undefined) => {
  const profileInformation = useGetProfileInformation();

  const emptyLicenses = profileInformation?.licenses?.length === 0;

  if (emptyLicenses) {
    return {
      editLicenseState: {
        licenseName: "",
        licenseIssuer: "",
        issueDate: undefined,
        expirationDate: undefined,
        doesNotExpire: false,
      },
    };
  }
  const licenseEditing = profileInformation?.licenses?.find(
    (license) => license._id === id
  );

  const issueDate = licenseEditing?.issueDate;
  const expirationDate = licenseEditing?.expirationDate;
  const doesNotExpire = licenseEditing?.doesNotExpire;
  const licenseName = licenseEditing?.licenseName;
  const licenseIssuer = licenseEditing?.licenseIssuer;

  const editLicenseState = {
    licenseName: licenseName,
    licenseIssuer: licenseIssuer,
    issueDate: issueDate,
    expirationDate: expirationDate,
    doesNotExpire: doesNotExpire,
  };

  return {
    editLicenseState,
  };
};

export const useEditSkillsInformation = (id: string | undefined) => {
  const profileInformation = useGetProfileInformation();

  const emptySkills = profileInformation?.skills?.length === 0;

  if (emptySkills) {
    return {
      editSkillState: {
        skillName: "",
      },
    };
  }

  const editSkillState = profileInformation?.skills?.find(
    (skill) => skill._id === id
  );

  return {
    editSkillState,
  };
};

export const useEditOrganizationInformation = (id: string | undefined) => {
  const profileInformation = useGetProfileInformation();

  const emptyOrganizations = profileInformation?.organizations?.length === 0;

  if (emptyOrganizations || !id) {
    return {
      editOrganizationState: {
        organizationName: "",
        position: "",
        startDate: undefined,
        endDate: undefined,
        parentOrganization: undefined,
      },
    };
  }

  const organizationEditing = profileInformation?.organizations?.find(
    (organization) =>
      organization._id === id ||
      (organization as typeof organization & { id?: string }).id === id
  );

  const startDate = organizationEditing?.startDate;
  const endDate = organizationEditing?.endDate;
  const organizationName = organizationEditing?.organizationName;
  const position = organizationEditing?.position;
  const parentOrganization = organizationEditing?.parentOrganization

  const editOrganizationState = {
    organizationName: organizationName,
    position: position,
    startDate: startDate,
    endDate: endDate,
    parentOrganization: parentOrganization,
    }

  return {
    editOrganizationState,
  };
};


export const useEditAvailabilityInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editUserAvailabilityState = {
    ...profileInformation?.user?.availability
  };

  return {
    editUserAvailabilityState,
  };
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ //
// Entity specific hooks that don't fit the above pattern //

export const useEditEntityProfileInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editEntityProfileState = {
    nonprofitName:
      profileInformation?.nonprofitName ||
      profileInformation?.user?.nonprofitName,
    organizationName: profileInformation?.organizationName,
    parentEntity: profileInformation?.parentEntity
      ? profileInformation?.parentEntity
      : undefined,
    zip: profileInformation?.user?.zip,
    address: profileInformation?.address,
    ein: profileInformation?.user?.ein,
    city: profileInformation?.user?.city,
    state: profileInformation?.state,
    nonprofitType: profileInformation?.nonprofitType,
    phoneNumber: profileInformation?.phoneNumber,
    associatedEntity: profileInformation?.associatedEntity
      ? profileInformation?.associatedEntity
      : undefined,
    website: profileInformation?.website,
    tagLine: profileInformation?.tagLine,
  };

  return { editEntityProfileState };
};

export const useEditEntityAboutInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editEntityAboutState = {
    aboutUs: profileInformation?.aboutUs,
  };

  return { editEntityAboutState };
};

export const useEditEntityValuesInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editEntityValuesState = {
    motto: profileInformation?.motto,
    mission: profileInformation?.mission,
    values: profileInformation?.values,
  };

  return { editEntityValuesState };
};

export const useEditEntityProgramsInformation = () => {
  const profileInformation = useGetProfileInformation();

  const editEntityProgramsState = {
    programs: profileInformation?.programs,
  };

  return { editEntityProgramsState };
};
