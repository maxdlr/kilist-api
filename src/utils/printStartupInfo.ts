import chalk from "chalk";
import pkg from "../../package.json";

const logo = `
${process.env.APP_NAME}
    `;

const printStartupInfo = (port: number | string, secure: boolean) => {
  const NODE_ENV = process.env.NODE_ENV || "development";

  console.info(`
${chalk.white(logo)}
----------------------
🚀  ${pkg.name}
----------------------
version      : v${pkg.version}
node         : ${process.version}
env          : ${NODE_ENV !== "production" ? "🧪 " : ""}${NODE_ENV}
listening    : ${secure ? "🔒" : ""} ${port}`);
};

export default printStartupInfo;
