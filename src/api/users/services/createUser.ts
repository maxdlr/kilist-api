import createHousehold from "@/api/households/services/createHousehold";
import findHousehold from "@/api/households/services/findHousehold";
import createList from "@/api/lists/services/createList";
import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import doTransaction from "@/utils/doTransaction";
import validateCrudPayload from "@/services/validateCrudPayload";
import PasswordCheck from "@/utils/PasswordCheck";
import { validate } from "class-validator";
import { EntityManager } from "typeorm";
import findUser from "./findUser";

type HouseholdChoice =
  | { householdChoice: "join"; joinCode: string }
  | { householdChoice: "create"; householdName?: string };

type CreateUserInput = {
  email: string;
  username: string;
  password: string;
  description?: string;
} & HouseholdChoice;

const resolveHousehold = async (
  input: HouseholdChoice,
  manager: EntityManager,
): Promise<HouseholdEntity> => {
  if (input.householdChoice === "join") {
    const household = await findHousehold(
      { joinCode: input.joinCode },
      manager,
    );
    if (!household) {
      throw ApiError(404, "No household found for this join code");
    }
    return household;
  }

  // A brand-new household starts with an empty main list so the user lands in
  // a working app (the List tab reads the main list) and can populate it via
  // onboarding. Joiners reuse their household's existing main list.
  const household = await createHousehold(input.householdName, manager);
  await createList(
    household.id,
    { title: "My list", isMain: true },
    manager,
  );
  return household;
};

const isValidHouseholdChoice = (input: unknown): input is HouseholdChoice => {
  if (typeof input !== "object" || input === null) return false;
  const candidate = input as Record<string, unknown>;

  if (candidate.householdChoice === "join") {
    return typeof candidate.joinCode === "string" && candidate.joinCode.length > 0;
  }

  if (candidate.householdChoice === "create") {
    return (
      candidate.householdName === undefined ||
      typeof candidate.householdName === "string"
    );
  }

  return false;
};

/**
 * Creates a new user and attaches them to a household — either by joining
 * an existing household via its join code, or by creating a new one.
 *
 * @param user - User details plus the household join/create choice
 * @returns The newly created user
 */
const createUser = async (user: CreateUserInput): Promise<UserEntity> => {
  if (!isValidHouseholdChoice(user)) {
    throw ApiError(
      400,
      'A valid householdChoice ("join" with joinCode, or "create") is required',
    );
  }

  const existingUser = await findUser({ username: user.username }).catch(
    () => {},
  );
  if (existingUser) {
    throw ApiError("User already exists");
  }

  const { email, username, password, description } = user;

  // Validate password before hashing
  const pwCheck = new PasswordCheck();
  pwCheck.password = password;
  const pwErrors = await validate(pwCheck);

  return await doTransaction(async (m) => {
    const household = await resolveHousehold(user, m);

    const userEntity = new UserEntity();
    userEntity.username = username;
    userEntity.email = email;
    userEntity.description = description;
    userEntity.household = household;
    userEntity.password = password;

    await validateCrudPayload(userEntity, pwErrors);

    const newUser = await m.save(UserEntity, userEntity).catch((e) => {
      throw ApiError("Cannot create new user" + e.message);
    });

    return newUser;
  });
};

export default createUser;
