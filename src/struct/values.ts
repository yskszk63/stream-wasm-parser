type Branded<U extends string> = { [key in U]: never };

/** 2.2.1 Bytes */
export type byte = number;

/** 2.2.2 Integers */
export type u32 = number & Branded<"u32">;
/** 2.2.2 Integers */
export type u64 = number & Branded<"u64">;
/** 2.2.2 Integers */
export type s32 = number & Branded<"s32">;
/** 2.2.2 Integers */
export type s64 = number & Branded<"s64">;
/** 2.2.2 Integers */
export type i8 = number & Branded<"i8">;
/** 2.2.2 Integers */
export type i16 = number & Branded<"i16">;
/** 2.2.2 Integers */
export type i32 = number & Branded<"i32">;
/** 2.2.2 Integers */
export type i64 = number & Branded<"i64">;

/** 2.2.3 Floating-Point */
export type f32 = number & Branded<"f32">;
/** 2.2.3 Floating-Point */
export type f64 = number & Branded<"f64">;

/** 2.2.4 Names */
export type name = string;
