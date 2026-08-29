import { execSync } from "node:child_process";

import buildConfig from "../config/build.ts";
import envConfig from '../config/env.ts';

execSync(envConfig.packageManager.publish(buildConfig.output));
