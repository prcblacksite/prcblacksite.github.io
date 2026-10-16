import { P } from "../lib/site";
import { steps } from "./steps";

export const render = (): string => steps(P.joining.steps);
