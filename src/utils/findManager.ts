import { EntityManager, ObjectLiteral, Repository } from "typeorm";

const findManager = <T extends ObjectLiteral>(
  Repository: Repository<T>,
  manager?: EntityManager,
): EntityManager => {
  let m = manager;
  if (!m) {
    m = Repository.manager;
  }

  return m;
};

export default findManager;
