import { vec } from "../struct";
import { u32 } from "./values";

/** 2.3.1 Number Types */
export type numtype = "i32" | "i64" | "f32" | "f64";

/** 2.3.2 Reference Types */
export type reftype = "funcref" | "externref";

/** 2.3.3 Value Types */
export type valtype = numtype | reftype;

/** 2.3.4 Result Types */
export type resulttype = vec<valtype>;

/** 2.3.5 Function Types */
export type functype = {
  tag: "func";
  val: {
    parameters: resulttype;
    results: resulttype;
  };
};

/** 2.3.6 Limits */
export type limits = {
  min: u32;
  max: u32 | null;
};

/** 2.3.7 Memory Types */
export type memtype = limits;

/** 2.3.8 Table Types */
export type tabletype = [limits, reftype];

/** 2.3.9 Global Types */
export type globaltype = ["const" | "var", valtype];

/** 2.3.10 External Types */
export type externtype = ["func", functype] | ["table", tabletype] | [
  "mem",
  memtype,
] | ["global", globaltype];
