import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";

export const MAX_DECLINED = 300;

export const suggestionKey = (name: string) => name.trim().toLowerCase().slice(0, 255);

export const hideJoinCode = <T extends Pick<UserEntity, "emailConfirmedAt" | "household">>(user: T): T =>
  user.emailConfirmedAt || !user.household
    ? user
    : { ...user, household: { ...user.household, joinCode: "" } };

export const visibleJoinCode = (
  user: Pick<UserEntity, "emailConfirmedAt">,
  household: Pick<HouseholdEntity, "joinCode">,
) => (user.emailConfirmedAt ? household.joinCode : "");
