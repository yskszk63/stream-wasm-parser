import { vec } from "../struct";
import { name } from "./values";
import * as v from "./values";
import * as t from "./types";
import { expr } from "./instr";
import { Tagged } from "../tag";

export type Indexed<I, V> = { index: I; val: V };

type Branded<U extends string> = { [key in U]: never };

/** 2.5.1 Indices */
export type typeidx = Branded<"typeidx">;
/** 2.5.1 Indices */
export type funcidx = Branded<"funcidx">;
/** 2.5.1 Indices */
export type tableidx = Branded<"tableidx">;
/** 2.5.1 Indices */
export type memidx = Branded<"memidx">;
/** 2.5.1 Indices */
export type globalidx = Branded<"globalidx">;
/** 2.5.1 Indices */
export type elemidx = Branded<"elemidx">;
/** 2.5.1 Indices */
export type dataidx = Branded<"dataidx">;
/** 2.5.1 Indices */
export type localidx = Branded<"localidx">;
/** 2.5.1 Indices */
export type labelidx = Branded<"labelidx">;

export type Item =
  | Tagged<"custom", customsec>
  | Tagged<"type", Indexed<typeidx, t.functype>>
  | Tagged<"import", import_>
  | Tagged<"func", Indexed<funcidx, typeidx>>
  | Tagged<"table", Indexed<tableidx, table>>
  | Tagged<"mem", Indexed<memidx, mem>>
  | Tagged<"global", Indexed<globalidx, global_>>
  | Tagged<"export", export_>
  | Tagged<"start", startsec>
  | Tagged<"elem", Indexed<elemidx, elem>>
  | Tagged<"code", code> // TODO index
  | Tagged<"data", Indexed<dataidx, data>>
  | Tagged<"datacount", v.u32>;

/** 5.5.3 Custom Section */
export type customsec = [name, Uint8Array]; // TODO Consider hold data or not.

/** 5.5.4 Type Section */
export type typesec = vec<t.functype>;

/** 5.5.5 Import Section */
export type importsec = vec<import_>;

export type import_ = {
  module: name;
  name: name;
  desc: importdesc;
};

export type importdesc =
  | Tagged<"func", Indexed<funcidx, typeidx>>
  | Tagged<"table", Indexed<tableidx, t.tabletype>>
  | Tagged<"mem", Indexed<memidx, t.memtype>>
  | Tagged<"global", Indexed<globalidx, t.globaltype>>;

/** 5.5.6 Function Section */
export type funcsec = vec<typeidx>;

/** 5.5.7 Table Section */
export type tablesec = vec<table>;

export type table = {
  type: t.tabletype;
};

/** 5.5.8 Memory Section */
export type memsec = vec<mem>;

export type mem = {
  type: t.memtype;
};

/** 5.5.9 Global Section */
export type globalsec = vec<global_>;

export type global_ = {
  type: t.globaltype;
  init: expr;
};

/** 5.5.10 Export Section */
export type exportsec = vec<export_>;

export type export_ = {
  name: name;
  desc: exportdesc;
};

export type exportdesc =
  | Tagged<"func", funcidx>
  | Tagged<"table", tableidx>
  | Tagged<"mem", memidx>
  | Tagged<"global", globalidx>;

/** 5.5.11 Start Section */
export type startsec = start;

export type start = {
  func: funcidx;
};

/** 5.5.12 Element Section */
export type elemsec = vec<elem>;

export type elem = {
  type: t.reftype;
  init: Tagged<"expr", vec<expr>> | Tagged<"funcref", vec<funcidx>>;
  mode: elemmode;
};

export type elemmode =
  | Tagged<"passive", undefined>
  | Tagged<"active", { table: tableidx; offset: expr }>
  | Tagged<"deactive", undefined>;

/** 5.5.13 Code Section */
export type codesec = vec<code>;

export type code = func;

export type func = [vec<locals>, expr]; // TODO Consider hold data or not.

export type locals = t.valtype;

/** 5.5.14 Data Section */
export type datasec = vec<data>;

export type data = {
  init: Uint8Array;
  mode: datamode;
};

export type datamode =
  | Tagged<"passive", undefined>
  | Tagged<"active", { memory: memidx; offset: expr }>;

/** 5.5.15 Data Count Section */
export type datacountsec = v.u32;
