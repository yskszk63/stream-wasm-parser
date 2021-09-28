(module
  (import "env" "memory" (memory 0))
  (import "env" "fun" (func))
  (import "env" "table" (table 1 funcref))
  (import "env" "global" (global (mut i32)))
)
