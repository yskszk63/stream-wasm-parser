(module
  (global (import "evn" "global") i32)
  (global i64 (i64.const 1))
  (global f32 (f32.const 2))
  (global f64 (f64.const 4))
  (global i32 (global.get 0))
)
